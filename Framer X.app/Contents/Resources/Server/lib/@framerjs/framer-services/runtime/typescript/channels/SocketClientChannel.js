"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ServiceChannel_1 = require("../ServiceChannel");
const RuntimeDebugging_1 = require("../RuntimeDebugging");
/** Event name for message passing, shared between client and server */
exports.socketMessageEventName = "test123";
/**
 * TypeScript only channel that communicates with a `SocketServerChannel`, using socket.io.
 */
class SocketClientChannel {
    // switch to websockets?
    constructor(socket) {
        this.listeners = [];
        this.onMessageEvent = (event) => {
            debug.log("onMessageEvent", event, this.listeners);
            const message = event;
            if (!ServiceChannel_1.ServiceChannel.isMessage(message)) {
                debug.log("Received something other than a message", event);
                return;
            }
            for (const listener of this.listeners) {
                listener(message);
            }
        };
        // TODO: decide whether we should connect here or on first message
        // TODO: see if there's a need to add a close() API to the channel interface
        this.socket = socket;
        this.socket.on(exports.socketMessageEventName, this.onMessageEvent);
    }
    postMessage(message) {
        debug.log("postMessage", message);
        if (!this.socket) {
            debug.error("SocketClientChannel has no socket for postMessage:", message);
            return;
        }
        this.socket.emit(exports.socketMessageEventName, message);
    }
    addMessageListener(callback) {
        this.listeners.push(callback);
    }
}
exports.SocketClientChannel = SocketClientChannel;
const debug = RuntimeDebugging_1.ServiceDebugging.createLogger("🌎");
