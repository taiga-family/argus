import {Probot} from 'probot';
import {ArgusBot} from './bot';
import {getWorkflowPrNumbers, getWorkflowRunConclusion, getWorkflowRunId} from './selectors';
import {getFailureReport, getScreenshotDiffImages, zip} from './utils';
import {BOT_MESSAGES} from './constants';

export = (app: Probot) => {
  app.on('workflow_run.completed', async context => {
    const bot = new ArgusBot(context);
    const [prNumber] = getWorkflowPrNumbers(context);

    switch (getWorkflowRunConclusion(context)) {
      case 'success':
        return bot.createOrUpdateReport(prNumber, BOT_MESSAGES.SUCCESS);

      case 'failure':
        const workflowRunId = getWorkflowRunId(context);

        if (!workflowRunId) return;

        /** TODO possibly there is a need to add timeout because at this time there are not always artifacts (test it!) */
        const [artifact] = await bot.getWorkflowArtifacts<ArrayBuffer>(workflowRunId);
        const images = getScreenshotDiffImages(artifact);

        const imagesUrls = await Promise.all(images.map(
            (image, index) => bot.uploadImage(image.getData(), `pr-${prNumber}/${index}.png`)
        ));

        const reportText = images.length
            ? getFailureReport(zip(images, imagesUrls))
            : BOT_MESSAGES.ARTIFACTS_DOWNLOAD_FAILED;

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
    const bot = new ArgusBot(context);
    const [prNumber] = getWorkflowPrNumbers(context);

    return bot.createOrUpdateReport(prNumber, BOT_MESSAGES.LOADING);
  });
};
