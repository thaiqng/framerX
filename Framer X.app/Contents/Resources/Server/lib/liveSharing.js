"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const logger_1 = require("./logger");
const logger = logger_1.createLogger("framer:liveSharing");
class LiveSharing extends events_1.EventEmitter {
    constructor(host) {
        super();
        this.state = LiveSharing.initialState();
        this.timeoutError = () => {
            this.timeoutTimer = undefined;
            this.emit("error", "Server could not be reached. It might be blocked by a firewall.");
            // Don’t change the tunnel or the status. The localtunnel code can’t cancel a tunnel
            // that was started, so we’ll just let it keep retrying
        };
        this.host = host;
    }
    enable() {
        if (this.state.status === "unavailable") {
            this.setStatus("available");
        }
    }
    start(port) {
        if (this.state.status !== "available") {
            logger.warn("Can only start live sharing when available");
            return;
        }
        if (this.tunnel) {
            // Internal error
            logger.error("Tunnel should not already exist.");
            return;
        }
        this.setStatus("starting");
        this.startTimeoutTimer();
        // The live server client is lazily loaded to improve start-up time.
        // Unfortunately there are no types available, so there is no `import` for that.
        const localtunnel = require("@framerjs/framer-live-client");
        // Since the dependency is optional, it might not be found
        // NOTE: This needs a better solution
        if (localtunnel === undefined) {
            this.setStatus("unavailable");
            return;
        }
        this.tunnel = localtunnel(port, { host: this.host }, (error, tunnel) => {
            if (error) {
                logger.error("Error creating the tunnel", error);
                this.tunnel = undefined;
                this.setStatus("available"); // FIXME Maybe not necessary because it will close on error?
            }
            else {
                // Reset timeout (connecting to a random port might not work)
                this.startTimeoutTimer();
            }
        });
        this.tunnel.on("url", url => {
            this.setStatus("active", url);
        });
        this.tunnel.on("error", error => {
            this.emit("error", error);
        });
        this.tunnel.on("close", () => {
            this.tunnel = undefined;
            this.setStatus("available");
        });
    }
    stop() {
        if (this.state.status !== "active") {
            logger.warn("Can only stop live sharing when active");
            return;
        }
        if (!this.tunnel) {
            // Internal error
            logger.error("Tunnel should exist.");
        }
        this.setStatus("stopping");
        this.tunnel.close();
    }
    setStatus(status, url) {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
        }
        this.state.status = status;
        this.state.url = url;
        this.emit("statusUpdate");
    }
    startTimeoutTimer(seconds = 10) {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
        }
        this.timeoutTimer = setTimeout(this.timeoutError, seconds * 1000);
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
}
LiveSharing.initialState = () => ({ status: "unavailable" });
exports.LiveSharing = LiveSharing;
