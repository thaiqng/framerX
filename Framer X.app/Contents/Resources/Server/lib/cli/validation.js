"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const chalk_1 = require("chalk");
exports.projectPathExists = (projectPath) => {
    // Confirm path exists
    if (!fs.pathExistsSync(projectPath)) {
        throw new Error(`The specified "${projectPath}" project does not exist.`);
    }
    // Confirm that the path is to a directory
    const stat = fs.statSync(projectPath);
    if (!stat.isDirectory()) {
        throw new Error("The project must be folder backed.");
    }
};
exports.framerTokenIsSet = () => {
    const { FRAMER_TOKEN: token } = process.env;
    if (!token || !token.trim()) {
        throw new Error(chalk_1.default `Missing {bold FRAMER_TOKEN} environment variable.\nPlease run the {bold {underline authenticate}} command to obtain your {bold FRAMER_TOKEN}.`);
    }
};
exports.canPublishToStore = (project, isPrivate) => __awaiter(this, void 0, void 0, function* () {
    if (isPrivate && !(yield project.canBePublishedPrivately)) {
        throw new Error(chalk_1.default `Package cannot be published privately.\nPlease re-run this command with the {bold --public} flag.`);
    }
});
exports.canFetchPackageMetaData = (project, newName) => {
    if (!project.packageName && !project.packageFramerName && !newName) {
        throw new Error(chalk_1.default `Cannot fetch package metadata because of missing information.\nPlease re-run this command with a {bold display name} using the {bold --new} argument.`);
    }
};
exports.canFetchPackageVersion = (project) => {
    if (!project.packageName) {
        throw new Error(chalk_1.default `Cannot fetch the latest version because of missing information.\nPlease ensure the package was previously published.`);
    }
};
