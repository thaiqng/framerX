"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RuntimePrivate_1 = require("./RuntimePrivate");
// ♻️
// IMPORTANT: Take care to apply changes to all supported languages
// when modifying code or documentation in the services runtime.
/**
 * Service runtime or service implementation errors.
 */
class ServiceError extends Error {
    constructor() {
        super(...arguments);
        this.code = 422 /* badResponse */;
    }
}
exports.ServiceError = ServiceError;
(function (ServiceError) {
    class ServiceNotFound extends ServiceError {
        constructor() {
            super(...arguments);
            this.code = 404 /* serviceNotFound */;
        }
    }
    ServiceError.ServiceNotFound = ServiceNotFound;
    class ServiceRequiresUpgrade extends ServiceError {
        constructor() {
            super(...arguments);
            this.code = 426 /* serviceRequiresUpgrade */;
        }
    }
    ServiceError.ServiceRequiresUpgrade = ServiceRequiresUpgrade;
    class Implementation extends ServiceError {
        constructor() {
            super(...arguments);
            this.code = 500 /* implementation */;
        }
    }
    ServiceError.Implementation = Implementation;
    class TimedOut extends ServiceError {
        constructor() {
            super(...arguments);
            this.code = 504 /* timedOut */;
        }
    }
    ServiceError.TimedOut = TimedOut;
    class BadRequest extends ServiceError {
        constructor() {
            super(...arguments);
            this.code = 400 /* badRequest */;
        }
    }
    ServiceError.BadRequest = BadRequest;
    ServiceError.BadResponse = ServiceError;
    function fromMessageBody(error) {
        let message;
        if (error && typeof error.message === "string") {
            message = error.message;
        }
        try {
            if (!error)
                return new ServiceError.BadResponse(message);
            // Cast to ServiceError.Code to get exhaustiveness checking, but could be anything
            const maybeCode = error.code;
            switch (maybeCode) {
                case 404 /* serviceNotFound */:
                    return new ServiceNotFound(message);
                case 426 /* serviceRequiresUpgrade */:
                    return new ServiceRequiresUpgrade(message);
                case 500 /* implementation */:
                    return new Implementation(message);
                case 504 /* timedOut */:
                    return new TimedOut(message);
                case 400 /* badRequest */:
                    return new BadRequest(message);
                case 422 /* badResponse */:
                    return new ServiceError.BadResponse(message);
                default:
                    RuntimePrivate_1.assertNever(maybeCode);
            }
        }
        catch (_a) { } // Something other than a valid error code
        return new ServiceError.BadResponse(message);
    }
    ServiceError.fromMessageBody = fromMessageBody;
    function toMessageBody(error) {
        if (error instanceof ServiceError) {
            return { code: error.code, message: error.message };
        }
        let message;
        if (typeof error === "string") {
            message = error;
        }
        else if (error && typeof error.message === "string") {
            message = error.message;
        }
        return { code: 500 /* implementation */, message };
    }
    ServiceError.toMessageBody = toMessageBody;
})(ServiceError = exports.ServiceError || (exports.ServiceError = {}));
