"use strict";
// ♻️
// IMPORTANT: Take care to apply changes to all supported languages
// when modifying code or documentation in the services runtime.
Object.defineProperty(exports, "__esModule", { value: true });
var ServiceChannel;
(function (ServiceChannel) {
    let MessageType;
    (function (MessageType) {
        MessageType["Request"] = "request";
        MessageType["Response"] = "response";
        MessageType["Error"] = "error";
    })(MessageType = ServiceChannel.MessageType || (ServiceChannel.MessageType = {}));
    function isMessage(obj) {
        if (typeof obj !== "object")
            return false;
        return (obj.type === ServiceChannel.MessageType.Request ||
            obj.type === ServiceChannel.MessageType.Response ||
            obj.type === ServiceChannel.MessageType.Error);
    }
    ServiceChannel.isMessage = isMessage;
})(ServiceChannel = exports.ServiceChannel || (exports.ServiceChannel = {}));
