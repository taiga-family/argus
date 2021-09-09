import {Probot} from 'probot';
import {ScreenshotBot} from './bot';
import {
    getWorkflowBranch,
    getWorkflowName,
    getWorkflowPrNumbers,
    getWorkflowRunConclusion,
    getWorkflowRunId
} from './selectors';
import {getFailureReport, zip} from './utils';
import {BOT_REPORT_MESSAGES} from './constants';

export = (app: Probot) => {
    app.on('workflow_run.completed', async context => {
        const bot = new ScreenshotBot(context);
        const workflowName = getWorkflowName(context);
        const workflowBranch = getWorkflowBranch(context);
        const [prNumber] = getWorkflowPrNumbers(context);

        if (await bot.checkShouldSkipWorkflow(workflowName, workflowBranch)) {
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
    });

    /**
     * WARNING: "Re-run all jobs" button does not trigger worklow_run.requested event
     * see {@link https://github.com/actions/runner/issues/726 github issue}
     * */
    app.on('workflow_run.requested', async context => {
        const bot = new ScreenshotBot(context);
        const workflowName = getWorkflowName(context);
        const workflowBranch = getWorkflowBranch(context);
        const [prNumber] = getWorkflowPrNumbers(context);

        if (await bot.checkShouldSkipWorkflow(workflowName, workflowBranch)) {
            return;
        }

        return bot.createOrUpdateReport(prNumber, BOT_REPORT_MESSAGES.LOADING_WORKFLOW);
    });

    app.on('pull_request.closed', async context => {
        const bot = new ScreenshotBot(context);
        const prNumber = context.payload.number;
        const oldBotComment = await bot.getPrevBotReportComment(prNumber);

        return oldBotComment?.id && bot.deleteUploadedImagesFolder(prNumber)
            .then(() => bot.createOrUpdateReport(prNumber, BOT_REPORT_MESSAGES.PR_CLOSED));
    });
};
