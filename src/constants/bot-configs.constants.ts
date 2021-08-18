import {IBotConfigs} from '../types';

export const BOT_CONFIGS_FILE_NAME = 'argus-configs.toml';

export const DEFAULT_BOT_CONFIGS: Required<IBotConfigs> = {
    workflowWithTests: ['.*test.*'],
};
