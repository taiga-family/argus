import type { IZipEntry } from 'adm-zip';
import AdmZip from 'adm-zip';

import { DEFAULT_BOT_CONFIGS } from '../constants';

export function getFilesFromZipFile(
    zipFile: ArrayBuffer | Buffer
): IZipEntry[] {
    const zip = new AdmZip(
        Buffer.isBuffer(zipFile) ? zipFile : Buffer.from(zipFile)
    );

    return zip.getEntries().filter((entry) => !entry.isDirectory);
}

function isImage(file: IZipEntry): boolean {
    return /\.(png|jpeg|jpg|gif|svg)$/gi.test(file.entryName);
}

export function findScreenshotDiffImages(
    zipFile: ArrayBuffer | Buffer,
    screenshotsDiffsPaths?: string[]
): IZipEntry[] {
    const files = getFilesFromZipFile(zipFile);
    const diffsPaths =
        screenshotsDiffsPaths || DEFAULT_BOT_CONFIGS['diff-paths'];

    return files
        .filter((file) =>
            diffsPaths.some((regExp) =>
                new RegExp(regExp, 'gi').test(file.entryName)
            )
        )
        .filter(isImage);
}

export function findNewScreenshotImages(
    zipFile: ArrayBuffer | Buffer,
    newScreenshotMark?: string
) {
    return getFilesFromZipFile(zipFile).filter((file) =>
        new RegExp(
            newScreenshotMark || DEFAULT_BOT_CONFIGS['new-screenshot-mark'],
            'gi'
        ).test(file.entryName)
    );
}
