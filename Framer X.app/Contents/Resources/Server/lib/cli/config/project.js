"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const validation_1 = require("../validation");
const logger_1 = require("../../logger");
const shared_1 = require("./shared");
const logger = logger_1.createLogger("framer-cli:config:project");
exports.buildProjectConfig = (argv) => {
    // If a project path is specified, change process dir to that path
    // This is a workaround for a publish bug that causes builds
    // to fail when the script is run outside the project
    const argvProjectPath = argv._[1];
    if (argvProjectPath) {
        if (typeof argvProjectPath !== "string") {
            throw new Error("Invalid project path provided.");
        }
        logger.info("Change working directory.");
        const projectPath = path.resolve(argvProjectPath);
        validation_1.projectPathExists(projectPath);
        process.chdir(projectPath);
    }
    const config = {
        api: typeof argv.api === "string" ? argv.api : shared_1.defaultAPI,
        // Command is always run from inside project
        projectPath: process.cwd(),
        cachePath: "/tmp/framer",
        yarnLinkDir: "/tmp/framer-yarn-link-folder",
        token: process.env.FRAMER_TOKEN,
    };
    return config;
};
