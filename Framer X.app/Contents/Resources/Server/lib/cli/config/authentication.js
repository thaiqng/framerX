"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("./shared");
exports.buildAuthenticationConfig = (argv) => {
    const email = argv._[1];
    if (typeof email !== "string" || !email) {
        throw new Error("An email address must be provided.");
    }
    return {
        api: typeof argv.api === "string" ? argv.api : shared_1.defaultAPI,
        email,
    };
};
