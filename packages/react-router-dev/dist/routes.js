/**
 * @react-router/dev v7.14.0
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

// routes.ts
var routes_exports = {};
__export(routes_exports, {
  getAppDirectory: () => getAppDirectory,
  index: () => index,
  layout: () => layout,
  prefix: () => prefix,
  relative: () => relative2,
  route: () => route
});
module.exports = __toCommonJS(routes_exports);

// config/routes.ts
var Path = __toESM(require("pathe"));
var v = __toESM(require("valibot"));
var import_pick = __toESM(require("lodash/pick"));

// invariant.ts
function invariant(value, message) {
  if (value === false || value === null || typeof value === "undefined") {
    console.error(
      "The following error is a bug in React Router; please open an issue! https://github.com/remix-run/react-router/issues/new/choose"
    );
    throw new Error(message);
  }
}

// config/routes.ts
function getAppDirectory() {
  invariant(globalThis.__reactRouterAppDirectory);
  return globalThis.__reactRouterAppDirectory;
}
var routeConfigEntrySchema = v.pipe(
  v.custom((value) => {
    return !(typeof value === "object" && value !== null && "then" in value && "catch" in value);
  }, "Invalid type: Expected object but received a promise. Did you forget to await?"),
  v.object({
    id: v.optional(
      v.pipe(
        v.string(),
        v.notValue("root", "A route cannot use the reserved id 'root'.")
      )
    ),
    path: v.optional(v.string()),
    index: v.optional(v.boolean()),
    caseSensitive: v.optional(v.boolean()),
    file: v.string(),
    children: v.optional(v.array(v.lazy(() => routeConfigEntrySchema)))
  })
);
var resolvedRouteConfigSchema = v.array(routeConfigEntrySchema);
var createConfigRouteOptionKeys = [
  "id",
  "index",
  "caseSensitive"
];
function route(path, file, optionsOrChildren, children) {
  let options = {};
  if (Array.isArray(optionsOrChildren) || !optionsOrChildren) {
    children = optionsOrChildren;
  } else {
    options = optionsOrChildren;
  }
  return {
    file,
    children,
    path: path ?? void 0,
    ...(0, import_pick.default)(options, createConfigRouteOptionKeys)
  };
}
var createIndexOptionKeys = ["id"];
function index(file, options) {
  return {
    file,
    index: true,
    ...(0, import_pick.default)(options, createIndexOptionKeys)
  };
}
var createLayoutOptionKeys = ["id"];
function layout(file, optionsOrChildren, children) {
  let options = {};
  if (Array.isArray(optionsOrChildren) || !optionsOrChildren) {
    children = optionsOrChildren;
  } else {
    options = optionsOrChildren;
  }
  return {
    file,
    children,
    ...(0, import_pick.default)(options, createLayoutOptionKeys)
  };
}
function prefix(prefixPath, routes) {
  return routes.map((route2) => {
    if (route2.index || typeof route2.path === "string") {
      return {
        ...route2,
        path: route2.path ? joinRoutePaths(prefixPath, route2.path) : prefixPath,
        children: route2.children
      };
    } else if (route2.children) {
      return {
        ...route2,
        children: prefix(prefixPath, route2.children)
      };
    }
    return route2;
  });
}
function relative2(directory) {
  return {
    /**
     * Helper function for creating a route config entry, for use within
     * `routes.ts`. Note that this helper has been scoped, meaning that file
     * path will be resolved relative to the directory provided to the
     * `relative` call that created this helper.
     */
    route: (path, file, ...rest) => {
      return route(path, Path.resolve(directory, file), ...rest);
    },
    /**
     * Helper function for creating a route config entry for an index route, for
     * use within `routes.ts`. Note that this helper has been scoped, meaning
     * that file path will be resolved relative to the directory provided to the
     * `relative` call that created this helper.
     */
    index: (file, ...rest) => {
      return index(Path.resolve(directory, file), ...rest);
    },
    /**
     * Helper function for creating a route config entry for a layout route, for
     * use within `routes.ts`. Note that this helper has been scoped, meaning
     * that file path will be resolved relative to the directory provided to the
     * `relative` call that created this helper.
     */
    layout: (file, ...rest) => {
      return layout(Path.resolve(directory, file), ...rest);
    },
    // Passthrough of helper functions that don't need relative scoping so that
    // a complete API is still provided.
    prefix
  };
}
function joinRoutePaths(path1, path2) {
  return [
    path1.replace(/\/+$/, ""),
    // Remove trailing slashes
    path2.replace(/^\/+/, "")
    // Remove leading slashes
  ].join("/");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAppDirectory,
  index,
  layout,
  prefix,
  relative,
  route
});
