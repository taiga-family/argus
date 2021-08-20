"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkflowRunId = exports.getWorkflowRunConclusion = exports.getWorkflowPrNumbers = exports.getWorkflowBranch = exports.getWorkflowName = void 0;
var getWorkflowName = function (context) {
    var _a;
    return ((_a = context.payload.workflow) === null || _a === void 0 ? void 0 : _a.name) || '';
};
exports.getWorkflowName = getWorkflowName;
var getWorkflowBranch = function (context) {
    var _a;
    return (_a = context.payload.workflow_run) === null || _a === void 0 ? void 0 : _a.head_branch;
};
exports.getWorkflowBranch = getWorkflowBranch;
var getWorkflowPrNumbers = function (context) {
    return context.payload.workflow_run ? context.payload.workflow_run.pull_requests.map(function (pr) { return pr.number; }) : [];
};
exports.getWorkflowPrNumbers = getWorkflowPrNumbers;
var getWorkflowRunConclusion = function (context) {
    var _a;
    return ((_a = context.payload.workflow_run) === null || _a === void 0 ? void 0 : _a.conclusion) || null;
};
exports.getWorkflowRunConclusion = getWorkflowRunConclusion;
var getWorkflowRunId = function (context) {
    var _a, _b;
    return (_b = (_a = context.payload.workflow_run) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
};
exports.getWorkflowRunId = getWorkflowRunId;
//# sourceMappingURL=workflow-run.selectors.js.map