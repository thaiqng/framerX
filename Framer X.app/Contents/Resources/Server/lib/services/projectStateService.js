"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const framer_services_1 = require("../@framerjs/framer-services");
class ProjectStateService {
    constructor() {
        this.assetChangeEmitter = new framer_services_1.ServiceEventEmitter();
        this.stateEmitter = new framer_services_1.ServiceEventEmitter();
    }
    assetChanged(change) {
        this.assetChangeEmitter.emit(change);
    }
    stateChanged(state) {
        this.stateEmitter.emit(state);
    }
    assetChangeStream() {
        return this.assetChangeEmitter;
    }
    stateStream() {
        return this.stateEmitter;
    }
}
exports.ProjectStateService = ProjectStateService;
