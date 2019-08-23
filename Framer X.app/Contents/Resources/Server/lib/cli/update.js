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
// Make sure that the CLI package is the latest version
const path = require("path");
const fs = require("fs-extra");
const semver = require("semver");
const chalk_1 = require("chalk");
const pkgDir = require("pkg-dir");
const config_1 = require("./config");
const jsonLines_1 = require("../jsonLines");
const yarn_1 = require("../yarn");
const interface_1 = require("./interface");
const logger_1 = require("../logger");
const logger = logger_1.createLogger("framer-cli:update");
// Throw if current package is a full major version behind, otherwise warn
// Default wait time between version checks is 24 hours
function checkIfOutOfDate(updateCheckInterval = 24 * 60 * 60 * 1000) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.loadLocalConfig();
        if (Date.now() - config.get("lastUpdateCheck") < updateCheckInterval) {
            logger.info("Package version checked recently.");
            return;
        }
        else {
            logger.info("Package version not checked recently.");
        }
        interface_1.spinner.start("Checking for updates");
        const pkgPath = path.join(pkgDir.sync(__dirname), "package.json");
        const { version: currentVersion, name } = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        // Try to fetch the latest version from the registry
        // If the registry is down, silently move on
        let latestVersion;
        try {
            latestVersion = yield getLatestVersion(name);
            config.set("lastUpdateCheck", Date.now());
            logger.info(`Latest version v${latestVersion}`);
        }
        catch (error) {
            logger.error(error);
            interface_1.spinner.stop();
            return;
        }
        const msg = chalk_1.default `Framer CLI is out of date.\nPlease update to {bold ${name}@${latestVersion}}.`;
        // On major version diffs, throw an error
        if (semver.diff(currentVersion, latestVersion) === "major") {
            throw new Error(msg);
        }
        if (semver.lt(currentVersion, latestVersion)) {
            interface_1.printWarning(msg);
        }
        interface_1.spinner.stop();
    });
}
exports.checkIfOutOfDate = checkIfOutOfDate;
function getLatestVersion(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const yarn = new yarn_1.Yarn();
        const versionResult = yield yarn.info([name, "version", "--json"]);
        const lines = jsonLines_1.JSONLines.parse(versionResult.output);
        // Be defensive against empty array returns and treat as errors
        // Make sure that the "data" property is a valid semver value
        const version = semver.valid(lines.length > 0 && lines[0].data);
        if (!version) {
            throw new Error("Could not retrieve latest published version of Framer CLI.");
        }
        return version;
    });
}
