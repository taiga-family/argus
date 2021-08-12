import {Context} from 'probot/lib/context';

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

    async getWorkflowArtifacts(workflowRunId: number) {
        const workflowRunInfo = this.context.repo({
            run_id: workflowRunId,
        });

        const artifactsInfo = await this.context.octokit.actions.listWorkflowRunArtifacts(workflowRunInfo)
            .catch(() => null);

        if (artifactsInfo) {
            const artifactsMetas = artifactsInfo.data.artifacts
                .map(({id}) => this.context.repo({artifact_id: id, archive_format: 'zip'}))
            const artifactsRequests = artifactsMetas
                .map(meta => this.context.octokit.actions.downloadArtifact(meta).then(({data}) => data));

            return Promise.all(artifactsRequests);
        }

        return [];
    };
}
