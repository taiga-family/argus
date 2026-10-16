export const DEFAULT_MAIN_BRANCH: 'main' | 'master' = 'main';
export const IS_GITHUB_ACTION = !!process.env.GITHUB_ACTIONS;
// shortcut: one cap for all environments, raise it if 200 files are not enough to debug
export const LOG_MAX_FILE_ENTRIES = 200;
