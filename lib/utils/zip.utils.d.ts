/// <reference types="node" />
import { IZipEntry } from 'adm-zip';
export declare function getFilesFromZipFile(zipFile: ArrayBuffer | Buffer): IZipEntry[];
export declare function findScreenshotDiffImages(zipFile: ArrayBuffer | Buffer, screenshotsDiffsPaths?: string[]): IZipEntry[];
