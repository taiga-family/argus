import {Context} from 'probot/lib/context';
import {GITHUB_CDN_DOMAIN, IMAGES_STORAGE_FOLDER, STORAGE_BRANCH} from './constants';

export class Bot {
    constructor(private context: Context) {}

    async sendComment(prNumber: number, body: string) {
        const comment = this.context.repo({
            body,
            issue_number: prNumber,
        });

        return this.context.octokit.issues.createComment(comment);
    }

    async buildMarkdownText(text: string) {
        return this.context.octokit.markdown.render({text})
    }

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

    async getBranchInfo(branch: string) {
        return this.context.octokit.rest.repos.getBranch({...this.context.repo(), branch}).catch(() => null);
    }

    async getFileInfo(path: string, branch: string = 'master') {
        return this.context.octokit.repos.getContent({
            ...this.context.repo(),
            path,
            ref: branch
        }).catch(() => null);
    }

    async createBranch(branch: string, fromBranch = 'master') {
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
     * Upload image to a separate branch (with creation of this branch if need)
     * @param image buffer of the file
     * @param fileName file name of future file
     * @return url of the download uploaded file
     */
    async uploadImage(image: Buffer, fileName: string): Promise<string> {
        const {repo, owner} = this.context.repo();
        const content = image.toString('base64');
        const path = `${IMAGES_STORAGE_FOLDER}/${fileName}`;
        const oldImageVersion = await this.getFileInfo(path, STORAGE_BRANCH);

        await this.createBranch(STORAGE_BRANCH);

        return this.context.octokit.repos
            .createOrUpdateFileContents({
                owner,
                repo,
                content,
                path,
                sha: oldImageVersion && 'sha' in oldImageVersion.data ? oldImageVersion.data.sha : undefined,
                branch: STORAGE_BRANCH,
                message: 'chore(argus): upload images of failed screenshot tests',
            })
            .then(() => `${GITHUB_CDN_DOMAIN}/${owner}/${repo}/${STORAGE_BRANCH}/${IMAGES_STORAGE_FOLDER}/${fileName}`);
    }
}
