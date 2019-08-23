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
// Built-in
const assert = require("assert");
const path = require("path");
const events = require("events");
const os = require("os");
const semver = require("semver");
// Light-weight
const fs = require("fs-extra");
const uuid = require("uuid/v4");
const lockfile = require("@yarnpkg/lockfile");
// Local
const yarn_1 = require("./yarn");
const types_1 = require("./types");
const server_1 = require("./server");
const jsonLines_1 = require("./jsonLines");
const framerLibraryManager_1 = require("./framerLibraryManager");
const paths_1 = require("./project/paths");
const logger_1 = require("./logger");
/** The largest file size we still consider for code files */
exports.HUGE_FILE = 10 * 1024 * 1024;
const logger = logger_1.createLogger("framer:project");
const api_1 = require("./api");
const debounce_1 = require("./debounce");
const DEFAULT_REGISTRY_INFO_REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes
process.on("unhandledRejection", (reason, p) => {
    logger.error("Unhandled Rejection at: Promise", p, "reason:", reason);
});
class Project extends events.EventEmitter {
    constructor(config) {
        super();
        this._lastBuildOutput = null;
        /**
         * This flag is set to true when project.stop() is being called
         * and signifies that no further work should be done for this project.
         */
        this.retired = false;
        this.sendScript = ({ socket, scriptsToSend, }) => {
            let emitScript;
            if (socket) {
                emitScript = buildOutput => socket.emit("script", JSON.stringify(scriptsToSend === "all" ? buildOutput : pick(buildOutput, scriptsToSend)));
            }
            else if (this._server) {
                const server = this._server;
                emitScript = buildOutput => server.io.emit("script", JSON.stringify(scriptsToSend === "all" ? buildOutput : pick(buildOutput, scriptsToSend)));
            }
            else {
                // Nothing to send the script to
                return;
            }
            // If the compiled scripts are available, send them
            if (this._lastBuildOutput) {
                return emitScript(this._lastBuildOutput);
            }
            // If the bundle was not built yet, we send a cached version if available
            const cachedBuildOutput = readCachedBuildOutput(this.paths.buildOutputDir);
            if (cachedBuildOutput) {
                return emitScript(cachedBuildOutput);
            }
            // Send the initial script with Framer Library “preloaded”
            const preloadBuildOutput = readPreloadBuildOutput();
            if (preloadBuildOutput) {
                return emitScript(preloadBuildOutput);
            }
        };
        /** Looks for a "framer" key in the package package.json, returns true if found. */
        this.isFramerPackage = (packagePath, cache) => {
            if (!packagePath.startsWith("node_modules/"))
                return false;
            const packagePathSegments = packagePath.split("/");
            // If we have a namespaced package then we need to include it in the package name.
            const isNamespaced = packagePath.startsWith("node_modules/@");
            const packageName = (isNamespaced ? packagePathSegments.slice(1, 3) : packagePathSegments.slice(1, 2)).join("/");
            if (!packageName)
                return false;
            // Fake a cache if none is passed
            if (!cache) {
                cache = new Map();
            }
            if (!cache.has(packageName)) {
                try {
                    const packageJSONPath = path.join(this.paths.nodeModules, packageName, "package.json");
                    const json = JSON.parse(fs.readFileSync(packageJSONPath).toString());
                    cache.set(packageName, !!json.framer);
                }
                catch (error) {
                    cache.set(packageName, false);
                }
            }
            return cache.get(packageName);
        };
        this.buildStandalone = (destination, previewData) => __awaiter(this, void 0, void 0, function* () {
            assert(destination.startsWith("/"));
            assert(previewData);
            assert(this._lastBuildOutput);
            if (!this._lastBuildOutput)
                return;
            function replace(template, placeholder, replacement) {
                // Neutralize occurrences of </script> that would mess up the page
                const scriptClose = "</script";
                let scriptCloseIndex = replacement.lastIndexOf(scriptClose);
                while (scriptCloseIndex >= 0) {
                    const prefix = replacement.substring(0, scriptCloseIndex);
                    const suffix = replacement.substring(scriptCloseIndex + placeholder.length);
                    // Resolves to <\/script, which in turn becomes </script if used within a JS string. For plaintext comments the escape doesn't matter because it's not in user-readable code. Note that we can't use CDATA because it's ignored in HTML5.
                    replacement = prefix + "<\\/script" + suffix;
                    scriptCloseIndex = replacement.lastIndexOf(scriptClose);
                }
                // String.replace isn't always reliable, either because of buffer limits or some sort of replacement string parsing
                // See https://github.com/framer/company/issues/10201
                const placeholderIndex = template.indexOf(placeholder);
                if (placeholderIndex >= 0) {
                    const prefix = template.substring(0, placeholderIndex);
                    const suffix = template.substring(placeholderIndex + placeholder.length);
                    template = prefix + replacement + suffix;
                }
                return template;
            }
            // Use a cache, since this might be called often
            const cachedIsFramerPackage = new Map();
            const isFramerPackage = (packagePath) => {
                // Some packages are namespaced e.g. @types or @framer so we want
                // to ensure we process the subdirectory containing the actual
                // packages.
                const isNamespaced = packagePath.startsWith("node_modules/@");
                if (isNamespaced && packagePath.split("/").length === 2) {
                    return true;
                }
                return this.isFramerPackage(packagePath, cachedIsFramerPackage);
            };
            const indexJs = this.addCanvasDataToBuild(this._lastBuildOutput["index.js"]);
            const vendorsJs = this._lastBuildOutput["vendors.js"];
            let output = fs.readFileSync(path.join(__dirname, "../../Vekter/standalone.html")).toString();
            output = replace(output, "__DATA__", previewData);
            output = replace(output, "__BUILD__", `${indexJs}\n${vendorsJs ? vendorsJs : ""}`);
            logger.log("writing standalone output", destination);
            yield fs.mkdirp(destination);
            yield fs.emptyDir(destination);
            const writeIndexHTML = new Promise(resolve => {
                fs.writeFile(path.join(destination, "index.html"), output, err => {
                    if (err) {
                        logger.error(err);
                    }
                    resolve();
                });
            });
            const resourceMap = {
                "../../Vekter/scripts/react/react.development.js": "build/react.development.js",
                "../../Vekter/scripts/react-dom/react-dom.development.js": "build/react-dom.development.js",
                "../../Vekter/styles/Draft.css": "build/Draft.css",
                "../../Vekter/styles/style.css": "build/style.css",
                "../../Vekter/standalone.js": "build/standalone.js",
                "../../Vekter/images/cursors/touch.png": "images/cursors/touch.png",
                "../../Vekter/images/cursors/touch@2x.png": "images/cursors/touch@2x.png",
                "../../Vekter/images/cursors/touch-active.png": "images/cursors/touch-active.png",
                "../../Vekter/images/cursors/touch-active@2x.png": "images/cursors/touch-active@2x.png",
            };
            const copyResources = copyResourceFiles(destination, resourceMap);
            yield writeIndexHTML;
            yield copyResources;
            let from = this.path;
            if (!from.endsWith("/") && from.length > 0) {
                from = from + "/";
            }
            const pathLength = from.length;
            const directories = [];
            const manifest = new Set();
            const resourceDestinations = new Set(Object.values(resourceMap));
            yield fs.copy(from, destination, {
                dereference: true,
                filter(src) {
                    const target = src.slice(pathLength);
                    if (target.length === 0)
                        return true;
                    if (target.startsWith("."))
                        return false;
                    if (path.basename(target).startsWith("."))
                        return false;
                    // note, we get passed in directories, and returning false will skip them completely
                    // and while we don't want node_modules, we do want store installed packages for their resources
                    if (target.startsWith("node_modules/") && !isFramerPackage(target))
                        return false;
                    if (target.match(/^code\/.*\.[tj]sx?/))
                        return false;
                    if (resourceDestinations.has(target))
                        return false;
                    if (target === "build/index.js")
                        return false;
                    if (target === "index.html")
                        return false;
                    if (target === "design/document.json")
                        return false;
                    if (target === "package.json")
                        return false;
                    if (target === "README.md")
                        return false;
                    if (target === "tsconfig.json")
                        return false;
                    if (target === "yarn.lock")
                        return false;
                    if (target === "yarn-error.log")
                        return false;
                    if (fs.statSync(src).isDirectory()) {
                        directories.push(target + "/");
                    }
                    else {
                        manifest.add(target);
                    }
                    return true;
                },
            });
            yield fs.copy(path.join(from, "node_modules", "framer", "build", "framer.js"), path.join(destination, "build", "framer.js"));
            // Add specifically generated or copied files to the manifest
            manifest.add("build/framer.js");
            manifest.add("index.html");
            resourceDestinations.forEach(value => manifest.add(value));
            // clear out any empty directories
            directories.forEach(dir => {
                for (const file of manifest) {
                    if (file.startsWith(dir))
                        return;
                }
                try {
                    fs.rmdirSync(path.join(destination, dir));
                }
                catch (_) {
                    // Ignore errors that happen (e.g., the directory is not empty)
                }
            });
            yield fs.mkdirp(path.join(destination, "framer"));
            const manifestText = Array.from(manifest).join("\n") + "\n";
            yield fs.writeFile(path.join(destination, "framer", "manifest.txt"), manifestText);
            logger.log("standalone export done:", destination, manifest.size);
        });
        this.commandHandler = (command, info) => __awaiter(this, void 0, void 0, function* () {
            switch (command) {
                case server_1.ServerCommand.addPackage:
                    if (!info.packageName) {
                        logger.warn("Missing package name, aborting installation");
                        break;
                    }
                    const isDevDependency = info.isDevDependency || false;
                    yield this.add(info.packageName, isDevDependency, info.context);
                    break;
                case server_1.ServerCommand.removePackage:
                    if (!info.packageName) {
                        logger.warn("Missing package name, cannot remove");
                        break;
                    }
                    yield this.remove(info.packageName, info.context);
                    yield this.refreshOutdated();
                    break;
                case server_1.ServerCommand.publishPackage:
                    yield this.publish(info.version, info.packageName, info.displayName, info.context, info.access);
                    break;
                case server_1.ServerCommand.updatePackageInfo:
                    yield this.updatePackageInfo();
                    break;
                case server_1.ServerCommand.upgradeDependency:
                    const { packageName, version } = info;
                    if (!packageName || !version) {
                        return;
                    }
                    yield this.upgrade(packageName, version);
                    break;
                case server_1.ServerCommand.setIsDocumentDirty:
                    if (info.dirty !== undefined && this._server) {
                        this._server.setState({ isDocumentDirty: info.dirty });
                    }
                    break;
                case server_1.ServerCommand.reloadClients:
                    this.reloadClients();
                    break;
                case server_1.ServerCommand.updateCanvasData:
                    this.canvasData = info.canvasData;
                    if (!this._watcher)
                        return;
                    this._watcher.writeBuildOutput(["index.js"]);
                    break;
                case server_1.ServerCommand.updateCanvasModule:
                    if (info.code)
                        fs.writeFileSync(this.paths.canvasModule, info.code);
                    break;
            }
        });
        this.updateServerPackagesListing = () => {
            if (!this._server)
                return;
            const state = {};
            const dependencies = this.packageJson.dependencies;
            if (dependencies) {
                state.packages = Object.keys(dependencies);
                this.updatePackagesInfo(state.packages);
            }
            this._server.setState(state);
        };
        this.debouncedUpdateServerPackagesListing = debounce_1.debounce(this.updateServerPackagesListing, 500);
        const { api, author, token } = config;
        this._config = config;
        this.paths = new paths_1.ProjectPaths(config);
        this.path = this.paths.project;
        // TODO: Change to not do all this work upon construction.
        // TODO: Change sync methods to promises to reduce blocking.
        if (!fs.existsSync(this.path))
            throw Error(`path does not exist: ${this.path}`);
        // There is no way to do an async constructor
        // Instead, depend on userInfo being a promise
        if (api && token) {
            this.api = new api_1.API(api, token);
        }
        // Get user info if API is available
        this.userInfo = this.fetchUserInfo(this.api);
        if (this.paths.yarnLinkDir) {
            yarn_1.writeYarnrc(this.path, this.paths.yarnLinkDir);
        }
        // TODO: Centralize the logic around the registry and package management
        // Once we have the user data, we can write the .npmrc file
        // which is needed for yarn to execute commands
        this.yarn = new yarn_1.Yarn(this.userInfo.then(userInfo => yarn_1.writeNpmrc(this.path, userInfo)));
        // XXX HACK (Remove when identity is added)
        if (author && !this.packageJson.author) {
            this.updatePackageJson((packageJson) => {
                packageJson.author = author;
                return packageJson;
            });
        }
        fs.ensureDirSync(this.paths.metadata);
        fs.ensureDirSync(this.paths.code);
        this.watchAssets();
        this.refreshLibraryVersionInfo();
        let ms = config.registryRefreshInterval;
        if (typeof ms !== "number") {
            ms = DEFAULT_REGISTRY_INFO_REFRESH_INTERVAL;
        }
        if (ms > 0) {
            this._refreshInterval = setInterval(() => this.refreshRegistryInfo(), ms);
        }
    }
    static load(config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (config.projectPath.endsWith(".framerx")) {
                // This is a compressed archive.
                const archivePath = config.projectPath;
                config.projectPath = path.join(os.tmpdir(), uuid(), "container");
                // TODO: Consider using blacklist to ignore unnecessary stuff (like .backups).
                yield extractProject(archivePath, config.projectPath);
            }
            return new Project(config);
        });
    }
    static handleYarnInstallationError(packageJson, resultError) {
        const jsonLines = jsonLines_1.JSONLines.parse(resultError);
        const errors = jsonLines.filter(line => line.type === "error");
        const dependencies = packageJson.dependencies || packageJson.devDependencies
            ? Object.assign({}, packageJson.devDependencies, packageJson.dependencies)
            : undefined;
        if (errors.length && dependencies) {
            const Sentry = require("@sentry/node");
            // to reduce the number of false positive cases where the error message contains word "framer"
            delete dependencies.framer;
            // sort package name by name starting with the longest names
            const packageNames = Object.keys(dependencies).sort((a, b) => b.length - a.length);
            // find the dependencies that failed to be installed,
            for (const error of errors) {
                const { data } = error;
                if (typeof data !== "string")
                    continue;
                const packageName = packageNames.find(name => data.includes(name));
                if (!packageName)
                    continue;
                logger.error(`There was an error installing dependency: ${packageName}`);
                Sentry.withScope(scope => {
                    scope.setTag("category", "yarn dependency installation error");
                    scope.setExtra("package", `${packageName}@${dependencies[packageName]}`);
                    Sentry.captureMessage(data, Sentry.Severity.Error);
                });
            }
        }
    }
    stop() {
        this._server = undefined;
        this.retired = true;
        if (this._refreshInterval) {
            clearInterval(this._refreshInterval);
            this._refreshInterval = undefined;
        }
        if (this._assetWatcher) {
            this._assetWatcher.close();
            this._assetWatcher = null;
        }
        if (this._watcher) {
            this._watcher.stop();
            this._watcher = undefined;
        }
    }
    getLatestPublishedVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            const versionResult = yield this.runTask("getLatestPublishedVersion", this.yarn.info([this.packageJson.name, "version", ...this.yarnOptions]));
            const lines = jsonLines_1.JSONLines.parse(versionResult.output);
            // Be defensive against empty array returns and treat as errors
            // Make sure that the "data" property is a valid semver value
            const version = semver.valid(lines.length > 0 && lines[0].data);
            // If there isn't a valid version, the package doesn't exist
            // in the registry because it hasn't been published
            if (!version) {
                throw new Error("This package has not been previously published.");
            }
            return version;
        });
    }
    install() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.retired)
                return;
            this._fixNodeModulesPath();
            if (yield this.runFramerInstallActions()) {
                this.reloadClients();
            }
            logger.info("Installing dependencies...");
            const dependenciesInstallStartMark = Date.now();
            // First check the local cache
            const result = yield this.runTask("install", this.yarn.install(["--prefer-offline", ...this.yarnOptions]));
            // Handle Yarn errors
            if (result.error) {
                Project.handleYarnInstallationError(this.packageJson, result.error);
            }
            logger.info(`Installing dependencies - DONE. Took ${Date.now() - dependenciesInstallStartMark}ms`);
            yield this.updatePackageInfo();
            // we start the preview window in about:blank, and wait for the first reload to start
            if (this._server) {
                this._server.setState({ doneFirstInstall: true });
            }
        });
    }
    installFramer(version) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.runFramerInstallActions(version)) {
                // preview depends on node_modules/framer/build/framer.debug.js
                // if that file has changed, we must reload preview
                this.reloadClients();
            }
            yield this.updatePackageInfo();
        });
    }
    /**
     * @returns true if actions were performed to change the installed library
     */
    runFramerInstallActions(version) {
        return __awaiter(this, void 0, void 0, function* () {
            const installedFramerVersion = this.installedFramerVersion();
            const builtInFramerVersion = this.builtInFramerVersion();
            const { packageJson } = this;
            const currentInstallStrategy = framerLibraryManager_1.installStrategy(packageJson);
            let updatedInstallStrategy;
            if (version) {
                updatedInstallStrategy = framerLibraryManager_1.installStrategyForVersion(version, builtInFramerVersion);
            }
            else {
                updatedInstallStrategy = framerLibraryManager_1.updateInstallStrategy(currentInstallStrategy, builtInFramerVersion, installedFramerVersion);
            }
            if (!updatedInstallStrategy) {
                // We’re stuck :( This will only happen if all the info above is undefined
                throw Error("Can’t install Framer Library");
            }
            const script = framerLibraryManager_1.actions(currentInstallStrategy, updatedInstallStrategy, installedFramerVersion);
            for (const action of script) {
                if (action === "remove") {
                    yield this.runTask("remove", this.yarn.remove(["framer", ...this.yarnOptions]));
                    continue;
                }
                if (action === "unlink") {
                    yield this.runTask("unlink", this.yarn.unlink(["framer", ...this.yarnOptions]));
                    continue;
                }
                if (action === "link") {
                    yield this.runTask("link", this.yarn.link(["framer", ...this.yarnOptions]));
                    continue;
                }
                if (action.name === "add") {
                    yield this.runTask("add", this.yarn.add([`framer@${action.version}`, ...this.yarnOptions]));
                    continue;
                }
                if (action.name === "addDev") {
                    yield this.runTask("add", this.yarn.add([`framer@${action.version}`, "--dev", ...this.yarnOptions]));
                    continue;
                }
                if (action.name === "addPeer") {
                    const currentFramerPeerDependency = (packageJson.peerDependencies && packageJson.peerDependencies.framer) || undefined;
                    const peerdependencyVersion = framerLibraryManager_1.newPeerDependency(currentFramerPeerDependency, action.version);
                    yield this.runTask("add", this.yarn.add([`framer@${peerdependencyVersion}`, "--peer", ...this.yarnOptions]));
                    continue;
                }
                if (action.name === "upgrade") {
                    yield this.runTask("upgrade", this.yarn.upgrade([`framer@${action.version}`, ...this.yarnOptions]));
                    continue;
                }
                // Make sure we’re exhaustive
                assertNever(action.name);
            }
            // Re-fetch the library version post actions.
            const currentFramerVersion = this.installedFramerVersion();
            this.updateCurrentLibraryVersion(currentFramerVersion);
            if (currentFramerVersion === null) {
                logger.warn("Was not able to install Framer version");
            }
            // We could do an early return, but then we would not update the current library version
            return script.length > 0;
        });
    }
    updateCurrentLibraryVersion(currentLibraryVersion) {
        if (this._server) {
            this._server.setState({ currentLibraryVersion: currentLibraryVersion || undefined });
        }
    }
    add(packageName, isDevDependency, context = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this._fixNodeModulesPath();
            const options = isDevDependency ? ["--dev"] : [];
            return this.runTask("add", this.yarn.add([packageName, ...this.yarnOptions, ...options]).then(() => {
                this.invalidateCompilerWatch();
                return this.updateServerPackagesListing();
            }), Object.assign({}, context, { packageName }));
        });
    }
    remove(packageName, context = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this._fixNodeModulesPath();
            return this.runTask("remove", this.yarn.remove([packageName, ...this.yarnOptions]).then(() => {
                return this.updateServerPackagesListing();
            }), Object.assign({}, context, { packageName }));
        });
    }
    upgrade(packageName, packageVersion, context = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this._fixNodeModulesPath();
            return this.runTask("upgrade", this.yarn.upgrade([`${packageName}@${packageVersion}`, ...this.yarnOptions]).then(() => {
                return this.updatePackageInfo();
            }), Object.assign({}, context, { packageName,
                packageVersion }));
        });
    }
    publish(version, packageName, displayName, context = {}, access) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.userInfo;
            if (!fs.existsSync(this.paths.npmrc)) {
                throw Error("missing .npmrc file in project");
            }
            const additionalOptions = ["--no-git-tag-version"];
            if (version) {
                additionalOptions.push("--new-version", version);
            }
            if (access === "restricted" || access === "public") {
                additionalOptions.push("--access", access);
            }
            const task = () => __awaiter(this, void 0, void 0, function* () {
                yield this.buildDist(packageName, displayName);
                const result = yield this.yarn
                    .publish([...this.yarnOptions, ...additionalOptions])
                    .catch(error => ({ error }));
                // Handle Yarn errors
                if (result.error) {
                    logger.error(result.error);
                    // Look at the output from Yarn and only throw if there's an error (ignore warnings).
                    // If there's no data at all, assume that's an error as well.
                    const jsonLines = jsonLines_1.JSONLines.parse(result.error);
                    if (!jsonLines.length || jsonLines[0].type === "error") {
                        yield this.handleYarnPublishFail(packageName, version, `Failed to publish via Yarn`).catch(err => {
                            logger.warn(err);
                        });
                        throw result.error;
                    }
                }
            });
            return this.runTask("publish", task(), Object.assign({}, context, { version }));
        });
    }
    handleYarnPublishFail(packageName, version, error) {
        return __awaiter(this, void 0, void 0, function* () {
            const { api } = this;
            if (!api || !packageName || !version) {
                return;
            }
            return api.rejectPendingVersion(packageName, version, error || "");
        });
    }
    check() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._server)
                return;
            const compatibility = framerLibraryManager_1.libraryCompatibility(this.packageJson, this.builtInFramerVersion(), this.installedFramerVersion());
            if (!compatibility.compatible) {
                const message = `${compatibility.message}\n\n${compatibility.recoverySuggestion}`;
                if (compatibility.isError) {
                    logger.warn(message);
                }
                else {
                    logger.error(message);
                }
            }
            yield this.runTask("check", this.yarn.check([...this.yarnOptions]));
        });
    }
    refreshRegistryInfo() {
        this.refreshOutdated();
        this.refreshLibraryVersionInfo();
    }
    getOutdated() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.runTask("getOutdated", this.yarn.outdated([...this.yarnOptions]));
        });
    }
    getPublishedFramerVersions() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.runTask("getPublishedFramerVersions", this.yarn.info(["framer", "versions", ...this.yarnOptions]));
        });
    }
    refreshLibraryVersionInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const versionsResult = yield this.getPublishedFramerVersions();
            if (!this._server) {
                return;
            }
            const jsonLines = jsonLines_1.JSONLines.parse(versionsResult.output);
            const builtInLibraryVersion = this.builtInFramerVersion();
            let availableLibraryVersions = undefined;
            if (jsonLines.length === 0) {
                if (builtInLibraryVersion) {
                    availableLibraryVersions = [builtInLibraryVersion];
                }
                this._server.setState({ availableLibraryVersions });
                return;
            }
            const inspect = jsonLines.filter(json => json.type === "inspect");
            if (inspect.length !== 1) {
                return Promise.reject("Can't find published Framer Library versions");
            }
            const libraryPublishedVersions = inspect[0].data;
            const alwaysIncludedVersions = [];
            if (builtInLibraryVersion) {
                alwaysIncludedVersions.push(builtInLibraryVersion);
            }
            const currentFramerVersion = this.installedFramerVersion();
            if (currentFramerVersion) {
                alwaysIncludedVersions.push(currentFramerVersion);
            }
            // We exclude these libraries from the menu because
            // Everything older than 0.9.7 is really old
            // The 0.9.8 alpha and beta were published as 0.10.0, and since deprecated, but the app does not pick that up (yet)
            const excludedLibaries = "<0.9.7 || ^0.9.8-beta || ^0.9.8-alpha";
            const includedLibraries = this.packageJson.peerDependencies && this.packageJson.peerDependencies.framer;
            availableLibraryVersions = framerLibraryManager_1.latestOfMajorVersions(libraryPublishedVersions, alwaysIncludedVersions, excludedLibaries, includedLibraries);
            this._server.setState({
                availableLibraryVersions,
                builtInLibraryVersion,
            });
        });
    }
    refreshOutdated() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._server)
                return;
            const outdatedResult = yield this.getOutdated();
            const jsonLines = jsonLines_1.JSONLines.parse(outdatedResult.output);
            if (jsonLines.length === 0) {
                this._server.setState({ outdated: [] });
                return;
            }
            const tables = jsonLines.filter(json => json.type === "table");
            if (tables.length !== 1) {
                return Promise.reject("Can't find outdated info");
            }
            const info = tables[0].data.body;
            const outdated = info
                .map(types_1.OutdatedPackage.fromTableRow)
                .filter(pkg => this.isFramerPackage(`node_modules/${pkg.name}`));
            this._server.setState({ outdated });
        });
    }
    updatePackageInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.retired)
                return;
            this.updateServerPackagesListing();
            // only check for outdated packages if online by looking at the userinfo
            // otherwise this operation can take quite long
            const userInfo = yield this.userInfo;
            if (userInfo) {
                yield this.refreshOutdated();
            }
            yield this.check();
        });
    }
    getProductionDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.yarn.run(["list", "--prod", ...this.yarnOptions]);
            const jsonLines = jsonLines_1.JSONLines.parse(result.output);
            if (jsonLines.length === 0)
                return [];
            const treeData = jsonLines[jsonLines.length - 1].data;
            if (!treeData.trees)
                return [];
            return treeData.trees.map((dependency) => dependency.name.replace(/^(.+)(@.+)$/, "$1"));
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            // Used for CLI and testing.
            const compiler = new (lazyWebpackCompiler())(this, {
                outputDir: this.paths.buildOutputDir,
            });
            yield compiler.build();
            this._lastBuildOutput = compiler.buildOutput;
            return compiler;
        });
    }
    buildDist(packageName, displayName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.prepareForPublish(packageName, displayName);
            const externals = yield this.getProductionDependencies();
            const compiler = new (lazyWebpackCompiler())(this, {
                externals,
                outputDir: this.paths.distOutputDir,
                enableBundleSplit: false,
            });
            yield compiler.build();
            return compiler;
        });
    }
    /** Used for testing. */
    pack(version, packageName, displayName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.buildDist(packageName, displayName);
            if (version) {
                yield this.yarn.run(["version", "--new-version", version, ...this.yarnOptions]);
            }
            const result = yield this.yarn.run(["pack", ...this.yarnOptions]);
            // Get the response from Yarn and parse the tarball path from it.
            const { data } = JSON.parse(result.output);
            if (typeof data !== "string")
                return null;
            // The path is only exposed through a formatted string, so extract it from there.
            const match = data.match(/^Wrote tarball to "(.*?)"\.$/);
            if (!match)
                return null;
            return match[1];
        });
    }
    // Use `context` to add extra info that the server should send along when reporting on this task
    runTask(name, task, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._server) {
                return this._server.runAsTask(name, task, context);
            }
            else {
                // Just silently wait on the promise
                return task;
            }
        });
    }
    get yarnOptions() {
        const options = [
            "--cwd",
            this.path,
            "--skip-integrity-check",
            "--cache-folder",
            this.paths.yarnCache,
            "--mutex",
            `file:${this.paths.yarnMutex}`,
            "--json",
            "--ignore-scripts",
        ];
        if (this.paths.yarnLinkDir) {
            options.push("--link-folder", this.paths.yarnLinkDir);
        }
        return options;
    }
    get watcher() {
        return this._watcher;
    }
    get packageJson() {
        try {
            return JSON.parse(fs.readFileSync(this.paths.packageJson).toString());
        }
        catch (error) {
            return {};
        }
    }
    set packageJson(info) {
        fs.writeFileSync(this.paths.packageJson, JSON.stringify(info, null, "\t"));
    }
    get packageFramerId() {
        const info = this.packageJson;
        if (!info.framer) {
            info.framer = {};
        }
        if (!info.framer.id) {
            info.framer.id = uuid();
            this.packageJson = info;
        }
        return info.framer.id;
    }
    get packageFramerName() {
        const info = this.packageJson;
        if (!info.framer)
            return undefined;
        return info.framer.displayName;
    }
    get packageName() {
        const info = this.packageJson;
        return info.name;
    }
    get packageVersion() {
        const info = this.packageJson;
        return info.version;
    }
    get builtInFramerPath() {
        if (!this.paths.yarnLinkDir)
            return;
        return path.join(this.paths.yarnLinkDir, "framer");
    }
    getPackageVersion(packagePath) {
        try {
            const packageJSON = JSON.parse(fs.readFileSync(path.join(packagePath, "package.json")).toString());
            return packageJSON.version || null;
        }
        catch (error) {
            // Fall-through, we’re going to try something different
        }
        return null;
    }
    builtInFramerVersion() {
        if (!this.builtInFramerPath) {
            return;
        }
        const version = this.getPackageVersion(this.builtInFramerPath);
        if (!version) {
            logger.error("Error reading built-in Framer version");
            return;
        }
        return version;
    }
    installedFramerVersion() {
        // Try and resolve the version from an installed package.
        const version = this.resolveFramerPackageVersion();
        if (version) {
            return version;
        }
        // We’re going to try something different
        const installation = framerLibraryManager_1.installStrategy(this.packageJson);
        if (installation) {
            try {
                const yarnLockfile = lockfile.parse(fs.readFileSync(this.paths.yarnLock).toString());
                const lockedFramer = yarnLockfile.object[`framer@${installation.version}`];
                if (lockedFramer) {
                    return lockedFramer.version;
                }
            }
            catch (error) {
                // Fall through, we’ll handle errors once
            }
        }
        return null;
    }
    resolveFramerPackageVersion() {
        const framerPath = path.join(this.paths.nodeModules, "framer");
        let framerPathStats;
        try {
            framerPathStats = fs.lstatSync(framerPath);
        }
        catch (_a) {
            return null;
        }
        // We need to verify that the installed package is still valid for
        // the current filesystem and Framer version. It must either be
        // a directory or symlink to the current yarn link-folder.
        if (framerPathStats.isSymbolicLink()) {
            const symlinkPath = fs.readlinkSync(framerPath);
            const resolvedPath = path.resolve(path.dirname(framerPath), symlinkPath);
            if (this.paths.yarnLinkDir && !resolvedPath.startsWith(this.paths.yarnLinkDir)) {
                return null;
            }
        }
        else if (!framerPathStats.isDirectory()) {
            return null;
        }
        // Try and get the current version from the installed package.
        return this.getPackageVersion(framerPath);
    }
    // FIXME: this function will benefit from using async IO, it should speed up up the whole re-build process
    framerPackages() {
        const packages = {};
        function getJSON(filePath) {
            try {
                return JSON.parse(fs.readFileSync(filePath, "utf8"));
            }
            catch (error) {
                return undefined;
            }
        }
        function getFileContent(filePath) {
            try {
                return fs.readFileSync(filePath, "utf8");
            }
            catch (error) {
                return undefined;
            }
        }
        const dependencies = new Set([
            "framer",
            ...Object.keys(this.packageJson.dependencies || {}),
            ...Object.keys(this.packageJson.devDependencies || {}),
        ]);
        for (const dependency of dependencies) {
            let json;
            if (!json) {
                // This is the path for a package that was installed from a registry
                const registryPackagePath = path.join(this.paths.nodeModules, dependency, "package.json");
                json = getJSON(registryPackagePath);
            }
            let dependencyPath;
            if (this.packageJson.dependencies && this.packageJson.dependencies[dependency]) {
                dependencyPath = this.packageJson.dependencies[dependency];
            }
            else if (this.packageJson.devDependencies && this.packageJson.devDependencies[dependency]) {
                dependencyPath = this.packageJson.devDependencies[dependency];
            }
            if (!json && dependencyPath) {
                // This is the path for a package that was installed locally
                const localPackagePath = path.join(this.path, dependencyPath, "package.json");
                json = getJSON(localPackagePath);
            }
            if (json && json.framer && json.name) {
                let design = undefined;
                if (!design) {
                    const moduleDesignPath = path.join(this.paths.nodeModules, dependency, "design", "document.json");
                    design = getFileContent(moduleDesignPath);
                }
                if (!design && dependencyPath) {
                    const localDesignPath = path.join(this.path, dependencyPath, "design", "document.json");
                    design = getFileContent(localDesignPath);
                }
                packages[json.name] = { packageJson: json, design };
            }
        }
        return packages;
    }
    get info() {
        return {
            path: this.path,
        };
    }
    reloadClients() {
        if (this._server) {
            this._server.io.emit("reload");
        }
    }
    /** Adds the normally live canvas data to the CanvasStore of a build. */
    addCanvasDataToBuild(indexJs) {
        // we search for the last entry, in case some external framer packages didn't replace their CANVAS_DATA
        const needle1 = "CanvasStore.shared(";
        const needle2 = "); // CANVAS_DATA;\n";
        let at = indexJs.lastIndexOf(needle1 + needle2);
        if (at < 0)
            return indexJs;
        at += needle1.length;
        // always remove the CANVAS_DATA marker
        const canvasData = this.canvasData || '{"children":[]}';
        return indexJs.slice(0, at) + canvasData + ");\n" + indexJs.slice(at + needle2.length);
    }
    serve(port) {
        return __awaiter(this, void 0, void 0, function* () {
            this._server = new server_1.Server(this._config);
            this._server.setProject(this);
            this.onServerStart();
            return this._server.start(port);
        });
    }
    onServerStart() {
        this.sendScript({ scriptsToSend: "all" });
        this.on("script", this.sendScript);
        this.updateServerPackagesListing();
        this.setInitialServerState();
    }
    setInitialServerState() {
        if (!this._server) {
            return;
        }
        const initialServerState = {};
        const builtInFramerVersion = this.builtInFramerVersion();
        if (builtInFramerVersion) {
            initialServerState.builtInLibraryVersion = builtInFramerVersion;
            if (!this._server.state.availableLibraryVersions) {
                initialServerState.availableLibraryVersions = [builtInFramerVersion];
            }
        }
        const currentLibraryVersion = this.installedFramerVersion();
        if (currentLibraryVersion) {
            initialServerState.currentLibraryVersion = currentLibraryVersion;
        }
        this._server.setState(initialServerState);
    }
    watch() {
        if (this.retired)
            return;
        if (this._watcher) {
            this._watcher.stop();
        }
        const watcher = new (lazyWebpackCompiler())(this, {
            outputDir: this.paths.buildOutputDir,
            enableBundleSplit: true,
        });
        this._watcher = watcher;
        watcher.progress.on("start", () => {
            this.runTask("build", new Promise(resolve => {
                watcher.progress.once("complete", resolve);
            }));
        });
        watcher.watch((err, updatedScriptNames) => {
            this._lastBuildOutput = watcher.buildOutput;
            this.emit("script", { scriptsToSend: updatedScriptNames });
        });
    }
    invalidateCompilerWatch() {
        if (!this._watcher) {
            return;
        }
        this._watcher.invalidate();
    }
    watchAssets() {
        // Should be only called once
        if (this._assetWatcher)
            return;
        const gaze = require("gaze"); // No types, unfortunately
        const relativeMetadataPath = path.relative(this.paths.project, this.paths.metadata);
        const relativeCodePath = path.relative(this.paths.project, this.paths.code);
        const assets = [
            `${relativeMetadataPath}/icon.png`,
            `${relativeMetadataPath}/artwork.png`,
            "package.json",
            "README.md",
        ];
        // The "*" and "metadata/*" are needed to pick up newly created files
        this._assetWatcher = new gaze.Gaze(["*", `${relativeMetadataPath}/*`, `${relativeCodePath}/**`], {
            debounceDelay: 50,
            cwd: this.path,
        });
        this._assetWatcher.on("all", (event, filepath) => {
            let relativePath = path.relative(this.path, filepath);
            if (process.platform === "win32") {
                relativePath = relativePath.replace("\\", "/");
            }
            if (relativePath === "package.json") {
                this.debouncedUpdateServerPackagesListing();
            }
            // Because of the globbing it picks up other changed files too
            // This only sends events when relevant files are changed
            if (assets.includes(relativePath) && this._server) {
                const url = `${this._server.state.url}/${relativePath}`;
                this._server.projectStateService.assetChanged({ relativePath });
                this._server.io.emit("filechange", { relativePath, url, event });
            }
            if (relativePath.startsWith("code/") && this._server) {
                this._server.io.emit("codechange", { path: relativePath, event });
            }
        });
        this._assetWatcher.on("ready", (watcher /* gaze */) => {
            for (const watchedPath in watcher.watched()) {
                if (watchedPath.startsWith(this.paths.nodeModules)) {
                    watcher.remove(watchedPath);
                }
            }
        });
        this._assetWatcher.on("error", (error) => {
            // ignore ENOENT errors, they are almost all bugs in gaze.js and it's use of fs.watch
            if (error && error.code === "ENOENT")
                return;
            // in Windows, we seem to be getting { code:EPERM, errno:-4048 }
            if (os.platform() === "win32" && error && error.code === "EPERM")
                return;
            // emitting other errors ourselves, will report and exit the nodejs process
            this.emit("error", error);
        });
    }
    canBePublishedPrivately() {
        return __awaiter(this, void 0, void 0, function* () {
            const userInfo = yield this.userInfo;
            return userInfo && userInfo.organization && userInfo.organization.id !== "00000000-0000-0000-0000-000000000000";
        });
    }
    prepareForPublish(packageName, displayName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.updatePackageJson((packageJson) => {
                if (packageJson.main === "build/index.js") {
                    // Override "main" to ensure that legacy projects are updated.
                    packageJson.main = "dist/index.js";
                }
                if (packageName) {
                    packageJson.name = packageName;
                }
                if (displayName) {
                    if (!packageJson.framer)
                        packageJson.framer = {};
                    packageJson.framer.displayName = displayName;
                }
                return packageJson;
            });
        });
    }
    updatePackageJson(updater) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const packageInfoData = yield fs.readFile(this.paths.packageJson);
                let packageInfo = JSON.parse(packageInfoData.toString());
                packageInfo = updater(packageInfo);
                const newPackageInfoData = Buffer.from(JSON.stringify(packageInfo, null, "\t"));
                if (packageInfoData.equals(newPackageInfoData)) {
                    // Don't write to the file if there's no change to avoid watch triggering.
                    return;
                }
                yield fs.writeFile(this.paths.packageJson, newPackageInfoData);
            }
            catch (error) {
                throw Error(`Error updating package.json ${error}`);
            }
        });
    }
    // Link the node_modules directory to a symlink in the cache, if needed
    _fixNodeModulesPath() {
        if (!fs.pathExistsSync(this.paths.nodeModules)) {
            // If it’s an symlink that points to a directory that does not exist, we end up here,
            // to be sure, try to remove the broken symlink
            try {
                fs.removeSync(this.paths.nodeModules);
            }
            finally {
            }
        }
        // Retrieve the packageFramerId so it gets added to the package.json if it does not exist
        // TODO: Remove this in the future. The ID is not actually used anymore
        // This is here mostly to mimic old behavior that is being relied on by the file format
        this.packageFramerId;
    }
    updatePackagesInfo(packages) {
        const { _server: server, api } = this;
        if (!server || !api)
            return;
        const unknownPackages = packages.filter(packageId => !server.hasPackageInfo(packageId));
        if (unknownPackages.length === 0)
            return;
        api.getPackagesMeta(unknownPackages)
            .then((json) => server.addPackageInfo(json))
            .catch(() => logger.warn("Could not fetch package info"));
    }
    fetchUserInfo(api) {
        // Handle errors fetching data to support offline functionality
        return api ? api.getUserInfo().then(data => data, () => undefined) : Promise.resolve(undefined);
    }
    /**
     * Resolves the path only when inside the code path.
     *
     * NOTE: Throws when trying to resolve outside of the code path
     *
     * @param checkExists Check (case-insensitively) that the file exists, when
     * enabled, throws if the file does not exist.
     *
     */
    resolveCodePath(name, checkExists = false) {
        const filePath = path.resolve(this.paths.code, name);
        if (!filePath.startsWith(this.paths.code)) {
            throw new Error(`File outside the code path: ${filePath}`);
        }
        if (checkExists && !this.caseSensitiveFileExistsSync(this.paths.code, name)) {
            throw new Error(`File that does not exist: ${filePath}`);
        }
        return filePath;
    }
    getCodeFilesAndFolders() {
        const data = [];
        const scandir = (dirname = "") => {
            fs.readdirSync(this.resolveCodePath(dirname)).forEach(file => {
                if (file.startsWith("."))
                    return;
                const filepath = path.join(dirname, file);
                const entry = this.getCodeEntry(filepath);
                data.push(entry);
                if (entry.dir) {
                    scandir(filepath);
                }
            });
        };
        scandir("");
        return data;
    }
    getCodeEntry(filename) {
        const filePath = this.resolveCodePath(filename, true);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            return { path: filename, dir: true };
        }
        if (!/\.([tj]sx?|json)$/.test(filename) || stat.size > exports.HUGE_FILE) {
            return { path: filename };
        }
        const content = fs.readFileSync(filePath, "utf8");
        return { path: filename, content };
    }
    saveCodeFile(name, content) {
        if (!/\.([tj]sx?|json)$/.test(name))
            return;
        const filePath = this.resolveCodePath(name);
        fs.mkdirpSync(path.dirname(filePath));
        fs.writeFileSync(filePath, content, "utf8");
    }
    deleteCodeFile(name) {
        if (!/\.([tj]sx?|json)$/.test(name))
            return;
        fs.removeSync(this.resolveCodePath(name, true));
    }
    // Stat does not provide a filename, so this seems to be the only way to check
    // if the exact filename exists on a case insensitive filesystem
    caseSensitiveFileExistsSync(dirName, fileName) {
        const dirContents = fs.readdirSync(dirName);
        const pathComponents = fileName.split(path.sep);
        if (pathComponents.length === 1) {
            return dirContents.includes(fileName);
        }
        const newDir = path.join(dirName, pathComponents[0]);
        const newFile = pathComponents.slice(1).join(path.sep);
        return this.caseSensitiveFileExistsSync(newDir, newFile);
    }
    createExampleFiles() {
        const templatePath = path.join(__dirname, "../../CodeTemplate/code");
        fs.ensureDirSync(this.paths.code);
        fs.copySync(templatePath, this.paths.code, { recursive: true });
    }
    getDeclarationFilesForDepedencies() {
        const packageJson = this.packageJson;
        const dependencies = new Set([
            ...Object.keys(packageJson.dependencies || {}),
            ...Object.keys(packageJson.devDependencies || {}),
            ...Object.keys(packageJson.peerDependencies || {}),
            "framer",
            "csstype",
            "prop-types",
        ]);
        const files = [];
        dependencies.forEach(name => {
            if (name.startsWith("@types"))
                return;
            const dts = this.getDeclarationFilesForPackage(name);
            files.push(...dts);
        });
        try {
            const motionDtsPath = path.join(this.path, "node_modules", "framer", "node_modules", "framer-motion", "dist", "framer-motion.d.ts");
            const stat = fs.statSync(motionDtsPath);
            if (stat.isFile() || stat.isSymbolicLink()) {
                files.push(...this.getDeclarationFilesAroundMain("framer-motion", motionDtsPath));
            }
        }
        catch (e) {
            if (!e.message.includes("ENOENT"))
                throw e;
        }
        return files;
    }
    getDeclarationFilesForPackage(name) {
        const code = this.path;
        try {
            const atTypesIndex = path.join(code, "node_modules/@types", name, "index.d.ts");
            const stat = fs.statSync(atTypesIndex);
            if (stat.isFile() || stat.isSymbolicLink()) {
                return this.getDeclarationFilesAroundMain(name, atTypesIndex);
            }
        }
        catch (e) {
            if (!e.message.includes("ENOENT"))
                throw e;
        }
        try {
            const moduleIndex = path.join(code, "node_modules", name, "index.d.ts");
            const stat = fs.statSync(moduleIndex);
            if (stat.isFile() || stat.isSymbolicLink()) {
                return this.getDeclarationFilesAroundMain(name, moduleIndex);
            }
        }
        catch (e) {
            if (!e.message.includes("ENOENT"))
                throw e;
        }
        try {
            const pkg = JSON.parse(fs.readFileSync(path.join(code, "node_modules", name, "package.json"), "utf8"));
            let types = null;
            if (pkg.typescript && pkg.typescript.definition) {
                types = pkg.typescript.definition;
            }
            else if (pkg.types) {
                types = pkg.types;
            }
            else if (pkg.typings) {
                types = pkg.typings;
            }
            else if (pkg.main) {
                types = pkg.main.slice(0, -3) + ".d.ts";
            }
            if (types) {
                const modulePath = path.join(code, "node_modules", name, types);
                const stat = fs.statSync(modulePath);
                if (stat.isFile() || stat.isSymbolicLink()) {
                    return this.getDeclarationFilesAroundMain(name, modulePath);
                }
            }
        }
        catch (e) {
            if (!e.message.includes("ENOENT"))
                throw e;
        }
        return [];
    }
    getDeclarationFilesAroundMain(module, modulepath) {
        const modulecontent = fs.readFileSync(modulepath, "utf8");
        const res = [{ module: path.join(module, "index.d.ts"), content: modulecontent }];
        const base = path.dirname(modulepath);
        const scandir = (dirname = "") => {
            fs.readdirSync(path.join(base, dirname)).forEach(filename => {
                if (filename.startsWith("."))
                    return;
                if (filename === "node_modules")
                    return;
                if (module === "react" && filename === "global.d.ts")
                    return;
                const filepath = path.join(base, dirname, filename);
                if (filepath === modulepath)
                    return;
                const stat = fs.statSync(filepath);
                if (stat.isDirectory()) {
                    scandir(path.join(dirname, filename));
                    return;
                }
                if (!filepath.endsWith(".d.ts"))
                    return;
                res.push({
                    module: path.join(module, dirname, filename),
                    content: fs.readFileSync(filepath, "utf8"),
                });
            });
        };
        scandir("");
        if (res.length > 1 && !modulepath.endsWith("index.d.ts")) {
            // the module might have internal depedencies using the original filename
            res.push({ module: path.join(module, path.basename(modulepath)), content: modulecontent });
        }
        return res;
    }
}
exports.Project = Project;
function copyResourceFiles(container, map) {
    return new Promise(resolve => {
        let scheduled = 0;
        function maybeDone() {
            if (scheduled === 0) {
                resolve();
            }
        }
        for (const key in map) {
            const source = path.join(__dirname, key);
            const target = path.join(container, map[key]);
            let statSource;
            try {
                statSource = fs.statSync(source);
            }
            catch (e) {
                logger.error("unable to find resource file:", key);
                continue;
            }
            try {
                const statTarget = fs.statSync(target);
                if (+statSource.mtime === +statTarget.mtime && statSource.size === statTarget.size) {
                    continue;
                }
            }
            catch (_a) { }
            scheduled += 1;
            fs.copy(source, target, { preserveTimestamps: true }, err => {
                if (err) {
                    logger.error(err);
                }
                scheduled -= 1;
                maybeDone();
            });
        }
        maybeDone();
    });
}
function readCachedBuildOutput(buildOutputDirPath) {
    const indexJs = getBuiltScript(buildOutputDirPath, "index.js");
    const vendorsJs = getBuiltScript(buildOutputDirPath, "vendors.js");
    if (!indexJs)
        return null;
    return {
        "index.js": indexJs,
        "vendors.js": vendorsJs,
    };
}
function getBuiltScript(buildOutputDirPath, script) {
    const scriptPath = path.join(buildOutputDirPath, script);
    try {
        return fs.readFileSync(scriptPath, "utf8");
    }
    catch (error) {
        if (error.code !== "ENOENT") {
            logger.error(`Cannot read script ${script}`, error);
        }
        return undefined;
    }
}
// TODO: might make sense to make IO in this function async
function readPreloadBuildOutput() {
    const preloadJsFilePath = path.join(__dirname, "../preload.js");
    if (!fs.pathExistsSync(preloadJsFilePath))
        return null;
    return {
        "index.js": fs.readFileSync(preloadJsFilePath).toString(),
    };
}
function pick(object, keys) {
    return keys.reduce((result, key) => {
        result[key] = object[key];
        return result;
    }, {});
}
function extractProject(archivePath, dir) {
    return new Promise((resolve, reject) => {
        const extract = require("extract-zip");
        extract(archivePath, { dir }, (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
function assertNever(value) {
    throw Error(`Unexpected value: ${value}`);
}
// Helper to lazy load Webpack
function lazyWebpackCompiler() {
    const { Compiler } = require("./webpack");
    return Compiler;
}
