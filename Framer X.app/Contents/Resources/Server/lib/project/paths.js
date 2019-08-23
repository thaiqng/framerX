"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
exports.defaults = {
    codePath: "code",
    metadataPath: "metadata",
};
class ProjectPaths {
    constructor(config) {
        const { cachePath, codePath, metadataPath, projectPath, staticPath, yarnLinkDir } = Object.assign({}, exports.defaults, config);
        this.project = path.resolve(projectPath);
        this.static = staticPath ? path.resolve(staticPath) : undefined;
        this.cache = path.resolve(cachePath);
        this.yarnLinkDir = yarnLinkDir ? path.resolve(yarnLinkDir) : undefined;
        this.yarnMutex = path.join(this.cache, "yarn", "mutex");
        this.distOutputDir = path.join(this.project, "dist");
        this.buildOutputDir = path.join(this.project, "build");
        this.nodeModules = path.join(this.project, "node_modules");
        /** WARNING: Use `resolveCode` instead of `path.join` when dealing with user input */
        this.code = path.join(this.project, codePath);
        this.canvasModule = path.join(this.code, "canvas.tsx");
        this.metadata = path.join(this.project, metadataPath);
        this.packageJson = path.join(this.project, "package.json");
        this.yarnLock = path.join(this.project, "yarn.lock");
        this.yarnCache = path.join(this.cache, "yarn", "cache");
        this.npmrc = path.join(this.project, ".npmrc");
        return Object.freeze(this);
    }
}
exports.ProjectPaths = ProjectPaths;
