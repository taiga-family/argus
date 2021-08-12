import { Probot } from 'probot';
import {Context} from 'probot/lib/context';
import {EventPayloads} from '@octokit/webhooks/dist-types/generated/event-payloads';

const getWorkflowPrNumbers = (context: Context<EventPayloads.WebhookPayloadWorkflowRun>): number[] => {
  return context.payload.workflow_run ? context.payload.workflow_run.pull_requests.map(pr => pr.number) : [];
}

type CheckRunConclusion = 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | 'stale';
const getWorkflowRunConclusion = (context: Context<EventPayloads.WebhookPayloadWorkflowRun>): CheckRunConclusion | null => {
  return context.payload.workflow_run?.conclusion as CheckRunConclusion || null;
}

const getWorkflowRunInfo = (context: Context<EventPayloads.WebhookPayloadWorkflowRun>) => {
  return context.payload.workflow_run && context.repo({
    run_id: context.payload.workflow_run.id,
  }) || null;
};

const getWorkflowArtifactsInfo = (context: Context) => {
  const workflowRunInfo = getWorkflowRunInfo(context);

  return workflowRunInfo && context.octokit.actions.listWorkflowRunArtifacts(workflowRunInfo)
};

const sendComment = (context: Context, prNumber: number, body: string): Promise<unknown> => {
  const comment = context.repo({
    body,
    issue_number: prNumber,
  });

  return context.octokit.issues.createComment(comment);
}

const buildMarkdownText = (context: Context, text: string) => {
  return context.octokit.markdown.render({text: `[${text}](https://translate.google.com/?hl=ru).`})
}

export = (app: Probot) => {
  app.on('workflow_run.completed', async context => {
    const [prNumber] = getWorkflowPrNumbers(context);

    if (getWorkflowRunConclusion(context) === 'success') {
      sendComment(context, prNumber, 'Screenshots tests completed successfully :white_check_mark:');
    } else {
      const artifactsInfo = await getWorkflowArtifactsInfo(context);

      if (artifactsInfo) {
        const [artifact_id] = artifactsInfo.data.artifacts.map(artifact => artifact.id);
        const artifactLink = await context.octokit.actions.downloadArtifact(
            context.repo({artifact_id, archive_format: 'zip'})
        );

        sendComment(
            context,
            prNumber,
            `Screenshots tests failed :x:\n Download artifacts via ${artifactLink}`
        );
        const testText =  await buildMarkdownText(context,'test');
        sendComment(context, prNumber, testText.data);
      } else {
        sendComment(
            context,
            prNumber,
            `Screenshots tests failed :x:\n Manually download artifacts of workflow to see screenshots diffs.`
        );
      }
    }
  });

  /**
   * WARNING: "Re-run all jobs" button does not generate worklow_run.requested event
   * see {@link https://github.com/actions/runner/issues/726 github issue}
   * */
  app.on('workflow_run.requested', async context => {
    const [prNumber] = getWorkflowPrNumbers(context);

    // TODO: refresh comment with loading status (if it exists)
    sendComment(context, prNumber, 'Screenshots running :rocket:');
  });
};
