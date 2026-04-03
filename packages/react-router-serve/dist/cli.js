#!/usr/bin/env node
/**
 * @react-router/serve v7.14.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// cli.ts
var import_node_fs = __toESM(require("fs"));
var import_node_os = __toESM(require("os"));
var import_node_path = __toESM(require("path"));
var import_node_url = __toESM(require("url"));
var import_express = require("@react-router/express");
var import_node_fetch_server = require("@mjackson/node-fetch-server");
var import_compression = __toESM(require("compression"));
var import_express2 = __toESM(require("express"));
var import_morgan = __toESM(require("morgan"));
var import_source_map_support = __toESM(require("source-map-support"));
var import_get_port = __toESM(require("get-port"));
process.env.NODE_ENV = process.env.NODE_ENV ?? "production";
import_source_map_support.default.install({
  retrieveSourceMap: function(source) {
    let match = source.startsWith("file://");
    if (match) {
      let filePath = import_node_url.default.fileURLToPath(source);
      let sourceMapPath = `${filePath}.map`;
      if (import_node_fs.default.existsSync(sourceMapPath)) {
        return {
          url: source,
          map: import_node_fs.default.readFileSync(sourceMapPath, "utf8")
        };
      }
    }
    return null;
  }
});
run();
function isRSCServerBuild(build) {
  return Boolean(
    typeof build === "object" && build && "default" in build && typeof build.default === "object" && build.default && "fetch" in build.default && typeof build.default.fetch === "function"
  );
}
function parseNumber(raw) {
  if (raw === void 0) return void 0;
  let maybe = Number(raw);
  if (Number.isNaN(maybe)) return void 0;
  return maybe;
}
async function run() {
  let port = parseNumber(process.env.PORT) ?? await (0, import_get_port.default)({ port: 3e3 });
  let buildPathArg = process.argv[2];
  if (!buildPathArg) {
    console.error(`
  Usage: react-router-serve <server-build-path> - e.g. react-router-serve build/server/index.js`);
    process.exit(1);
  }
  let buildPath = import_node_path.default.resolve(buildPathArg);
  let buildModule = await import(import_node_url.default.pathToFileURL(buildPath).href);
  let build;
  let isRSCBuild = false;
  if (isRSCBuild = isRSCServerBuild(buildModule)) {
    const config = {
      publicPath: "/",
      assetsBuildDirectory: "../client",
      ...buildModule.unstable_reactRouterServeConfig || {}
    };
    build = {
      fetch: buildModule.default.fetch,
      publicPath: config.publicPath,
      assetsBuildDirectory: import_node_path.default.resolve(
        import_node_path.default.dirname(buildPath),
        config.assetsBuildDirectory
      )
    };
  } else {
    build = buildModule;
  }
  let onListen = () => {
    let address = process.env.HOST || Object.values(import_node_os.default.networkInterfaces()).flat().find((ip) => String(ip?.family).includes("4") && !ip?.internal)?.address;
    if (!address) {
      console.log(`[react-router-serve] http://localhost:${port}`);
    } else {
      console.log(
        `[react-router-serve] http://localhost:${port} (http://${address}:${port})`
      );
    }
  };
  let app = (0, import_express2.default)();
  app.disable("x-powered-by");
  if (!isRSCBuild) {
    app.use((0, import_compression.default)());
  }
  app.use(
    import_node_path.default.posix.join(build.publicPath, "assets"),
    import_express2.default.static(import_node_path.default.join(build.assetsBuildDirectory, "assets"), {
      immutable: true,
      maxAge: "1y"
    })
  );
  app.use(build.publicPath, import_express2.default.static(build.assetsBuildDirectory));
  app.use(import_express2.default.static("public", { maxAge: "1h" }));
  app.use((0, import_morgan.default)("tiny"));
  if (build.fetch) {
    app.all("*", (0, import_node_fetch_server.createRequestListener)(build.fetch));
  } else {
    app.all(
      "*",
      (0, import_express.createRequestHandler)({
        build: buildModule,
        mode: process.env.NODE_ENV
      })
    );
  }
  let server = process.env.HOST ? app.listen(port, process.env.HOST, onListen) : app.listen(port, onListen);
  ["SIGTERM", "SIGINT"].forEach((signal) => {
    process.once(signal, () => server?.close(console.error));
  });
}
