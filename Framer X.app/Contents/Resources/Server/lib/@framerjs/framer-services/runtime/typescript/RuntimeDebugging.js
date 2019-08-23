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
var ServiceDebugging;
(function (ServiceDebugging) {
    /** Enable to output log() calls to the console. */
    ServiceDebugging.wantsVerboseLogging = false;
})(ServiceDebugging = exports.ServiceDebugging || (exports.ServiceDebugging = {}));
/**
 * @private Infrastructure that should never be used outside the Framer Services package implementation.
 */
(function (ServiceDebugging) {
    /** @private Create a new console-like logger object. */
    function createLogger(prefix) {
        return {
            log: (message, ...optionalParams) => {
                const activeLogger = ServiceDebugging.customLogger || console;
                if (!activeLogger || !ServiceDebugging.wantsVerboseLogging)
                    return;
                activeLogger.log(prefix + " " + message, ...optionalParams);
            },
            error: (message, ...optionalParams) => {
                const activeLogger = ServiceDebugging.customLogger || console;
                if (!activeLogger)
                    return;
                activeLogger.error(prefix + " " + message, ...optionalParams);
            },
        };
    }
    ServiceDebugging.createLogger = createLogger;
    /** @private Only for tests. Enables or disables testing mode. */
    ServiceDebugging._isTesting = false;
    let _testingServiceManager;
    /** @private Only for tests. Temporarily changes the value of ServiceManager.shared(). */
    function _testWithShared(manager, fn) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ServiceDebugging._isTesting)
                throw new Error("ServiceManager.isTesting must be true to use testWithShared()");
            if (_testingServiceManager)
                throw new Error("ServiceManager.testWithShared() may not be nested");
            try {
                _testingServiceManager = manager;
                return yield fn();
            }
            catch (error) {
                throw error;
            }
            finally {
                _testingServiceManager = undefined;
            }
        });
    }
    ServiceDebugging._testWithShared = _testWithShared;
    /** @private For ServiceManager */
    function _sharedServiceManagerIfTesting() {
        if (ServiceDebugging._isTesting) {
            if (!_testingServiceManager) {
                throw new Error("ServiceManager.shared() may not be used while testing. Use testWithShared() for explicitness.");
            }
            else {
                return _testingServiceManager;
            }
        }
        // Just use the standard shared logic if not testing
        return undefined;
    }
    ServiceDebugging._sharedServiceManagerIfTesting = _sharedServiceManagerIfTesting;
})(ServiceDebugging = exports.ServiceDebugging || (exports.ServiceDebugging = {}));
