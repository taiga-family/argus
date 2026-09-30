import {GITHUB_DOMAIN} from '../constants';

export interface IRepoRef {
    owner: string;
    repo: string;
}

export const getPrUrl = ({owner, repo}: IRepoRef, prNumber: number): string =>
    `${GITHUB_DOMAIN}/${owner}/${repo}/pull/${prNumber}`;

export const getCommitUrl = ({owner, repo}: IRepoRef, commitSha: string): string =>
    `${GITHUB_DOMAIN}/${owner}/${repo}/commit/${commitSha}`;

export const getWorkflowRunUrl = (
    {owner, repo}: IRepoRef,
    workflowRunId: number,
): string => `${GITHUB_DOMAIN}/${owner}/${repo}/actions/runs/${workflowRunId}`;

export const getBranchUrl = ({owner, repo}: IRepoRef, branch: string): string =>
    `${GITHUB_DOMAIN}/${owner}/${repo}/tree/${branch}`;
