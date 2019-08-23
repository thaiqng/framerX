"use strict";
// ♻️
// IMPORTANT: Take care to apply changes to all supported languages
// when modifying code or documentation in the services runtime.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ServiceChannel_1 = require("./ServiceChannel");
const ServiceErrors_1 = require("./ServiceErrors");
const RuntimePrivate_1 = require("./RuntimePrivate");
const RuntimeDebugging_1 = require("./RuntimeDebugging");
const timers_1 = require("./timers");
/**
 * Manages a cluster of channels and services and sets up service communication. Use the auto-generated Service objects
 * to register implementations and get proxies to cross-process services. Most clients will set up a single shared object
 * with multiple channels.
 */
class ServiceManager {
    constructor(logger = RuntimeDebugging_1.ServiceDebugging.createLogger("📮")) {
        this.logger = logger;
        /**
         * Creates a new proxy for a given service. Since the presence of the service isn't checked, errors may occur when
         * actually calling methods on the proxy.
         *
         * @param service The auto-generated definition object for the wanted service
         * @param channel Where the service is assumed to live. Calling this method implicitly registers the channel.
         */
        this.expect = (service, channel) => {
            this.logger.log("ServiceManager.expect:", service.id);
            return this.addRouter(channel).expect(service);
        };
        /**
         * Waits for the presence of the service, with a configurable timeout. Returns a proxy on success, or rejects with
         * a service error (e.g. the request timed out, service wasn't).
         *
         * const service = await SomeService.on(someChannel).discover({ timeout: 1000 })
         * await service.someMethod()
         *
         * @param service The auto-generated definition object for the wanted service
         * @param channel Where the service is assumed to live. Calling this method implicitly registers the channel.
         * @param options.timeout Number of milliseconds to wait for the service's presence. Default = 30000
         */
        this.discover = (service, channel, options) => __awaiter(this, void 0, void 0, function* () {
            this.logger.log("ServiceManager.discover:", service.id);
            return this.addRouter(channel).discover(service, options);
        });
        /** Removes a registered implementation or channel. */
        this.unregister = (_) => {
            // FIXME: implement
        };
        this.routers = new Set();
        this.addRouter = (channel) => {
            for (const existing of this.routers) {
                if (existing.channel === channel) {
                    return existing;
                }
            }
            const router = new Router(channel, this.logger);
            this.routers.add(router);
            return router;
        };
    }
    register(what) {
        return __awaiter(this, void 0, void 0, function* () {
            function isImplementation(obj) {
                return obj.service !== undefined && obj.implementation !== undefined;
            }
            if (isImplementation(what)) {
                this.logger.log("ServiceManager.registerImplementation:", what.service.id);
                yield this.addRouter(what.channel).registerImplementation(what.implementation, what.service);
            }
            else {
                this.logger.log("ServiceManager.registerChannel");
                this.addRouter(what.channel);
            }
        });
    }
}
exports.ServiceManager = ServiceManager;
(function (ServiceManager) {
    const sharedServiceManager = new ServiceManager();
    /**
     * Shared service manager for TypeScript clients that only have one area of responsibility within the runtime,
     * exposed as the generated `SomeService.on(channel)` convenience API. If your current script runtime only has
     * a single domain of responsibility (e.g. Vekter representing a single document), use the convenience instead
     * of constructing your own service managers.
     */
    function shared() {
        return RuntimeDebugging_1.ServiceDebugging._sharedServiceManagerIfTesting() || sharedServiceManager;
    }
    ServiceManager.shared = shared;
})(ServiceManager = exports.ServiceManager || (exports.ServiceManager = {}));
class Router {
    constructor(channel, logger) {
        this.channel = channel;
        this.logger = logger;
        this.onMessage = (message) => {
            this.logger.log("Router.onMessage:", message);
            try {
                // For now, just assume we're in a wonderful world where a type check implies a complete and valid message
                if (message.type === ServiceChannel_1.ServiceChannel.MessageType.Request) {
                    void this.onRequest(message);
                }
                else if (message.type === ServiceChannel_1.ServiceChannel.MessageType.Response) {
                    if (message.method === Discovery.method) {
                        this.onDiscoveryResponse(message);
                    }
                    else {
                        this.onResponse(message);
                    }
                }
                else if (message.type === ServiceChannel_1.ServiceChannel.MessageType.Error) {
                    void this.onError(message);
                }
                else {
                    RuntimePrivate_1.assertNever(message.type, new Error(`Unknown service router message: ${JSON.stringify(message)}`));
                }
            }
            catch (error) {
                this.logger.log("Router.onMessage error:", error);
            }
        };
        this.waitingDiscoveryMap = {};
        this.reflectDiscoveredServices = () => {
            if (!this.latestDiscoveryInfo) {
                return;
            }
            for (const serviceId of Object.keys(this.latestDiscoveryInfo.services)) {
                const promises = this.waitingDiscoveryMap[serviceId];
                if (promises) {
                    this.waitingDiscoveryMap[serviceId] = [];
                    promises.forEach(promise => promise.resolve());
                }
            }
        };
        this.onDiscoveryResponse = (response) => {
            if (Discovery.isValidInfo(response.body)) {
                this.latestDiscoveryInfo = response.body;
                this.reflectDiscoveredServices();
            }
            else {
                this.logger.log("Router.onDiscoveryResponse: received invalid data", response.body);
            }
            // Also do standard response handling if it's an explicit discovery request
            if (response.id !== Discovery.broadcastMessageId) {
                this.onResponse(response);
            }
        };
        this.broadcastDiscoveryInfo = (requestId) => {
            const services = {};
            for (const key in this.implementedServices) {
                const service = this.implementedServices[key].service;
                services[key] = { fingerprint: service.fingerprint };
            }
            const discoveryInfo = { services };
            try {
                this.channel.postMessage({
                    type: ServiceChannel_1.ServiceChannel.MessageType.Response,
                    id: requestId || Discovery.broadcastMessageId,
                    serviceId: Discovery.serviceId,
                    method: Discovery.method,
                    body: discoveryInfo,
                });
            }
            catch (_a) {
                // postMessage can fail (e.g. when generating a "dehydrated" version of the host page). Since this broadcast happens automatically and not as part of explicitly calling a service method, suppress errors here. If discovery fails, the actual services will fail as well.
            }
        };
        // Outgoing messages
        this.expect = (service) => {
            this.logger.log("Router.expect");
            return service.newOutgoingWrapper((message) => __awaiter(this, void 0, void 0, function* () {
                this.logger.log("Router.send", message);
                // Discover services if needed
                yield this.waitForDiscoveryInfo();
                this.throwErrorIfBadService(service);
                return this.postRequest(service.id, message);
            }));
        };
        this.discover = (service, { timeout = 30000 } = {}) => __awaiter(this, void 0, void 0, function* () {
            this.logger.log("Router.discover");
            // Discover services if needed and wait until this specific one appears
            yield Promise.race([
                this.waitForDiscoveredService(service),
                // Time out if it doesn't appear fast enough
                new Promise((_, reject) => timers_1.setTimeout(() => reject(
                // Distinguish between timeout waiting for discovery and waiting for a service to appear
                this.latestDiscoveryInfo ? new ServiceErrors_1.ServiceError.ServiceNotFound() : new ServiceErrors_1.ServiceError.TimedOut()), timeout)),
            ]);
            this.throwErrorIfBadService(service);
            return this.expect(service);
        });
        this.throwErrorIfBadService = (service) => {
            const discoveryInfo = this.latestDiscoveryInfo;
            // Fail if the other end of the channel doesn't declare the needed service
            const serviceInfo = discoveryInfo && discoveryInfo ? discoveryInfo.services[service.id] : undefined;
            if (!serviceInfo) {
                this.logger.log("Router couldn't find service", discoveryInfo);
                throw new ServiceErrors_1.ServiceError.ServiceNotFound();
            }
            // Fail if the versions don't match
            if (serviceInfo.fingerprint !== service.fingerprint) {
                this.logger.log("couldn't find compatible service version", discoveryInfo);
                throw new ServiceErrors_1.ServiceError.ServiceRequiresUpgrade();
            }
        };
        this.postRequest = (serviceId, message, timeout) => {
            this.logger.log("Router.postRequest:", message);
            const promise = RuntimePrivate_1.ServiceRuntimePrivate.newResolvablePromise();
            // Prepare a good enough unique string to identify the request/response pair across services
            const requestId = RuntimePrivate_1.ServiceRuntimePrivate.generateUniqueId();
            this.waitingRequestsMap[requestId] = promise;
            // Send the request
            const request = {
                type: ServiceChannel_1.ServiceChannel.MessageType.Request,
                id: requestId,
                serviceId,
                method: message.method,
                stream: StreamOperation.toMessage(message.stream),
                body: message.argument,
            };
            this.channel.postMessage(request);
            // Simulate an error if there has been no response after the timeout
            if (typeof timeout === "number") {
                timers_1.setTimeout(() => {
                    const needsResponse = !!this.waitingRequestsMap[requestId];
                    if (needsResponse) {
                        this.onError({
                            type: ServiceChannel_1.ServiceChannel.MessageType.Error,
                            id: request.id,
                            serviceId: request.serviceId,
                            method: request.method,
                            body: undefined,
                        }, new ServiceErrors_1.ServiceError.TimedOut());
                    }
                }, timeout);
            }
            return promise;
        };
        this.waitingRequestsMap = {};
        this.onResponse = (response) => {
            const request = this.waitingRequestsMap[response.id];
            if (!request)
                return this.logger.error("Router received response without corresponding request:", response);
            delete this.waitingRequestsMap[response.id];
            request.resolve(response.body);
        };
        this.onError = (response, customError) => {
            const request = this.waitingRequestsMap[response.id];
            if (!request)
                return this.logger.error("Router received error without corresponding request:", response);
            delete this.waitingRequestsMap[response.id];
            const error = customError || ServiceErrors_1.ServiceError.fromMessageBody(response.body);
            request.reject(error);
        };
        // Incoming messages
        this.registerImplementation = (rawImplementation, service) => __awaiter(this, void 0, void 0, function* () {
            this.logger.log("Router.registerImplementation:", rawImplementation);
            // Only expose known methods, bound to the implementation object so they can be called as is
            const implementation = {};
            for (const key in service.methods) {
                const name = key;
                const method = rawImplementation[name];
                if (typeof method !== "function") {
                    throw new ServiceErrors_1.ServiceError.Implementation(`Implementation for ${service.id} doesn't correctly implement ${name}()`);
                }
                implementation[name] = method.bind(rawImplementation);
            }
            this.implementedServices[service.id] = { service, implementation };
            this.broadcastDiscoveryInfo();
        });
        this.implementedServices = {};
        this.streamIterators = {};
        this.onRequest = (request) => __awaiter(this, void 0, void 0, function* () {
            this.logger.log("Router.onRequest:", request);
            // Explicit discovery requests
            if (request.method === Discovery.method) {
                this.broadcastDiscoveryInfo(request.id);
                return;
            }
            // Service requests
            let resultType = ServiceChannel_1.ServiceChannel.MessageType.Response;
            let resultBody;
            try {
                const implementedService = this.implementedServices[request.serviceId];
                const implementation = implementedService ? implementedService.implementation : undefined;
                if (!implementation) {
                    this.logger.error("Router received unknown request:", request);
                    throw new ServiceErrors_1.ServiceError.BadRequest();
                }
                if (request.stream) {
                    // Streaming method, a.k.a. an iteration request for an async iterator
                    const stream = StreamOperation.fromMessage(request.stream);
                    let iterator = this.streamIterators[stream.id];
                    if (!iterator) {
                        // Start a new iterator if one doesn't exist yet
                        const method = implementation[request.method];
                        const iteratorStream = (yield method(request.body));
                        iterator = iteratorStream[Symbol.asyncIterator]();
                        this.streamIterators[stream.id] = iterator;
                    }
                    if (stream.method !== "next") {
                        throw new ServiceErrors_1.ServiceError.BadRequest("Stream operations other than next() are not yet supported");
                    }
                    const iteratorResult = yield iterator.next();
                    resultBody = { done: iteratorResult.done, value: iteratorResult.value };
                }
                else {
                    // Regular service method
                    const method = implementation[request.method];
                    resultBody = yield method(request.body);
                }
            }
            catch (error) {
                this.logger.log("Router.onRequest error:", error.message);
                resultType = ServiceChannel_1.ServiceChannel.MessageType.Error;
                resultBody = ServiceErrors_1.ServiceError.toMessageBody(error);
            }
            finally {
                // Note: the result type currently isn't verified or validated in any way
                this.channel.postMessage({
                    type: resultType,
                    id: request.id,
                    serviceId: request.serviceId,
                    method: request.method,
                    body: resultBody,
                });
            }
        });
        channel.addMessageListener(this.onMessage);
    }
    waitForDiscoveryInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            // No need to discover if we already have info. The other end of the channel makes sure that any updates get
            // actively pushed using broadcastDiscoveryInfo (e.g. when a service registers)
            if (this.latestDiscoveryInfo) {
                return this.latestDiscoveryInfo;
            }
            // Explicitly request discovery info
            yield this.postRequest(Discovery.serviceId, { method: Discovery.method }, 1000 /* timeout */);
            if (!this.latestDiscoveryInfo) {
                throw new ServiceErrors_1.ServiceError.ServiceNotFound();
            }
            return this.latestDiscoveryInfo;
        });
    }
    waitForDiscoveredService(service) {
        return __awaiter(this, void 0, void 0, function* () {
            // Will be resolved when any discovery response contains the expected service
            const promise = RuntimePrivate_1.ServiceRuntimePrivate.newResolvablePromise();
            const promises = this.waitingDiscoveryMap[service.id] || [];
            this.waitingDiscoveryMap[service.id] = promises;
            promises.push(promise);
            // Make sure there's at least one attempt to get discovery info, but ignore its success/failure
            this.waitForDiscoveryInfo().catch(() => { });
            this.reflectDiscoveredServices();
            return promise;
        });
    }
}
var Discovery;
(function (Discovery) {
    Discovery.serviceId = "";
    Discovery.method = "#discover";
    Discovery.broadcastMessageId = "";
    function isValidInfo(body) {
        if (!body || !body.services || typeof body.services !== "object")
            return false;
        return true;
    }
    Discovery.isValidInfo = isValidInfo;
})(Discovery || (Discovery = {}));
var StreamOperation;
(function (StreamOperation) {
    const returnPrefix = "#return:";
    const throwPrefix = "#throw:";
    function fromMessage(operation) {
        if (operation.startsWith(returnPrefix)) {
            return { id: operation.substr(returnPrefix.length), method: "return" };
        }
        else if (operation.startsWith(throwPrefix)) {
            return { id: operation.substr(throwPrefix.length), method: "throw" };
        }
        else {
            return { id: operation, method: "next" };
        }
    }
    StreamOperation.fromMessage = fromMessage;
    function toMessage(stream) {
        if (!stream)
            return undefined;
        switch (stream.method) {
            case "next":
                return stream.id; // Having just a stream identifier implicitly means calling next()
            case "return":
                return returnPrefix + stream.id;
            case "throw":
                return throwPrefix + stream.id;
            default:
                return undefined;
        }
    }
    StreamOperation.toMessage = toMessage;
})(StreamOperation || (StreamOperation = {}));
