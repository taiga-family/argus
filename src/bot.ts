import {Context} from 'probot/lib/context';
import {
    DEFAULT_MAIN_BRANCH,
    GITHUB_CDN_DOMAIN,
    IMAGES_STORAGE_FOLDER,
    STORAGE_BRANCH,
    TEST_REPORT_HIDDEN_LABEL,
} from './constants';
import {checkContainsHiddenLabel, markCommentWithHiddenLabel} from './utils';

export abstract class Bot {
    constructor(protected context: Context) {}

    /**
     * Send comment to the issue
     * (pull request is the same issue but with code)
     * @param issueNumber
     * @param markdownText string (optionally, can include markdown syntax)
     */
    async sendComment(issueNumber: number, markdownText: string) {
        const comment = this.context.repo({
            body: markdownText,
            issue_number: issueNumber,
        });

        return this.context.octokit.issues.createComment(comment);
    }

    /**
     * Update certain comment in the issue (pull request is the same issue but with code)
     * @param commentId
     * @param newMarkdownContent string (optionally, can include markdown syntax)
     */
    async updateComment(commentId: number, newMarkdownContent: string) {
        return this.context.octokit.rest.issues.updateComment({
            ...this.context.repo(),
            comment_id: commentId,
            body: newMarkdownContent,
        });
    }

    /**
     * Get info about all comments in the current issue/PR
     */
    async getCommentsByIssueId(issueNumber: number) {
        return this.context.octokit.rest.issues.listComments({
            ...this.context.repo(),
            issue_number: issueNumber,
        }).then(({data}) => data);
    }

    /**
     * Download artifacts (zip files) in the workflow and unpack them
     */
    async getWorkflowArtifacts<T>(workflowRunId: number): Promise<T[]> {
        const workflowRunInfo = this.context.repo({
            run_id: workflowRunId,
        });

        const artifactsInfo = await this.context.octokit.actions.listWorkflowRunArtifacts(workflowRunInfo)
            .catch(() => null);

        if (artifactsInfo) {
            const artifactsMetas = artifactsInfo.data.artifacts
                .map(({id}) => this.context.repo({artifact_id: id, archive_format: 'zip'}))
            const artifactsRequests = artifactsMetas
                .map(meta => this.context.octokit.actions.downloadArtifact(meta).then(({data}) => data as T));

            return Promise.all(artifactsRequests);
        }

        return [];
    };

    /**
     * Get info about file by its path in the repository
     */
    async getFileInfo(path: string, branch: string = DEFAULT_MAIN_BRANCH) {
        return this.context.octokit.repos.getContent({
            ...this.context.repo(),
            path,
            ref: branch
        }).catch(() => null);
    }

    /**
     * Get info about git branch by its name
     */
    async getBranchInfo(branch: string) {
        return this.context.octokit.rest.repos.getBranch({...this.context.repo(), branch}).catch(() => null);
    }

    /**
     * Create git branch in current repository (do nothing if branch already exists)
     * @param branch new branch name
     * @param fromBranch from which to create new branch
     */
    async createBranch(branch: string, fromBranch = DEFAULT_MAIN_BRANCH) {
        if (await this.getBranchInfo(branch)) {
            return;
        }

        const fromBranchInfo = await this.context.octokit.rest.repos.getBranch({
            ...this.context.repo(),
            branch: fromBranch
        });

        return this.context.octokit.rest.git.createRef({
            ...this.context.repo(),
            ref: `refs/heads/${branch}`,
            sha: fromBranchInfo.data.commit.sha,
        });
    }

    /**
     * Upload file to a separate branch (with creation of this branch if it not exists yet)
     * @param file buffer of the file
     * @param path path of future file (including file name + file format)
     * @param commitMessage
     * @return url link to download the uploaded file
     */
    async uploadFile(file: Buffer, path: string, commitMessage: string): Promise<string> {
        const {repo, owner} = this.context.repo();
        const content = file.toString('base64');
        const oldFileVersion = await this.getFileInfo(path, STORAGE_BRANCH);

        await this.createBranch(STORAGE_BRANCH);

        return this.context.octokit.repos
            .createOrUpdateFileContents({
                owner,
                repo,
                content,
                path,
                sha: oldFileVersion && 'sha' in oldFileVersion.data ? oldFileVersion.data.sha : undefined,
                branch: STORAGE_BRANCH,
                message: commitMessage,
            })
            .then(() => `${GITHUB_CDN_DOMAIN}/${owner}/${repo}/${STORAGE_BRANCH}/${path}`);
    }
}

export class ArgusBot extends Bot {
    async getPrevBotReportComment(prNumber: number) {
        const prComments = await this.getCommentsByIssueId(prNumber);

        return prComments.find(
            ({body}) => checkContainsHiddenLabel(body || '', TEST_REPORT_HIDDEN_LABEL)
        ) || null;
    }

    async createOrUpdateReport(prNumber: number, markdownText: string) {
        const oldBotComment = await this.getPrevBotReportComment(prNumber);
        const markedMarkdownText = markCommentWithHiddenLabel(markdownText, TEST_REPORT_HIDDEN_LABEL);

        return oldBotComment?.id
            ? this.updateComment(oldBotComment.id, markedMarkdownText)
            : this.sendComment(prNumber, markedMarkdownText);
    }

    async uploadImage(file: Buffer, imagePath: string) {
        const {repo, owner} = this.context.repo();
        const commitMessage = 'chore(argus): upload images of failed screenshot tests';

        return this.uploadFile(
            file,
            `${IMAGES_STORAGE_FOLDER}/${owner}-${repo}/${imagePath}`,
            commitMessage
        );
    }
}
