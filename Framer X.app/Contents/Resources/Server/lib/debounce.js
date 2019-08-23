"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function debounce(fn, time) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(fn, time, ...args);
    };
}
exports.debounce = debounce;
