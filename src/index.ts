import { Probot } from "probot";
import {Context} from 'probot/lib/context';
import {EventPayloads} from '@octokit/webhooks/dist-types/generated/event-payloads';

const getPrNumbers = (context: Context<EventPayloads.WebhookPayloadCheckRun>): number[] => {
  return context.payload.check_run.pull_requests.map(pr => pr.number);
}

type CheckRunConclusion = 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | 'stale';
const getCheckRunConclusion = (context: Context<EventPayloads.WebhookPayloadCheckRun>): CheckRunConclusion | null => {
  return context.payload.check_run.conclusion as CheckRunConclusion | null;
}

const sendComment = (context: Context, prNumber: number, body: string): void => {
  const comment = context.repo({
    body,
    issue_number: prNumber,
  });

  context.octokit.issues.createComment(comment);
}

export = (app: Probot) => {
  app.on('check_run', async context => {
    const [prNumber] = getPrNumbers(context)

    if (context.payload.action === 'completed') {
      // download artifacts and send message
      if (getCheckRunConclusion(context) === 'success') {
        sendComment(context, prNumber, 'Screenshots tests completed successfully :white_check_mark:');
      } else {
        sendComment(context, prNumber, 'Screenshots tests failed :x:');
      }
    } else {
      // refresh comment with loading status (if it exists)
      sendComment(context, prNumber, 'Screenshots running :rocket:');
    }
  });
};
