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
const semver = require("semver");
const chalk_1 = require("chalk");
const config_1 = require("../config");
const project_1 = require("../../project");
const interface_1 = require("../interface");
const validators = require("../validation");
const utils_1 = require("../utils");
const api_1 = require("../../api");
exports.publish = (argv) => __awaiter(this, void 0, void 0, function* () {
    // Validate auth, package, and argv
    interface_1.spinner.start("Authenticating");
    validators.framerTokenIsSet();
    // Build the configuration needed for publishing
    const config = config_1.buildPublishConfig(argv);
    const api = new api_1.API(config.api, config.token);
    yield api.getUserInfo();
    interface_1.spinner.text = "Validating";
    const project = yield project_1.Project.load(config.projectConfig);
    // Check that the user can publish to the requested store
    validators.canPublishToStore(project, config.isPrivate);
    // Ensure there is sufficient data for checking the registry
    // (package name, display name, or new argument input)
    validators.canFetchPackageMetaData(project, config.newName);
    // Get package data from registry about the package
    const { version: latestPublishedVersion, packageName, displayName, published } = yield api.getPackageMeta(project.packageName, project.packageFramerName || config.newName, config.isPrivate);
    // Prevent users from publishing with the `--new` argument
    // if the package is already in the registry
    if (published && config.isNewArgSet) {
        throw new Error(chalk_1.default `This package has already been published as {bold ${displayName}}.\nPlease re-run the publish command without the \`--new\` argument.`);
    }
    interface_1.spinner.text = "Preparing";
    // Use remote data and local package to pick the next version to publish
    const nextVersion = getNextVersion(project.packageVersion, latestPublishedVersion, argv.major !== undefined ? "major" : "minor", published);
    interface_1.spinner.text = "Installing dependencies";
    yield project.install();
    interface_1.spinner.text = "Building project";
    const compiler = yield project.buildDist();
    if (compiler.missingDependencies.length > 0) {
        interface_1.printMissingDependenciesWarning(compiler.missingDependencies, project.path);
    }
    // Confirm the user wants to publish the version
    // (unless the --yes flag is passed in)
    if (!config.disablePrompts) {
        interface_1.spinner.stop();
        yield promptBeforePublishing(packageName, nextVersion, config.isPublic);
        interface_1.spinner.start();
    }
    interface_1.spinner.text = "Publishing";
    // Prepare the project for preflight, then publish, and finally post-processing
    yield api.preflight(nextVersion, packageName, config.isPrivate);
    yield project.publish(nextVersion, packageName, displayName, {}, config.isPublic ? "public" : "restricted");
    yield checkPackageVersionStatus(api, packageName, nextVersion);
    interface_1.spinner.stopAndPersist({
        text: "Package successfully published",
        symbol: "🚀",
    });
});
const getNextVersion = (pkgVersion = "", latestPublishedVersion = "", bump, published) => {
    // 1) If the package has not been previously published, set the
    //    version to 1.0.0, regardless of the package version
    // 2) If there is a  package version and a latest published version,
    //    and the package version is higher, take the package version
    //    without bumping
    // 3) If there is a package version and a latest published version,
    //    and the package version is equal to or less than the latest
    //    published version, bump the latest published version
    //    based on versioning strategy
    // 4) If there is a package version and no latest published version,
    //    take the package version as is
    // 5) If there is no package version and a latest published version,
    //    bump the latest published version based on versioning strategy
    // 6) Otherwise, default to version 1.0.0
    const defaultVersion = "1.0.0";
    const hasValidPackageVersion = !!semver.valid(pkgVersion);
    const hasValidLatestPublishedVersion = !!semver.valid(latestPublishedVersion);
    // 1
    if (!published) {
        return defaultVersion;
    }
    // 2
    if (hasValidPackageVersion &&
        hasValidLatestPublishedVersion &&
        semver.gt(pkgVersion || "", latestPublishedVersion || "")) {
        return pkgVersion;
    }
    // 3
    if (hasValidPackageVersion && hasValidLatestPublishedVersion && semver.lte(pkgVersion, latestPublishedVersion)) {
        return semver.inc(latestPublishedVersion, bump);
    }
    // 4
    if (hasValidPackageVersion && !hasValidLatestPublishedVersion) {
        return pkgVersion;
    }
    // 5
    if (!hasValidPackageVersion && hasValidLatestPublishedVersion) {
        return semver.inc(latestPublishedVersion, bump);
    }
    // 6
    return defaultVersion;
};
const promptBeforePublishing = (name, version, isPublic) => __awaiter(this, void 0, void 0, function* () {
    let promptText = `Ready to publish `;
    promptText += chalk_1.default `{bold ${name}} v{bold ${version}} `;
    if (isPublic) {
        promptText += chalk_1.default `({yellowBright public store}). `;
    }
    else {
        promptText += chalk_1.default `({greenBright private store}). `;
    }
    promptText += `Continue (y/N)? `;
    const answer = yield interface_1.prompt(promptText);
    if (!answer.trim().match(/^(y|yes)$/i)) {
        interface_1.spinner.stopAndPersist({ text: "Publishing aborted", symbol: "🚫" });
        // Terminate the process cleanly
        process.exit();
    }
});
const checkPackageVersionStatus = (api, packageName, version) => __awaiter(this, void 0, void 0, function* () {
    const genericErrorMessage = "Something went wrong publishing the package. Please try again.";
    let response;
    try {
        response = yield utils_1.poll(() => api.getPackageVersionStatus(packageName, version), response => response.status === "completed" || response.status === "rejected", 1000 * 2, 1000 * 60 * 3);
    }
    catch (error) {
        throw new Error(genericErrorMessage);
    }
    if (response.status === "rejected") {
        if (response.error.internal)
            throw new Error(genericErrorMessage);
        throw new Error(response.error.message);
    }
});
