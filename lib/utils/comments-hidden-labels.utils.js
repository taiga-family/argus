"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkContainsHiddenLabel = exports.markCommentWithHiddenLabel = void 0;
function markCommentWithHiddenLabel(markdownText, label) {
    return "<!-- argus-bot-id: " + label + " -->\n" + markdownText;
}
exports.markCommentWithHiddenLabel = markCommentWithHiddenLabel;
function checkContainsHiddenLabel(markdownText, label) {
    return markdownText.includes("<!-- argus-bot-id: " + label + " -->");
}
exports.checkContainsHiddenLabel = checkContainsHiddenLabel;
//# sourceMappingURL=comments-hidden-labels.utils.js.map