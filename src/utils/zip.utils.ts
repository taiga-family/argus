import AdmZip from 'adm-zip';

export function getFilesFromZipFile(zipFile: ArrayBuffer | Buffer): Buffer[] {
    const zip = new AdmZip(Buffer.isBuffer(zipFile) ? zipFile : Buffer.from(zipFile));

    return zip.getEntries().filter(entry => !entry.isDirectory).map(image => image.getData());
}
