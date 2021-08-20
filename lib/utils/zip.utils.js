"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findScreenshotDiffImages = exports.getFilesFromZipFile = void 0;
var adm_zip_1 = __importDefault(require("adm-zip"));
var constants_1 = require("../constants");
function getFilesFromZipFile(zipFile) {
    var zip = new adm_zip_1.default(Buffer.isBuffer(zipFile) ? zipFile : Buffer.from(zipFile));
    return zip.getEntries().filter(function (entry) { return !entry.isDirectory; });
}
exports.getFilesFromZipFile = getFilesFromZipFile;
// TODO add more images format
function isImage(file) {
    return file.entryName.includes('.png');
}
function findScreenshotDiffImages(zipFile, screenshotsDiffsPaths) {
    var files = getFilesFromZipFile(zipFile);
    var diffsPaths = screenshotsDiffsPaths || constants_1.DEFAULT_BOT_CONFIGS.screenshotsDiffsPaths;
    return files
        .filter(function (file) { return diffsPaths.some(function (regExp) { return new RegExp(regExp, 'gi').test(file.entryName); }); })
        .filter(isImage);
}
exports.findScreenshotDiffImages = findScreenshotDiffImages;
//# sourceMappingURL=zip.utils.js.map