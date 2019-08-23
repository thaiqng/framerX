"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ServiceChannel_1 = require("../ServiceChannel");
const RuntimeDebugging_1 = require("../RuntimeDebugging");
const Environment_1 = require("./Environment");
const SocketClientChannel_1 = require("./SocketClientChannel");
/**
 * TypeScript only channel that communicates with any number of `SocketClientChannel`s, using socket.io.
 * Conceptually, individual clients are collapsed into one virtual channel endpoint, so any service registered
 * on this channel should be designed to not depend on client state.
 */
class SocketServerChannel {
    constructor(server) {
        this.server = server;
        this.clientSockets = new Set();
        this.onConnect = (socket) => {
            if (!Environment_1.isSocketServerClient(socket)) {
                debug.error(`Received something other than a socket on "connect"`, socket);
                return;
            }
            debug.log("on connect");
            this.clientSockets.add(socket);
            socket.on(SocketClientChannel_1.socketMessageEventName, this.onMessageEvent);
        };
        this.onMessageEvent = (message) => {
            debug.log("server onMessageEvent", message);
            if (!ServiceChannel_1.ServiceChannel.isMessage(message))
                return;
            for (const listener of this.listeners) {
                listener(message);
            }
        };
        this.listeners = [];
        debug.log("constructing SocketServerChannel");
        this.server.on("connect", this.onConnect);
    }
    postMessage(message) {
        debug.log("postMessage", message);
        // TODO: might need to swap out identifiers here?
        this.clientSockets.forEach(client => {
            client.emit(SocketClientChannel_1.socketMessageEventName, message);
        });
        // if (true) {
        //     return debug.error("SocketServerChannel has no socket for postMessage:", message)
        // }
    }
    addMessageListener(callback) {
        this.listeners.push(callback);
    }
}
exports.SocketServerChannel = SocketServerChannel;
const debug = RuntimeDebugging_1.ServiceDebugging.createLogger("🌎");
