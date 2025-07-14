import type { IBotConfigs } from '../types';

export const BOT_CONFIGS_FILE_NAME = 'screenshot-bot.config.yml';

export const DEFAULT_BOT_CONFIGS: Required<IBotConfigs> = {
    workflowWithTests: ['.*screenshot.*'],
    screenshotsDiffsPaths: [
        '.*__diff_output__.*', // it is default cypress folder name into which snapshot diffs are put
    ],
    newScreenshotMark: '.*==new==.*',
    branchesIgnore: [],
    screenshotImageAttrs: ['height="300"'],
    failedTestsReportDescription: '',
};
