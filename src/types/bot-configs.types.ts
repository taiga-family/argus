export interface IBotConfigs {
    /**
     * array of regular expression strings to match workflow names
     * which should be watched by bot
     * @example ['.*screenshot.*']
     */
    workflowWithTests?: string[];
    /**
     * array of regular expression strings to match images inside artifacts (by their path or file name)
     * which shows difference between two screenshot and which will be added to bot report comment
     * @example ['.*__diff_output__.*']
     */
    screenshotsDiffsPaths?: string[];
    /**
     * Regular expression string to match images inside artifacts (by their path or file name)
     * which are created by new screenshot tests.
     * @example '.*==new==.*'
     */
    newScreenshotMark?: string;
    /**
     * array of regular expression strings to match branch names
     * which should be skipped by bot
     * ___
     * @example ["^release/.*"]
     */
    branchesIgnore: string[];
}
