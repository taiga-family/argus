"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFailureReport = void 0;
var createScreenshotRowInfo = function (_a) {
    var entryName = _a[0].entryName, link = _a[1];
    return "<h4>" + entryName + ":</h4>\n\n ![](" + link + ")\n<br>\n";
};
var getFailureReport = function (imagesInfo) {
    return "\n<h1>Screenshots tests failed :x:</h1>\n\n" + imagesInfo.map(createScreenshotRowInfo).join('') + "\n";
};
exports.getFailureReport = getFailureReport;
//# sourceMappingURL=tests-report.utils.js.map