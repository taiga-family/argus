"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArgusBot = exports.Bot = void 0;
var constants_1 = require("./constants");
var utils_1 = require("./utils");
var Bot = /** @class */ (function () {
    function Bot(context) {
        this.context = context;
    }
    /**
     * Send comment to the issue
     * (pull request is the same issue but with code).
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/issues#create-an-issue-comment Create an issue comment}:
     * GitHub App must have the **issues:write**
     * (or **pull_requests:write** if you are working only with PRs) permission to use this endpoints.
     *
     * @param issueNumber
     * @param markdownText string (optionally, can include markdown syntax)
     */
    Bot.prototype.sendComment = function (issueNumber, markdownText) {
        return __awaiter(this, void 0, void 0, function () {
            var comment;
            return __generator(this, function (_a) {
                comment = this.context.repo({
                    body: markdownText,
                    issue_number: issueNumber,
                });
                return [2 /*return*/, this.context.octokit.issues.createComment(comment)];
            });
        });
    };
    /**
     * Update certain comment in the issue (pull request is the same issue but with code).
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/issues#update-an-issue-comment Update an issue comment}:
     * GitHub App must have the **issues:write**
     * (or **pull_requests:write** if you are working only with PRs) permission to use this endpoints.
     *
     * @param commentId
     * @param newMarkdownContent string (optionally, can include markdown syntax)
     */
    Bot.prototype.updateComment = function (commentId, newMarkdownContent) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.context.octokit.rest.issues.updateComment(__assign(__assign({}, this.context.repo()), { comment_id: commentId, body: newMarkdownContent }))];
            });
        });
    };
    /**
     * Get info about all comments in the current issue/PR.
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/issues#list-issue-comments List issue comments}:
     * GitHub App must have the **issues:read**
     * (or **pull_requests:read** if you are working only with PRs) permission to use this endpoints.
     */
    Bot.prototype.getCommentsByIssueId = function (issueNumber) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.context.octokit.rest.issues.listComments(__assign(__assign({}, this.context.repo()), { issue_number: issueNumber })).then(function (_a) {
                        var data = _a.data;
                        return data;
                    })];
            });
        });
    };
    /**
     * Download artifacts (zip files) in the workflow and unpack them.
     *
     * This method uses two github api endpoints:
     * - {@link https://docs.github.com/en/rest/reference/actions#list-workflow-run-artifacts List workflow run artifacts}
     * - {@link https://docs.github.com/en/rest/reference/actions#download-an-artifact Download an artifact}
     *
     * GitHub App must have the **actions:read** permission to use these endpoints.
     */
    Bot.prototype.getWorkflowArtifacts = function (workflowRunId) {
        return __awaiter(this, void 0, void 0, function () {
            var workflowRunInfo, artifactsInfo, artifactsMetas, artifactsRequests;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        workflowRunInfo = this.context.repo({
                            run_id: workflowRunId,
                        });
                        return [4 /*yield*/, this.context.octokit.actions.listWorkflowRunArtifacts(workflowRunInfo)
                                .catch(function () { return null; })];
                    case 1:
                        artifactsInfo = _a.sent();
                        if (artifactsInfo) {
                            artifactsMetas = artifactsInfo.data.artifacts
                                .map(function (_a) {
                                var id = _a.id;
                                return _this.context.repo({ artifact_id: id, archive_format: 'zip' });
                            });
                            artifactsRequests = artifactsMetas
                                .map(function (meta) { return _this.context.octokit.actions.downloadArtifact(meta).then(function (_a) {
                                var data = _a.data;
                                return data;
                            }); });
                            return [2 /*return*/, Promise.all(artifactsRequests)];
                        }
                        return [2 /*return*/, []];
                }
            });
        });
    };
    ;
    /**
     * Get file (+ meta info about it) by its path in the repository.
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/repos#get-repository-content Get repository content}:
     * GitHub App must have the **contents:read** (or **single_file:read** to required files) permission to use this endpoints.
     *
     * @param path file location (from root of repo)
     * @param branch target branch
     * (if branch param is not provided it takes the repository’s default branch (usually master/main))
     */
    Bot.prototype.getFile = function (path, branch) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.context.octokit.repos.getContent(__assign(__assign({}, this.context.repo()), { path: path, ref: branch })).catch(function () { return null; })];
            });
        });
    };
    /**
     * Get info about git branch by its name.
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/repos#get-a-branch Get a branch}:
     * GitHub App must have the **contents:read** permission to use this endpoints.
     */
    Bot.prototype.getBranchInfo = function (branch) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.context.octokit.rest.repos.getBranch(__assign(__assign({}, this.context.repo()), { branch: branch })).catch(function () { return null; })];
            });
        });
    };
    /**
     * Create git branch in current repository (do nothing if branch already exists).
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/git#create-a-reference Create a reference}:
     * GitHub App must have the **contents:write** permission to use this endpoints.
     *
     * @param branch new branch name
     * @param fromBranch from which to create new branch
     * (if branch param is not provided it tries to parse repository’s default branch or use {@link DEFAULT_MAIN_BRANCH})
     */
    Bot.prototype.createBranch = function (branch, fromBranch) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var fromBranchInfo;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getBranchInfo(branch)];
                    case 1:
                        if (_c.sent()) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.getBranchInfo(fromBranch || ((_b = (_a = this.context.payload) === null || _a === void 0 ? void 0 : _a.repository) === null || _b === void 0 ? void 0 : _b.default_branch) || constants_1.DEFAULT_MAIN_BRANCH)];
                    case 2:
                        fromBranchInfo = _c.sent();
                        if (!fromBranchInfo) {
                            return [2 /*return*/];
                        }
                        return [2 /*return*/, this.context.octokit.rest.git.createRef(__assign(__assign({}, this.context.repo()), { ref: "refs/heads/" + branch, sha: fromBranchInfo.data.commit.sha }))];
                }
            });
        });
    };
    /**
     * Upload file to a separate branch.
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/repos#create-or-update-file-contents Create or update file contents}:
     * GitHub App must have the **single_file:write** permission (to required files) to use this endpoints
     * (or **contents:write**).
     */
    Bot.prototype.uploadFile = function (_a) {
        var file = _a.file, path = _a.path, branch = _a.branch, commitMessage = _a.commitMessage;
        return __awaiter(this, void 0, void 0, function () {
            var _b, repo, owner, content, oldFileVersion;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = this.context.repo(), repo = _b.repo, owner = _b.owner;
                        content = file.toString('base64');
                        return [4 /*yield*/, this.getFile(path, branch)];
                    case 1:
                        oldFileVersion = _c.sent();
                        return [2 /*return*/, this.context.octokit.repos
                                .createOrUpdateFileContents({
                                owner: owner,
                                repo: repo,
                                content: content,
                                path: path,
                                branch: branch,
                                sha: oldFileVersion && 'sha' in oldFileVersion.data ? oldFileVersion.data.sha : undefined,
                                message: commitMessage,
                            })
                                .then(function () { return constants_1.GITHUB_CDN_DOMAIN + "/" + owner + "/" + repo + "/" + branch + "/" + path; })];
                }
            });
        });
    };
    /**
     * Delete file in the following branch.
     *
     * This method uses github api endpoint:
     * - {@link https://docs.github.com/en/rest/reference/repos#delete-a-file Delete a file}:
     * GitHub App must have the **single_file:write** permission (to required files) to use this endpoints
     * (or **contents:write**).
     */
    Bot.prototype.deleteFile = function (_a) {
        var path = _a.path, commitMessage = _a.commitMessage, branch = _a.branch;
        return __awaiter(this, void 0, void 0, function () {
            var oldFileVersion;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getFile(path, branch)];
                    case 1:
                        oldFileVersion = _b.sent();
                        if (!(oldFileVersion && 'sha' in oldFileVersion.data)) {
                            return [2 /*return*/, Promise.reject('the file is not found!')];
                        }
                        return [2 /*return*/, this.context.octokit.rest.repos.deleteFile(__assign(__assign({}, this.context.repo()), { path: path, branch: branch, message: commitMessage, sha: oldFileVersion.data.sha }))];
                }
            });
        });
    };
    return Bot;
}());
exports.Bot = Bot;
var ArgusBot = /** @class */ (function (_super) {
    __extends(ArgusBot, _super);
    function ArgusBot() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.botConfigs = null;
        return _this;
    }
    ArgusBot.prototype.loadBotConfigs = function (branch) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getFile(constants_1.BOT_CONFIGS_FILE_NAME, branch)
                        .then(function (res) { return (res === null || res === void 0 ? void 0 : res.data) && 'content' in res.data ? res.data.content : ''; })
                        .then(function (base64Str) { return utils_1.parseTomlFileBase64Str(base64Str); })
                        .catch(function () { return constants_1.DEFAULT_BOT_CONFIGS; })];
            });
        });
    };
    ArgusBot.prototype.getPrevBotReportComment = function (prNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var prComments;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCommentsByIssueId(prNumber)];
                    case 1:
                        prComments = _a.sent();
                        return [2 /*return*/, prComments.find(function (_a) {
                                var body = _a.body;
                                return utils_1.checkContainsHiddenLabel(body || '', constants_1.TEST_REPORT_HIDDEN_LABEL);
                            }) || null];
                }
            });
        });
    };
    ArgusBot.prototype.createOrUpdateReport = function (prNumber, markdownText) {
        return __awaiter(this, void 0, void 0, function () {
            var oldBotComment, markedMarkdownText;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getPrevBotReportComment(prNumber)];
                    case 1:
                        oldBotComment = _a.sent();
                        markedMarkdownText = utils_1.markCommentWithHiddenLabel(markdownText, constants_1.TEST_REPORT_HIDDEN_LABEL);
                        return [2 /*return*/, (oldBotComment === null || oldBotComment === void 0 ? void 0 : oldBotComment.id)
                                ? this.updateComment(oldBotComment.id, markedMarkdownText)
                                : this.sendComment(prNumber, markedMarkdownText)];
                }
            });
        });
    };
    ArgusBot.prototype.getScreenshotDiffImages = function (zipFile, branch) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this.botConfigs) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, this.loadBotConfigs(branch)];
                    case 1:
                        _a.botConfigs = _b.sent();
                        _b.label = 2;
                    case 2: return [2 /*return*/, utils_1.findScreenshotDiffImages(zipFile, this.botConfigs.screenshotsDiffsPaths)];
                }
            });
        });
    };
    ArgusBot.prototype.uploadImages = function (images, prNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createBranch(constants_1.STORAGE_BRANCH)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, Promise.all(images.map(function (file, index) { return _this.uploadFile({
                                file: file,
                                path: _this.getSavedImagePathPrefix(prNumber) + "/" + index + ".png",
                                commitMessage: constants_1.BOT_COMMIT_MESSAGE.UPLOAD_IMAGE,
                                branch: constants_1.STORAGE_BRANCH,
                            }); }))];
                }
            });
        });
    };
    ArgusBot.prototype.checkShouldSkipWorkflow = function (workflowName, workflowBranch) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, workflowsWithTests;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this.botConfigs) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, this.loadBotConfigs(workflowBranch)];
                    case 1:
                        _a.botConfigs = _b.sent();
                        _b.label = 2;
                    case 2:
                        workflowsWithTests = this.botConfigs.workflowWithTests || constants_1.DEFAULT_BOT_CONFIGS.workflowWithTests;
                        return [2 /*return*/, !workflowName || !workflowsWithTests.some(function (regExp) { return new RegExp(regExp, 'gi').test(workflowName); })];
                }
            });
        });
    };
    ArgusBot.prototype.deleteUploadedImagesFolder = function (prNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var folder;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getFile(this.getSavedImagePathPrefix(prNumber), constants_1.STORAGE_BRANCH)];
                    case 1:
                        folder = _a.sent();
                        if (folder && Array.isArray(folder.data)) {
                            return [2 /*return*/, Promise.all(folder.data.map(function (_a) {
                                    var path = _a.path;
                                    return _this.deleteFile({
                                        path: path,
                                        commitMessage: constants_1.BOT_COMMIT_MESSAGE.DELETE_FOLDER,
                                        branch: constants_1.STORAGE_BRANCH
                                    });
                                }))];
                        }
                        return [2 /*return*/, null];
                }
            });
        });
    };
    ArgusBot.prototype.getSavedImagePathPrefix = function (prNumber) {
        var _a = this.context.repo(), repo = _a.repo, owner = _a.owner;
        return constants_1.IMAGES_STORAGE_FOLDER + "/" + owner + "-" + repo + "-" + prNumber;
    };
    return ArgusBot;
}(Bot));
exports.ArgusBot = ArgusBot;
//# sourceMappingURL=bot.js.map