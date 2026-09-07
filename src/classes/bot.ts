import {type EmitterWebhookEventName} from '@octokit/webhooks';
import {type IZipEntry} from 'adm-zip';
import {type Context, type ProbotOctokit} from 'probot';

import {
    BOT_CONFIGS_FILE_NAME,
    DEFAULT_BOT_CONFIGS,
    DEFAULT_MAIN_BRANCH,
    GITHUB_CDN_DOMAIN,
    GithubFileMode,
    IMAGES_STORAGE_FOLDER,
    STORAGE_BRANCH,
    TEST_REPORT_HIDDEN_LABEL,
} from '../constants';
import {
    getWorkflowHeadRepo,
    getWorkflowHeadSha,
    getWorkflowPrNumbers,
    isWorkflowContext,
} from '../selectors';
import {type IBotConfigs, type IBotConfigsSource, type IWorkflowArtifact} from '../types';
import {
    checkContainsHiddenLabel,
    findNewScreenshotImages,
    findScreenshotDiffImages,
    markCommentWithHiddenLabel,
} from '../utils';

type OctokitResponse<M extends (...args: never[]) => unknown> = Awaited<ReturnType<M>>;

type IssueComment = OctokitResponse<
    ProbotOctokit['rest']['issues']['listComments']
>['data'][number];

export abstract class Bot<T extends EmitterWebhookEventName> {
    protected context: Context<T>;

    constructor(context: Context<T>) {
        this.context = context;
    }

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
    public async sendComment(
        issueNumber: number,
        markdownText: string,
    ): Promise<OctokitResponse<ProbotOctokit['issues']['createComment']>> {
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
    public async updateComment(
        commentId: number,
        newMarkdownContent: string,
    ): Promise<OctokitResponse<ProbotOctokit['rest']['issues']['updateComment']>> {
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
    public async getCommentsByIssueId(issueNumber: number): Promise<IssueComment[]> {
        return this.context.octokit.rest.issues
            .listComments({
                ...this.context.repo(),
                issue_number: issueNumber,
            })
            .then(({data}) => data);
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
    public async getWorkflowArtifacts<F>(
        workflowRunId: number,
    ): Promise<Array<IWorkflowArtifact<F>>> {
        const workflowRunInfo = this.context.repo({run_id: workflowRunId});

        const artifactsInfo = await this.context.octokit.actions
            .listWorkflowRunArtifacts(workflowRunInfo)
            .catch(() => null);

        const artifacts = artifactsInfo?.data.artifacts ?? [];

        return Promise.all(
            artifacts.map(async ({id, name, size_in_bytes: sizeInBytes, expired}) =>
                this.context.octokit.actions
                    .downloadArtifact(
                        this.context.repo({artifact_id: id, archive_format: 'zip'}),
                    )
                    .then(({data}) => ({
                        id,
                        name,
                        sizeInBytes,
                        expired,
                        data: data as F,
                    })),
            ),
        );
    }

    /**
     * Get file (+ meta info about it) by its path in the repository.
     * ___
     * This method uses github api endpoint
     * {@link https://docs.github.com/en/rest/reference/repos#get-repository-content Get repository content}.
     *
     * GitHub App must have the **contents:read** (or **single_file:read** to required files) permission to use this endpoints.
     *
     * @param path file location (from root of repo)
     * @param targetConfigs info about target repository
     */
    public async getFile(
        path: string,
        {
            branch,
            owner,
            repo,
        }: {
            branch: string;
            /** Repository owner. Default: takes value from `context.repo()` */
            owner?: string;
            /** Repository name. Default: takes value from `context.repo()` */
            repo?: string;
        },
    ): Promise<OctokitResponse<ProbotOctokit['repos']['getContent']> | null> {
        const repoInfo = this.context.repo();

        return this.context.octokit.repos
            .getContent({
                owner: owner || repoInfo.owner,
                repo: repo || repoInfo.repo,
                path,
                ref: branch,
            })
            .catch(() => null);
    }

    /**
     * Get info about git branch by its name.
     * ___
     * This method uses github api endpoint
     * {@link https://docs.github.com/en/rest/reference/repos#get-a-branch Get a branch}.
     *
     * GitHub App must have the **contents:read** permission to use this endpoints.
     */
    public async getBranchInfo(
        branch: string,
    ): Promise<OctokitResponse<ProbotOctokit['rest']['repos']['getBranch']> | null> {
        return this.context.octokit.rest.repos
            .getBranch({...this.context.repo(), branch})
            .catch(() => null);
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
    public async createBranch(
        branch: string,
        fromBranch?: string,
    ): Promise<OctokitResponse<ProbotOctokit['rest']['git']['createRef']> | undefined> {
        if (await this.getBranchInfo(branch)) {
            return;
        }

        const currentRepoDefaultBranch =
            'repository' in this.context.payload
                ? this.context.payload.repository?.default_branch
                : '';

        const fromBranchInfo = await this.getBranchInfo(
            fromBranch || currentRepoDefaultBranch || DEFAULT_MAIN_BRANCH,
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
     * Upload multiple files to a separate branch under a single commit.
     */
    public async uploadFiles({
        files,
        branch,
        commitMessage,
    }: {
        files: ReadonlyArray<{path: string; content: Buffer}>;
        commitMessage: string;
        branch: string;
    }): Promise<{commitSha: string; urls: string[]}> {
        if (!files.length) {
            return {commitSha: '', urls: []};
        }

        const commitSha = await this.createCommit({
            files,
            branch,
            commitMessage,
        });

        const {repo, owner} = this.context.repo();

        return {
            commitSha,
            urls: files.map(
                ({path}) => `${GITHUB_CDN_DOMAIN}/${owner}/${repo}/${branch}/${path}`,
            ),
        };
    }

    /**
     * Delete files in the following branch.
     */
    public async deleteFiles({
        paths,
        commitMessage,
        branch,
    }: {
        paths: string[];
        commitMessage: string;
        branch: string;
    }): Promise<string | null> {
        return paths.length
            ? this.createCommit({
                  files: paths.map((path) => ({path, content: null})),
                  branch,
                  commitMessage,
              })
            : null;
    }

    /**
     * List pull requests.
     * ___
     * This method uses github api endpoint
     * {@link https://docs.github.com/en/rest/reference/pulls#list-pull-requests List pull requests}.
     *
     * GitHub App must have the **pull_requests:read** permission to use this endpoints.
     */
    public async getPRsList(): Promise<
        OctokitResponse<ProbotOctokit['rest']['pulls']['list']>
    > {
        return this.context.octokit.rest.pulls.list(this.context.repo());
    }

    /**
     * Create commit and push it to the top of the branch.
     * ___
     * This method uses github api endpoints:
     * - {@link https://docs.github.com/en/rest/git/blobs#create-a-blob Create a blob}
     * - {@link https://docs.github.com/en/rest/git/refs#get-a-reference Get a reference}
     * - {@link https://docs.github.com/en/rest/reference/git#create-a-tree Create a tree}
     * - {@link https://docs.github.com/en/rest/reference/git#create-a-commit Create a commit}
     * - {@link https://docs.github.com/en/rest/git/refs#update-a-reference Update a reference}
     */
    protected async createCommit({
        files,
        branch,
        commitMessage,
    }: {
        files: ReadonlyArray<{path: string; content: Buffer | null}>;
        commitMessage: string;
        branch: string;
    }): Promise<string> {
        if (!files.length) {
            throw new Error('[createCommit] Empty array is forbidden');
        }

        const repo = this.context.repo();
        const storageBranchRef = `heads/${branch}`;

        const filesNewSha = await Promise.all(
            files.map(async ({content, path}) => {
                const blobs = content
                    ? this.createBlob(content).then(({sha}) => sha)
                    : Promise.resolve(null);

                return blobs.then((sha) => ({
                    path,
                    sha,
                }));
            }),
        );

        const baseTreeSha = await this.context.octokit.git
            .getRef({
                ...repo,
                ref: storageBranchRef,
            })
            .then(({data}) => data.object.sha);

        const newTreeSha = await this.context.octokit.git
            .createTree({
                ...repo,
                tree: filesNewSha.map(({path, sha}) => ({
                    path,
                    sha,
                    type: 'blob',
                    mode: GithubFileMode.Blob,
                })),
                base_tree: baseTreeSha,
            })
            .then(({data}) => data.sha);

        const commitSha = await this.context.octokit.git
            .createCommit({
                ...repo,
                tree: newTreeSha,
                parents: [baseTreeSha],
                message: commitMessage,
            })
            .then(({data}) => data.sha);

        await this.context.octokit.git.updateRef({
            ...repo,
            ref: storageBranchRef,
            sha: commitSha,
        });

        return commitSha;
    }

    private async createBlob(
        fileContent: Buffer,
    ): Promise<OctokitResponse<ProbotOctokit['git']['createBlob']>['data']> {
        return this.context.octokit.git
            .createBlob({
                ...this.context.repo(),
                content: fileContent.toString('base64'),
                encoding: 'base64',
            })
            .then(({data}) => data);
    }
}

export class ScreenshotBot<T extends EmitterWebhookEventName> extends Bot<T> {
    private botConfigs: Required<IBotConfigs> | null = null;
    private botConfigsSource: IBotConfigsSource | null = null;

    public async loadBotConfigs(branch: string): Promise<Required<IBotConfigs>> {
        const repoInfo = this.context.repo();
        const headRepo = isWorkflowContext(this.context)
            ? getWorkflowHeadRepo(this.context)
            : null;

        const owner = headRepo?.owner.login ?? repoInfo.owner;
        const repo = headRepo?.name ?? repoInfo.repo;
        const path = `.github/${BOT_CONFIGS_FILE_NAME}`;

        return this.context.octokit.config
            .get({
                owner,
                repo,
                branch,
                path,
                defaults: DEFAULT_BOT_CONFIGS,
            })
            .then(({config, files}) => {
                this.botConfigsSource = {
                    owner,
                    repo,
                    path,
                    found: files.some((file) => file.config !== null),
                };

                return config;
            });
    }

    public async getBotConfigs(
        branch: string = DEFAULT_MAIN_BRANCH,
    ): Promise<Required<IBotConfigs>> {
        if (!this.botConfigs) {
            this.botConfigs = await this.loadBotConfigs(branch);
        }

        return this.botConfigs;
    }

    public getBotConfigsSource(): IBotConfigsSource | null {
        return this.botConfigsSource;
    }

    public async getPrevBotReportComment(prNumber: number): Promise<IssueComment | null> {
        const prComments = await this.getCommentsByIssueId(prNumber);

        return (
            prComments.find(({body}) =>
                checkContainsHiddenLabel(body || '', TEST_REPORT_HIDDEN_LABEL),
            ) || null
        );
    }

    public async createOrUpdateReport(
        prNumber: number,
        markdownText: string,
    ): Promise<
        OctokitResponse<
            | ProbotOctokit['issues']['createComment']
            | ProbotOctokit['rest']['issues']['updateComment']
        >
    > {
        const oldBotComment = await this.getPrevBotReportComment(prNumber);
        const markedMarkdownText = markCommentWithHiddenLabel(
            markdownText,
            TEST_REPORT_HIDDEN_LABEL,
        );

        return oldBotComment?.id
            ? this.updateComment(oldBotComment.id, markedMarkdownText)
            : this.sendComment(prNumber, markedMarkdownText);
    }

    public async getImagesByFn(
        zipFiles: Array<ArrayBuffer | Buffer>,
        fn: (zipFile: ArrayBuffer | Buffer) => IZipEntry[],
        branch: string,
    ): Promise<IZipEntry[]> {
        if (!zipFiles.length) {
            return Promise.resolve([]);
        }

        if (!this.botConfigs) {
            this.botConfigs = await this.loadBotConfigs(branch);
        }

        const screenshots = [];

        for (const file of zipFiles) {
            const images = fn(file);

            screenshots.push(...images);
        }

        return screenshots;
    }

    public async getNewScreenshotImages(
        zipFiles: Array<ArrayBuffer | Buffer>,
        branch: string,
    ): Promise<IZipEntry[]> {
        const filterFn = (zipFile: ArrayBuffer | Buffer): IZipEntry[] =>
            findNewScreenshotImages(zipFile, this.botConfigs?.['new-screenshot-mark']);

        return this.getImagesByFn(zipFiles, filterFn, branch);
    }

    public async getScreenshotDiffImages(
        zipFiles: Array<ArrayBuffer | Buffer>,
        branch: string,
    ): Promise<IZipEntry[]> {
        const filterFn = (zipFile: ArrayBuffer | Buffer): IZipEntry[] =>
            findScreenshotDiffImages(zipFile, this.botConfigs?.['diff-paths']);

        return this.getImagesByFn(zipFiles, filterFn, branch);
    }

    public async uploadImages(
        images: Buffer[],
        prNumber: number,
        workflowRunId: number,
    ): Promise<{commitSha: string; urls: string[]}> {
        await this.createBranch(STORAGE_BRANCH);

        const files = images.map((content, i) => ({
            content,
            path: `${this.getSavedImagePathPrefix(prNumber)}/${workflowRunId}-${i}.png`,
        }));

        return this.uploadFiles({
            files,
            branch: STORAGE_BRANCH,
            commitMessage: `ci(screenshot-bot): Upload | {pr: ${prNumber}, workflow: ${workflowRunId}}`,
        });
    }

    /**
     * @returns `null` when the workflow should be processed, or a human-readable skip reason otherwise.
     */
    public async checkShouldSkipWorkflow(
        workflowName: string,
        workflowBranch: string,
    ): Promise<string | null> {
        if (!this.botConfigs) {
            this.botConfigs = await this.loadBotConfigs(workflowBranch);
        }

        const hasTests =
            process.env.GITHUB_ACTIONS ||
            (workflowName &&
                this.botConfigs.workflows.some((regExp) =>
                    new RegExp(regExp, 'gi').test(workflowName),
                ));

        if (!hasTests) {
            return `workflow "${workflowName}" does not match configured "workflows" patterns`;
        }

        const branchIgnored =
            !!workflowBranch &&
            this.botConfigs['branches-ignore'].some((regExp) =>
                new RegExp(regExp, 'gi').test(workflowBranch),
            );

        return branchIgnored
            ? `branch "${workflowBranch}" matches configured "branches-ignore" patterns`
            : null;
    }

    public async deleteUploadedImagesFolder(prNumber: number): Promise<string | null> {
        const folder = await this.getFile(this.getSavedImagePathPrefix(prNumber), {
            branch: STORAGE_BRANCH,
        });

        const paths =
            folder && Array.isArray(folder.data) ? folder.data.map(({path}) => path) : [];

        return this.deleteFiles({
            paths,
            commitMessage: `ci(screenshot-bot): Delete | {pr: ${prNumber}}`,
            branch: STORAGE_BRANCH,
        });
    }

    /**
     * If it is contribution from forked repo,
     * `workflow-run` event will always have `pull_requests` field as empty array.
     * See this {@link https://github.community/t/pull-request-attribute-empty-in-workflow-run-event-object-for-pr-from-forked-repo/154682 issue}.
     *
     * In this case bot get PR number in another way (with help of addition API request).
     */
    public async getWorkflowPrNumber(): Promise<number | null> {
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
        const contributionPR =
            currentRepoPulls.find((pr) => pr.head.sha === headSha) || null;

        return contributionPR?.number ?? null;
    }

    private getSavedImagePathPrefix(prNumber: number): string {
        const {repo, owner} = this.context.repo();

        return `${IMAGES_STORAGE_FOLDER}/${owner}-${repo}-${prNumber}`;
    }
}
