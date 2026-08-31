import {type Context} from 'probot';

type WorkflowRunContext =
    | Context<'workflow_run.completed'>
    | Context<'workflow_run.requested'>
    | Context<'workflow_run'>;

type WorkflowRun = Context<'workflow_run'>['payload']['workflow_run'];

export const getWorkflowName = (context: WorkflowRunContext): string =>
    context.payload.workflow.name || '';

export const getWorkflowBranch = (context: WorkflowRunContext): string =>
    context.payload.workflow_run.head_branch || '';

export const getWorkflowPrNumbers = (context: WorkflowRunContext): number[] =>
    context.payload.workflow_run.pull_requests.map((pr) => pr.number);

export const getWorkflowRunConclusion = (
    context: Context<'workflow_run.completed'>,
): Context<'workflow_run.completed'>['payload']['workflow_run']['conclusion'] =>
    context.payload.workflow_run.conclusion;

export const getWorkflowRunId = (context: WorkflowRunContext): number =>
    context.payload.workflow_run.id;

export const getWorkflowHeadSha = (context: WorkflowRunContext): string =>
    context.payload.workflow_run.head_sha;

export const isWorkflowContext = (
    context: Context,
    // https://github.com/probot/probot/issues/1680
    // @ts-ignore TS2590: Expression produces a union type that is too complex to represent.
): context is Context<
    'workflow_run.completed' | 'workflow_run.requested' | 'workflow_run'
> => 'workflow_run' in context.payload;

/**
 * Opening PR via fork => function returns forked repository
 * Opening PR by maintainer => function returns original repository
 */
export const getWorkflowHeadRepo = (
    context: WorkflowRunContext,
): WorkflowRun['head_repository'] => context.payload.workflow_run.head_repository;
