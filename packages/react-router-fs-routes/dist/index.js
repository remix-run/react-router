/**
 * @react-router/fs-routes v8.0.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import fs from "node:fs";
import path from "node:path";
import { getAppDirectory } from "@react-router/dev/routes";
import { makeRe } from "minimatch";
//#region manifest.ts
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
		if (parentId === rootId) routeConfig.push(route);
		else {
			let parentRoute = parentId && routeConfigById[parentId];
			if (parentRoute) {
				parentRoute.children = parentRoute.children || [];
				parentRoute.children.push(route);
			}
		}
	}
	return routeConfig;
}
//#endregion
//#region normalizeSlashes.ts
function normalizeSlashes(file) {
	return file.replaceAll(path.win32.sep, "/");
}
//#endregion
//#region flatRoutes.ts
const routeModuleExts = [
	".js",
	".jsx",
	".ts",
	".tsx",
	".md",
	".mdx"
];
const PrefixLookupTrieEndSymbol = Symbol("PrefixLookupTrieEndSymbol");
var PrefixLookupTrie = class {
	root = { [PrefixLookupTrieEndSymbol]: false };
	add(value) {
		if (!value) throw new Error("Cannot add empty string to PrefixLookupTrie");
		let node = this.root;
		for (let char of value) {
			if (!node[char]) node[char] = { [PrefixLookupTrieEndSymbol]: false };
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
		for (let char of Object.keys(node)) this.#findAndRemoveRecursive(values, node[char], prefix + char, filter);
		if (node[PrefixLookupTrieEndSymbol] && filter(prefix)) {
			node[PrefixLookupTrieEndSymbol] = false;
			values.push(prefix);
		}
		return values;
	}
};
function flatRoutes$1(appDirectory, ignoredFilePatterns = [], prefix = "routes") {
	let ignoredFileRegex = Array.from(new Set(["**/.*", ...ignoredFilePatterns])).map((re) => makeRe(re)).filter((re) => !!re);
	let routesDir = path.join(appDirectory, prefix);
	if (!findFile(appDirectory, "root", routeModuleExts)) throw new Error(`Could not find a root route module in the app directory: ${appDirectory}`);
	if (!fs.existsSync(routesDir)) throw new Error(`Could not find the routes directory: ${routesDir}. Did you forget to create it?`);
	let entries = fs.readdirSync(routesDir, {
		withFileTypes: true,
		encoding: "utf-8"
	});
	let routes = [];
	for (let entry of entries) {
		let filepath = normalizeSlashes(path.join(routesDir, entry.name));
		let route = null;
		if (entry.isDirectory()) route = findRouteModuleForFolder(appDirectory, filepath, ignoredFileRegex);
		else if (entry.isFile()) route = findRouteModuleForFile(appDirectory, filepath, ignoredFileRegex);
		if (route) routes.push(route);
	}
	return flatRoutesUniversal(appDirectory, routes, prefix);
}
function flatRoutesUniversal(appDirectory, routes, prefix = "routes") {
	let urlConflicts = /* @__PURE__ */ new Map();
	let routeManifest = {};
	let prefixLookup = new PrefixLookupTrie();
	let uniqueRoutes = /* @__PURE__ */ new Map();
	let routeIdConflicts = /* @__PURE__ */ new Map();
	let normalizedApp = normalizeSlashes(appDirectory);
	let appWithPrefix = path.posix.join(normalizedApp, prefix);
	let routeIds = /* @__PURE__ */ new Map();
	for (let file of routes) {
		let normalizedFile = normalizeSlashes(file);
		let routeExt = path.extname(normalizedFile);
		let routeDir = path.dirname(normalizedFile);
		let routeId = routeDir === appWithPrefix ? path.posix.relative(normalizedApp, normalizedFile).slice(0, -routeExt.length) : path.posix.relative(normalizedApp, routeDir);
		let conflict = routeIds.get(routeId);
		if (conflict) {
			let currentConflicts = routeIdConflicts.get(routeId);
			if (!currentConflicts) currentConflicts = [path.posix.relative(normalizedApp, conflict)];
			currentConflicts.push(path.posix.relative(normalizedApp, normalizedFile));
			routeIdConflicts.set(routeId, currentConflicts);
			continue;
		}
		routeIds.set(routeId, normalizedFile);
	}
	let sortedRouteIds = Array.from(routeIds).sort(([a], [b]) => b.length - a.length);
	for (let [routeId, file] of sortedRouteIds) {
		let index = routeId.endsWith("_index");
		let [segments, raw] = getRouteSegments(routeId.slice(prefix.length + 1));
		let pathname = createRoutePath(segments, raw, index);
		routeManifest[routeId] = {
			file: path.posix.relative(normalizedApp, file),
			id: routeId,
			path: pathname
		};
		if (index) routeManifest[routeId].index = true;
		let childRouteIds = prefixLookup.findAndRemove(routeId, (value) => {
			return [".", "/"].includes(value.slice(routeId.length).charAt(0));
		});
		prefixLookup.add(routeId);
		if (childRouteIds.length > 0) for (let childRouteId of childRouteIds) routeManifest[childRouteId].parentId = routeId;
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
		if (parentConfig?.path && pathname) pathname = pathname.slice(parentConfig.path.length).replace(/^\//, "").replace(/\/$/, "");
		if (!config.parentId) config.parentId = "root";
		config.path = pathname || void 0;
		/**
		* We do not try to detect path collisions for pathless layout route
		* files because, by definition, they create the potential for route
		* collisions _at that level in the tree_.
		*
		* Consider example where a user may want multiple pathless layout routes
		* for different subfolders
		*
		*   routes/
		*     account.tsx
		*     account._private.tsx
		*     account._private.orders.tsx
		*     account._private.profile.tsx
		*     account._public.tsx
		*     account._public.login.tsx
		*     account._public.perks.tsx
		*
		* In order to support both a public and private layout for `/account/*`
		* URLs, we are creating a mutually exclusive set of URLs beneath 2
		* separate pathless layout routes.  In this case, the route paths for
		* both account._public.tsx and account._private.tsx is the same
		* (/account), but we're again not expecting to match at that level.
		*
		* By only ignoring this check when the final portion of the filename is
		* pathless, we will still detect path collisions such as:
		*
		*   routes/parent._pathless.foo.tsx
		*   routes/parent._pathless2.foo.tsx
		*
		* and
		*
		*   routes/parent._pathless/index.tsx
		*   routes/parent._pathless2/index.tsx
		*/
		let lastRouteSegment = config.id.replace(new RegExp(`^${prefix}/`), "").split(".").pop();
		if (lastRouteSegment && lastRouteSegment.startsWith("_") && lastRouteSegment !== "_index") continue;
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
	if (routeIdConflicts.size > 0) for (let [routeId, files] of routeIdConflicts.entries()) console.error(getRouteIdConflictErrorMessage(routeId, files));
	if (urlConflicts.size > 0) for (let [path, routes] of urlConflicts.entries()) {
		for (let i = 1; i < routes.length; i++) delete routeManifest[routes[i].id];
		let files = routes.map((r) => r.file);
		console.error(getRoutePathConflictErrorMessage(path, files));
	}
	return routeManifest;
}
function findRouteModuleForFile(appDirectory, filepath, ignoredFileRegex) {
	let relativePath = normalizeSlashes(path.relative(appDirectory, filepath));
	if (ignoredFileRegex.some((regex) => regex.test(relativePath))) return null;
	return filepath;
}
function findRouteModuleForFolder(appDirectory, filepath, ignoredFileRegex) {
	let relativePath = path.relative(appDirectory, filepath);
	if (ignoredFileRegex.some((regex) => regex.test(relativePath))) return null;
	let routeRouteModule = findFile(filepath, "route", routeModuleExts);
	let routeIndexModule = findFile(filepath, "index", routeModuleExts);
	if (routeRouteModule && routeIndexModule) {
		let [segments, raw] = getRouteSegments(path.relative(appDirectory, filepath));
		let routePath = createRoutePath(segments, raw, false);
		console.error(getRoutePathConflictErrorMessage(routePath || "/", [routeRouteModule, routeIndexModule]));
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
		let notSupportedInRR = (segment, char) => {
			throw new Error(`Route segment "${segment}" for "${routeId}" cannot contain "${char}".\nIf this is something you need, upvote this proposal for React Router https://github.com/remix-run/react-router/discussions/9822.`);
		};
		if (rawSegment.includes("*")) return notSupportedInRR(rawSegment, "*");
		if (rawSegment.includes(":")) return notSupportedInRR(rawSegment, ":");
		if (rawSegment.includes("/")) return notSupportedInRR(segment, "/");
		routeSegments.push(segment);
		rawRouteSegments.push(rawSegment);
	};
	while (index < routeId.length) {
		let char = routeId[index];
		index++;
		switch (state) {
			case "NORMAL":
				if (isSegmentSeparator(char)) {
					pushRouteSegment(routeSegment, rawRouteSegment);
					routeSegment = "";
					rawRouteSegment = "";
					state = "NORMAL";
					break;
				}
				if (char === "[") {
					state = "ESCAPE";
					rawRouteSegment += char;
					break;
				}
				if (char === "(") {
					state = "OPTIONAL";
					rawRouteSegment += char;
					break;
				}
				if (!routeSegment && char === "$") {
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
			case "ESCAPE":
				if (char === "]") {
					state = "NORMAL";
					rawRouteSegment += char;
					break;
				}
				routeSegment += char;
				rawRouteSegment += char;
				break;
			case "OPTIONAL":
				if (char === ")") {
					routeSegment += "?";
					rawRouteSegment += char;
					state = "NORMAL";
					break;
				}
				if (char === "[") {
					state = "OPTIONAL_ESCAPE";
					rawRouteSegment += char;
					break;
				}
				if (!routeSegment && char === "$") {
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
			case "OPTIONAL_ESCAPE":
				if (char === "]") {
					state = "OPTIONAL";
					rawRouteSegment += char;
					break;
				}
				routeSegment += char;
				rawRouteSegment += char;
				break;
		}
	}
	pushRouteSegment(routeSegment, rawRouteSegment);
	return [routeSegments, rawRouteSegments];
}
function createRoutePath(routeSegments, rawRouteSegments, isIndex) {
	let result = [];
	if (isIndex) routeSegments = routeSegments.slice(0, -1);
	for (let index = 0; index < routeSegments.length; index++) {
		let segment = routeSegments[index];
		let rawSegment = rawRouteSegments[index];
		if (segment.startsWith("_") && rawSegment.startsWith("_")) continue;
		if (segment.endsWith("_") && rawSegment.endsWith("_")) segment = segment.slice(0, -1);
		result.push(segment);
	}
	return result.length ? result.join("/") : void 0;
}
function getRoutePathConflictErrorMessage(pathname, routes) {
	let [taken, ...others] = routes;
	if (!pathname.startsWith("/")) pathname = "/" + pathname;
	return `⚠️ Route Path Collision: "${pathname}"\n\nThe following routes all define the same URL, only the first one will be used\n\n🟢 ${taken}\n` + others.map((route) => `⭕️️ ${route}`).join("\n") + "\n";
}
function getRouteIdConflictErrorMessage(routeId, files) {
	let [taken, ...others] = files;
	return `⚠️ Route ID Collision: "${routeId}"\n\nThe following routes all define the same Route ID, only the first one will be used\n\n🟢 ${taken}\n` + others.map((route) => `⭕️️ ${route}`).join("\n") + "\n";
}
function isSegmentSeparator(checkChar) {
	if (!checkChar) return false;
	return [
		"/",
		".",
		path.win32.sep
	].includes(checkChar);
}
function findFile(dir, basename, extensions) {
	for (let ext of extensions) {
		let name = basename + ext;
		let file = path.join(dir, name);
		if (fs.existsSync(file)) return file;
	}
}
//#endregion
//#region index.ts
/**
* Creates route config from the file system using a convention that matches
* [Remix v2's route file
* naming](https://v2.remix.run/docs/file-conventions/routes), for use
* within `routes.ts`.
*/
async function flatRoutes(options = {}) {
	let { ignoredRouteFiles = [], rootDirectory: userRootDirectory = "routes" } = options;
	let appDirectory = getAppDirectory();
	let rootDirectory = path.resolve(appDirectory, userRootDirectory);
	let prefix = normalizeSlashes(path.relative(appDirectory, rootDirectory));
	return routeManifestToRouteConfig(fs.existsSync(rootDirectory) ? flatRoutes$1(appDirectory, ignoredRouteFiles, prefix) : {});
}
//#endregion
export { flatRoutes };
