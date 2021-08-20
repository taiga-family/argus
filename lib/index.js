"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var bot_1 = require("./bot");
var selectors_1 = require("./selectors");
var utils_1 = require("./utils");
var constants_1 = require("./constants");
module.exports = function (app) {
    app.on('workflow_run.completed', function (context) { return __awaiter(void 0, void 0, void 0, function () {
        var bot, workflowName, workflowBranch, prNumber, _a, workflowRunId, artifact, images, imagesUrls, reportText;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    bot = new bot_1.ArgusBot(context);
                    workflowName = selectors_1.getWorkflowName(context);
                    workflowBranch = selectors_1.getWorkflowBranch(context);
                    prNumber = selectors_1.getWorkflowPrNumbers(context)[0];
                    return [4 /*yield*/, bot.checkShouldSkipWorkflow(workflowName, workflowBranch)];
                case 1:
                    if (_b.sent()) {
                        return [2 /*return*/];
                    }
                    _a = selectors_1.getWorkflowRunConclusion(context);
                    switch (_a) {
                        case 'success': return [3 /*break*/, 2];
                        case 'failure': return [3 /*break*/, 3];
                    }
                    return [3 /*break*/, 7];
                case 2: return [2 /*return*/, bot.createOrUpdateReport(prNumber, constants_1.BOT_REPORT_MESSAGES.SUCCESS_WORKFLOW)];
                case 3:
                    workflowRunId = selectors_1.getWorkflowRunId(context);
                    if (!workflowRunId)
                        return [2 /*return*/];
                    return [4 /*yield*/, bot.getWorkflowArtifacts(workflowRunId)];
                case 4:
                    artifact = (_b.sent())[0];
                    return [4 /*yield*/, bot.getScreenshotDiffImages(artifact, workflowBranch)];
                case 5:
                    images = _b.sent();
                    return [4 /*yield*/, bot.uploadImages(images.map(function (image) { return image.getData(); }), prNumber)];
                case 6:
                    imagesUrls = _b.sent();
                    reportText = images.length
                        ? utils_1.getFailureReport(utils_1.zip(images, imagesUrls))
                        : constants_1.BOT_REPORT_MESSAGES.FAILED_WORKFLOW_NO_SCREENSHOTS;
                    return [2 /*return*/, bot.createOrUpdateReport(prNumber, reportText)];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    /**
     * WARNING: "Re-run all jobs" button does not trigger worklow_run.requested event
     * see {@link https://github.com/actions/runner/issues/726 github issue}
     * */
    app.on('workflow_run.requested', function (context) { return __awaiter(void 0, void 0, void 0, function () {
        var bot, workflowName, workflowBranch, prNumber;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    bot = new bot_1.ArgusBot(context);
                    workflowName = selectors_1.getWorkflowName(context);
                    workflowBranch = selectors_1.getWorkflowBranch(context);
                    prNumber = selectors_1.getWorkflowPrNumbers(context)[0];
                    return [4 /*yield*/, bot.checkShouldSkipWorkflow(workflowName, workflowBranch)];
                case 1:
                    if (_a.sent()) {
                        return [2 /*return*/];
                    }
                    return [2 /*return*/, bot.createOrUpdateReport(prNumber, constants_1.BOT_REPORT_MESSAGES.LOADING_WORKFLOW)];
            }
        });
    }); });
    app.on('pull_request.closed', function (context) { return __awaiter(void 0, void 0, void 0, function () {
        var bot, prNumber;
        return __generator(this, function (_a) {
            bot = new bot_1.ArgusBot(context);
            prNumber = context.payload.number;
            return [2 /*return*/, bot.deleteUploadedImagesFolder(prNumber)
                    .then(function () { return bot.createOrUpdateReport(prNumber, constants_1.BOT_REPORT_MESSAGES.PR_CLOSED); })];
        });
    }); });
};
//# sourceMappingURL=index.js.map