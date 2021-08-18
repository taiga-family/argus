export interface IBotConfigs {
    /**
     * array of regular expression strings to match workflow names
     * which should be watched by bot
     */
    workflowWithTests?: string[];
    /**
     * array of regular expression strings to match images inside artifacts (by their path or file name)
     * which shows difference between two screenshot and which will be added to bot report comment
     */
    screenshotsDiffsPaths?: string[];
}
