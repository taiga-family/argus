import * as core from '@actions/core';
import {type Context, type Probot} from 'probot';

import {ScreenshotBot} from './classes';
import {
    BotReportMessage,
    LOG_MAX_TREE_ENTRIES,
    LogSection,
    STORAGE_BRANCH,
} from './constants';
import {
    getBranchUrl,
    getCommitUrl,
    getPrUrl,
    getWorkflowBranch,
    getWorkflowHeadRepo,
    getWorkflowHeadSha,
    getWorkflowName,
    getWorkflowPrNumbers,
    getWorkflowRunConclusion,
    getWorkflowRunId,
    getWorkflowRunUrl,
} from './selectors';
import {
    buildFilesTree,
    createLogger,
    formatBytes,
    formatDuration,
    getFailureReport,
    getFilesFromZipFile,
    renderFilesTree,
    zip,
} from './utils';

const RepositoryEvent = {
    WorkflowRunCompleted: 'workflow_run.completed',
    /**
     * WARNING: "Re-run all jobs" button does not trigger worklow_run.requested event
     * see {@link https://github.com/actions/runner/issues/726 github issue}
     * */
    WorkflowRunRequested: 'workflow_run.requested',
    PRClosed: 'pull_request.closed',
} as const;

const getRunMode = (): string =>
    process.env.GITHUB_ACTIONS ? 'GitHub Action' : 'GitHub App';

const EVENTS_CALLBACKS = {
    [RepositoryEvent.WorkflowRunCompleted]: async (
        context: Context<'workflow_run.completed'>,
    ) => {
        const startedAt = Date.now();
        const log = createLogger(context.log);
        const bot = new ScreenshotBot<'workflow_run.completed'>(context);
        const repo = context.repo();
        const workflowName = getWorkflowName(context);
        const workflowBranch = getWorkflowBranch(context);
        const workflowRunId = getWorkflowRunId(context);
        const commitSha = getWorkflowHeadSha(context) || '';
        const headRepo = getWorkflowHeadRepo(context);
        const isFork = headRepo.owner.login !== repo.owner || headRepo.name !== repo.repo;
        const conclusion = getWorkflowRunConclusion(context);

        log.group(LogSection.Context, () =>
            log.keyValue([
                ['Event', context.name],
                ['Delivery id', context.id],
                ['Repository', `${repo.owner}/${repo.repo}`],
                [
                    'Commit',
                    commitSha
                        ? `${commitSha.slice(0, 7)}  ${getCommitUrl(repo, commitSha)}`
                        : '(unknown)',
                ],
                [
                    'Workflow',
                    `"${workflowName}" (run ${workflowRunId})  ${getWorkflowRunUrl(repo, workflowRunId)}`,
                ],
                ['Head branch', workflowBranch || '(unknown)'],
                [
                    'Head repo',
                    `${headRepo.owner.login}/${headRepo.name}${isFork ? ' (fork)' : ''}`,
                ],
                ['Conclusion', conclusion],
                ['Run mode', getRunMode()],
            ]),
        );

        const [prNumber, skipReason] = await Promise.all([
            bot.getWorkflowPrNumber(),
            bot.checkShouldSkipWorkflow(workflowName, workflowBranch),
        ]);

        if (prNumber && getWorkflowPrNumbers(context).length === 0) {
            log.notice(
                `Argus: PR #${prNumber} resolved via fallback search by head SHA (fork contribution)`,
            );
        }

        if (!prNumber) {
            return log.notice(
                'Argus: pull request not found for this workflow run — nothing to do',
            );
        }

        if (skipReason) {
            return log.notice(`Argus: skipped — ${skipReason}`);
        }

        log.info(`Pull request  #${prNumber}  ${getPrUrl(repo, prNumber)}`);

        if (conclusion === 'success') {
            const comment = await bot.createOrUpdateReport(
                prNumber,
                BotReportMessage.SuccessWorkflow,
            );

            log.info(`Report comment  ${comment.data.html_url}`);
            log.info(`Argus finished in ${formatDuration(Date.now() - startedAt)}`);

            return comment;
        }

        if (!workflowRunId) {
            return log.notice('Argus: workflow run id is missing — nothing to do');
        }

        const botConfigs = await bot.getBotConfigs(workflowBranch);
        const configSource = bot.getBotConfigsSource();

        log.group(LogSection.BotConfigs, () =>
            log.keyValue([
                [
                    'Source',
                    configSource
                        ? `${configSource.path} @ ${configSource.owner}/${configSource.repo} (${
                              configSource.found ? 'found' : 'defaults'
                          })`
                        : '(unknown)',
                ],
                ...Object.entries(botConfigs).map(([key, value]): [string, string] => [
                    key,
                    JSON.stringify(value),
                ]),
            ]),
        );

        const artifacts = await bot.getWorkflowArtifacts<ArrayBuffer>(workflowRunId);

        if (!artifacts.length) {
            log.warn('Argus: no workflow artifacts found');
        }

        log.group(`${LogSection.Artifacts} (${artifacts.length})`, () =>
            log.list(
                artifacts.map(
                    (artifact, i) =>
                        `${i + 1}. ${artifact.name}   ${formatBytes(
                            artifact.sizeInBytes,
                        )}   id ${artifact.id}`,
                ),
            ),
        );

        log.group(LogSection.FilesInsideArtifacts, () => {
            artifacts.forEach((artifact) => {
                const entries = getFilesFromZipFile(artifact.data);

                log.info(`${artifact.name} (${entries.length} files)`);
                log.info(
                    renderFilesTree(
                        buildFilesTree(
                            entries.map((entry) => ({
                                path: entry.entryName,
                                size: entry.header.size,
                            })),
                        ),
                        {maxEntries: core.isDebug() ? Infinity : LOG_MAX_TREE_ENTRIES},
                    ),
                );
            });
        });

        const artifactsData = artifacts.map((artifact) => artifact.data);

        const failedTestsImages = await bot.getScreenshotDiffImages(
            artifactsData,
            workflowBranch,
        );

        const {commitSha: diffsCommitSha, urls: failedTestsImagesUrls} =
            await bot.uploadImages(
                failedTestsImages.map((image) => image.getData()),
                prNumber,
                workflowRunId,
            );

        const newTestsImages = await bot.getNewScreenshotImages(
            artifactsData,
            workflowBranch,
        );

        const {commitSha: newCommitSha, urls: newTestsImagesUrls} =
            await bot.uploadImages(
                newTestsImages.map((image) => image.getData()),
                prNumber,
                workflowRunId,
            );

        log.group(`${LogSection.ScreenshotDiffs} (${failedTestsImages.length})`, () =>
            log.list(
                zip(failedTestsImages, failedTestsImagesUrls).map(
                    ([image, url]) => `${image.entryName}\n  → ${url}`,
                ),
            ),
        );

        log.group(`${LogSection.NewScreenshots} (${newTestsImages.length})`, () =>
            log.list(
                zip(newTestsImages, newTestsImagesUrls).map(
                    ([image, url]) => `${image.entryName}\n  → ${url}`,
                ),
            ),
        );

        if (!failedTestsImages.length && !newTestsImages.length) {
            log.warn(
                'Argus: no screenshot diff/new images matched the configured patterns',
            );
        }

        const uploadedCommitSha = newCommitSha || diffsCommitSha;

        if (uploadedCommitSha) {
            log.info(
                `Uploaded ${
                    failedTestsImages.length + newTestsImages.length
                } image(s) to branch "${STORAGE_BRANCH}"  ${getBranchUrl(repo, STORAGE_BRANCH)}`,
            );
            log.info(
                `Storage commit  ${uploadedCommitSha}  ${getCommitUrl(repo, uploadedCommitSha)}`,
            );
        }

        const reportText =
            failedTestsImages.length || newTestsImages.length
                ? getFailureReport(
                      zip(failedTestsImages, failedTestsImagesUrls),
                      zip(newTestsImages, newTestsImagesUrls),
                      {commitSha, botConfigs},
                  )
                : BotReportMessage.FailedWorkflowNoScreenshots;

        const comment = await bot.createOrUpdateReport(prNumber, reportText);

        log.info(`Report comment  ${comment.data.html_url}`);
        log.info(`Argus finished in ${formatDuration(Date.now() - startedAt)}`);

        return comment;
    },
    [RepositoryEvent.WorkflowRunRequested]: async (
        context: Context<'workflow_run.requested'>,
    ) => {
        const log = createLogger(context.log);
        const bot = new ScreenshotBot<'workflow_run.requested'>(context);
        const repo = context.repo();
        const workflowName = getWorkflowName(context);
        const workflowBranch = getWorkflowBranch(context);
        const workflowRunId = getWorkflowRunId(context);

        log.group(LogSection.Context, () =>
            log.keyValue([
                ['Event', context.name],
                ['Delivery id', context.id],
                ['Repository', `${repo.owner}/${repo.repo}`],
                [
                    'Workflow',
                    `"${workflowName}" (run ${workflowRunId})  ${getWorkflowRunUrl(repo, workflowRunId)}`,
                ],
                ['Head branch', workflowBranch || '(unknown)'],
                ['Run mode', getRunMode()],
            ]),
        );

        const [prNumber, skipReason] = await Promise.all([
            bot.getWorkflowPrNumber(),
            bot.checkShouldSkipWorkflow(workflowName, workflowBranch),
        ]);

        if (!prNumber) {
            return log.notice(
                'Argus: pull request not found for this workflow run — nothing to do',
            );
        }

        if (skipReason) {
            return log.notice(`Argus: skipped — ${skipReason}`);
        }

        log.info(`Pull request  #${prNumber}  ${getPrUrl(repo, prNumber)}`);

        const comment = await bot.createOrUpdateReport(
            prNumber,
            BotReportMessage.LoadingWorkflow,
        );

        log.info(`Report comment  ${comment.data.html_url}`);

        return comment;
    },
    [RepositoryEvent.PRClosed]: async (context: Context<'pull_request.closed'>) => {
        const log = createLogger(context.log);
        const bot = new ScreenshotBot<'pull_request.closed'>(context);
        const repo = context.repo();
        const prNumber = context.payload.number;

        log.group(LogSection.Context, () =>
            log.keyValue([
                ['Event', context.name],
                ['Delivery id', context.id],
                ['Repository', `${repo.owner}/${repo.repo}`],
                ['Pull request', `#${prNumber}  ${getPrUrl(repo, prNumber)}`],
                ['Run mode', getRunMode()],
            ]),
        );

        const oldBotComment = await bot.getPrevBotReportComment(prNumber);

        if (!oldBotComment?.id) {
            return log.notice(
                'Argus: no previous bot comment found for this PR — nothing to clean up',
            );
        }

        const deletedCommitSha = await bot.deleteUploadedImagesFolder(prNumber);

        if (deletedCommitSha) {
            log.info(
                `Deleted stored screenshots, commit  ${deletedCommitSha}  ${getCommitUrl(
                    repo,
                    deletedCommitSha,
                )}`,
            );
        } else {
            log.notice('Argus: no stored screenshots found for this PR');
        }

        const comment = await bot.createOrUpdateReport(
            prNumber,
            BotReportMessage.PRClosed,
        );

        log.info(`Report comment  ${comment.data.html_url}`);

        return comment;
    },
} as const;

export default (app: Probot): void => {
    app.on(RepositoryEvent.WorkflowRunRequested, async (context) => {
        await EVENTS_CALLBACKS[RepositoryEvent.WorkflowRunRequested](context);
    });

    app.on(RepositoryEvent.WorkflowRunCompleted, async (context) => {
        await EVENTS_CALLBACKS[RepositoryEvent.WorkflowRunCompleted](context);
    });

    app.on(RepositoryEvent.PRClosed, async (context) => {
        await EVENTS_CALLBACKS[RepositoryEvent.PRClosed](context);
    });
};
