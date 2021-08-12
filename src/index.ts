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

export = (app: Probot) => {
  app.on('workflow_run.completed', async context => {
    const [prNumber] = getWorkflowPrNumbers(context);

    if (getWorkflowRunConclusion(context) === 'success') {
      sendComment(context, prNumber, 'Screenshots tests completed successfully :white_check_mark:');
    } else {
      const artifactsInfo = await getWorkflowArtifactsInfo(context);

      console.log(artifactsInfo);

      sendComment(context, prNumber, 'Screenshots tests failed :x:');
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
