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
const project_1 = require("../../project");
const interface_1 = require("../interface");
const config_1 = require("../config");
exports.build = (argv) => __awaiter(this, void 0, void 0, function* () {
    interface_1.spinner.start("Validating");
    // Build the configuration needed by the project
    const config = config_1.buildProjectConfig(argv);
    const project = yield project_1.Project.load(config);
    interface_1.spinner.text = "Installing dependencies";
    yield project.install();
    interface_1.spinner.text = "Building project";
    const compiler = yield project.buildDist();
    if (compiler.missingDependencies.length > 0) {
        interface_1.printMissingDependenciesWarning(compiler.missingDependencies, project.path);
    }
    interface_1.spinner.stopAndPersist({
        text: "Package successfully built.",
        symbol: "📦",
    });
});
