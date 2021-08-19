export const BOT_REPORT_MESSAGES = {
    LOADING_WORKFLOW: `
# Tests are running :rocket:\n
Wait for workflow run with tests to finish :coffee:`,
    SUCCESS_WORKFLOW: `
# Tests completed successfully :white_check_mark:\n
Good job :fire:`,
    FAILED_WORKFLOW_NO_SCREENSHOTS: `
# Workflow with tests failed :x:\n
I have not found any screenshots diffs. Probably, workflow failed for another reason.\n
Manually download artifacts of workflow or look into workflow logs to check it.`,
    PR_CLOSED: `
# Pull request was closed :heavy_check_mark:\n
All saved screenshots (for current PR) were deleted :wastebasket:`,
} as const;

export const BOT_COMMIT_MESSAGE = {
    UPLOAD_IMAGE: 'chore(argus): upload images of failed screenshot tests',
    DELETE_FOLDER: 'chore(argus): delete saved screenshots (PR was closed)',
} as const;
