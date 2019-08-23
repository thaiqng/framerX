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
const child_process_1 = require("child_process");
const path = require("path");
const uuid = require("uuid/v4");
const pkgDir = require("pkg-dir");
const ini = require("ini");
const jsonLines_1 = require("./jsonLines");
const logger_1 = require("./logger");
const logger = logger_1.createLogger("framer:project");
const nodePath = process.execPath;
// This is needed to work as part of both a package and the server
// 1. Traverse file system until we find the package's root (first package.json)
// 2. Find yarn executable in that package's node_modules/.bin folder
// 3. Follow the symlink to the real yarn/lib/cli.js file
const yarnPath = fs.realpathSync(path.join(pkgDir.sync(__dirname), "node_modules/.bin/yarn"));
const dependencyErrorRegex = /doesn't satisfy found match of/;
function parseYarnErrors(error) {
    try {
        const yarnErrors = jsonLines_1.JSONLines.parse(error);
        let errors = yarnErrors
            // Keep only error type
            .filter(item => item.type === "error")
            // Filter out errors summary 'Found N errors.'
            .filter(item => !item.data.includes("Found "))
            // Add a unique id to each error
            .map(item => {
            // Downgrade dependency errors to warnings
            if (item.data.match(dependencyErrorRegex)) {
                item.type = "warning";
            }
            return Object.assign({}, item, { id: uuid() });
        });
        if (!yarnErrors.length && typeof error === "string" && error.length) {
            // Filter out a Yarn bug we often run into
            if (!error.includes("/node_modules/yarn/lib/cli.js")) {
                errors = [{ data: error, type: "error", id: uuid() }];
            }
        }
        return errors;
    }
    catch (err) {
        return [{ id: uuid(), type: "error", data: `Error processing "${error}": ${err}` }];
    }
}
function log(result) {
    if (result.output) {
        logger.log(result.output);
    }
    if (result.error) {
        logger.error(result.error);
    }
    return result;
}
class Yarn {
    constructor(initialization = Promise.resolve()) {
        this.initialization = initialization;
        this.run = (args, callback) => __awaiter(this, void 0, void 0, function* () {
            yield this.initialization;
            return new Promise((resolve, reject) => {
                args.unshift(yarnPath);
                const output = [];
                const errorBuffers = [];
                const childProcess = child_process_1.spawn(nodePath, args, { cwd: process.cwd() });
                const outputHandler = jsonLines((line) => {
                    if (typeof line === "string") {
                        // Line that could not be parsed as JSON.
                        output.push(line + "\n");
                        return;
                    }
                    switch (line.type) {
                        case "progressFinish":
                        case "progressStart":
                        case "progressTick":
                            // TODO: Add support for reporting progress. Ignore for now.
                            break;
                        case "info":
                        case "step":
                            // TODO: Decide if we want to be more verbose about these messages.
                            break;
                        case "tree":
                        // TODO: Stop passing through success as JSON (we rely on this behavior for now):
                        // case "success":
                        default:
                            // TODO: Handle most messages and stop outputting unhandled ones.
                            output.push(JSON.stringify(line) + "\n");
                            break;
                    }
                });
                childProcess.stdout.on("data", outputHandler);
                childProcess.stderr.on("data", (chunk) => {
                    errorBuffers.push(chunk);
                });
                const result = () => {
                    return { output: output.join(""), error: Buffer.concat(errorBuffers).toString() };
                };
                childProcess.on("error", () => reject(log(result())));
                childProcess.on("close", () => setTimeout(() => resolve(log(result())), 100));
            }).then(result => {
                if (callback) {
                    callback();
                }
                return result;
            });
        });
        this.install = args => {
            return this.run(["install", ...args]);
        };
        this.link = args => {
            return this.run(["link", ...args]);
        };
        this.unlink = args => {
            return this.run(["unlink", ...args]);
        };
        this.add = args => {
            return this.run(["add", ...args]);
        };
        this.remove = args => {
            return this.run(["remove", ...args]);
        };
        this.publish = args => {
            return this.run(["publish", ...args]);
        };
        this.outdated = args => {
            return this.run(["outdated", ...args]);
        };
        this.upgrade = args => {
            return this.run(["upgrade", ...args]);
        };
        this.check = args => {
            return this.run(["check", ...args]);
        };
        this.info = args => {
            return this.run(["info", ...args]);
        };
    }
}
exports.Yarn = Yarn;
/**
 * Takes Buffer chunks and parses each complete line as a JSON object and passes it on to the
 * provided handler. Lines that could not be parsed as JSON will be passed through as strings.
 */
function jsonLines(handler) {
    let buffer = "";
    return (chunk) => {
        const lines = (buffer + chunk.toString()).split("\n");
        if (lines.length === 1) {
            // No newline in chunk, so it's probably incomplete.
            buffer = lines[0];
            return;
        }
        buffer = lines.pop() || ""; // Non-empty if chunk did not end with newline.
        for (const line of lines) {
            if (!line)
                continue;
            try {
                const message = JSON.parse(line);
                handler(message);
            }
            catch (e) {
                handler(line);
            }
        }
    };
}
// Handling writing npmrc for use by Yarn for Framer registry access
function writeNpmrc(projectPath, userInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const npmrcPath = path.join(projectPath, ".npmrc");
        const hasNpmrc = yield fs.pathExists(npmrcPath);
        if (!userInfo) {
            if (!hasNpmrc) {
                logger.error("Cannot fetch or find .npmrc file in project.");
            }
            return;
        }
        // Default to writing the npmrc content that is returned from the API
        let { npmrc } = userInfo;
        // If there is an existing npmrc file, we need to merge the contents to
        // protect the user's potential settings for their own registries
        if (hasNpmrc) {
            // Parse the existing npmrc via ini and turn back into a string
            // Merge the template npmrc with the existing npmrc content
            // Any of the new values that have matching keys will be preferred over
            // existing values that have the same key
            // This will resolve keys changing and help future-proof against
            // new key/values that might come from the API's npmrc template in the
            // future
            const existingNpmrc = yield fs.readFile(npmrcPath, "utf8");
            const content = [existingNpmrc, npmrc].join("\n");
            npmrc = ini.stringify(ini.parse(content));
        }
        return fs.outputFile(npmrcPath, npmrc, "utf8");
    });
}
exports.writeNpmrc = writeNpmrc;
// We need to write this to the yarnrc because it is not picked up when put in the npmrc
// The link-folder command line argument is also passed by the server, this is only so that external yarn commands also pick the right link folder
// Otherwise running `yarn add` in the project folder would remove the linked framer library
function writeYarnrc(projectPath, yarnLinkDir) {
    const yarnrcPath = path.join(projectPath, ".yarnrc");
    const yarnrcContents = `--link-folder "${yarnLinkDir}"`;
    fs.outputFileSync(yarnrcPath, yarnrcContents, "utf8");
}
exports.writeYarnrc = writeYarnrc;
