import {Probot, Context} from 'probot';
import {
    getWorkflowBranch,
    getWorkflowName,
    getWorkflowRunConclusion,
    getWorkflowRunId
} from './selectors';
import {getFailureReport, zip} from './utils';
import {BOT_REPORT_MESSAGES} from './constants';
import {ScreenshotBot, SlackLogger} from './classes';

const REPOSITORY_EVENTS = {
    WORKFLOW_RUN_COMPLETED: 'workflow_run.completed',
    /**
     * WARNING: "Re-run all jobs" button does not trigger worklow_run.requested event
     * see {@link https://github.com/actions/runner/issues/726 github issue}
     * */
    WORKFLOW_RUN_REQUESTED: 'workflow_run.requested',
    PR_CLOSED: 'pull_request.closed',
} as const;

const EVENTS_CALLBACKS = {
    [REPOSITORY_EVENTS.WORKFLOW_RUN_COMPLETED]: async (context: Context<'workflow_run.completed'>) => {
        const bot = new ScreenshotBot<'workflow_run.completed'>(context);
        const workflowName = getWorkflowName(context);
        const workflowBranch = getWorkflowBranch(context);
        const [prNumber, shouldSkipWorkflow] = await Promise.all([
            bot.getWorkflowPrNumber(),
            bot.checkShouldSkipWorkflow(workflowName, workflowBranch),
        ]);

        if (!prNumber || shouldSkipWorkflow) {
            return;
        }

        switch (getWorkflowRunConclusion(context)) {
            case 'success':
                return bot.createOrUpdateReport(prNumber, BOT_REPORT_MESSAGES.SUCCESS_WORKFLOW);

            case 'failure':
                const workflowRunId = getWorkflowRunId(context);

                if (!workflowRunId) return;

                const artifacts = await bot.getWorkflowArtifacts<ArrayBuffer>(workflowRunId);
                const images = await bot.getScreenshotDiffImages(artifacts, workflowBranch);
                const imagesUrls = await bot.uploadImages(images.map(image => image.getData()), prNumber, workflowRunId);

                const reportText = images.length
                    ? getFailureReport(zip(images, imagesUrls))
                    : BOT_REPORT_MESSAGES.FAILED_WORKFLOW_NO_SCREENSHOTS;

                return bot.createOrUpdateReport(prNumber, reportText);

            default:
                return;
        }
    },
    [REPOSITORY_EVENTS.WORKFLOW_RUN_REQUESTED]: async (context: Context<'workflow_run.requested'>) => {
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

        return bot.createOrUpdateReport(prNumber, BOT_REPORT_MESSAGES.LOADING_WORKFLOW);
    },
    [REPOSITORY_EVENTS.PR_CLOSED]: async (context: Context<'pull_request.closed'>) => {
        const bot = new ScreenshotBot<'pull_request.closed'>(context);
        const prNumber = context.payload.number;
        const oldBotComment = await bot.getPrevBotReportComment(prNumber);

        return oldBotComment?.id && bot.deleteUploadedImagesFolder(prNumber)
            .then(() => bot.createOrUpdateReport(prNumber, BOT_REPORT_MESSAGES.PR_CLOSED));
    }
} as const;

const logError = (step: string, context: Context, error: unknown) => {
    const slackLogger = new SlackLogger();

    return slackLogger.sendError(step, context, error);
}

export = (app: Probot) => {
    app.on(REPOSITORY_EVENTS.WORKFLOW_RUN_REQUESTED, async context => {
        try {
            await EVENTS_CALLBACKS[REPOSITORY_EVENTS.WORKFLOW_RUN_REQUESTED](context);
        } catch (err) {
            await logError(REPOSITORY_EVENTS.WORKFLOW_RUN_REQUESTED, context, err);
        }
    });

    app.on(REPOSITORY_EVENTS.WORKFLOW_RUN_COMPLETED, async context => {
        try {
            await EVENTS_CALLBACKS[REPOSITORY_EVENTS.WORKFLOW_RUN_COMPLETED](context);
        } catch (err) {
            await logError(REPOSITORY_EVENTS.WORKFLOW_RUN_COMPLETED, context, err);
        }
    });

    app.on(REPOSITORY_EVENTS.PR_CLOSED, async context => {
        try {
            await EVENTS_CALLBACKS[REPOSITORY_EVENTS.PR_CLOSED](context);
        } catch (err) {
            await logError(REPOSITORY_EVENTS.PR_CLOSED, context, err);
        }
    });
};
