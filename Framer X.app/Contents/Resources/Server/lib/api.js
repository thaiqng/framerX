"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
// Light-weight
const request = require("request-promise-native");
const logger_1 = require("./logger");
const logger = logger_1.createLogger("framer:api");
const replacePathParams = (path, pathParams) => {
    if (!pathParams) {
        return path;
    }
    const tokens = path.split("/").map(token => {
        if (!token.startsWith(":")) {
            return token;
        }
        const name = token.split(":")[1];
        return encodeURIComponent(pathParams[name] || "");
    });
    return tokens.join("/");
};
class API {
    constructor(baseAPIURL, token = "") {
        this.baseAPIURL = baseAPIURL;
        this.token = token;
    }
    getUserInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return this.parseNpmrcResponse(yield this.request("user-info"));
            }
            catch (error) {
                if (error.statusCode >= 500) {
                    throw new Error("There was a problem fetching user data. Please try again.");
                }
                if (error.statusCode === 401) {
                    throw new Error("Authentication for fetching user data failed.");
                }
                throw new Error("Could not fetch user data.");
            }
        });
    }
    getPackagesMeta(packages) {
        return this.request("packages-meta", { body: { packageNames: packages } }).catch(() => {
            throw new Error("Unable to fetch packages metadata.");
        });
    }
    startRegistryChallenge(email) {
        return this.request("start-registry-challenge", { body: { email } }).catch(() => {
            throw new Error("Unable to authenticate user.");
        });
    }
    checkRegistryChallenge(code) {
        return this.request("check-registry-challenge", { body: { code } }).catch(error => {
            if (error.statusCode === 404) {
                throw new Error("Login session expired.\nPlease try again.");
            }
            throw new Error("Unable to complete authentication.\nPlease try again.");
        });
    }
    getPackageMeta(packageName, displayName, isPrivate) {
        return this.request("package-meta", { qs: { packageName, displayName, private: isPrivate } }).catch(() => {
            throw new Error("Unable to fetch package data. Please try again.");
        });
    }
    preflight(version, packageName, isPrivate) {
        return this.request("preflight", { body: { packageName, version, private: isPrivate } }).catch(() => {
            throw new Error("Unable to complete publication.\nPlease try again.");
        });
    }
    rejectPendingVersion(packageName, version, error) {
        return this.request("reject-pending-version", {
            pathParams: { packageName, version },
            body: { error },
        }).catch(err => {
            throw new Error("Cannot reject pending version.");
        });
    }
    getPackageVersionStatus(packageName, version) {
        return this.request("package-version-status", {
            pathParams: { packageName, version },
        }).catch(err => {
            throw new Error("Unable to retrieve package status.");
        });
    }
    parseNpmrcResponse(response) {
        if (response.npmrc === undefined) {
            throw new Error("No npmrc value found.");
        }
        const npmrc = Buffer.from(response.npmrc, "base64").toString();
        return Object.assign({}, response, { npmrc: npmrc.replace("_authToken=TOKEN", `_authToken=${this.token}`) });
    }
    request(endpointName, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = API.endpoints[endpointName];
            const { method } = endpoint;
            const { pathParams } = options, args = __rest(options, ["pathParams"]);
            const path = options ? replacePathParams(endpoint.path, pathParams) : endpoint.path;
            const uri = `${this.baseAPIURL}${path}`;
            const requestArgs = Object.assign({ method, uri, headers: { Authorization: `Token ${this.token}` }, json: true }, args);
            logger.debug("Request: ", JSON.stringify(requestArgs, null, 2));
            return request(requestArgs).then(response => {
                logger.debug(`Response from "${endpointName}": `, response);
                return response;
            }, error => {
                logger.error(`Request to "${endpointName}" failed: `, error.message);
                throw error;
            });
        });
    }
}
/**
 * In order to have dynamic endpoint paths, use the :-prefix notation as
 * you would do in Express routes: /foo/:bar/:baz/action.
 */
API.endpoints = {
    "user-info": { path: "/studio/me", method: "GET" },
    "packages-meta": { path: "/studio/packages/meta/get-many", method: "POST" },
    "reject-pending-version": { path: "/studio/packages/:packageName/versions/:version/reject", method: "POST" },
    // CLI Specific
    "start-registry-challenge": { path: "/auth/registry/challenge", method: "POST" },
    "check-registry-challenge": { path: "/auth/registry/check", method: "POST" },
    "package-meta": { path: "/store/cli/packages/meta", method: "GET" },
    preflight: { path: "/store/cli/preflight", method: "POST" },
    "package-version-status": { path: "/store/cli/packages/:packageName/versions/:version/status", method: "GET" },
};
exports.API = API;
