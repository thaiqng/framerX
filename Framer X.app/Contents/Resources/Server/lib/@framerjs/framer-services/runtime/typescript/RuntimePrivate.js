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
const ServiceErrors_1 = require("./ServiceErrors");
const RuntimeDebugging_1 = require("./RuntimeDebugging");
/**
 * @private Infrastructure that should never be used outside the Framer Services package implementation.
 */
var ServiceRuntimePrivate;
(function (ServiceRuntimePrivate) {
    // Capture Math.random in case some other code swaps it out
    const randomNumber = Math.random;
    /** Returns a good enough unique string to identify request/response pairs across services */
    function generateUniqueId() {
        return `${randomNumber()}`;
    }
    ServiceRuntimePrivate.generateUniqueId = generateUniqueId;
    function newResolvablePromise() {
        let promiseResolve;
        let promiseReject;
        const promise = new Promise((resolve, reject) => {
            promiseResolve = resolve;
            promiseReject = reject;
        });
        promise.resolve = promiseResolve;
        promise.reject = promiseReject;
        return promise;
    }
    ServiceRuntimePrivate.newResolvablePromise = newResolvablePromise;
    class StreamReader {
        constructor(method, helper) {
            this.method = method;
            this.helper = helper;
            this.read = (callback) => __awaiter(this, void 0, void 0, function* () {
                const iterator = this[Symbol.asyncIterator]();
                const { iteration } = this;
                if (!iteration) {
                    // Iteration context should have been set up with the iterator
                    throw new ServiceErrors_1.ServiceError.BadRequest("Cannot start reading stream");
                }
                this.iterate(iterator, callback);
                return Promise.race([iteration.isDonePromise, iteration.isCancelledPromise]);
            });
            this.cancel = () => __awaiter(this, void 0, void 0, function* () {
                const { iteration } = this;
                if (!iteration) {
                    // Don't allow cancelling the stream before reading started
                    throw new ServiceErrors_1.ServiceError.BadRequest("Cannot cancel a stream before reading it");
                }
                iteration.isCancelledPromise.resolve();
            });
        }
        iterate(iterator, callback) {
            // Note: this uses explicit Promises to work around a strange crash in JavaScriptCore at time of writing
            // See https://github.com/framer/company/issues/13411 for more info
            void iterator.next().then((result) => __awaiter(this, void 0, void 0, function* () {
                if (result.done) {
                    return;
                }
                yield callback(result.value);
                this.iterate(iterator, callback);
            }));
        }
        [Symbol.asyncIterator](argument) {
            if (this.iteration) {
                throw new ServiceErrors_1.ServiceError.BadRequest("ServiceStream instances can only be read once. If multiple AsyncIterators or read() calls are required, create a new stream for each by calling the associated service method. To broadcast events with an observer pattern, consider using a client-specific EventEmitter or similar.");
            }
            const iteration = (this.iteration = {
                isDonePromise: newResolvablePromise(),
                isCancelledPromise: newResolvablePromise(),
            });
            // Contrary to what the types say, value = undefined is valid when done = true
            const doneResult = { done: true, value: undefined };
            // The stream id will let the Router on the other end remember the corresponding iterator
            const id = generateUniqueId();
            const logger = RuntimeDebugging_1.ServiceDebugging.createLogger(`🏄‍ [${id}]`);
            return {
                // Note: this uses explicit Promises to work around a strange crash in JavaScriptCore at time of writing
                // See https://github.com/framer/company/issues/13411 for more info
                next: () => {
                    const valuePromise = this.helper({
                        method: this.method,
                        argument,
                        stream: { id, method: "next" },
                    }).then(result => {
                        if (!isIteratorResult(result)) {
                            // FIXME: reject instead of ending the iteration?
                            logger.log("StreamReader.next received an invalid iterator result for next()", result);
                            return Promise.resolve(doneResult);
                        }
                        return Promise.resolve(result);
                    });
                    return Promise.race([
                        // The next value may "never" resolve, e.g. if an event emitter isn't emitting new events
                        valuePromise.then(result => {
                            if (result.done) {
                                iteration.isDonePromise.resolve();
                            }
                            return result;
                        }),
                        iteration.isCancelledPromise.then(_ => {
                            // FIXME: this would be a good place to communicate cancel to the server side
                            return doneResult;
                        }),
                    ]);
                },
            };
        }
    }
    ServiceRuntimePrivate.StreamReader = StreamReader;
    function isIteratorResult(result) {
        if (!result)
            return false;
        return result.done === true || (result.done === false && result.value !== undefined);
    }
})(ServiceRuntimePrivate = exports.ServiceRuntimePrivate || (exports.ServiceRuntimePrivate = {}));
function assertNever(x, error) {
    throw error || new Error("Unexpected object: " + x);
}
exports.assertNever = assertNever;
