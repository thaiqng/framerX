"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Conf = require("conf");
const logger_1 = require("../../logger");
const logger = logger_1.createLogger("framer-cli:config:local");
let cachedLocalConfig;
exports.loadLocalConfig = () => {
    const defaults = {
        // Init with the current time so the first version check is only
        // after the set interval, so not to bother users right away
        lastUpdateCheck: Date.now(),
    };
    // Cache the config
    if (!cachedLocalConfig) {
        logger.info("Loading local configuration.");
        cachedLocalConfig = new Conf({
            configName: "framer-cli",
            schema: {
                lastUpdateCheck: {
                    type: "number",
                },
            },
            defaults,
        });
    }
    return cachedLocalConfig;
};
