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
exports.poll = (fn, condition, waitingInterval = 200, maxTimeout = 1000 * 60 * 10) => __awaiter(this, void 0, void 0, function* () {
    let polling;
    let endPolling;
    const promise = new Promise((resolve, reject) => {
        // Create a singular logic function to be called repetitively
        const composedFn = () => __awaiter(this, void 0, void 0, function* () {
            // If the fn throws an error, reject the promise
            // Additionally, the condition function can either
            //  1. return true, ending the polling
            //  2. return false, continuing the polling
            //  3. throw an error, ending the polling
            try {
                const result = yield fn();
                if (condition(result)) {
                    resolve(result);
                    // Bail early on success
                    return;
                }
            }
            catch (error) {
                reject(error);
                // Bail early on error
                return;
            }
            // If there is no resolution, continue polling
            polling = execute();
        });
        // Create a singular timeout function to be called repetitively
        const execute = () => setTimeout(composedFn, waitingInterval);
        // Kick off the polling
        execute();
        // Put in place a timeout to prevent excessively long polling
        endPolling = setTimeout(() => reject(new Error("Operation timed out.")), maxTimeout);
    }).then(response => {
        clearTimeout(polling);
        clearTimeout(endPolling);
        return response;
    }, error => {
        clearTimeout(polling);
        clearTimeout(endPolling);
        throw error;
    });
    return promise;
});
