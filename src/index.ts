import {Probot} from 'probot';
import {ArgusBot} from './bot';
import {getWorkflowPrNumbers, getWorkflowRunConclusion} from './selectors';
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
        const workflowRunId = context.payload.workflow_run?.id;

        if (!workflowRunId) return;

        const {repo, owner} = context.repo();
        /** TODO possibly there is a need to add timeout because at this time there are not always artifacts (test it!) */
        const artifacts = await bot.getWorkflowArtifacts<ArrayBuffer>(workflowRunId);
        const images = getScreenshotDiffImages(artifacts[0]);
        const key = `${owner}-${repo}-${prNumber}`;

        const imagesUrls = await Promise.all(
            images.map((image, index) => bot.uploadImage(image.getData(), `${key}/${index}.png`))
        );

        const reportText = artifacts.length
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
