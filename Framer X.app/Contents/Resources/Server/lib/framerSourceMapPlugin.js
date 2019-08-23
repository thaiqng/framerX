"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_sources_1 = require("webpack-sources");
const cache = new WeakMap();
const sourceMapString = "//# sourceMappingURL=data:application/json;base64,";
const tsErrorRegex = /ERROR in (.*)\((\d+),\d+\)[^:]*: (.*)/;
// rewrite "[tsl] ERROR in ./code/Test.tsx(7,1)\n      TS1128: Declaration or statement expected."
function rewordCompileError(message, file) {
    const match = tsErrorRegex.exec(message);
    if (match) {
        let path = match[1];
        if (path.endsWith(file)) {
            if (file.startsWith("./code/")) {
                path = file.slice("./code/".length);
            }
            else {
                path = file;
            }
        }
        const line = match[2];
        const msg = match[3];
        return `Compile Error in ${file} line ${line}: ${msg}`;
    }
    return message;
}
exports.rewordCompileError = rewordCompileError;
// remove all prefixed slashes and dots
function trimDirWalking(path) {
    const match = /[^./]/.exec(path);
    if (!match)
        return path;
    return path.slice(match.index);
}
exports.trimDirWalking = trimDirWalking;
class FramerSourceMapTemplatePlugin {
    apply(moduleTemplate) {
        moduleTemplate.hooks.module.tap("FramerSourceMapTemplatePlugin", (source, mod) => {
            // don't do anything except for typescript files in code/
            const file = mod.id;
            if (!/code\/.*\.[tj]sx?/.test(file))
                return source;
            // use cache
            const cacheEntry = cache.get(source);
            if (cacheEntry !== undefined)
                return cacheEntry;
            if (mod.errors && mod.errors.length > 0) {
                const path = file.startsWith("./code/") ? file.slice("./code/".length) : trimDirWalking(file);
                const firstError = mod.errors[0];
                const message = rewordCompileError(firstError.message, path);
                const errorResult = new webpack_sources_1.RawSource("throw new Error(" + JSON.stringify(message) + ")");
                cache.set(source, errorResult);
                return errorResult;
            }
            // pick up tsc generated content and sourcemap
            const original = source.source();
            const at = original.lastIndexOf(sourceMapString);
            // make sure the sourceMapStart is not part of an error or something
            const sourceMapStart = original.lastIndexOf(")") < at ? at : -1;
            const content = sourceMapStart >= 0 ? original.slice(0, sourceMapStart) : original;
            let result;
            if (file.endsWith("code/canvas.tsx")) {
                // not for canvas.tsx
                result = new webpack_sources_1.RawSource(content);
            }
            else {
                // inject a frameSourceMap in front of the actual generated sources
                let sourcemap = "";
                if (sourceMapStart >= 0) {
                    sourcemap = "\n//# framerSourceMap=" + original.slice(sourceMapStart + sourceMapString.length);
                }
                result = new webpack_sources_1.RawSource(sourcemap + "\n" + content);
            }
            cache.set(source, result);
            return result;
        });
        moduleTemplate.hooks.hash.tap("FramerSourceMapTemplatePlugin", hash => {
            hash.update("FramerSourceMapTemplatePlugin");
            hash.update("2");
        });
    }
}
class FramerSourceMapPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap("FrameSourceMapPlugin", compilation => {
            new FramerSourceMapTemplatePlugin().apply(compilation.moduleTemplates.javascript);
        });
    }
}
exports.FramerSourceMapPlugin = FramerSourceMapPlugin;
