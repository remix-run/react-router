/**
 * @react-router/fs-routes v7.13.2
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
  flatRoutes: () => flatRoutes2
});
module.exports = __toCommonJS(index_exports);
var import_node_fs2 = __toESM(require("fs"));
var import_node_path3 = __toESM(require("path"));
var import_routes = require("@react-router/dev/routes");

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

// flatRoutes.ts
var import_node_fs = __toESM(require("fs"));
var import_node_path2 = __toESM(require("path"));
var import_minimatch = require("minimatch");

// normalizeSlashes.ts
var import_node_path = __toESM(require("path"));
function normalizeSlashes(file) {
  return file.replaceAll(import_node_path.default.win32.sep, "/");
}

// flatRoutes.ts
var routeModuleExts = [".js", ".jsx", ".ts", ".tsx", ".md", ".mdx"];
var paramPrefixChar = "$";
var escapeStart = "[";
var escapeEnd = "]";
var optionalStart = "(";
var optionalEnd = ")";
var PrefixLookupTrieEndSymbol = Symbol("PrefixLookupTrieEndSymbol");
var PrefixLookupTrie = class {
  root = {
    [PrefixLookupTrieEndSymbol]: false
  };
  add(value) {
    if (!value) throw new Error("Cannot add empty string to PrefixLookupTrie");
    let node = this.root;
    for (let char of value) {
      if (!node[char]) {
        node[char] = {
          [PrefixLookupTrieEndSymbol]: false
        };
      }
      node = node[char];
    }
    node[PrefixLookupTrieEndSymbol] = true;
  }
  findAndRemove(prefix, filter) {
    let node = this.root;
    for (let char of prefix) {
      if (!node[char]) return [];
      node = node[char];
    }
    return this.#findAndRemoveRecursive([], node, prefix, filter);
  }
  #findAndRemoveRecursive(values, node, prefix, filter) {
    for (let char of Object.keys(node)) {
      this.#findAndRemoveRecursive(values, node[char], prefix + char, filter);
    }
    if (node[PrefixLookupTrieEndSymbol] && filter(prefix)) {
      node[PrefixLookupTrieEndSymbol] = false;
      values.push(prefix);
    }
    return values;
  }
};
function flatRoutes(appDirectory, ignoredFilePatterns = [], prefix = "routes") {
  let ignoredFileRegex = Array.from(/* @__PURE__ */ new Set(["**/.*", ...ignoredFilePatterns])).map((re) => (0, import_minimatch.makeRe)(re)).filter((re) => !!re);
  let routesDir = import_node_path2.default.join(appDirectory, prefix);
  let rootRoute = findFile(appDirectory, "root", routeModuleExts);
  if (!rootRoute) {
    throw new Error(
      `Could not find a root route module in the app directory: ${appDirectory}`
    );
  }
  if (!import_node_fs.default.existsSync(routesDir)) {
    throw new Error(
      `Could not find the routes directory: ${routesDir}. Did you forget to create it?`
    );
  }
  let entries = import_node_fs.default.readdirSync(routesDir, {
    withFileTypes: true,
    encoding: "utf-8"
  });
  let routes = [];
  for (let entry of entries) {
    let filepath = normalizeSlashes(import_node_path2.default.join(routesDir, entry.name));
    let route = null;
    if (entry.isDirectory()) {
      route = findRouteModuleForFolder(
        appDirectory,
        filepath,
        ignoredFileRegex
      );
    } else if (entry.isFile()) {
      route = findRouteModuleForFile(appDirectory, filepath, ignoredFileRegex);
    }
    if (route) routes.push(route);
  }
  let routeManifest = flatRoutesUniversal(appDirectory, routes, prefix);
  return routeManifest;
}
function flatRoutesUniversal(appDirectory, routes, prefix = "routes") {
  let urlConflicts = /* @__PURE__ */ new Map();
  let routeManifest = {};
  let prefixLookup = new PrefixLookupTrie();
  let uniqueRoutes = /* @__PURE__ */ new Map();
  let routeIdConflicts = /* @__PURE__ */ new Map();
  let normalizedApp = normalizeSlashes(appDirectory);
  let appWithPrefix = import_node_path2.default.posix.join(normalizedApp, prefix);
  let routeIds = /* @__PURE__ */ new Map();
  for (let file of routes) {
    let normalizedFile = normalizeSlashes(file);
    let routeExt = import_node_path2.default.extname(normalizedFile);
    let routeDir = import_node_path2.default.dirname(normalizedFile);
    let routeId = routeDir === appWithPrefix ? import_node_path2.default.posix.relative(normalizedApp, normalizedFile).slice(0, -routeExt.length) : import_node_path2.default.posix.relative(normalizedApp, routeDir);
    let conflict = routeIds.get(routeId);
    if (conflict) {
      let currentConflicts = routeIdConflicts.get(routeId);
      if (!currentConflicts) {
        currentConflicts = [import_node_path2.default.posix.relative(normalizedApp, conflict)];
      }
      currentConflicts.push(import_node_path2.default.posix.relative(normalizedApp, normalizedFile));
      routeIdConflicts.set(routeId, currentConflicts);
      continue;
    }
    routeIds.set(routeId, normalizedFile);
  }
  let sortedRouteIds = Array.from(routeIds).sort(
    ([a], [b]) => b.length - a.length
  );
  for (let [routeId, file] of sortedRouteIds) {
    let index = routeId.endsWith("_index");
    let [segments, raw] = getRouteSegments(routeId.slice(prefix.length + 1));
    let pathname = createRoutePath(segments, raw, index);
    routeManifest[routeId] = {
      file: import_node_path2.default.posix.relative(normalizedApp, file),
      id: routeId,
      path: pathname
    };
    if (index) routeManifest[routeId].index = true;
    let childRouteIds = prefixLookup.findAndRemove(routeId, (value) => {
      return [".", "/"].includes(value.slice(routeId.length).charAt(0));
    });
    prefixLookup.add(routeId);
    if (childRouteIds.length > 0) {
      for (let childRouteId of childRouteIds) {
        routeManifest[childRouteId].parentId = routeId;
      }
    }
  }
  let parentChildrenMap = /* @__PURE__ */ new Map();
  for (let [routeId] of sortedRouteIds) {
    let config = routeManifest[routeId];
    if (!config.parentId) continue;
    let existingChildren = parentChildrenMap.get(config.parentId) || [];
    existingChildren.push(config);
    parentChildrenMap.set(config.parentId, existingChildren);
  }
  for (let [routeId] of sortedRouteIds) {
    let config = routeManifest[routeId];
    let originalPathname = config.path || "";
    let pathname = config.path;
    let parentConfig = config.parentId ? routeManifest[config.parentId] : null;
    if (parentConfig?.path && pathname) {
      pathname = pathname.slice(parentConfig.path.length).replace(/^\//, "").replace(/\/$/, "");
    }
    if (!config.parentId) config.parentId = "root";
    config.path = pathname || void 0;
    let lastRouteSegment = config.id.replace(new RegExp(`^${prefix}/`), "").split(".").pop();
    let isPathlessLayoutRoute = lastRouteSegment && lastRouteSegment.startsWith("_") && lastRouteSegment !== "_index";
    if (isPathlessLayoutRoute) {
      continue;
    }
    let conflictRouteId = originalPathname + (config.index ? "?index" : "");
    let conflict = uniqueRoutes.get(conflictRouteId);
    uniqueRoutes.set(conflictRouteId, config);
    if (conflict && (originalPathname || config.index)) {
      let currentConflicts = urlConflicts.get(originalPathname);
      if (!currentConflicts) currentConflicts = [conflict];
      currentConflicts.push(config);
      urlConflicts.set(originalPathname, currentConflicts);
      continue;
    }
  }
  if (routeIdConflicts.size > 0) {
    for (let [routeId, files] of routeIdConflicts.entries()) {
      console.error(getRouteIdConflictErrorMessage(routeId, files));
    }
  }
  if (urlConflicts.size > 0) {
    for (let [path4, routes2] of urlConflicts.entries()) {
      for (let i = 1; i < routes2.length; i++) {
        delete routeManifest[routes2[i].id];
      }
      let files = routes2.map((r) => r.file);
      console.error(getRoutePathConflictErrorMessage(path4, files));
    }
  }
  return routeManifest;
}
function findRouteModuleForFile(appDirectory, filepath, ignoredFileRegex) {
  let relativePath = normalizeSlashes(import_node_path2.default.relative(appDirectory, filepath));
  let isIgnored = ignoredFileRegex.some((regex) => regex.test(relativePath));
  if (isIgnored) return null;
  return filepath;
}
function findRouteModuleForFolder(appDirectory, filepath, ignoredFileRegex) {
  let relativePath = import_node_path2.default.relative(appDirectory, filepath);
  let isIgnored = ignoredFileRegex.some((regex) => regex.test(relativePath));
  if (isIgnored) return null;
  let routeRouteModule = findFile(filepath, "route", routeModuleExts);
  let routeIndexModule = findFile(filepath, "index", routeModuleExts);
  if (routeRouteModule && routeIndexModule) {
    let [segments, raw] = getRouteSegments(
      import_node_path2.default.relative(appDirectory, filepath)
    );
    let routePath = createRoutePath(segments, raw, false);
    console.error(
      getRoutePathConflictErrorMessage(routePath || "/", [
        routeRouteModule,
        routeIndexModule
      ])
    );
  }
  return routeRouteModule || routeIndexModule || null;
}
function getRouteSegments(routeId) {
  let routeSegments = [];
  let rawRouteSegments = [];
  let index = 0;
  let routeSegment = "";
  let rawRouteSegment = "";
  let state = "NORMAL";
  let pushRouteSegment = (segment, rawSegment) => {
    if (!segment) return;
    let notSupportedInRR = (segment2, char) => {
      throw new Error(
        `Route segment "${segment2}" for "${routeId}" cannot contain "${char}".
If this is something you need, upvote this proposal for React Router https://github.com/remix-run/react-router/discussions/9822.`
      );
    };
    if (rawSegment.includes("*")) {
      return notSupportedInRR(rawSegment, "*");
    }
    if (rawSegment.includes(":")) {
      return notSupportedInRR(rawSegment, ":");
    }
    if (rawSegment.includes("/")) {
      return notSupportedInRR(segment, "/");
    }
    routeSegments.push(segment);
    rawRouteSegments.push(rawSegment);
  };
  while (index < routeId.length) {
    let char = routeId[index];
    index++;
    switch (state) {
      case "NORMAL": {
        if (isSegmentSeparator(char)) {
          pushRouteSegment(routeSegment, rawRouteSegment);
          routeSegment = "";
          rawRouteSegment = "";
          state = "NORMAL";
          break;
        }
        if (char === escapeStart) {
          state = "ESCAPE";
          rawRouteSegment += char;
          break;
        }
        if (char === optionalStart) {
          state = "OPTIONAL";
          rawRouteSegment += char;
          break;
        }
        if (!routeSegment && char === paramPrefixChar) {
          if (index === routeId.length) {
            routeSegment += "*";
            rawRouteSegment += char;
          } else {
            routeSegment += ":";
            rawRouteSegment += char;
          }
          break;
        }
        routeSegment += char;
        rawRouteSegment += char;
        break;
      }
      case "ESCAPE": {
        if (char === escapeEnd) {
          state = "NORMAL";
          rawRouteSegment += char;
          break;
        }
        routeSegment += char;
        rawRouteSegment += char;
        break;
      }
      case "OPTIONAL": {
        if (char === optionalEnd) {
          routeSegment += "?";
          rawRouteSegment += char;
          state = "NORMAL";
          break;
        }
        if (char === escapeStart) {
          state = "OPTIONAL_ESCAPE";
          rawRouteSegment += char;
          break;
        }
        if (!routeSegment && char === paramPrefixChar) {
          if (index === routeId.length) {
            routeSegment += "*";
            rawRouteSegment += char;
          } else {
            routeSegment += ":";
            rawRouteSegment += char;
          }
          break;
        }
        routeSegment += char;
        rawRouteSegment += char;
        break;
      }
      case "OPTIONAL_ESCAPE": {
        if (char === escapeEnd) {
          state = "OPTIONAL";
          rawRouteSegment += char;
          break;
        }
        routeSegment += char;
        rawRouteSegment += char;
        break;
      }
    }
  }
  pushRouteSegment(routeSegment, rawRouteSegment);
  return [routeSegments, rawRouteSegments];
}
function createRoutePath(routeSegments, rawRouteSegments, isIndex) {
  let result = [];
  if (isIndex) {
    routeSegments = routeSegments.slice(0, -1);
  }
  for (let index = 0; index < routeSegments.length; index++) {
    let segment = routeSegments[index];
    let rawSegment = rawRouteSegments[index];
    if (segment.startsWith("_") && rawSegment.startsWith("_")) {
      continue;
    }
    if (segment.endsWith("_") && rawSegment.endsWith("_")) {
      segment = segment.slice(0, -1);
    }
    result.push(segment);
  }
  return result.length ? result.join("/") : void 0;
}
function getRoutePathConflictErrorMessage(pathname, routes) {
  let [taken, ...others] = routes;
  if (!pathname.startsWith("/")) {
    pathname = "/" + pathname;
  }
  return `\u26A0\uFE0F Route Path Collision: "${pathname}"

The following routes all define the same URL, only the first one will be used

\u{1F7E2} ${taken}
` + others.map((route) => `\u2B55\uFE0F\uFE0F ${route}`).join("\n") + "\n";
}
function getRouteIdConflictErrorMessage(routeId, files) {
  let [taken, ...others] = files;
  return `\u26A0\uFE0F Route ID Collision: "${routeId}"

The following routes all define the same Route ID, only the first one will be used

\u{1F7E2} ${taken}
` + others.map((route) => `\u2B55\uFE0F\uFE0F ${route}`).join("\n") + "\n";
}
function isSegmentSeparator(checkChar) {
  if (!checkChar) return false;
  return ["/", ".", import_node_path2.default.win32.sep].includes(checkChar);
}
function findFile(dir, basename, extensions) {
  for (let ext of extensions) {
    let name = basename + ext;
    let file = import_node_path2.default.join(dir, name);
    if (import_node_fs.default.existsSync(file)) return file;
  }
  return void 0;
}

// index.ts
async function flatRoutes2(options = {}) {
  let { ignoredRouteFiles = [], rootDirectory: userRootDirectory = "routes" } = options;
  let appDirectory = (0, import_routes.getAppDirectory)();
  let rootDirectory = import_node_path3.default.resolve(appDirectory, userRootDirectory);
  let relativeRootDirectory = import_node_path3.default.relative(appDirectory, rootDirectory);
  let prefix = normalizeSlashes(relativeRootDirectory);
  let routes = import_node_fs2.default.existsSync(rootDirectory) ? flatRoutes(appDirectory, ignoredRouteFiles, prefix) : {};
  return routeManifestToRouteConfig(routes);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  flatRoutes
});
