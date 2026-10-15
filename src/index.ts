import {type Context, type Probot} from 'probot';

import {ScreenshotBot} from './classes';
import {BotReportMessage, IS_GITHUB_ACTION, LOG_MAX_FILE_ENTRIES} from './constants';
import {
    getWorkflowBranch,
    getWorkflowHeadSha,
    getWorkflowName,
    getWorkflowRunConclusion,
    getWorkflowRunId,
} from './selectors';
import {getFailureReport, getFilesFromZipFile, zip} from './utils';

const RepositoryEvent = {
    WorkflowRunCompleted: 'workflow_run.completed',
    /**
     * WARNING: "Re-run all jobs" button does not trigger worklow_run.requested event
     * see {@link https://github.com/actions/runner/issues/726 github issue}
     * */
    WorkflowRunRequested: 'workflow_run.requested',
    PRClosed: 'pull_request.closed',
} as const;

const logEvent = (context: Context, event: string, fields: object): void =>
    context.log.info(
        {id: context.id, isGithubAction: IS_GITHUB_ACTION, ...fields},
        `Argus: ${event}`,
    );

const EVENTS_CALLBACKS = {
    [RepositoryEvent.WorkflowRunCompleted]: async (
        context: Context<'workflow_run.completed'>,
    ) => {
        const {log} = context;
        const bot = new ScreenshotBot<'workflow_run.completed'>(context);
        const workflowName = getWorkflowName(context);
        const workflowBranch = getWorkflowBranch(context);
        const workflowRunId = getWorkflowRunId(context);
        const commitSha = getWorkflowHeadSha(context) || '';
        const conclusion = getWorkflowRunConclusion(context);

        logEvent(context, RepositoryEvent.WorkflowRunCompleted, {
            workflowName,
            workflowRunId,
            workflowBranch,
            commitSha,
            conclusion,
        });

        const [prNumber, shouldSkipWorkflow] = await Promise.all([
            bot.getWorkflowPrNumber(),
            bot.checkShouldSkipWorkflow(workflowName, workflowBranch),
        ]);

        if (!prNumber) {
            return log.info('Argus: pull request not found for this workflow run');
        }

        if (shouldSkipWorkflow) {
            return log.info(
                {workflowName, workflowBranch},
                'Argus: skipped by "workflows" / "branches-ignore" configs',
            );
        }

        if (conclusion === 'success') {
            return bot.createOrUpdateReport(prNumber, BotReportMessage.SuccessWorkflow);
        }

        if (!workflowRunId) {
            return log.warn('Argus: workflow run id is missing');
        }

        const botConfigs = await bot.getBotConfigs();

        log.info({botConfigs, source: bot.botConfigsSource}, 'Argus: bot configs');

        const artifacts = await bot.getWorkflowArtifacts<ArrayBuffer>(workflowRunId);

        if (!artifacts.length) {
            log.warn('Argus: no workflow artifacts found');
        }

        let loggedFiles = 0;

        artifacts.forEach(({id, name, sizeInBytes, data}) => {
            const files = getFilesFromZipFile(data)
                .map((entry) => entry.entryName)
                .sort();

            const shown = files.slice(0, Math.max(0, LOG_MAX_FILE_ENTRIES - loggedFiles));

            loggedFiles += shown.length;
            log.info(
                {
                    id,
                    sizeInBytes,
                    files: shown,
                    truncatedFiles: files.length - shown.length,
                },
                `Argus: artifact "${name}" (${files.length} files)`,
            );
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
                failedTestsImages.length,
            );

        if (failedTestsImages.length || newTestsImages.length) {
            log.info(
                {
                    diffs: failedTestsImages.map((image) => image.entryName),
                    newScreenshots: newTestsImages.map((image) => image.entryName),
                    storageCommitSha: newCommitSha || diffsCommitSha,
                },
                'Argus: uploaded screenshots',
            );
        } else {
            log.warn(
                'Argus: no screenshot diff/new images matched the configured patterns',
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

        return bot.createOrUpdateReport(prNumber, reportText);
    },
    [RepositoryEvent.WorkflowRunRequested]: async (
        context: Context<'workflow_run.requested'>,
    ) => {
        const {log} = context;
        const bot = new ScreenshotBot<'workflow_run.requested'>(context);
        const workflowName = getWorkflowName(context);
        const workflowBranch = getWorkflowBranch(context);

        logEvent(context, RepositoryEvent.WorkflowRunRequested, {
            workflowName,
            workflowBranch,
        });

        const [prNumber, shouldSkipWorkflow] = await Promise.all([
            bot.getWorkflowPrNumber(),
            bot.checkShouldSkipWorkflow(workflowName, workflowBranch),
        ]);

        if (!prNumber) {
            return log.info('Argus: pull request not found for this workflow run');
        }

        return shouldSkipWorkflow
            ? log.info(
                  {workflowName, workflowBranch},
                  'Argus: skipped by "workflows" / "branches-ignore" configs',
              )
            : bot.createOrUpdateReport(prNumber, BotReportMessage.LoadingWorkflow);
    },
    [RepositoryEvent.PRClosed]: async (context: Context<'pull_request.closed'>) => {
        const {log} = context;
        const bot = new ScreenshotBot<'pull_request.closed'>(context);
        const prNumber = context.payload.number;

        logEvent(context, RepositoryEvent.PRClosed, {prNumber});

        const oldBotComment = await bot.getPrevBotReportComment(prNumber);

        if (!oldBotComment?.id) {
            return log.info('Argus: no previous bot comment found for this PR');
        }

        const deletedCommitSha = await bot.deleteUploadedImagesFolder(prNumber);

        log.info({deletedCommitSha}, 'Argus: deleted stored screenshots');

        return bot.createOrUpdateReport(prNumber, BotReportMessage.PRClosed);
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
