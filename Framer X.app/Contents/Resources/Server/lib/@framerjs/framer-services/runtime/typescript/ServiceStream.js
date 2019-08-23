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
const RuntimePrivate_1 = require("./RuntimePrivate");
const ServiceErrors_1 = require("./ServiceErrors");
const RuntimeDebugging_1 = require("./RuntimeDebugging");
const logger = RuntimeDebugging_1.ServiceDebugging.createLogger("");
/**
 * ServiceEventEmitter is a stream implementation for a (potentially infinite) sequence of events
 * not associated with any particular task or service message. It supports any number of attached
 * AsyncIterators, with no guarantee as to which event will appear in the first iteration. Use for
 * publish/subscribe or state observing behavior.
 */
class ServiceEventEmitter {
    constructor() {
        this.iterators = [];
        this.emit = (value) => {
            for (const iterator of this.iterators) {
                iterator.update(value);
            }
        };
        this.read = (_) => __awaiter(this, void 0, void 0, function* () {
            // Conform to the client+server ServiceStream interface, but make sure the runtime never depends on it
            throw new ServiceErrors_1.ServiceError.BadRequest("read() on service implementations is invalid");
        });
        this.cancel = () => __awaiter(this, void 0, void 0, function* () {
            throw new Error("cancel is not implemented");
        });
    }
    [Symbol.asyncIterator]() {
        // TODO: have a replayLastEvent setting with the initialization?
        return new ServiceTask((update, done) => {
            this.iterators.push({ update, done });
        });
    }
}
exports.ServiceEventEmitter = ServiceEventEmitter;
/**
 * ServiceTask is a stream implementation for a finite sequence of updates or data packets, sent as a result of
 * one specific service message. It can be iterated only once. Use for one-off task status updates or data transfer.
 */
class ServiceTask {
    constructor(task) {
        this.hasAsyncIterator = false;
        this.promises = [];
        this.doneResult = { done: true, value: undefined };
        this.update = (value) => {
            let lastPromise = this.promises[this.promises.length - 1];
            if (value && lastPromise === undefined) {
                if (!this.returnedNextPromise) {
                    logger.error("lastPromise and returnedNextPromise should never both be undefined");
                    return;
                }
                lastPromise = this.returnedNextPromise;
            }
            if (value !== undefined) {
                this.promises.push(RuntimePrivate_1.ServiceRuntimePrivate.newResolvablePromise());
                lastPromise.resolve({ done: false, value });
            }
            else {
                lastPromise.resolve(this.doneResult);
            }
        };
        this.next = () => __awaiter(this, void 0, void 0, function* () {
            const promise = this.promises.shift();
            this.returnedNextPromise = promise;
            return promise || this.doneResult;
        });
        this.read = (_) => __awaiter(this, void 0, void 0, function* () {
            // Conform to the client+server ServiceStream interface, but make sure the runtime never depends on it
            throw new ServiceErrors_1.ServiceError.BadRequest("read() on service implementations is invalid");
        });
        this.promises = [RuntimePrivate_1.ServiceRuntimePrivate.newResolvablePromise()];
        task(this.update, this.update);
    }
    [Symbol.asyncIterator]() {
        if (this.hasAsyncIterator) {
            throw new Error("ServiceTask.asyncIterator() may only be called once");
        }
        this.hasAsyncIterator = true;
        return this;
    }
}
exports.ServiceTask = ServiceTask;
