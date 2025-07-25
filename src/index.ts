import type { IZipEntry } from 'adm-zip';
import type { Context, Probot } from 'probot';

import { ScreenshotBot, SlackLogger } from './classes';
import { BotReportMessage } from './constants';
import {
    getWorkflowBranch,
    getWorkflowHeadSha,
    getWorkflowName,
    getWorkflowRunConclusion,
    getWorkflowRunId,
} from './selectors';
import { getFailureReport, zip } from './utils';

const enum RepositoryEvent {
    WorkflowRunCompleted = 'workflow_run.completed',
    /**
     * WARNING: "Re-run all jobs" button does not trigger worklow_run.requested event
     * see {@link https://github.com/actions/runner/issues/726 github issue}
     * */
    WorkflowRunRequested = 'workflow_run.requested',
    PRClosed = 'pull_request.closed',
}

const EVENTS_CALLBACKS = {
    [RepositoryEvent.WorkflowRunCompleted]: async (
        context: Context<'workflow_run.completed'>
    ) => {
        const bot = new ScreenshotBot<'workflow_run.completed'>(context);
        const workflowName = getWorkflowName(context);
        const workflowBranch = getWorkflowBranch(context);
        const commitSha = getWorkflowHeadSha(context) || '';
        const [prNumber, shouldSkipWorkflow] = await Promise.all([
            bot.getWorkflowPrNumber(),
            bot.checkShouldSkipWorkflow(workflowName, workflowBranch),
        ]);

        if (!prNumber || shouldSkipWorkflow) {
            return;
        }

        if (getWorkflowRunConclusion(context) === 'success') {
            return bot.createOrUpdateReport(
                prNumber,
                BotReportMessage.SuccessWorkflow
            );
        }

        const workflowRunId = getWorkflowRunId(context);

        if (!workflowRunId) {
            return;
        }

        const artifacts = await bot.getWorkflowArtifacts<ArrayBuffer>(
            workflowRunId
        );
        const failedTestsImages = await bot.getScreenshotDiffImages(
            artifacts,
            workflowBranch
        );
        const failedTestsImagesUrls = await bot.uploadImages(
            failedTestsImages.map((image) => image.getData()),
            prNumber,
            workflowRunId
        );

        const newTestsImages: IZipEntry[] = await bot.getNewScreenshotImages(
            artifacts,
            workflowBranch
        );
        const newTestsImagesUrls: string[] = await bot.uploadImages(
            newTestsImages.map((image) => image.getData()),
            prNumber,
            workflowRunId
        );

        const botConfigs = await bot.getBotConfigs();
        const reportText =
            failedTestsImages.length || newTestsImages.length
                ? getFailureReport(
                      zip(failedTestsImages, failedTestsImagesUrls),
                      zip(newTestsImages, newTestsImagesUrls),
                      { commitSha, botConfigs }
                  )
                : BotReportMessage.FailedWorkflowNoScreenshots;

        return bot.createOrUpdateReport(prNumber, reportText);
    },
    [RepositoryEvent.WorkflowRunRequested]: async (
        context: Context<'workflow_run.requested'>
    ) => {
        const bot = new ScreenshotBot<'workflow_run.requested'>(context);
        const workflowName = getWorkflowName(context);
        const workflowBranch = getWorkflowBranch(context);
        const [prNumber, shouldSkipWorkflow] = await Promise.all([
            bot.getWorkflowPrNumber(),
            bot.checkShouldSkipWorkflow(workflowName, workflowBranch),
        ]);

        if (!prNumber || shouldSkipWorkflow) {
            return;
        }

        return bot.createOrUpdateReport(
            prNumber,
            BotReportMessage.LoadingWorkflow
        );
    },
    [RepositoryEvent.PRClosed]: async (
        context: Context<'pull_request.closed'>
    ) => {
        const bot = new ScreenshotBot<'pull_request.closed'>(context);
        const prNumber = context.payload.number;
        const oldBotComment = await bot.getPrevBotReportComment(prNumber);

        return (
            oldBotComment?.id &&
            bot
                .deleteUploadedImagesFolder(prNumber)
                .then(() =>
                    bot.createOrUpdateReport(
                        prNumber,
                        BotReportMessage.PRClosed
                    )
                )
        );
    },
} as const;

const logError = (step: string, context: Context, error: unknown) => {
    const slackLogger = new SlackLogger();

    return slackLogger.sendError(step, context, error);
};

export default (app: Probot) => {
    app.on(RepositoryEvent.WorkflowRunRequested, async (context) => {
        try {
            await EVENTS_CALLBACKS[RepositoryEvent.WorkflowRunRequested](
                context
            );
        } catch (err) {
            await logError(RepositoryEvent.WorkflowRunRequested, context, err);
        }
    });

    app.on(RepositoryEvent.WorkflowRunCompleted, async (context) => {
        try {
            await EVENTS_CALLBACKS[RepositoryEvent.WorkflowRunCompleted](
                context
            );
        } catch (err) {
            await logError(RepositoryEvent.WorkflowRunCompleted, context, err);
        }
    });

    app.on(RepositoryEvent.PRClosed, async (context) => {
        try {
            await EVENTS_CALLBACKS[RepositoryEvent.PRClosed](context);
        } catch (err) {
            await logError(RepositoryEvent.PRClosed, context, err);
        }
    });
};
