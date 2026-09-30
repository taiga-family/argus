export interface IWorkflowArtifact<F> {
    id: number;
    name: string;
    sizeInBytes: number;
    expired: boolean;
    data: F;
}
