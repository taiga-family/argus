import type { Context } from 'probot';

export const getWorkflowName = (
    context:
        | Context<'workflow_run'>
        | Context<'workflow_run.requested'>
        | Context<'workflow_run.completed'>
): string => {
    return context.payload.workflow?.name || '';
};

export const getWorkflowBranch = (
    context:
        | Context<'workflow_run'>
        | Context<'workflow_run.requested'>
        | Context<'workflow_run.completed'>
): string => {
    return context.payload.workflow_run?.head_branch || '';
};

export const getWorkflowPrNumbers = (
    context:
        | Context<'workflow_run'>
        | Context<'workflow_run.requested'>
        | Context<'workflow_run.completed'>
): number[] => {
    return context.payload.workflow_run
        ? context.payload.workflow_run.pull_requests.map((pr) => pr.number)
        : [];
};

export const getWorkflowRunConclusion = (
    context: Context<'workflow_run.completed'>
) => {
    return context.payload.workflow_run?.conclusion || null;
};

export const getWorkflowRunId = (
    context:
        | Context<'workflow_run'>
        | Context<'workflow_run.requested'>
        | Context<'workflow_run.completed'>
): number | null => {
    return context.payload.workflow_run?.id ?? null;
};

export const getWorkflowHeadSha = (
    context:
        | Context<'workflow_run'>
        | Context<'workflow_run.requested'>
        | Context<'workflow_run.completed'>
): string | null => {
    return context.payload.workflow_run?.head_sha ?? null;
};

export const isWorkflowContext = (
    context: Context
    // https://github.com/probot/probot/issues/1680
    // @ts-ignore TS2590: Expression produces a union type that is too complex to represent.
): context is Context<
    'workflow_run' | 'workflow_run.completed' | 'workflow_run.requested'
> => {
    return 'workflow_run' in context.payload;
};

/**
 * Opening PR via fork => function returns forked repository
 * Opening PR by maintainer => function returns original repository
 */
export const getWorkflowHeadRepo = (
    context:
        | Context<'workflow_run'>
        | Context<'workflow_run.requested'>
        | Context<'workflow_run.completed'>
) => {
    return context.payload.workflow_run.head_repository;
};
