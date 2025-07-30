export interface IBotConfigs {
    /**
     * array of regular expression strings to match workflow names
     * which should be watched by bot
     * @example ['.*screenshot.*']
     */
    workflows?: string[];
    /**
     * array of regular expression strings to match images inside artifacts (by their path or file name)
     * which shows difference between two screenshot and which will be added to bot report comment
     * @example ['.*__diff_output__.*']
     */
    'diff-paths'?: string[];
    /**
     * Regular expression string to match images inside artifacts (by their path or file name)
     * which are created by new screenshot tests.
     * @example '.*==new==.*'
     */
    'new-screenshot-mark'?: string;
    /**
     * array of regular expression strings to match branch names
     * which should be skipped by bot
     * ___
     * @example ["^release/.*"]
     */
    'branches-ignore': string[];
    /**
     * array of attributes (key="value") for html-tag <img /> (screenshots)
     * ___
     * @example ['width="200px"', 'height="300px"']
     */
    'img-attrs': string[];
    /**
     * Text which is placed at the beginning of section "Failed tests"
     * ___
     * @example **After <= Diff => Before**
     */
    'failed-report-description': string;
}
