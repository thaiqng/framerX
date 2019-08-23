"use strict";
// ♻️
// IMPORTANT: Take care to sync changes with the Swift counterpart.
Object.defineProperty(exports, "__esModule", { value: true });
const ServiceChannel_1 = require("../ServiceChannel");
const RuntimeDebugging_1 = require("../RuntimeDebugging");
/**
 * Channel that communicates with another `PostMessageChannel`, either using a `postMessage` entry point (e.g.
 * an iframe or parent frame) or with PostMessageChannel on the Swift side.
 */
class PostMessageChannel {
    constructor(target) {
        this.target = target;
        this.listeners = [];
        this.onMessageEvent = (event) => {
            debug.log("onMessageEvent", event);
            // Ignore events that don't come from the postMessage target
            if (
            // Regular frame sources
            event.source !== this.target &&
                // Parent frame source (set up by Swift)
                !(this === parentFrameChannel &&
                    event.source === window &&
                    event.data &&
                    event.data.__postMessageChannelSource === swiftWindowParentName)) {
                return;
            }
            const message = event.data;
            if (!ServiceChannel_1.ServiceChannel.isMessage(message))
                return;
            for (const listener of this.listeners) {
                listener(message);
            }
        };
        // When targeting the parent frame, either use the actual parent or the messageHandler set up by Swift
        if (target === (window ? window.parent : undefined) || target === swiftPostMessageProxy) {
            debug.log("Constructing parent channel");
            if (!isConstructingParentFrameChannel || parentFrameChannel !== undefined) {
                throw new Error("PostMessageChannel.toParentFrame must be used instead of initializing with window.parent.");
            }
            else if (!window) {
                // Running in a test environment
                this.target = {
                    postMessage: (...args) => {
                        debug.log("postMessage to parent channel not running in a DOM environment: ", args);
                    },
                };
                return;
            }
            else if (window.parent !== window) {
                // Use the actual parent if it exists
                this.target = window.parent;
            }
            else {
                // Use the messageHandler set up by Swift
                this.target = swiftPostMessageProxy;
            }
        }
        else {
            debug.log("Constructing other channel");
        }
        if (window) {
            window.addEventListener("message", this.onMessageEvent, false);
        }
    }
    static get toParentFrame() {
        isConstructingParentFrameChannel = true;
        parentFrameChannel = parentFrameChannel || new PostMessageChannel(swiftPostMessageProxy);
        isConstructingParentFrameChannel = false;
        return parentFrameChannel;
    }
    postMessage(message) {
        debug.log("postMessage", message);
        this.target.postMessage(message, "*");
    }
    addMessageListener(callback) {
        this.listeners.push(callback);
    }
}
exports.PostMessageChannel = PostMessageChannel;
const debug = RuntimeDebugging_1.ServiceDebugging.createLogger("✉️");
// Special channel to the parent frame
let isConstructingParentFrameChannel = false;
let parentFrameChannel;
// Fallback for frames that don't have a window.parent: detect Swift container
const swiftWindowParentName = "swiftWindowParent";
let swiftWindowParentMessageHandler;
const swiftPostMessageProxy = {
    postMessage: (...args) => {
        try {
            if (!window)
                throw new Error("PostMessageChannel requires a DOM environment");
            swiftWindowParentMessageHandler =
                swiftWindowParentMessageHandler || window["webkit"].messageHandlers[swiftWindowParentName];
            swiftWindowParentMessageHandler.postMessage(...args);
        }
        catch (error) {
            throw new Error(`Can't find window.parent or ${swiftWindowParentName} message handler`);
        }
    },
};
