import type { IBotConfigs } from '../types';

export const BOT_CONFIGS_FILE_NAME = 'screenshot-bot.config.yml';

export const DEFAULT_BOT_CONFIGS: Required<IBotConfigs> = {
    workflows: ['.*screenshot.*'],
    'branches-ignore': [],
    'diff-paths': [
        '.*__diff_output__.*', // it is default cypress folder name into which snapshot diffs are put
    ],
    'new-screenshot-mark': '.*==new==.*',
    'img-attrs': [],
    'failed-report-description': '',
};
