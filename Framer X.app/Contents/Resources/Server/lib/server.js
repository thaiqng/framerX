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
// Built-in
const http = require("http");
const path = require("path");
const fs = require("fs");
// Light-weight
const uuid = require("uuid/v4");
// Used immediately
const express = require("express");
const compression = require("compression");
const socketio = require("socket.io");
const middleware = require("./middleware");
const bodyParser = require("body-parser");
// Use the version of framer-services that comes with the repository
const framer_services_1 = require("./@framerjs/framer-services");
const project_1 = require("./project");
const liveSharing_1 = require("./liveSharing");
const logger_1 = require("./logger");
const logger = logger_1.createLogger("framer:server");
framer_services_1.ServiceDebugging.customLogger = logger;
const projectStateService_1 = require("./services/projectStateService");
const projectPackageService_1 = require("./services/projectPackageService");
var ServerCommand;
(function (ServerCommand) {
    ServerCommand["addPackage"] = "addPackage";
    ServerCommand["removePackage"] = "removePackage";
    ServerCommand["publishPackage"] = "publishPackage";
    ServerCommand["reloadClients"] = "reloadClients";
    ServerCommand["updatePackageInfo"] = "updatePackageInfo";
    ServerCommand["setIsDocumentDirty"] = "setIsDocumentDirty";
    ServerCommand["installFramerLibrary"] = "installFramerLibrary";
    ServerCommand["upgradeDependency"] = "upgradeDependency";
    ServerCommand["updateCanvasData"] = "updateCanvasData";
    ServerCommand["updateCanvasModule"] = "updateCanvasModule";
    ServerCommand["startLiveSharing"] = "startLiveSharing";
    ServerCommand["stopLiveSharing"] = "stopLiveSharing";
    ServerCommand["joinRoom"] = "joinRoom";
    ServerCommand["updatePreview"] = "updatePreview";
    ServerCommand["previewInspectorUpdate"] = "previewInspectorUpdate";
    ServerCommand["togglePreviewInspector"] = "togglePreviewInspector";
    ServerCommand["metrics"] = "metrics";
    ServerCommand["buildStandaloneExport"] = "buildStandaloneExport";
    ServerCommand["setProjectDir"] = "setProjectDir";
    ServerCommand["runPerformanceTests"] = "runPerformanceTests";
    ServerCommand["performanceTestsComplete"] = "performanceTestsComplete";
    ServerCommand["clientConnected"] = "clientConnected";
})(ServerCommand = exports.ServerCommand || (exports.ServerCommand = {}));
function setLongCache(res) {
    res.setHeader("Cache-Control", "public, max-age=36000");
    res.setHeader("Pragma", "");
    res.setHeader("Surrogate-Control", "");
}
class Server {
    constructor(config) {
        this.config = config;
        this._state = {
            url: undefined,
            filename: undefined,
            running: false,
            packages: [],
            outdated: [],
            tasks: {},
            isDocumentDirty: false,
            liveSharing: liveSharing_1.LiveSharing.initialState(),
            packagesInfo: {},
            hasProject: false,
            doneFirstInstall: false,
            previewInspectorHasErrors: false,
            previewInspectorHasWarnings: false,
        };
        this.previewData = null;
        this.rawCanvasData = null;
        const app = express();
        this.expressApp = app;
        this.http = http.createServer(app);
        this.io = socketio(this.http);
        this.ioChannel = new framer_services_1.SocketServerChannel(this.io);
        this.projectStateService = new projectStateService_1.ProjectStateService();
        framer_services_1.ProjectState.on(this.ioChannel).register(this.projectStateService);
        this.projectPackageService = new projectPackageService_1.ProjectPackageService();
        framer_services_1.ProjectPackage.on(this.ioChannel).register(this.projectPackageService);
        if (config && config.token && config.api) {
            const { token, api: rootUrl } = config;
            // Load private dependencies on demand to support CLI
            const { PrivateStoreClientService, PublicStoreClientService } = require("./services/storeClientService");
            framer_services_1.PrivateStoreClient.on(this.ioChannel).register(new PrivateStoreClientService({ rootUrl, token }));
            framer_services_1.PublicStoreClient.on(this.ioChannel).register(new PublicStoreClientService({ rootUrl, token }));
        }
        else {
            logger.error("Unable to initialize StoreClient services due to missing config");
        }
        if (!config || !config.disableLiveSharing) {
            this.liveSharing = new liveSharing_1.LiveSharing("https://framer.live");
            this.liveSharing.on("statusUpdate", () => {
                if (!this.liveSharing)
                    return;
                this.setState({ liveSharing: this.liveSharing.state });
            });
            this.liveSharing.on("error", error => {
                logger.error(`Live Preview Error: ${error}`);
            });
        }
        app.use(middleware.nocache);
        app.use(middleware.logging);
        if (config && config.corsPorts) {
            app.use(middleware.getCORS(config.corsPorts));
        }
        app.use(compression());
        app.options("*", (req, res) => {
            res.send(200);
        });
        app.use("/_proxy", function (req, res) {
            req.pipe(lazyLoadRequest()(req.url.slice(1))).pipe(res);
        });
        // NOTE! Methods below use `middleware.isAuthenticated`!
        app.get("/_files", middleware.isAuthenticated, (req, res) => {
            if (!this.project)
                return res.send(500);
            const data = {
                files: this.project.getCodeFilesAndFolders(),
            };
            res.send(data);
        });
        app.get("/_dependencies", middleware.isAuthenticated, (req, res) => {
            if (!this.project)
                return res.send(500);
            res.send(this.project.getDeclarationFilesForDepedencies());
        });
        /** use HUGE_FILE, but bigger, because the file is json escaped */
        const jsonParser = bodyParser.json({ limit: project_1.HUGE_FILE * 2 });
        app.post("/_file", middleware.isAuthenticated, jsonParser, (req, res) => {
            if (!this.project)
                return res.send(500);
            const name = req.body.path;
            try {
                res.send(this.project.getCodeEntry(name));
            }
            catch (e) {
                logger.error(e.message);
                res.sendStatus(404);
            }
        });
        app.post("/_save_file", middleware.isAuthenticated, jsonParser, (req, res) => {
            if (!this.project)
                return res.send(500);
            const name = req.body.path;
            const content = req.body.content;
            try {
                this.project.saveCodeFile(name, content);
                res.send({ status: "ok" });
            }
            catch (e) {
                logger.error(e.message);
                res.sendStatus(404);
            }
        });
        app.post("/_delete_file", middleware.isAuthenticated, jsonParser, (req, res) => {
            if (!this.project)
                return res.send(500);
            const name = req.body.path;
            try {
                this.project.deleteCodeFile(name);
                res.send({ status: "ok" });
            }
            catch (e) {
                logger.error(e.message);
                res.sendStatus(404);
            }
        });
        app.post("/_create_code_example_files", middleware.isAuthenticated, jsonParser, (req, res) => {
            if (!this.project)
                return res.send(500);
            this.project.createExampleFiles();
            const data = {
                files: this.project.getCodeFilesAndFolders(),
            };
            res.send(data);
        });
        const staticPath = this.config && this.config.staticPath;
        if (staticPath) {
            app.use("/_app/resources", express.static(staticPath));
        }
        this.setup();
    }
    get state() {
        if (!this.config)
            return this._state;
        // If a proxy is forwarding requests to this server, the public URLs will be different.
        const { proxyDocumentURL, proxyImageBaseURL, proxyURL } = this.config;
        const state = Object.assign({}, this._state);
        // TODO: Remove check for existing documentURL (see updateURLs method).
        if (proxyDocumentURL && this._state.documentURL) {
            state.documentURL = proxyDocumentURL;
        }
        if (proxyImageBaseURL)
            state.imageBaseURL = proxyImageBaseURL;
        if (proxyURL)
            state.url = proxyURL;
        return state;
    }
    setProject(project) {
        if (this.project) {
            this.project.stop();
        }
        this.project = project;
        this.projectPackageService.setProject(project);
        this.commandHandler = project.commandHandler;
        const app = this.expressApp;
        // must make sure design images are fully cachable
        app.use("/design/images", express.static(path.join(project.path, "design", "images"), {
            setHeaders: setLongCache,
        }));
        app.use("/.cache", express.static(path.join(project.path, ".cache"), {
            setHeaders: setLongCache,
        }));
        // normal images are under user control, should invalidate after a while
        app.use("/images", express.static(path.join(project.path, "images"), {
            setHeaders: function (res) {
                res.setHeader("Cache-Control", "public, must-revalidate, max-age=36000");
                res.setHeader("Pragma", "");
                res.setHeader("Surrogate-Control", "");
            },
        }));
        // redirect / and /index.html to preview/preview.html
        if (project.paths.static) {
            // This works because the static middleware will call next when not found
            app.get("/", function (req, res) {
                if (req.path === "/" || req.path === "/index.html") {
                    res.redirect("/preview/");
                }
            });
            // Needed to make the route above work
            app.use("/preview", express.static(path.join(project.paths.static, "Vekter"), { index: "preview.html" }));
            app.use("/_app/resources", express.static(project.paths.static));
        }
        app.use("/", express.static(project.path));
        const lazyMulter = lazyLoadMulter();
        const metadataUploadHandler = lazyMulter({ storage: lazyMulter.memoryStorage() }).single("resource");
        app.post("/upload/metadata/:resourceFilename", middleware.isAuthenticated, metadataUploadHandler, (req, res) => {
            const resourceFilename = path.basename(req.params.resourceFilename).toLowerCase();
            const isReadme = "readme.md" === resourceFilename;
            const dest = isReadme
                ? path.join(project.path, "README.md")
                : path.join(project.paths.metadata, resourceFilename);
            fs.writeFile(dest, req.file.buffer, err => {
                if (err) {
                    logger.warn(err);
                    res.sendStatus(400);
                    return;
                }
                res.sendStatus(200);
            });
        });
        this.updateURLs();
        // Reload the clients, because we just now mounted the `_app/resources` path
        this.project.reloadClients();
    }
    setup() {
        this.io.on("connect", socket => {
            Object.keys(ServerCommand).forEach((command) => {
                socket.on(command, info => {
                    if (!this.handleServerCommand(socket, command, info)) {
                        this.commandHandler && this.commandHandler(command, info);
                    }
                });
            });
            // Send the state over the just connected socket
            const state = this.state;
            socket.emit("state", state);
            this.projectStateService.stateChanged(state);
            // Send the script at load (for dev), but only to the socket connecting!
            this.project && this.project.sendScript({ socket, scriptsToSend: "all" });
        });
    }
    // Returns true if handled by server
    handleServerCommand(socket, command, info) {
        // Hijack commands that don’t really involve the project.
        // Returning `false` will let the commandHandler get involved
        // Public commands (accessible without authentication)
        switch (command) {
            // Used by all preview clients, in the app and via live preview
            case "joinRoom": {
                if (!info.room)
                    return true;
                socket.join(info.room);
                if (info.room === "preview") {
                    if (this.rawCanvasData) {
                        socket.emit("updateCanvasData", this.rawCanvasData);
                    }
                    socket.emit("updatePreview", this.previewData);
                }
                return true;
            }
            // Used when preview is opened in the browser
            case "metrics": {
                this.io.emit("metrics", { type: info.type });
                return true;
            }
            // Used for console, only in the app
            case "previewInspectorUpdate": {
                const { previewInspectorHasWarnings, previewInspectorHasErrors } = info;
                const { previewInspectorHasWarnings: previousWarnings, previewInspectorHasErrors: previousErrors, } = this.state;
                const stateDidChange = previousErrors !== previewInspectorHasErrors || previousWarnings !== previewInspectorHasWarnings;
                if (stateDidChange) {
                    this.setState({ previewInspectorHasWarnings, previewInspectorHasErrors });
                }
                return true;
            }
        }
        if (process.env.FRAMER_ENV === "test") {
            switch (command) {
                case "runPerformanceTests": {
                    this.io.sockets.emit("runPerformanceTests");
                    return true;
                }
                case "clientConnected": {
                    this.io.sockets.emit("clientConnected");
                    return true;
                }
                case "performanceTestsComplete": {
                    this.io.sockets.emit("performanceTestsComplete", info);
                    return true;
                }
            }
        }
        const { token } = socket.handshake.query;
        const { AUTHORIZATION_TOKEN: expectedToken } = process.env;
        if (expectedToken && token !== expectedToken) {
            // Don’t allow further processing!
            return true;
        }
        switch (command) {
            case "startLiveSharing": {
                if (this.liveSharing) {
                    this.liveSharing.start(this.httpAddress().port);
                }
                return true;
            }
            case "stopLiveSharing": {
                if (this.liveSharing) {
                    this.liveSharing.stop();
                }
                return true;
            }
            case "updatePreview": {
                this.previewData = info.previewData || null;
                this.io.to("preview").emit("updatePreview", info.previewData);
                return true;
            }
            case "togglePreviewInspector": {
                this.io.to("preview").emit("togglePreviewInspector");
                return true;
            }
            case "updateCanvasData": {
                this.rawCanvasData = info.canvasData || null;
                this.io.to("preview").emit("updateCanvasData", info.canvasData);
                return false; // Because we still want the project to handle this command too!
            }
            case "buildStandaloneExport": {
                if (!this.project || !info.path)
                    return true;
                this.project
                    .buildStandalone(info.path, info.previewData)
                    .then(() => {
                    socket.emit("buildStandaloneExportDone", "ok");
                })
                    .catch(error => {
                    logger.error(error);
                    socket.emit("buildStandaloneExportDone", error && error.message ? error.message : error);
                });
                return true;
            }
            case "setProjectDir": {
                const { dir } = info;
                if (!dir)
                    return true;
                if (!this.config)
                    return true;
                if (this.config.projectPath === dir)
                    return true;
                this.config.projectPath = dir;
                const project = new project_1.Project(this.config);
                project._server = this;
                this.setProject(project);
                project.onServerStart();
                (() => __awaiter(this, void 0, void 0, function* () {
                    yield project.install();
                    project.watch();
                    yield project.updatePackageInfo();
                }))();
                return true;
            }
            case "installFramerLibrary": {
                const { version } = info;
                if (!version)
                    return true;
                this.installFramerLibrary(version);
                return true;
            }
            default: {
                return false;
            }
        }
    }
    installFramerLibrary(version) {
        if (!this.project)
            return;
        this.project.installFramer(version);
    }
    start(port = 3000) {
        let tryPort = typeof port === "number" ? port : port[0];
        const maxPort = typeof port === "number" ? port : port[1];
        // When setting a host (which we want, to prevent leaking info to the network),
        // we also need to set “exclusive”, else the server will end up pooling with other
        // servers.
        const listenOptions = { host: "127.0.0.1", exclusive: true };
        return new Promise((resolve, reject) => {
            const onError = error => {
                if (error.code === "EADDRINUSE" && tryPort < maxPort) {
                    this.http.listen(Object.assign({}, listenOptions, { port: ++tryPort })); // Retry
                }
                else {
                    this.http.removeListener("error", onError);
                    this.http.removeListener("listening", onListening);
                    reject(error);
                }
            };
            const onListening = () => {
                const { address, port: httpPort } = this.httpAddress();
                this.http.removeListener("error", onError);
                this.setState({
                    url: `http://${address}:${httpPort}`,
                    filename: this.project && path.basename(this.project.path),
                    running: true,
                });
                if (this.liveSharing) {
                    this.liveSharing.enable();
                }
                this.updateURLs();
                resolve(httpPort);
            };
            this.http.on("error", onError);
            this.http.once("listening", onListening);
            this.http.listen(Object.assign({}, listenOptions, { port: tryPort }));
        });
    }
    hasPackageInfo(packageId) {
        return packageId in this._state.packagesInfo;
    }
    addPackageInfo(info) {
        const packageIds = Object.keys(info);
        const newPackages = packageIds.filter(packageId => !this.hasPackageInfo(packageId));
        if (newPackages.length === 0)
            return;
        const packagesInfo = Object.assign({}, this._state.packagesInfo);
        newPackages.forEach(newPackgeId => {
            let value = info[newPackgeId];
            if (value !== null && typeof value !== "object") {
                value = null;
            }
            packagesInfo[newPackgeId] = value;
        });
        this.setState({ packagesInfo });
    }
    httpAddress() {
        // The adress will only be a string if the server is listening on a pipe or a socket: https://nodejs.org/dist/latest-v10.x/docs/api/net.html#net_server_address
        // So it's safe to cast it here, because we use the APIs in a way that this will never be a string
        return this.http.address();
    }
    registerTask(name, task, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const taskId = uuid();
            this.addTaskToState(taskId, name, context);
            try {
                yield task;
            }
            finally {
                this.removeTaskFromState(taskId);
            }
        });
    }
    runAsTask(name, task, context) {
        return __awaiter(this, void 0, void 0, function* () {
            // Although registerTask is async, we intentionally don't wait for it here
            this.registerTask(name, task, context);
            return task;
        });
    }
    addTaskToState(id, name, context) {
        const tasks = Object.assign({}, this.state.tasks);
        tasks[id] = context ? { name, context } : { name };
        this.setState({ tasks });
    }
    removeTaskFromState(id) {
        const tasks = Object.assign({}, this.state.tasks);
        delete tasks[id];
        this.setState({ tasks });
    }
    setState(state) {
        Object.assign(this._state, state);
        // Log to stdout, used by the app (at least for the first state)
        logger.log(JSON.stringify(this._state));
        // Send the state over all connected sockets
        this.io.emit("state", this.state);
        this.projectStateService.stateChanged(this.state);
    }
    updateURLs() {
        if (!this.project || !this.project.path || !this.state.url)
            return;
        const projectPath = this.project.path;
        const { url } = this.state;
        let documentURL;
        if (fs.existsSync(path.join(projectPath, "design/document.json"))) {
            // TODO: Add another state property that says if document.json
            //       file exists, and always send this URL.
            documentURL = `${url}/design/document.json`;
        }
        this.setState({ documentURL, imageBaseURL: `${url}/design/images/`, hasProject: true });
    }
}
exports.Server = Server;
function pathToFileURL(str) {
    if (typeof str !== "string") {
        throw new Error("Expected a string");
    }
    let pathName = path.resolve(str).replace(/\\/g, "/");
    // Windows drive letter must be prefixed with a slash
    if (pathName[0] !== "/") {
        pathName = "/" + pathName;
    }
    return encodeURI("file://" + pathName);
}
// Lazy loading for start-up performance
const lazyLoadModule = (name) => () => require(name);
const lazyLoadRequest = lazyLoadModule("request");
const lazyLoadMulter = lazyLoadModule("multer");
