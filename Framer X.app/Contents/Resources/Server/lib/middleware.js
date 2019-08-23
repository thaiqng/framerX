"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const morgan = require("morgan");
const path = require("path");
const prettyBytes = require("pretty-bytes");
const url_1 = require("url");
const utils_1 = require("./utils");
exports.nocache = (req, res, next) => {
    res.setHeader("Surrogate-Control", "no-store");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
};
exports.addslash = (req, res, next) => {
    const extension = path.extname(req.path);
    if (!extension && req.path.substr(-1) !== "/") {
        const query = req.url.slice(req.path.length);
        res.redirect(301, req.path + "/" + query);
    }
    else {
        next();
    }
};
exports.logging = morgan((tokens, req, res) => {
    // Filter out all paths starting with /_ like socket.io
    if (tokens.url(req, res).startsWith("/_")) {
        return null;
    }
    let status = tokens.status(req, res);
    if (status !== "200") {
        status = chalk_1.default.red(status);
    }
    return chalk_1.default.gray([
        // _.last(remoteAddress.split(":")),
        tokens.method(req, res),
        status,
        chalk_1.default.rgb(170, 170, 170)(tokens.url(req, res)),
        prettyBytes(parseInt(tokens.res(req, res, "content-length") || "0")),
        `(${Math.round(parseFloat(tokens["response-time"](req, res)) || 0)}ms)`,
    ].join(" "));
});
function getCORS(corsPortRanges) {
    const corsHostsWhitelist = new Set(["localhost", "127.0.0.1"]);
    function enableCORS(req, res) {
        const requestOrigin = req.headers.origin;
        if (!requestOrigin)
            return;
        const url = new url_1.URL(requestOrigin);
        if (!url.port)
            return;
        if (url.protocol !== "http:")
            return;
        const host = url.hostname;
        const port = parseInt(url.port);
        if (utils_1.isPortInRanges(port, corsPortRanges)) {
            if (!corsHostsWhitelist.has(host))
                return;
            const origin = url.origin;
            res.header("Access-Control-Allow-Origin", origin);
            res.header("Access-Control-Allow-Headers", "X-Requested-With,Authorization,Content-Type");
        }
    }
    const cors = function (req, res, next) {
        enableCORS(req, res);
        next();
    };
    return cors;
}
exports.getCORS = getCORS;
exports.isAuthenticated = (req, res, next) => {
    const { AUTHORIZATION_TOKEN: authorization } = process.env;
    if (authorization && req.headers.authorization !== `token ${authorization}`) {
        res.send(401);
    }
    else {
        next();
    }
};
