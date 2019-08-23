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
const chalk_1 = require("chalk");
const api_1 = require("../../api");
const config_1 = require("../config");
const interface_1 = require("../interface");
const utils_1 = require("../utils");
exports.authenticate = (argv) => __awaiter(this, void 0, void 0, function* () {
    interface_1.spinner.start("Validating");
    const config = config_1.buildAuthenticationConfig(argv);
    interface_1.spinner.text = "Authenticating";
    const api = new api_1.API(config.api);
    const { code } = yield api.startRegistryChallenge(config.email);
    interface_1.print(chalk_1.default `📬 We sent an email to {bold ${config.email}}. Please follow the provided steps.`);
    interface_1.spinner.start("Waiting for confirmation...");
    const { authToken } = yield utils_1.poll(() => api.checkRegistryChallenge(code), (response) => {
        if (response.status === "complete")
            return true;
        return false;
    });
    interface_1.spinner.stopAndPersist({
        text: chalk_1.default `Your {bold FRAMER_TOKEN} for publishing is {bold ${authToken}}`,
        symbol: "🔑",
    });
});
