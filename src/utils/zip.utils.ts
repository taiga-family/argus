import AdmZip, {IZipEntry} from 'adm-zip';

export function getFilesFromZipFile(zipFile: ArrayBuffer | Buffer): IZipEntry[] {
    const zip = new AdmZip(Buffer.isBuffer(zipFile) ? zipFile : Buffer.from(zipFile));

    return zip.getEntries().filter(entry => !entry.isDirectory);
}

// TODO add more images format
function isImage(file: IZipEntry): boolean {
    return file.entryName.includes('.png');
}

export function getScreenshotDiffImages(zipFile: ArrayBuffer | Buffer): IZipEntry[] {
    const files = getFilesFromZipFile(zipFile);

    return files
        .filter(file => file.entryName.includes('__diff_output__'))
        .filter(isImage);
}
