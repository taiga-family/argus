"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOT_COMMIT_MESSAGE = exports.BOT_REPORT_MESSAGES = void 0;
exports.BOT_REPORT_MESSAGES = {
    LOADING_WORKFLOW: "\n# Tests are running :rocket:\n\nWait for workflow run with tests to finish :coffee:",
    SUCCESS_WORKFLOW: "\n# Tests completed successfully :white_check_mark:\n\nGood job :fire:",
    FAILED_WORKFLOW_NO_SCREENSHOTS: "\n# Workflow with tests failed :x:\n\nI have not found any screenshots diffs. Probably, workflow failed for another reason.\n\nManually download artifacts of workflow or look into workflow logs to check it.",
    PR_CLOSED: "\n# Pull request was closed :heavy_check_mark:\n\nAll saved screenshots (for current PR) were deleted :wastebasket:",
};
exports.BOT_COMMIT_MESSAGE = {
    UPLOAD_IMAGE: 'chore(argus): upload images of failed screenshot tests',
    DELETE_FOLDER: 'chore(argus): delete saved screenshots (PR was closed)',
};
//# sourceMappingURL=bot-messages.constants.js.map