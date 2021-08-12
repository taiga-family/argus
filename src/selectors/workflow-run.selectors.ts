import {Context} from 'probot/lib/context';
import {EventPayloads} from '@octokit/webhooks/dist-types/generated/event-payloads';

type WorkflowRunContext = Context<EventPayloads.WebhookPayloadWorkflowRun>;

export const getWorkflowPrNumbers = (context: WorkflowRunContext): number[] => {
    return context.payload.workflow_run ? context.payload.workflow_run.pull_requests.map(pr => pr.number) : [];
}

type CheckRunConclusion = 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | 'stale';
export const getWorkflowRunConclusion = (context: WorkflowRunContext): CheckRunConclusion | null => {
    return context.payload.workflow_run?.conclusion as CheckRunConclusion || null;
}
