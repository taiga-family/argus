import {Probot} from 'probot';
import {Bot} from './bot';
import {getWorkflowPrNumbers, getWorkflowRunConclusion} from './selectors';
import {getFailureReport, getScreenshotDiffImages} from './utils';
import {BOT_MESSAGES} from './constants';

const zip = <T, G>(a: T[], b: G[]): [T, G][] => a.map((item, i) => [item, b[i]]);

export = (app: Probot) => {
  app.on('workflow_run.completed', async context => {
    const bot = new Bot(context);
    const [prNumber] = getWorkflowPrNumbers(context);

    switch (getWorkflowRunConclusion(context)) {
      case 'success':
        return bot.sendComment(prNumber, BOT_MESSAGES.SUCCESS);

      case 'failure':
        const workflowRunId = context.payload.workflow_run?.id || null;
        const {repo, owner} = context.repo();
        const artifacts = workflowRunId ? await bot.getWorkflowArtifacts<ArrayBuffer>(workflowRunId) : [];
        const images = getScreenshotDiffImages(artifacts[0]);
        const key = `${owner}-${repo}-${prNumber}`;

        const imagesUrls = await Promise.all(
            images.map((image, index) => bot.uploadImage(image.getData(), `${key}/${index}.png`))
        );

        const reportText = artifacts.length
            ? getFailureReport(zip(images, imagesUrls))
            : BOT_MESSAGES.ARTIFACTS_DOWNLOAD_FAILED;

        return bot.sendComment(prNumber, reportText);

      default:
        return;
    }
  });

  /**
   * WARNING: "Re-run all jobs" button does not trigger worklow_run.requested event
   * see {@link https://github.com/actions/runner/issues/726 github issue}
   * */
  app.on('workflow_run.requested', async context => {
    const bot = new Bot(context);
    const [prNumber] = getWorkflowPrNumbers(context);

    // TODO: refresh comment with loading status (if it exists)
    await bot.sendComment(prNumber, BOT_MESSAGES.LOADING);
  });
};
