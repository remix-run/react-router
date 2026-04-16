/**
 * @react-router/remix-routes-option-adapter v7.14.1
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
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var index_exports = {};
__export(index_exports, {
  remixRoutesOptionAdapter: () => remixRoutesOptionAdapter
});
module.exports = __toCommonJS(index_exports);

// manifest.ts
function routeManifestToRouteConfig(routeManifest, rootId = "root") {
  let routeConfigById = {};
  for (let id in routeManifest) {
    let route = routeManifest[id];
    routeConfigById[id] = {
      id: route.id,
      file: route.file,
      path: route.path,
      index: route.index,
      caseSensitive: route.caseSensitive
    };
  }
  let routeConfig = [];
  for (let id in routeConfigById) {
    let route = routeConfigById[id];
    let parentId = routeManifest[route.id].parentId;
    if (parentId === rootId) {
      routeConfig.push(route);
    } else {
      let parentRoute = parentId && routeConfigById[parentId];
      if (parentRoute) {
        parentRoute.children = parentRoute.children || [];
        parentRoute.children.push(route);
      }
    }
  }
  return routeConfig;
}

// normalizeSlashes.ts
var import_node_path = __toESM(require("path"));
function normalizeSlashes(file) {
  return file.replaceAll(import_node_path.default.win32.sep, "/");
}

// defineRoutes.ts
var defineRoutes = (callback) => {
  let routes = /* @__PURE__ */ Object.create(null);
  let parentRoutes = [];
  let alreadyReturned = false;
  let defineRoute = (path2, file, optionsOrChildren, children) => {
    if (alreadyReturned) {
      throw new Error(
        "You tried to define routes asynchronously but started defining routes before the async work was done. Please await all async data before calling `defineRoutes()`"
      );
    }
    let options;
    if (typeof optionsOrChildren === "function") {
      options = {};
      children = optionsOrChildren;
    } else {
      options = optionsOrChildren || {};
    }
    let route = {
      path: path2 ? path2 : void 0,
      index: options.index ? true : void 0,
      caseSensitive: options.caseSensitive ? true : void 0,
      id: options.id || createRouteId(file),
      parentId: parentRoutes.length > 0 ? parentRoutes[parentRoutes.length - 1].id : "root",
      file
    };
    if (route.id in routes) {
      throw new Error(
        `Unable to define routes with duplicate route id: "${route.id}"`
      );
    }
    routes[route.id] = route;
    if (children) {
      parentRoutes.push(route);
      children();
      parentRoutes.pop();
    }
  };
  callback(defineRoute);
  alreadyReturned = true;
  return routes;
};
function createRouteId(file) {
  return normalizeSlashes(stripFileExtension(file));
}
function stripFileExtension(file) {
  return file.replace(/\.[a-z0-9]+$/i, "");
}

// index.ts
async function remixRoutesOptionAdapter(routes) {
  let routeManifest = await routes(defineRoutes);
  return routeManifestToRouteConfig(routeManifest);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  remixRoutesOptionAdapter
});
