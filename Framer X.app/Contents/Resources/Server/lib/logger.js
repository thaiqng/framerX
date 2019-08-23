"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createDebugger = require("debug");
const interface_1 = require("./cli/interface");
var Level;
(function (Level) {
    Level[Level["debug"] = 0] = "debug";
    Level[Level["info"] = 1] = "info";
})(Level = exports.Level || (exports.Level = {}));
var Output;
(function (Output) {
    Output[Output["debug"] = 0] = "debug";
    Output[Output["console"] = 1] = "console";
    Output[Output["silent"] = 2] = "silent";
})(Output = exports.Output || (exports.Output = {}));
var LogTypes;
(function (LogTypes) {
    LogTypes["log"] = "log";
    LogTypes["debug"] = "debug";
    LogTypes["info"] = "info";
    LogTypes["warn"] = "warn";
    LogTypes["error"] = "error";
})(LogTypes = exports.LogTypes || (exports.LogTypes = {}));
const globalConfig = {
    output: Output.console,
    level: Level.info,
};
exports.configure = ({ output = Output.console, level = Level.info }) => {
    globalConfig.output = output;
    globalConfig.level = level;
};
const noop = () => null;
exports.debugPrinter = print => (globalConfig.level === Level.debug ? print : noop);
// This is leaking CLI specific information into the
// logger which is not ideal, but this wrapper makes it
// significantly easier to see what is happening when
// debugging the application, and both spinner and logging
// can loosely be considered part of the interface
const wrapWithSpinnerLogic = print => (...args) => {
    if (interface_1.spinner.isSpinning) {
        interface_1.spinner.stop();
        print(...args);
        interface_1.spinner.start();
    }
    else {
        print(...args);
    }
};
exports.createLogger = (prefix) => {
    /* tslint:disable:no-console */
    const { output } = globalConfig;
    if (output === Output.silent) {
        return {
            [LogTypes.log]: noop,
            [LogTypes.info]: noop,
            [LogTypes.warn]: noop,
            [LogTypes.error]: noop,
            [LogTypes.debug]: noop,
        };
    }
    // If the logger is being used for debug, the logs will
    // be hidden by default - this might need to update in
    // the future so that information can be accessed
    // to provide a better experience for the user
    if (output === Output.debug) {
        const debug = createDebugger(prefix);
        debug.log = console.log.bind(console);
        const errorDebug = createDebugger(prefix);
        const logger = wrapWithSpinnerLogic(debug);
        const errorLogger = wrapWithSpinnerLogic(errorDebug);
        return {
            [LogTypes.log]: logger,
            [LogTypes.info]: logger,
            [LogTypes.warn]: errorLogger,
            [LogTypes.error]: errorLogger,
            [LogTypes.debug]: exports.debugPrinter(logger),
        };
    }
    return {
        [LogTypes.log]: wrapWithSpinnerLogic(console.log.bind(console)),
        [LogTypes.info]: wrapWithSpinnerLogic(console.info.bind(console)),
        [LogTypes.warn]: wrapWithSpinnerLogic(console.warn.bind(console)),
        [LogTypes.error]: wrapWithSpinnerLogic(console.error.bind(console)),
        [LogTypes.debug]: exports.debugPrinter(wrapWithSpinnerLogic(console.info.bind(console))),
    };
    /* tslint:enable:no-console */
};
