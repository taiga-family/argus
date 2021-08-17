export const BOT_REPORT_MESSAGES = {
    LOADING: '# Screenshots running :rocket:',
    SUCCESS: '# Screenshots tests completed successfully :white_check_mark:',
    ARTIFACTS_DOWNLOAD_FAILED: '# Screenshots tests failed :x:\n Manually download artifacts of workflow to see screenshots diffs.',
} as const;

export const BOT_COMMIT_MESSAGE = {
    UPLOAD_IMAGE: 'chore(argus): upload images of failed screenshot tests',
    DELETE_FOLDER: 'chore(argus): delete saved screenshots (PR was closed)',
} as const;
