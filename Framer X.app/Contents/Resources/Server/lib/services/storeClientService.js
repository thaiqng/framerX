"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const store_client_1 = require("@framerjs/store-client");
class PrivateStoreClientService extends store_client_1.HttpStoreClient {
    constructor({ token, rootUrl }) {
        super({ token, rootUrl, privateStore: true, fetch: store_client_1.requestFetch });
    }
}
exports.PrivateStoreClientService = PrivateStoreClientService;
class PublicStoreClientService extends store_client_1.HttpStoreClient {
    constructor({ token, rootUrl }) {
        super({ token, rootUrl, privateStore: false, fetch: store_client_1.requestFetch });
    }
}
exports.PublicStoreClientService = PublicStoreClientService;
