"use strict";
// ❗️
// The Services package needs to work in any TypeScript environment, so dependencies should be limited to things that
// are available in all the client subsystems. These types server as a failable import. If the reader knows of a better
// solution to only reference types without creating a tsc/webpack dependency, definitely change this up.
Object.defineProperty(exports, "__esModule", { value: true });
function isSocketServerClient(socket) {
    return typeof socket.on === "function" && typeof socket.emit === "function";
}
exports.isSocketServerClient = isSocketServerClient;
