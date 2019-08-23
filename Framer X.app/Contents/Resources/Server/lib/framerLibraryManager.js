"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const semver = require("semver");
const semver_1 = require("semver");
/**
 * This function comes close to semver.satisfies with {includePrerelease: true}
 * But it has a little bit different behaviour concerning prereleases
 * See the tests for details
 */
function isCompatible(libraryVersion, withRange) {
    let version;
    if (typeof libraryVersion === "string") {
        if (semver.valid(libraryVersion)) {
            version = new semver.SemVer(libraryVersion);
        }
        else if (semver.validRange(libraryVersion)) {
            return semver.intersects(libraryVersion, withRange);
        }
        else {
            const coercedVersion = semver.coerce(libraryVersion);
            if (!coercedVersion) {
                return false;
            }
            else {
                version = coercedVersion;
            }
        }
    }
    else {
        // Create a new SemVer, because we're going to modify it
        version = new semver_1.SemVer(libraryVersion.raw);
    }
    // Handle prerelease versions like normal versions
    version.prerelease = [];
    return semver.satisfies(version, withRange);
}
exports.isCompatible = isCompatible;
/**
 * This updates the install strategy of a project, based on the built-in Library version and the currently installed Library version
 * Basically it decides to link the library if it is satisfied by the built-in version and installs it as a dev dependency otherwise
 * See the tests for more specific cases
 */
function updateInstallStrategy(currentInstallStrategy, builtInLibraryVersion, installedLibraryVersion) {
    const expected = currentInstallStrategy && semver.validRange(currentInstallStrategy.version)
        ? new semver.Range(currentInstallStrategy.version)
        : undefined;
    let builtIn = null;
    if (builtInLibraryVersion) {
        if (semver.valid(builtInLibraryVersion)) {
            builtIn = new semver_1.SemVer(builtInLibraryVersion);
        }
        else {
            builtIn = semver.coerce(builtInLibraryVersion);
        }
    }
    let installed = null;
    if (installedLibraryVersion) {
        if (semver.valid(installedLibraryVersion)) {
            installed = new semver_1.SemVer(installedLibraryVersion);
        }
        else {
            installed = semver.coerce(installedLibraryVersion);
        }
    }
    else if (currentInstallStrategy &&
        currentInstallStrategy.type === "dev" &&
        semver.valid(currentInstallStrategy.version)) {
        installed = new semver_1.SemVer(currentInstallStrategy.version);
    }
    if (!expected) {
        if (!builtIn) {
            if (installed) {
                return { type: "dev", version: installed.format() };
            }
            else {
                return undefined;
            }
        }
        if (!installed || semver.eq(installed, builtIn)) {
            return { type: "linked", version: builtIn.format() };
        }
        else {
            return { type: "dev", version: installed.format() };
        }
    }
    if (builtIn && isCompatible(builtIn, expected)) {
        if (currentInstallStrategy && currentInstallStrategy.type !== "linked") {
            if (installed && semver.gt(installed, builtIn)) {
                return { type: "dev", version: installed.raw };
            }
        }
        return { type: "linked", version: expected.raw };
    }
    return { type: "dev", version: expected.raw };
}
exports.updateInstallStrategy = updateInstallStrategy;
function installStrategy(packageJSON) {
    const dev = packageJSON.devDependencies && packageJSON.devDependencies.framer;
    if (dev) {
        return { type: "dev", version: dev };
    }
    const dep = packageJSON.dependencies && packageJSON.dependencies.framer;
    if (dep) {
        return { type: "dep", version: dep };
    }
    const peer = packageJSON.peerDependencies && packageJSON.peerDependencies.framer;
    if (peer) {
        return { type: "linked", version: peer };
    }
    return undefined;
}
exports.installStrategy = installStrategy;
function installStrategyForVersion(version, builtInFramerVersion) {
    let type;
    if (version === builtInFramerVersion) {
        type = "linked";
        version = version;
    }
    else {
        type = "dev";
    }
    return { type, version };
}
exports.installStrategyForVersion = installStrategyForVersion;
function majorVersion(version) {
    let result = `${version.major}`;
    if (version.major === 0) {
        result += `.${version.minor}`;
        if (version.minor === 0) {
            result += `.${version.patch}`;
        }
    }
    return result;
}
function newPeerDependency(framerPeerDependency, toVersion) {
    let version;
    if (!semver.valid(toVersion)) {
        version = semver.coerce(toVersion);
    }
    else {
        version = new semver.SemVer(toVersion);
    }
    if (!version) {
        // If there isn't yet a current peer dependency, yarn will handle an empty version correctly
        return framerPeerDependency || "";
    }
    if (!framerPeerDependency) {
        return `^${majorVersion(version)}`;
    }
    if (isCompatible(version, framerPeerDependency)) {
        return framerPeerDependency;
    }
    // Get the major version
    return `${framerPeerDependency} || ^${majorVersion(version)}`;
}
exports.newPeerDependency = newPeerDependency;
function actions(from, to, installedFramerVersion) {
    const result = [];
    if (from && from.type === to.type) {
        if (installedFramerVersion && !semver.valid(installedFramerVersion)) {
            installedFramerVersion = semver.coerce(installedFramerVersion);
        }
        if (from.version === to.version &&
            installedFramerVersion &&
            semver.satisfies(installedFramerVersion, to.version)) {
            return [];
        }
        else if (to.type === "linked") {
            if (from.version === to.version) {
                if (!installedFramerVersion) {
                    result.push("link");
                }
            }
            else {
                // You can’t upgrade peer dependencies (c.f. https://github.com/yarnpkg/yarn/issues/4314)
                result.push("remove", { name: "addPeer", version: to.version });
                if (!installedFramerVersion) {
                    result.push("link");
                }
            }
        }
        else {
            result.push("remove", { name: "addPeer", version: to.version });
            const name = to.type === "dev" ? "addDev" : "add";
            result.push({ name, version: to.version });
        }
    }
    else {
        if (from && (from.type === "dev" || from.type === "dep")) {
            result.push("remove");
        }
        if (from && from.type === "linked" && (to.type === "dev" || to.type === "dep")) {
            result.push("unlink");
        }
        if (to.type === "dev") {
            result.push({ name: "addPeer", version: to.version });
            result.push({ name: "addDev", version: to.version });
        }
        if (to.type === "linked") {
            result.push({ name: "addPeer", version: to.version }, "link");
        }
    }
    return result;
}
exports.actions = actions;
function isNewMajorVersion(version, previousVersion) {
    if (!previousVersion) {
        return true;
    }
    if (previousVersion.major !== version.major) {
        return true;
    }
    if (version.major === 0 && previousVersion.minor !== version.minor) {
        return true;
    }
    return false;
}
function latestOfMajorVersions(versions, alwaysIncludedVersions = [], excludedRange, includedRange) {
    alwaysIncludedVersions = alwaysIncludedVersions.filter(version => semver.valid(version));
    let input = [];
    for (const version of versions) {
        if (semver.valid(version) && !alwaysIncludedVersions.includes(version)) {
            input.push(new semver.SemVer(version));
        }
    }
    input = semver.sort(input); // It only contains SemVer's to begin with, so this cast is safe
    const latestVersions = [];
    for (const version of input) {
        const previousVersion = latestVersions[latestVersions.length - 1];
        const previousVersionIsIncluded = !includedRange || semver.satisfies(previousVersion, includedRange);
        const versionIsIncluded = includedRange && semver.satisfies(version, includedRange);
        const versionIsExcluded = excludedRange && semver.satisfies(version, excludedRange);
        const shouldIncludeVersion = !versionIsExcluded || versionIsIncluded;
        if (isNewMajorVersion(version, previousVersion) && shouldIncludeVersion) {
            latestVersions.push(version);
            continue;
        }
        if (semver.prerelease(version)) {
            if (!semver.prerelease(previousVersion) || previousVersion.prerelease[0] !== version.prerelease[0]) {
                // Only add prerelease releases if the previous one wasn’t the same type of prerelease
                if (shouldIncludeVersion) {
                    latestVersions.push(version);
                }
                continue;
            }
        }
        else {
            while (semver.prerelease(previousVersion) &&
                !isNewMajorVersion(version, latestVersions[latestVersions.length - 2])) {
                // Remove prerelease versions if there is a newer release version (for the same major version)
                latestVersions.pop();
            }
        }
        if (!includedRange ||
            // Do not remove it if the previous was in the included range and the current is not
            !(previousVersionIsIncluded && !versionIsIncluded)) {
            latestVersions.pop();
        }
        // Replace the previous version with a newer one (for the same major version)
        if (shouldIncludeVersion) {
            latestVersions.push(version);
        }
    }
    const outputVersions = latestVersions;
    outputVersions.push(...alwaysIncludedVersions);
    return semver
        .sort(outputVersions)
        .map((version) => (typeof version !== "string" ? version.format() : version));
}
exports.latestOfMajorVersions = latestOfMajorVersions;
function libraryCompatibility(packageJSON, builtInFramerVersion, installedLibraryVersion) {
    const framerPeer = packageJSON.peerDependencies && packageJSON.peerDependencies.framer;
    if (!framerPeer) {
        return {
            compatible: false,
            isError: true,
            message: "Project does not define compatible Framer Library versions.",
            recoverySuggestion: "Try selecting a Framer Library version from the File > Framer Library Version menu.",
        };
    }
    if (!builtInFramerVersion) {
        return {
            compatible: false,
            isError: true,
            message: "No built-in Framer Library found in this Framer X version.",
            recoverySuggestion: "Try reinstalling Framer X.",
        };
    }
    if (!installedLibraryVersion) {
        return {
            compatible: false,
            isError: true,
            message: "Project does not have a Framer Library installed.",
            recoverySuggestion: "Try to re-open the project.",
        };
    }
    if (!isCompatible(builtInFramerVersion, framerPeer)) {
        return {
            compatible: false,
            isError: false,
            message: `Project might be incompatible with this Framer X version (${builtInFramerVersion} is not listed as compatible version in "${framerPeer}")`,
            recoverySuggestion: "Try selecting the Built-In Framer Library version from the File menu.",
        };
    }
    if (semver.gt(builtInFramerVersion, installedLibraryVersion)) {
        return {
            compatible: false,
            isError: false,
            message: `Framer Library version of project (${installedLibraryVersion}) is older than used in this Framer X version (${builtInFramerVersion}).`,
            recoverySuggestion: "Try selecting the Built-In Framer Library version from the File menu.",
        };
    } // else
    return {
        compatible: true,
        isError: false,
        message: "Project is fully supported by this Framer X version.",
        recoverySuggestion: "",
    };
}
exports.libraryCompatibility = libraryCompatibility;
