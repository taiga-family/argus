import * as core from '@actions/core';
import {type Logger as PinoLogger} from 'pino';

import {formatKeyValue} from './format.utils';

export interface IBotLogger {
    group(title: string, render: () => void): void;
    info(message: string): void;
    notice(message: string): void;
    warn(message: string): void;
    keyValue(rows: Array<[string, string]>): void;
    list(items: string[]): void;
}

export function createLogger(log: PinoLogger): IBotLogger {
    const isAction = !!process.env.GITHUB_ACTIONS;

    const info = (message: string): void => {
        if (isAction) {
            core.info(message);
        } else {
            log.info(message);
        }
    };

    const notice = (message: string): void => {
        if (isAction) {
            core.notice(message);
        } else {
            log.info(message);
        }
    };

    const warn = (message: string): void => {
        if (isAction) {
            core.warning(message);
        } else {
            log.warn(message);
        }
    };

    // GitHub does not support nested `::group::` sections, so callers must not nest `group()` calls.
    const group = (title: string, render: () => void): void => {
        if (!isAction) {
            info(`— ${title} —`);
            render();

            return;
        }

        core.startGroup(title);

        try {
            render();
        } finally {
            core.endGroup();
        }
    };

    const keyValue = (rows: Array<[string, string]>): void => {
        info(formatKeyValue(rows));
    };

    const list = (items: string[]): void => {
        items.forEach(info);
    };

    return {group, info, notice, warn, keyValue, list};
}
