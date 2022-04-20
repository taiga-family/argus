import { IBotConfigs } from '../types';

export const BOT_CONFIGS_FILE_NAME = 'bot-configs.toml';

export const DEFAULT_BOT_CONFIGS: Required<IBotConfigs> = {
    workflowWithTests: ['.*screenshot.*'],
    screenshotsDiffsPaths: [
        '.*__diff_output__.*', // it is default cypress folder name into which snapshot diffs are put
    ],
};
