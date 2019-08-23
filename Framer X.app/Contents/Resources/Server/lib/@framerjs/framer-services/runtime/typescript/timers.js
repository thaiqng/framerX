"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Node and Browser have slightly different setTimeout definitions and we
 * import neither library into the Services TypeScript configuration. So to
 * avoid conflicts we just pull them off the global object and redeclare them
 * in this local module.
 */
const ctx = new Function("return this")();
exports.setTimeout = (...args) => ctx.setTimeout(...args);
exports.clearTimeout = (...args) => ctx.clearTimeout(...args);
