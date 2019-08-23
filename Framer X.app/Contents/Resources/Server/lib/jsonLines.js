"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var JSONLines;
(function (JSONLines) {
    function parse(stringValue) {
        return stringValue
            .trim()
            .split("\n")
            .filter(line => line !== "" && line.startsWith("{")) // Correct for weird javascript behaviour and remove non-json
            .map(line => JSON.parse(line));
    }
    JSONLines.parse = parse;
})(JSONLines = exports.JSONLines || (exports.JSONLines = {}));
