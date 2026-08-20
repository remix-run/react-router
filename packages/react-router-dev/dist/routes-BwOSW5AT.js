/**
 * @react-router/dev v8.3.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import * as Path from "pathe";
import pick from "lodash/pick.js";
import * as v from "valibot";
//#region invariant.ts
function invariant(value, message) {
	if (value === false || value === null || typeof value === "undefined") {
		console.error("The following error is a bug in React Router; please open an issue! https://github.com/remix-run/react-router/issues/new/choose");
		throw new Error(message);
	}
}
//#endregion
//#region config/routes.ts
function setAppDirectory(directory) {
	globalThis.__reactRouterAppDirectory = directory;
}
/**
* Provides the absolute path to the app directory, for use within `routes.ts`.
* This is designed to support resolving file system routes.
*/
function getAppDirectory() {
	invariant(globalThis.__reactRouterAppDirectory);
	return globalThis.__reactRouterAppDirectory;
}
const routeConfigEntrySchema = v.pipe(v.custom((value) => {
	return !(typeof value === "object" && value !== null && "then" in value && "catch" in value);
}, "Invalid type: Expected object but received a promise. Did you forget to await?"), v.object({
	id: v.optional(v.pipe(v.string(), v.notValue("root", "A route cannot use the reserved id 'root'."))),
	path: v.optional(v.string()),
	index: v.optional(v.boolean()),
	caseSensitive: v.optional(v.boolean()),
	file: v.string(),
	children: v.optional(v.array(v.lazy(() => routeConfigEntrySchema)))
}));
const resolvedRouteConfigSchema = v.array(routeConfigEntrySchema);
function validateRouteConfig({ routeConfigFile, routeConfig }) {
	if (!routeConfig) return {
		valid: false,
		message: `Route config must be the default export in "${routeConfigFile}".`
	};
	if (!Array.isArray(routeConfig)) return {
		valid: false,
		message: `Route config in "${routeConfigFile}" must be an array.`
	};
	let { issues } = v.safeParse(resolvedRouteConfigSchema, routeConfig);
	if (issues?.length) {
		let { root, nested } = v.flatten(issues);
		return {
			valid: false,
			message: [
				`Route config in "${routeConfigFile}" is invalid.`,
				root ? `${root}` : [],
				nested ? Object.entries(nested).map(([path, message]) => `Path: routes.${path}\n${message}`) : []
			].flat().join("\n\n")
		};
	}
	return {
		valid: true,
		routeConfig
	};
}
const createConfigRouteOptionKeys = [
	"id",
	"index",
	"caseSensitive"
];
function route(path, file, optionsOrChildren, children) {
	let options = {};
	if (Array.isArray(optionsOrChildren) || !optionsOrChildren) children = optionsOrChildren;
	else options = optionsOrChildren;
	return {
		file,
		children,
		path: path ?? void 0,
		...pick(options, createConfigRouteOptionKeys)
	};
}
const createIndexOptionKeys = ["id"];
/**
* Helper function for creating a route config entry for an index route, for use
* within `routes.ts`.
*/
function index(file, options) {
	return {
		file,
		index: true,
		...pick(options, createIndexOptionKeys)
	};
}
const createLayoutOptionKeys = ["id"];
function layout(file, optionsOrChildren, children) {
	let options = {};
	if (Array.isArray(optionsOrChildren) || !optionsOrChildren) children = optionsOrChildren;
	else options = optionsOrChildren;
	return {
		file,
		children,
		...pick(options, createLayoutOptionKeys)
	};
}
/**
* Helper function for adding a path prefix to a set of routes without needing
* to introduce a parent route file, for use within `routes.ts`.
*/
function prefix(prefixPath, routes) {
	return routes.map((route) => {
		if (route.index || typeof route.path === "string") return {
			...route,
			path: route.path ? joinRoutePaths(prefixPath, route.path) : prefixPath,
			children: route.children
		};
		else if (route.children) return {
			...route,
			children: prefix(prefixPath, route.children)
		};
		return route;
	});
}
/**
* Creates a set of route config helpers that resolve file paths relative to the
* given directory, for use within `routes.ts`. This is designed to support
* splitting route config into multiple files within different directories.
*/
function relative(directory) {
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
		prefix
	};
}
function configRoutesToRouteManifest(appDirectory, routes) {
	let routeManifest = {};
	function walk(route, parentId) {
		let id = route.id || createRouteId(route.file);
		let manifestItem = {
			id,
			parentId,
			file: Path.isAbsolute(route.file) ? Path.relative(appDirectory, route.file) : route.file,
			path: route.path,
			index: route.index,
			caseSensitive: route.caseSensitive
		};
		if (routeManifest.hasOwnProperty(id)) throw new Error(`Unable to define routes with duplicate route id: "${id}"`);
		routeManifest[id] = manifestItem;
		if (route.children) for (let child of route.children) walk(child, id);
	}
	for (let route of routes) walk(route);
	return routeManifest;
}
function createRouteId(file) {
	return Path.normalize(stripFileExtension(file));
}
function stripFileExtension(file) {
	return file.replace(/\.[a-z0-9]+$/i, "");
}
function joinRoutePaths(path1, path2) {
	return [path1.replace(/\/+$/, ""), path2.replace(/^\/+/, "")].join("/");
}
//#endregion
export { prefix as a, setAppDirectory as c, layout as i, validateRouteConfig as l, getAppDirectory as n, relative as o, index as r, route as s, configRoutesToRouteManifest as t, invariant as u };
