"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const project_1 = require("./project");
const shared_1 = require("./shared");
exports.buildPublishConfig = (argv) => {
    if (Object.prototype.hasOwnProperty.call(argv, "yes") && typeof argv.yes !== "boolean") {
        throw new Error(chalk_1.default `The {bold --yes} argument can only be set as a flag.`);
    }
    if (Object.prototype.hasOwnProperty.call(argv, "new")) {
        if (typeof argv.new !== "string") {
            throw new Error(chalk_1.default `The {bold --new} argument can only be a string.`);
        }
        if (!argv.new.trim()) {
            throw new Error(chalk_1.default `The {bold --new} argument value cannot be blank.`);
        }
    }
    return {
        api: typeof argv.api === "string" ? argv.api : shared_1.defaultAPI,
        token: process.env.FRAMER_TOKEN,
        newName: typeof argv.new === "string" ? argv.new : undefined,
        isNewArgSet: !!(argv.new && typeof argv.new === "string" && argv.new.trim()),
        isPublic: !!argv.public,
        isPrivate: !argv.public,
        disablePrompts: !!argv.yes,
        projectConfig: project_1.buildProjectConfig(argv),
    };
};
