"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTomlFileBase64Str = void 0;
var toml_1 = __importDefault(require("toml"));
function parseTomlFileBase64Str(base64Str) {
    var parsedString = Buffer.from(base64Str, 'base64').toString();
    return toml_1.default.parse(parsedString);
}
exports.parseTomlFileBase64Str = parseTomlFileBase64Str;
//# sourceMappingURL=toml-files.utils.js.map