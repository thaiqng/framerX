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
const fs_1 = require("fs");
const path = require("path");
const REGEX_ALLOWED_DESIGN_ASSET_NAME = /^\w+\.\w+$/;
class ProjectPackageService {
    // The filePath is explicitly not a `string` to avoid possible path injections.
    readFile(filePath) {
        const project = this.assertProjectIsPresent("readFile");
        const result = fs_1.readFileSync(path.join(project.path, filePath), { encoding: "utf8" });
        return result;
    }
    // FIXME: ideally we would construct the ProjectPackageService with a `project` already to avoid these assertions
    assertProjectIsPresent(methodName) {
        if (!this.project) {
            throw new Error(`Cannot invoke method ${methodName} if project hasn't been set`);
        }
        return this.project;
    }
    setProject(project) {
        this.project = project;
    }
    uploadDesignAsset({ fileName, encodedContent }) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = this.assertProjectIsPresent("uploadDesignAsset");
            if (!REGEX_ALLOWED_DESIGN_ASSET_NAME.test(fileName)) {
                throw new Error(`File ${fileName} not allowed`);
            }
            fs_1.writeFileSync(path.join(project.path, "metadata", fileName), encodedContent, { encoding: "base64" });
        });
    }
    uploadReadme({ readme }) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = this.assertProjectIsPresent("uploadReadme");
            fs_1.writeFileSync(path.join(project.path, "README.md"), readme, { encoding: "utf8" });
        });
    }
    fetchReadme() {
        return __awaiter(this, void 0, void 0, function* () {
            return { readme: this.readFile("README.md") };
        });
    }
    fetchPackageJson() {
        return __awaiter(this, void 0, void 0, function* () {
            return { package: JSON.parse(this.readFile("package.json")) };
        });
    }
    addPackageDependency(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = this.assertProjectIsPresent("addPackageDependency");
            return project.add(args.packageName, false);
        });
    }
    publishPackage({ version, packageName, displayName, slug, isPrivate, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = this.assertProjectIsPresent("publishPackage");
            const context = {
                slug,
                isPrivate,
                packageName,
                displayName,
                version,
            };
            return project.publish(version, packageName, displayName, context, isPrivate ? "restricted" : "public");
        });
    }
}
exports.ProjectPackageService = ProjectPackageService;
