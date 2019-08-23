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
// Configure the logger at the beginning of the process
// to prevent having to leak the environment the logger
// is running in into every file
const logger_1 = require("./logger");
logger_1.configure({
    output: logger_1.Output.console,
    level: process.env.FRAMER_ENV === "development" ? logger_1.Level.debug : logger_1.Level.info,
});
const minimist = require("minimist");
const chalk_1 = require("chalk");
const project_1 = require("./project");
const server_1 = require("./server");
const utils_1 = require("./utils");
process.title = "Framer Project";
const logger = logger_1.createLogger("framer:app");
/*
CLI
-------------------------------------------------------------------------------
Run an HTTP server with auto reload. Use --staticPath to serve the
specified path under /static/.

Use --no-live-sharing to disable Live Sharing when serving.
-------------------------------------------------------------------------------
Options:
--api=<url>                 API endpoint to use
--author=<name>             Set author if there is none [HACK!]
--cachePath=<path>          Use a custom cache path
--registry=<domain>         Registry to use (for publishing and @framer/*)
--yarnLinkFolder=<path>     The path to the Yarn link directory that
                            should be used to link packages
*/
function serve(project, argv) {
    return __awaiter(this, void 0, void 0, function* () {
        const chosenPort = yield project.serve(utils_1.portRange(argv.port || argv.p));
        process.title += ` ${chosenPort}`;
        yield project.install();
        project.watch();
        return true; // don’t exit
    });
}
const main = () => __awaiter(this, void 0, void 0, function* () {
    const argv = minimist(process.argv.slice(2));
    utils_1.setupCocoaProcessHandler();
    let { registryRefreshInterval } = argv;
    if (typeof registryRefreshInterval !== "number") {
        registryRefreshInterval = undefined;
    }
    const config = {
        projectPath: argv._[0],
        staticPath: argv.staticPath,
        cachePath: argv.cachePath || "/tmp/framer",
        yarnLinkDir: argv.yarnLinkFolder || "/tmp/framer-yarn-link-folder",
        token: argv.token,
        api: argv.api,
        author: argv.author,
        registry: argv.registry,
        registryRefreshInterval,
        proxyURL: argv.proxyURL,
        proxyDocumentURL: argv.proxyDocumentURL,
        proxyImageBaseURL: argv.proxyImageBaseURL,
        disableLiveSharing: argv["live-sharing"] !== undefined && !argv["live-sharing"],
        corsPorts: argv["cors-ports"] ? utils_1.parsePortRanges(argv["cors-ports"]) : undefined,
    };
    if (!config.projectPath) {
        // Directory not available yet – the project will be created later.
        const server = new server_1.Server(config);
        const chosenPort = yield server.start(utils_1.portRange(argv.port || argv.p));
        process.title += ` ${chosenPort}`;
        return; // don’t exit
    }
    const project = yield project_1.Project.load(config);
    yield serve(project, argv);
});
main().catch(e => error(e.message));
// Because Sentry is slow, install it after the server started (we’re not using the Middleware)
require("@sentry/node").init({ dsn: "https://05cdf9fe436f4b058c893701e0a577c8@sentry.io/1253080" });
function error(message) {
    logger.error(chalk_1.default `\n{redBright ERROR: ${message}}`);
    // Terminate with failure code
    return process.exit(1);
}
