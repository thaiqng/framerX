"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var State;
(function (State) {
    State[State["Passthrough"] = 0] = "Passthrough";
    State[State["MatchedKey"] = 1] = "MatchedKey";
    State[State["MatchedFunctionStart"] = 2] = "MatchedFunctionStart";
})(State || (State = {}));
// Reset to Passthrough when not in passthrough but encountering this line
const resetLine = "/***/ }),";
// tslint:disable-next-line:no-default-export
function default_1(source, map, meta) {
    const sourcePerLine = source.split("\n");
    let output = "";
    let state = State.Passthrough;
    sourcePerLine.forEach(line => {
        switch (state) {
            case State.Passthrough:
                if (line.match(/^\/\*\*\*\/ ".*node_modules\/styled-components\/dist.*":/)) {
                    state = State.MatchedKey;
                }
                break;
            case State.MatchedKey:
                if (line.match(/^\/\*\*\*\/ \(function\(module,/)) {
                    line = "/***/ (function(module) {";
                    state = State.MatchedFunctionStart;
                }
                else if (line === resetLine) {
                    state = State.Passthrough;
                }
                break;
            case State.MatchedFunctionStart:
                if (line.match(/^eval\("/)) {
                    line = 'module.exports = require("styled-components")';
                    state = State.Passthrough;
                }
                else if (line === resetLine) {
                    state = State.Passthrough;
                }
                break;
        }
        output += `${line}\n`;
    });
    return output;
}
exports.default = default_1;
// TODO: Make it use a buffer?
/* Raw means we’ll get a buffer */
// export const raw = true
