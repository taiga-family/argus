"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BOT_CONFIGS = exports.BOT_CONFIGS_FILE_NAME = void 0;
exports.BOT_CONFIGS_FILE_NAME = 'argus-configs.toml';
exports.DEFAULT_BOT_CONFIGS = {
    workflowWithTests: ['.*test.*'],
    screenshotsDiffsPaths: [
        '.*__diff_output__.*' // it is default cypress folder name into which snapshot diffs are put
    ],
};
//# sourceMappingURL=bot-configs.constants.js.map