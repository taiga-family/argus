import {Context} from 'probot';
import {EmitterWebhookEventName} from '@octokit/webhooks';
import {IZipEntry} from 'adm-zip';
import {
    BOT_COMMIT_MESSAGE,
    BOT_CONFIGS_FILE_NAME,
    DEFAULT_BOT_CONFIGS,
    DEFAULT_MAIN_BRANCH,
    GITHUB_CDN_DOMAIN,
    IMAGES_STORAGE_FOLDER,
    STORAGE_BRANCH,
    TEST_REPORT_HIDDEN_LABEL,
} from '../constants';
import {
    checkContainsHiddenLabel,
    findScreenshotDiffImages,
    markCommentWithHiddenLabel,
    parseTomlFileBase64Str,
} from '../utils';
import {IBotConfigs} from '../types';
import {getWorkflowHeadSha, getWorkflowPrNumbers, isWorkflowContext} from '../selectors';

export abstract class Bot<T extends EmitterWebhookEventName> {
    constructor(protected context: Context<T>) {}

    /**
     * Send comment to the issue
     * (pull request is the same issue but with code).
     * ___
     * This method uses github api endpoint:
     * {@link https://docs.github.com/en/rest/reference/issues#create-an-issue-comment Create an issue comment}.
     *
     * GitHub App must have the **issues:write**
     * (or **pull_requests:write** if you are working only with PRs) permission to use this endpoints.
     *
     * @param issueNumber number
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
     * Update certain comment in the issue (pull request is the same issue but with code).
     * ___
     * This method uses github api endpoint
     * {@link https://docs.github.com/en/rest/reference/issues#update-an-issue-comment Update an issue comment}.
     *
     * GitHub App must have the **issues:write**
     * (or **pull_requests:write** if you are working only with PRs) permission to use this endpoints.
     *
     * @param commentId number
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
     * Get info about all comments in the current issue/PR.
     * ___
     * This method uses github api endpoint
     * {@link https://docs.github.com/en/rest/reference/issues#list-issue-comments List issue comments}.
     *
     * GitHub App must have the **issues:read**
     * (or **pull_requests:read** if you are working only with PRs) permission to use this endpoints.
     */
    async getCommentsByIssueId(issueNumber: number) {
        return this.context.octokit.rest.issues.listComments({
            ...this.context.repo(),
            issue_number: issueNumber,
        }).then(({data}) => data);
    }

    /**
     * Download artifacts (zip files) in the workflow and unpack them.
     * ___
     * This method uses two github api endpoints:
     * - {@link https://docs.github.com/en/rest/reference/actions#list-workflow-run-artifacts List workflow run artifacts}
     * - {@link https://docs.github.com/en/rest/reference/actions#download-an-artifact Download an artifact}
     *
     * GitHub App must have the **actions:read** permission to use these endpoints.
     */
    async getWorkflowArtifacts<T>(workflowRunId: number): Promise<T[]> {
        const workflowRunInfo = this.context.repo({
            run_id: workflowRunId,
        });

        const artifactsInfo = await this.context.octokit.actions.listWorkflowRunArtifacts(workflowRunInfo)
            .catch(() => null);
        const artifacts = artifactsInfo && artifactsInfo.data.artifacts || [];

        if (artifacts.length) {
            const artifactsMetas = artifacts
                .map(({id}) => this.context.repo({artifact_id: id, archive_format: 'zip'}))
            const artifactsRequests = artifactsMetas
                .map(meta => this.context.octokit.actions.downloadArtifact(meta).then(({data}) => data as T));

            return Promise.all(artifactsRequests);
        }

        return [];
    };

    /**
     * Get file (+ meta info about it) by its path in the repository.
     * ___
     * This method uses github api endpoint
     * {@link https://docs.github.com/en/rest/reference/repos#get-repository-content Get repository content}.
     *
     * GitHub App must have the **contents:read** (or **single_file:read** to required files) permission to use this endpoints.
     *
     * @param path file location (from root of repo)
     * @param branch target branch
     * (if branch param is not provided it takes the repository’s default branch (usually master/main))
     */
    async getFile(path: string, branch?: string) {
        return this.context.octokit.repos.getContent({
            ...this.context.repo(),
            path,
            ref: branch
        }).catch(() => null);
    }

    /**
     * Get info about git branch by its name.
     * ___
     * This method uses github api endpoint
     * {@link https://docs.github.com/en/rest/reference/repos#get-a-branch Get a branch}.
     *
     * GitHub App must have the **contents:read** permission to use this endpoints.
     */
    async getBranchInfo(branch: string) {
        return this.context.octokit.rest.repos.getBranch({...this.context.repo(), branch}).catch(() => null);
    }

    /**
     * Create git branch in current repository (do nothing if branch already exists).
     * ___
     * This method uses github api endpoint
     * {@link https://docs.github.com/en/rest/reference/git#create-a-reference Create a reference}.
     *
     * GitHub App must have the **contents:write** permission to use this endpoints.
     *
     * @param branch new branch name
     * @param fromBranch from which to create new branch
     * (if branch param is not provided it tries to parse repository’s default branch or use {@link DEFAULT_MAIN_BRANCH})
     */
    async createBranch(branch: string, fromBranch?: string) {
        if (await this.getBranchInfo(branch)) {
            return;
        }

        const currentRepoDefaultBranch = 'repository' in this.context.payload ? this.context.payload.repository?.default_branch : '';
        const fromBranchInfo = await this.getBranchInfo(
            fromBranch || currentRepoDefaultBranch || DEFAULT_MAIN_BRANCH
        );

        if (!fromBranchInfo) {
            return;
        }

        return this.context.octokit.rest.git.createRef({
            ...this.context.repo(),
            ref: `refs/heads/${branch}`,
            sha: fromBranchInfo.data.commit.sha,
        });
    }

    /**
     * Upload file to a separate branch.
     * ___
     * This method uses github api endpoint
     * {@link https://docs.github.com/en/rest/reference/repos#create-or-update-file-contents Create or update file contents}.
     *
     * GitHub App must have the **single_file:write** permission (to required files) to use this endpoints
     * (or **contents:write**).
     */
    async uploadFile({file, path, branch, commitMessage}: {
        /** buffer of the file */
        file: Buffer,
        /** path of future file (including file name + file format) */
        path: string,
        commitMessage: string,
        branch: string
    }): Promise<string> {
        const {repo, owner} = this.context.repo();
        const content = file.toString('base64');
        const oldFileVersion = await this.getFile(path, branch);

        return this.context.octokit.repos
            .createOrUpdateFileContents({
                owner,
                repo,
                content,
                path,
                branch,
                sha: oldFileVersion && 'sha' in oldFileVersion.data ? oldFileVersion.data.sha : undefined,
                message: commitMessage,
            })
            .then(() => `${GITHUB_CDN_DOMAIN}/${owner}/${repo}/${branch}/${path}`);
    }

    /**
     * Delete file in the following branch.
     * ___
     * This method uses github api endpoint
     * {@link https://docs.github.com/en/rest/reference/repos#delete-a-file Delete a file}.
     *
     * GitHub App must have the **single_file:write** permission (to required files) to use this endpoints
     * (or **contents:write**).
     */
    async deleteFile({path, commitMessage, branch}: {
        path: string,
        commitMessage: string,
        branch: string
    }) {
        const oldFileVersion = await this.getFile(path, branch);

        if (!(oldFileVersion && 'sha' in oldFileVersion.data)) {
            return Promise.reject('the file is not found!');
        }

        return this.context.octokit.rest.repos.deleteFile({
            ...this.context.repo(),
            path,
            branch,
            message: commitMessage,
            sha: oldFileVersion.data.sha,
        })
    }

    /**
     * List pull requests.
     * ___
     * This method uses github api endpoint
     * {@link https://docs.github.com/en/rest/reference/pulls#list-pull-requests List pull requests}.
     *
     * GitHub App must have the **pull_requests:read** permission to use this endpoints.
     */
    async getPRsList() {
        return this.context.octokit.rest.pulls.list(this.context.repo());
    }
}

export class ScreenshotBot<T extends EmitterWebhookEventName> extends Bot<T> {
    private botConfigs: IBotConfigs | null = null;

    async loadBotConfigs(branch?: string): Promise<IBotConfigs> {
        return this.getFile(BOT_CONFIGS_FILE_NAME, branch)
            .then(res => res?.data && 'content' in res.data ? res.data.content : '')
            .then(base64Str => parseTomlFileBase64Str<IBotConfigs>(base64Str))
            .catch(() => DEFAULT_BOT_CONFIGS);
    }

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

    async getScreenshotDiffImages(zipFiles: Array<ArrayBuffer | Buffer>, branch?: string): Promise<IZipEntry[]> {
        if (!zipFiles.length) {
            return Promise.resolve([]);
        }

        if (!this.botConfigs) {
            this.botConfigs = await this.loadBotConfigs(branch);
        }

        /**
         * TODO: add support of many artifacts per workflow
         * {@link https://github.com/TinkoffCreditSystems/argus/issues/4 issue}
         */
        const [zipFile] = zipFiles;

        return findScreenshotDiffImages(zipFile, this.botConfigs.screenshotsDiffsPaths);
    }

    async uploadImages(images: Buffer[], prNumber: number, workflowRunId: number) {
        await this.createBranch(STORAGE_BRANCH);

        return Promise.all(images.map(
            (file, index) => this.uploadFile({
                file,
                path: `${this.getSavedImagePathPrefix(prNumber)}/${workflowRunId}-${index}.png`,
                commitMessage: BOT_COMMIT_MESSAGE.UPLOAD_IMAGE,
                branch: STORAGE_BRANCH,
            })
        ));
    }

    async checkShouldSkipWorkflow(workflowName: string, workflowBranch?: string): Promise<boolean> {
        if (!this.botConfigs) {
            this.botConfigs = await this.loadBotConfigs(workflowBranch);
        }

        const workflowsWithTests = this.botConfigs.workflowWithTests || DEFAULT_BOT_CONFIGS.workflowWithTests;

        return !workflowName || !workflowsWithTests.some(regExp => new RegExp(regExp, 'gi').test(workflowName));
    }

    async deleteUploadedImagesFolder(prNumber: number) {
        const folder = await this.getFile(
            this.getSavedImagePathPrefix(prNumber),
            STORAGE_BRANCH
        );

        if (folder && Array.isArray(folder.data)) {
            return Promise.all(
                folder.data.map(({path}) => this.deleteFile({
                    path,
                    commitMessage: BOT_COMMIT_MESSAGE.DELETE_FOLDER,
                    branch: STORAGE_BRANCH
                }))
            );
        }

        return null;
    }

    /**
     * If it is contribution from forked repo,
     * `workflow-run` event will always have `pull_requests` field as empty array.
     * See this {@link https://github.community/t/pull-request-attribute-empty-in-workflow-run-event-object-for-pr-from-forked-repo/154682 issue}.
     *
     * In this case bot get PR number in another way (with help of addition API request).
     */
    async getWorkflowPrNumber(): Promise<number | null> {
        if (!isWorkflowContext(this.context)) {
            return null;
        }

        const [prNumber] = getWorkflowPrNumbers(this.context);

        if (typeof prNumber === 'number') {
            // almost all cases (except for contribution via forked repo)
            return prNumber;
        }

        const currentRepoPulls = await this.getPRsList().then(({data}) => data);
        const headSha = getWorkflowHeadSha(this.context);
        const contributionPR = currentRepoPulls.find(pr => pr.head.sha === headSha) || null;

        return contributionPR && contributionPR.number;
    }

    private getSavedImagePathPrefix(prNumber: number): string {
        const {repo, owner} = this.context.repo();

        return `${IMAGES_STORAGE_FOLDER}/${owner}-${repo}-${prNumber}`;
    }
}