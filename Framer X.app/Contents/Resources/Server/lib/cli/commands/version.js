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
const chalk_1 = require("chalk");
const config_1 = require("../config");
const project_1 = require("../../project");
const interface_1 = require("../interface");
const validators = require("../validation");
exports.version = (argv) => __awaiter(this, void 0, void 0, function* () {
    interface_1.spinner.start("Validating");
    validators.framerTokenIsSet();
    // Create a project to generate .npmrc file with token
    const project = yield project_1.Project.load(config_1.buildProjectConfig(argv));
    // Ensure there is sufficient data for checking the registry
    validators.canFetchPackageVersion(project);
    const packageName = project.packageName;
    interface_1.spinner.text = "Fetching package data";
    // Get package data from registry about the package
    let version;
    try {
        version = yield project.getLatestPublishedVersion();
    }
    catch (_a) {
        throw new Error(chalk_1.default `Cannot retrieve the latest version.\nPlease ensure the package was previously published.`);
    }
    interface_1.spinner.stopAndPersist({
        text: chalk_1.default `Latest version of {bold ${packageName}} is v{bold ${version}}.`,
        symbol: "🗂 ",
    });
});
