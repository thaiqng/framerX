"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function portRange(base = 4567, count = 100) {
    return [base, base + count];
}
exports.portRange = portRange;
function setupCocoaProcessHandler() {
    // The macOS application uses a stdio connection as a method of controlling the child cli process
    // when the application closes the stdin connection it expects the child process to exit. This is
    // to work around the unreliable behaviour of NSTask when attempting to force termination.
    // Begin reading from stdin so the process does not exit.
    process.stdin.resume();
    process.stdin.on("end", () => {
        process.exit();
    });
}
exports.setupCocoaProcessHandler = setupCocoaProcessHandler;
function startRaven() {
    require("raven")
        .config("https://05cdf9fe436f4b058c893701e0a577c8@sentry.io/1253080")
        .install();
}
exports.startRaven = startRaven;
function parsePortRanges(s) {
    const ranges = [];
    const parts = s.split(",");
    for (const part of parts) {
        const tokens = part.split("-");
        const fromPort = parseInt(tokens[0]);
        const toPort = parseInt(tokens[1]) || fromPort;
        ranges.push([fromPort, toPort]);
    }
    return ranges;
}
exports.parsePortRanges = parsePortRanges;
function isPortInRanges(value, ranges) {
    return ranges.some(range => value >= range[0] && value <= range[1]);
}
exports.isPortInRanges = isPortInRanges;
