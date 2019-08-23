#!/usr/bin/env node
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
const logger_1 = require("../logger");
logger_1.configure({ output: logger_1.Output.debug, level: logger_1.Level.debug });
const update_1 = require("./update");
const interface_1 = require("./interface");
const commands = require("./commands");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        interface_1.setProcessTitle("Framer Project");
        // Check that the latest version of the CLI is being ran
        yield update_1.checkIfOutOfDate();
        // Command is treated specially when parsing argv
        const { command, argv, help } = interface_1.parseArgv();
        // Terminate early if command does not exist
        if (!command || !(command in commands)) {
            interface_1.printUsage();
            // Terminate with an error code
            process.exit(1);
            // Return for testing
            return;
        }
        // Print usage for a specific command
        if (commands[command] && help) {
            interface_1.printUsage(command);
            process.exit();
            // Return for testing
            return;
        }
        // Errors will be handled by the `run` Promise catch
        return commands[command](argv);
    });
}
exports.main = main;
if (require.main === module) {
    main().then(() => {
        process.exit();
    }, error => {
        if (error) {
            interface_1.printError(error.message || error);
        }
        process.exit(1);
    });
}
