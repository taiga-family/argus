import {Probot} from 'probot';
import {Bot} from './bot';
import {getWorkflowPrNumbers, getWorkflowRunConclusion} from './selectors';
import {getFilesFromZipFile, getFailureReport} from './utils';

const BOT_DEFAULT_MESSAGES = {
  LOADING: 'Screenshots running :rocket:',
  SUCCESS: 'Screenshots tests completed successfully :white_check_mark:',
  ARTIFACTS_DOWNLOAD_FAILED: 'Screenshots tests failed :x:\n Manually download artifacts of workflow to see screenshots diffs.',
} as const;

export = (app: Probot) => {
  app.on('workflow_run.completed', async context => {
    const bot = new Bot(context);
    const [prNumber] = getWorkflowPrNumbers(context);

    switch (getWorkflowRunConclusion(context)) {
      case 'success':
        return bot.sendComment(prNumber, BOT_DEFAULT_MESSAGES.SUCCESS);

      case 'failure':
        const workflowRunId = context.payload.workflow_run?.id || null;
        const {repo, owner} = context.repo();
        const artifacts = workflowRunId ? await bot.getWorkflowArtifacts<ArrayBuffer>(workflowRunId) : [];
        const images = getFilesFromZipFile(artifacts[0]);
        const key = `${owner}-${repo}-${prNumber}`;

        const imagesUrls = await Promise.all(
            images.map((image, index) => bot.uploadImage(image, `${key}/${index}.png`))
        );

        const reportText = artifacts.length
            ? getFailureReport(imagesUrls)
            : BOT_DEFAULT_MESSAGES.ARTIFACTS_DOWNLOAD_FAILED;

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
    await bot.sendComment(prNumber, BOT_DEFAULT_MESSAGES.LOADING);
  });
};
