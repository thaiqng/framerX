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
const events_1 = require("events");
const webpack = require("webpack");
const MemoryFS = require("memory-fs");
const path = require("path");
const fs = require("fs-extra");
const VirtualModulesPlugin = require("webpack-virtual-modules");
const logger_1 = require("./logger");
const logger = logger_1.createLogger("framer:webpack");
const analyzer_1 = require("./analyzer");
const framerSourceMapPlugin_1 = require("./framerSourceMapPlugin");
const defaults = ({ project, designDependenciesName, enableBundleSplit, }) => {
    const designDependenciesModulePath = path.join(project.path, designDependenciesName);
    return {
        devtool: false,
        watch: true,
        mode: "development",
        output: {
            path: "/",
            filename: "index.js",
            libraryTarget: "umd",
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx", ".css"],
        },
        resolveLoader: {
            modules: [`${__dirname}/../node_modules/`, "node_modules", `${__dirname}`],
        },
        externals: [
            {
                "framer/resource": {
                    root: "framer/resource",
                    commonjs2: "framer/resource",
                    commonjs: "framer/resource",
                    amd: "framer/resource",
                },
                framer: {
                    root: "Framer",
                    commonjs2: "framer",
                    commonjs: "framer",
                    amd: "framer",
                },
                react: {
                    root: "React",
                    commonjs2: "react",
                    commonjs: "react",
                    amd: "react",
                },
                "react-dom": {
                    root: "ReactDOM",
                    commonjs2: "react-dom",
                    commonjs: "react-dom",
                    amd: "react-dom",
                },
            },
        ],
        plugins: [new framerSourceMapPlugin_1.FramerSourceMapPlugin()],
        optimization: enableBundleSplit
            ? {
                splitChunks: {
                    cacheGroups: {
                        vendors: {
                            test: /\/designDependencies\.js$|\/node_modules\//,
                            filename: "vendors.js",
                            chunks: "all",
                            enforce: true,
                        },
                    },
                },
            }
            : undefined,
        module: {
            // parsing this module is usually the most expensive operation of the re-build
            // it is also unnecessary because it doesn't contain any `import` statements
            noParse: modulePath => modulePath === designDependenciesModulePath,
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    use: [
                        {
                            loader: "ts-loader",
                            options: {
                                transpileOnly: true,
                                colors: false,
                                compilerOptions: {
                                    inlineSourceMap: true,
                                },
                                getCustomTransformers: () => ({
                                    before: [analyzer_1.analyzeAndExportComponents],
                                }),
                            },
                        },
                    ],
                },
                {
                    test: /\.css$/,
                    use: [{ loader: "style-loader" }, { loader: "css-loader" }],
                },
            ],
        },
    };
};
// This is the code injected into the webpack module loading logic, so packages can find out their
// installed path.
// Notice we mask our access to "module" by eval, otherwise webpack installs some buildin module.js.
const resourceUrlModuleCode = `

// asset url
var __module_i = eval(\"typeof module !== 'undefined' ? module.i : ''\");
var __framer_package = (/(node_modules[/].*)[/](build|dist).index.js/.exec(__module_i) || [])[1]
function __asset_url__(src) { return __WEBPACK_EXTERNAL_MODULE_framer__.serverURL(__framer_package, src) };
installedModules['framer/resource'] = { i: 'framer/resource', l: true, exports: { url: __asset_url__ } };
`;
class Compiler {
    constructor(project, { externals = [], outputDir, enableBundleSplit = true }) {
        this.entryName = "./package.js"; // Needs to start with ./
        this.designDependenciesName = "./designDependencies.js"; // Needs to start with ./
        this.bundledDependencies = [];
        this.missingDependencies = [];
        this._buildOutput = null;
        this._lastHash = "";
        this._lastEntry = "";
        this._lastDesignDependencies = undefined;
        this._entryTemplate = fs.readFileSync(path.join(__dirname, "entry.template.js"), "utf8");
        this._handleWatch = (error, stats) => __awaiter(this, void 0, void 0, function* () {
            if (error) {
                logger.error(error);
            }
            this.stats = stats;
            if (stats.hasErrors()) {
                // https://webpack.js.org/configuration/stats/
                logger.error(stats.toString("minimal"));
            }
            if (stats.startTime && stats.endTime) {
                logger.info(`_handleWatch: build took ${stats.endTime - stats.startTime}ms`);
            }
            // Make sure we only send updates if the actual script did change
            if (this._lastHash === stats.hash) {
                return;
            }
            this._lastHash = stats.hash;
            this._buildOutput = this.readBuildOutput();
            const emittedScriptNames = getEmittedScriptNames(stats);
            logger.info(`_handleWatch: updated scripts - ${emittedScriptNames.join(",")}`);
            yield this.writeBuildOutput(emittedScriptNames);
            if (this._watchCallback)
                this._watchCallback(undefined, emittedScriptNames);
        });
        if (!fs.existsSync(project.path))
            throw Error(`path does not exist: ${project.path}`);
        this.project = project;
        this.progress = new ProgressWatcher();
        this._buildOutputDirPath = outputDir;
        // Set up a virtual module plugin for webpack so we can make the entry a dynamic string
        const { entry, designDependencies } = this.generateVirtualModules();
        this._virtualModulesPlugin = new VirtualModulesPlugin({
            [this.entryName]: entry,
            [this.designDependenciesName]: designDependencies,
        });
        this.config = defaults({ project, designDependenciesName: this.designDependenciesName, enableBundleSplit });
        this.config.entry = this.entryName;
        this.config.plugins && this.config.plugins.push(this._virtualModulesPlugin, this.progress.webpackPlugin());
        this.config.context = project.path;
        if (externals.length > 0) {
            // TSLint fights with prettier on this one
            // tslint:disable-next-line:semicolon
            ;
            this.config.externals.push(/^framer-package-loader!/, ...externals);
        }
        // Create the compiler and add a memory file system
        this.compiler = webpack(this.config);
        this.outputFileSystem = new MemoryFS();
        this.compiler.outputFileSystem = this.outputFileSystem;
        this.compiler.hooks.compilation.tap("framer", compilation => {
            const template = compilation.mainTemplate;
            template.hooks.require.tap("save module call", (source, chunk, hash) => {
                // We replace the normal webpack module call by wrapping it and capturing any errors.
                // A single error will not break all components. And components that are no longer
                // available can read the `error` exported and inform the user.
                return source.replace("modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);", "try { modules[moduleId].call(module.exports, module, module.exports, __webpack_require__); } catch (error) { module.exports = { error } }");
            });
            template.hooks.requireExtensions.tap("save module call", (source, chunk, hash) => {
                // We install a module called "framer/resource" that captures the current module.i if available.
                return source + resourceUrlModuleCode;
            });
        });
    }
    stop() {
        if (!this._watch) {
            return;
        }
        this._watch.close(() => { });
    }
    updateVirtualModules() {
        const { entry, designDependencies } = this.generateVirtualModules();
        if (entry === this._lastEntry && designDependencies === this._lastDesignDependencies)
            return;
        fs.ensureDirSync(this.project.paths.code);
        this._virtualModulesPlugin.writeModule(this.entryName, entry);
        this._virtualModulesPlugin.writeModule(this.designDependenciesName, designDependencies);
        this._lastEntry = entry;
        this._lastDesignDependencies = designDependencies;
    }
    /**
     *  Generates dynamic modules used as an entry point for webpack
     *  and to inline all design components from the dependencies
     */
    generateVirtualModules() {
        let designDependenciesTemplate;
        const entryPackagesTemplate = ["const packages = {}"];
        const packages = this.project.framerPackages();
        Object.keys(packages).forEach(key => {
            const packageObject = packages[key];
            const loader = key === "framer" ? "" : "framer-package-loader!";
            const design = packageObject.design;
            if (design) {
                // lazy-initialize template
                if (!designDependenciesTemplate)
                    designDependenciesTemplate = ["const designs = {}"];
                designDependenciesTemplate.push(`designs["${key}"] = ${design}`);
            }
            entryPackagesTemplate.push(`
                packages["${key}"] = () => {
                    var package = {}
                    var designJson
                    try {
                        package = require("${loader}${key}")
                        ${design ? `designJson = require("${this.designDependenciesName}")["${key}"]` : ""}
                    } catch (e) {
                        console.log(e)
                    }
                    package.__framer__ = package.__framer__ || {}
                    package.__framer__.packageJson = ${JSON.stringify(packageObject.packageJson)}
                    package.__framer__.packageJson.design = designJson
                    return package
                }`);
        });
        if (designDependenciesTemplate) {
            designDependenciesTemplate.push("module.exports = designs");
        }
        return {
            entry: this._entryTemplate.replace(/PACKAGES_CODE/g, entryPackagesTemplate.join("\n")),
            designDependencies: designDependenciesTemplate && designDependenciesTemplate.join("\n"),
        };
    }
    get buildOutput() {
        return this._buildOutput;
    }
    readBuildOutput() {
        return {
            "index.js": this.outputFileSystem.readFileSync(`/index.js`, "utf8"),
            "vendors.js": this.outputFileSystem.existsSync("/vendors.js")
                ? this.outputFileSystem.readFileSync("/vendors.js", "utf8")
                : undefined,
        };
    }
    // Write the build output to disk
    writeBuildOutput(emittedScripts) {
        return __awaiter(this, void 0, void 0, function* () {
            const buildOutput = this.buildOutput;
            if (!buildOutput) {
                logger.error("Attempted to write non-existing buildOutput to disk");
                return;
            }
            fs.ensureDirSync(this._buildOutputDirPath);
            const tasks = emittedScripts.map(scriptName => {
                const scriptContent = scriptName === "index.js"
                    ? this.project.addCanvasDataToBuild(buildOutput[scriptName])
                    : buildOutput[scriptName];
                if (!scriptContent) {
                    logger.error(`There is no ${scriptName} content in this.buildOutput`);
                    return Promise.resolve();
                }
                return writeFile(path.join(this._buildOutputDirPath, scriptName), scriptContent);
            });
            return Promise.all(tasks).then(() => undefined);
        });
    }
    build() {
        this.bundledDependencies = [];
        this.missingDependencies = [];
        return new Promise((resolve, reject) => {
            this.compiler.run((err, stats) => {
                if (err) {
                    reject(err);
                    return;
                }
                // Find all the dependencies that have been bundled
                // 1. The module is not included in the known list of externals
                // 2. The module has a rawRequest value (some modules have an unknown value)
                // 3. The rawRequest value starts with either an @ symbol or letter, per npm package name rules
                const bundledDependencies = stats.compilation.modules.filter(module => !module.external && module.rawRequest && /^[@a-z]/i.test(module.rawRequest));
                // Store the raw names of the bundled dependencies
                this.bundledDependencies = bundledDependencies.map(({ rawRequest }) => rawRequest);
                // Filter out bundled sub-dependencies by checking if every reason the module
                // is bundled is because of another dependency to know which dependencies
                // should be installed in the project
                this.missingDependencies = bundledDependencies
                    .filter(module => !module.reasons.every(reason => /node_modules/.test(reason.module.context)))
                    .map(({ rawRequest }) => rawRequest);
                this._buildOutput = this.readBuildOutput();
                resolve(this.writeBuildOutput(getEmittedScriptNames(stats)));
            });
        });
    }
    // This watcher also watches package.json, because it is required in the entry template,
    // causing the watcher to trigger when yarn adds or removes a package
    watch(callback) {
        if (this._watch) {
            return;
        }
        // Don't ignore node_modules or package.json here,
        // because that is what triggers the watcher when packages are installed, removed or updated
        const watchOptions = {
            aggregateTimeout: 100,
        };
        this._watchCallback = callback;
        this.compiler.hooks.watchRun.tap("update entry", compiler => {
            // Update the build entry when a watch is triggered,
            // just before a compile starts
            this.updateVirtualModules();
        });
        this._watch = this.compiler.watch(watchOptions, this._handleWatch);
    }
    invalidate() {
        if (!this._watch)
            return;
        this._watch.invalidate();
    }
}
exports.Compiler = Compiler;
class ProgressWatcher extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.running = false;
        this.percentage = 0;
    }
    webpackPlugin() {
        return new webpack.ProgressPlugin((percentage, message) => {
            if (percentage === 1) {
                this.running = false;
                this.emit("complete");
            }
            else if (!this.running) {
                this.running = true;
                this.percentage = 0;
                this.emit("start");
            }
            if (percentage !== this.percentage) {
                this.percentage = percentage;
                this.emit("progress", percentage);
            }
        });
    }
}
function writeFile(filePath, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, err => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}
function getEmittedScriptNames(stats) {
    return stats
        .toJson({
        all: false,
        assets: true,
    })
        .assets.filter(asset => asset.emitted)
        .map(asset => asset.name);
}
