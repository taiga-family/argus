export declare const BOT_REPORT_MESSAGES: {
    readonly LOADING_WORKFLOW: "\n# Tests are running :rocket:\n\nWait for workflow run with tests to finish :coffee:";
    readonly SUCCESS_WORKFLOW: "\n# Tests completed successfully :white_check_mark:\n\nGood job :fire:";
    readonly FAILED_WORKFLOW_NO_SCREENSHOTS: "\n# Workflow with tests failed :x:\n\nI have not found any screenshots diffs. Probably, workflow failed for another reason.\n\nManually download artifacts of workflow or look into workflow logs to check it.";
    readonly PR_CLOSED: "\n# Pull request was closed :heavy_check_mark:\n\nAll saved screenshots (for current PR) were deleted :wastebasket:";
};
export declare const BOT_COMMIT_MESSAGE: {
    readonly UPLOAD_IMAGE: "chore(argus): upload images of failed screenshot tests";
    readonly DELETE_FOLDER: "chore(argus): delete saved screenshots (PR was closed)";
};
