"use strict";
var module = require("module");
var path = require("path");
console.log(module.globalPaths);
module.globalPaths.push(path.join(__dirname, "../Vekter/src"));
module.globalPaths.push(path.join(__dirname, "../Library"));
console.log(module.globalPaths);
require("document/index");
