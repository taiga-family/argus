export interface IWorkflowArtifact<F> {
    id: number;
    name: string;
    sizeInBytes: number;
    data: F;
}
