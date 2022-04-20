export const enum BotReportMessage {
    LoadingWorkflow = `
# Tests are running :rocket:\n
Wait for workflow run with tests to finish :coffee:`,
    SuccessWorkflow = `
# Tests completed successfully :white_check_mark:\n
Good job :fire:`,
    FailedWorkflowNoScreenshots = `
# Workflow with tests failed :x:\n
I have not found any screenshots diffs. Probably, workflow failed for another reason.\n
Manually download artifacts of workflow or look into workflow logs to check it.`,
    PRClosed = `
# Pull request was closed :heavy_check_mark:\n
All saved screenshots (for current PR) were deleted :wastebasket:`,
}

export const enum BotCommitMessage {
    UploadImage = 'chore: upload images of failed screenshot tests',
    DeleteFolder = 'chore: delete saved screenshots (PR was closed)',
}
