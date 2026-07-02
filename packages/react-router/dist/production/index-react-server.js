/**
 * react-router v8.2.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { AsyncLocalStorage } from "node:async_hooks";
import * as React from "react";
import { parse, serialize, splitSetCookieString } from "cookie-es";
import { BrowserRouter, Form, HashRouter, Link, Links, MemoryRouter, Meta, NavLink, Navigate, Outlet, Outlet as Outlet$1, Route, Router, RouterProvider, Routes, ScrollRestoration, StaticRouter, StaticRouterProvider, UNSAFE_AwaitContextProvider, UNSAFE_WithComponentProps, UNSAFE_WithErrorBoundaryProps, UNSAFE_WithHydrateFallbackProps, unstable_HistoryRouter } from "react-router/internal/react-server-client";
//#region lib/router/url.ts
const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|[\\/]{2})/i;
//#endregion
//#region lib/router/history.ts
function invariant$1(value, message) {
	if (value === false || value === null || typeof value === "undefined") throw new Error(message);
}
function warning(cond, message) {
	if (!cond) {
		if (typeof console !== "undefined") console.warn(message);
		try {
			throw new Error(message);
		} catch (e) {}
	}
}
function createKey$1() {
	return Math.random().toString(36).substring(2, 10);
}
/**
* Creates a Location object with a unique key from the given Path
*/
function createLocation(current, to, state = null, key, mask) {
	return {
		pathname: typeof current === "string" ? current : current.pathname,
		search: "",
		hash: "",
		...typeof to === "string" ? parsePath(to) : to,
		state,
		key: to && to.key || key || createKey$1(),
		mask
	};
}
/**
* Creates a string URL path from the given pathname, search, and hash components.
*
* @category Utils
*/
function createPath({ pathname = "/", search = "", hash = "" }) {
	if (search && search !== "?") pathname += search.charAt(0) === "?" ? search : "?" + search;
	if (hash && hash !== "#") pathname += hash.charAt(0) === "#" ? hash : "#" + hash;
	return pathname;
}
/**
* Parses a string URL path into its separate pathname, search, and hash components.
*
* @category Utils
*/
function parsePath(path) {
	let parsedPath = {};
	if (path) {
		let hashIndex = path.indexOf("#");
		if (hashIndex >= 0) {
			parsedPath.hash = path.substring(hashIndex);
			path = path.substring(0, hashIndex);
		}
		let searchIndex = path.indexOf("?");
		if (searchIndex >= 0) {
			parsedPath.search = path.substring(searchIndex);
			path = path.substring(0, searchIndex);
		}
		if (path) parsedPath.pathname = path;
	}
	return parsedPath;
}
//#endregion
//#region lib/router/utils.ts
/**
* Creates a type-safe {@link RouterContext} object that can be used to
* store and retrieve arbitrary values in [`action`](../../start/framework/route-module#action)s,
* [`loader`](../../start/framework/route-module#loader)s, and [middleware](../../how-to/middleware).
* Similar to React's [`createContext`](https://react.dev/reference/react/createContext),
* but specifically designed for React Router's request/response lifecycle.
*
* If a `defaultValue` is provided, it will be returned from `context.get()`
* when no value has been set for the context. Otherwise, reading this context
* when no value has been set will throw an error.
*
* ```tsx filename=app/context.ts
* import { createContext } from "react-router";
*
* // Create a context for user data
* export const userContext =
*   createContext<User | null>(null);
* ```
*
* ```tsx filename=app/middleware/auth.ts
* import { getUserFromSession } from "~/auth.server";
* import { userContext } from "~/context";
*
* export const authMiddleware = async ({
*   context,
*   request,
* }) => {
*   const user = await getUserFromSession(request);
*   context.set(userContext, user);
* };
* ```
*
* ```tsx filename=app/routes/profile.tsx
* import { userContext } from "~/context";
*
* export async function loader({
*   context,
* }: Route.LoaderArgs) {
*   const user = context.get(userContext);
*
*   if (!user) {
*     throw new Response("Unauthorized", { status: 401 });
*   }
*
*   return { user };
* }
* ```
*
* @public
* @category Utils
* @mode framework
* @mode data
* @param defaultValue An optional default value for the context. This value
* will be returned if no value has been set for this context.
* @returns A {@link RouterContext} object that can be used with
* `context.get()` and `context.set()` in [`action`](../../start/framework/route-module#action)s,
* [`loader`](../../start/framework/route-module#loader)s, and [middleware](../../how-to/middleware).
*/
function createContext(defaultValue) {
	return { defaultValue };
}
/**
* Provides methods for writing/reading values in application context in a
* type-safe way. Primarily for usage with [middleware](../../how-to/middleware).
*
* @example
* import {
*   createContext,
*   RouterContextProvider
* } from "react-router";
*
* const userContext = createContext<User | null>(null);
* const contextProvider = new RouterContextProvider();
* contextProvider.set(userContext, getUser());
* //                               ^ Type-safe
* const user = contextProvider.get(userContext);
* //    ^ User
*
* @public
* @category Utils
* @mode framework
* @mode data
*/
var RouterContextProvider = class {
	#map = /* @__PURE__ */ new Map();
	/**
	* Create a new `RouterContextProvider` instance
	* @param init An optional initial context map to populate the provider with
	*/
	constructor(init) {
		if (init) for (let [context, value] of init) this.set(context, value);
	}
	/**
	* Access a value from the context. If no value has been set for the context,
	* it will return the context's `defaultValue` if provided, or throw an error
	* if no `defaultValue` was set.
	* @param context The context to get the value for
	* @returns The value for the context, or the context's `defaultValue` if no
	* value was set
	*/
	get(context) {
		if (this.#map.has(context)) return this.#map.get(context);
		if (context.defaultValue !== void 0) return context.defaultValue;
		throw new Error("No value found for context");
	}
	/**
	* Set a value for the context. If the context already has a value set, this
	* will overwrite it.
	*
	* @param context The context to set the value for
	* @param value The value to set for the context
	* @returns {void}
	*/
	set(context, value) {
		this.#map.set(context, value);
	}
};
const unsupportedLazyRouteObjectKeys = new Set([
	"lazy",
	"caseSensitive",
	"path",
	"id",
	"index",
	"children"
]);
function isUnsupportedLazyRouteObjectKey(key) {
	return unsupportedLazyRouteObjectKeys.has(key);
}
const unsupportedLazyRouteFunctionKeys = new Set([
	"lazy",
	"caseSensitive",
	"path",
	"id",
	"index",
	"middleware",
	"children"
]);
function isUnsupportedLazyRouteFunctionKey(key) {
	return unsupportedLazyRouteFunctionKeys.has(key);
}
function isIndexRoute(route) {
	return route.index === true;
}
function defaultMapRouteProperties(route) {
	let updates = {};
	if (route.Component) Object.assign(updates, {
		element: React.createElement(route.Component),
		Component: void 0
	});
	if (route.HydrateFallback) Object.assign(updates, {
		hydrateFallbackElement: React.createElement(route.HydrateFallback),
		HydrateFallback: void 0
	});
	if (route.ErrorBoundary) Object.assign(updates, {
		errorElement: React.createElement(route.ErrorBoundary),
		ErrorBoundary: void 0
	});
	return updates;
}
function convertRoutesToDataRoutes(routes, mapRouteProperties = defaultMapRouteProperties, parentPath = [], manifest = {}, allowInPlaceMutations = false) {
	return routes.map((route, index) => {
		let treePath = [...parentPath, String(index)];
		let id = typeof route.id === "string" ? route.id : treePath.join("-");
		invariant$1(route.index !== true || !route.children, `Cannot specify children on an index route`);
		invariant$1(allowInPlaceMutations || !manifest[id], `Found a route id collision on id "${id}".  Route id's must be globally unique within Data Router usages`);
		if (isIndexRoute(route)) {
			let indexRoute = {
				...route,
				id
			};
			manifest[id] = mergeRouteUpdates(indexRoute, mapRouteProperties(indexRoute));
			return indexRoute;
		} else {
			let pathOrLayoutRoute = {
				...route,
				id,
				children: void 0
			};
			manifest[id] = mergeRouteUpdates(pathOrLayoutRoute, mapRouteProperties(pathOrLayoutRoute));
			if (route.children) pathOrLayoutRoute.children = convertRoutesToDataRoutes(route.children, mapRouteProperties, treePath, manifest, allowInPlaceMutations);
			return pathOrLayoutRoute;
		}
	});
}
function mergeRouteUpdates(route, updates) {
	return Object.assign(route, {
		...updates,
		...typeof updates.lazy === "object" && updates.lazy != null ? { lazy: {
			...route.lazy,
			...updates.lazy
		} } : {}
	});
}
/**
* Matches the given routes to a location and returns the match data.
*
* @example
* import { matchRoutes } from "react-router";
*
* let routes = [{
*   path: "/",
*   Component: Root,
*   children: [{
*     path: "dashboard",
*     Component: Dashboard,
*   }]
* }];
*
* matchRoutes(routes, "/dashboard"); // [rootMatch, dashboardMatch]
*
* @public
* @category Utils
* @param routes The array of route objects to match against.
* @param locationArg The location to match against, either a string path or a
* partial {@link Location} object
* @param basename Optional base path to strip from the location before matching.
* Defaults to `/`.
* @returns An array of matched routes, or `null` if no matches were found.
*/
function matchRoutes(routes, locationArg, basename = "/") {
	return matchRoutesImpl(routes, locationArg, basename, false);
}
function matchRoutesImpl(routes, locationArg, basename, allowPartial, precomputedBranches) {
	let pathname = stripBasename((typeof locationArg === "string" ? parsePath(locationArg) : locationArg).pathname || "/", basename);
	if (pathname == null) return null;
	let branches = precomputedBranches ?? flattenAndRankRoutes(routes);
	let matches = null;
	let decoded = decodePath(pathname);
	for (let i = 0; matches == null && i < branches.length; ++i) matches = matchRouteBranch(branches[i], decoded, allowPartial);
	return matches;
}
function convertRouteMatchToUiMatch(match, loaderData) {
	let { route, pathname, params } = match;
	return {
		id: route.id,
		pathname,
		params,
		loaderData: loaderData[route.id],
		handle: route.handle
	};
}
function flattenAndRankRoutes(routes) {
	let branches = flattenRoutes(routes);
	rankRouteBranches(branches);
	return branches;
}
function flattenRoutes(routes, branches = [], parentsMeta = [], parentPath = "", _hasParentOptionalSegments = false) {
	let flattenRoute = (route, index, hasParentOptionalSegments = _hasParentOptionalSegments, relativePath) => {
		let meta = {
			relativePath: relativePath === void 0 ? route.path || "" : relativePath,
			caseSensitive: route.caseSensitive === true,
			childrenIndex: index,
			route
		};
		if (meta.relativePath.startsWith("/")) {
			if (!meta.relativePath.startsWith(parentPath) && hasParentOptionalSegments) return;
			invariant$1(meta.relativePath.startsWith(parentPath), `Absolute route path "${meta.relativePath}" nested under path "${parentPath}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`);
			meta.relativePath = meta.relativePath.slice(parentPath.length);
		}
		let path = joinPaths([parentPath, meta.relativePath]);
		let routesMeta = parentsMeta.concat(meta);
		if (route.children && route.children.length > 0) {
			invariant$1(route.index !== true, `Index routes must not have child routes. Please remove all child routes from route path "${path}".`);
			flattenRoutes(route.children, branches, routesMeta, path, hasParentOptionalSegments);
		}
		if (route.path == null && !route.index) return;
		branches.push({
			path,
			score: computeScore(path, route.index),
			routesMeta: routesMeta.map((meta, i) => {
				let [matcher, params] = compilePath(meta.relativePath, meta.caseSensitive, i === routesMeta.length - 1);
				return {
					...meta,
					matcher,
					compiledParams: params
				};
			})
		});
	};
	routes.forEach((route, index) => {
		if (route.path === "" || !route.path?.includes("?")) flattenRoute(route, index);
		else for (let exploded of explodeOptionalSegments(route.path)) flattenRoute(route, index, true, exploded);
	});
	return branches;
}
function explodeOptionalSegments(path) {
	let segments = path.split("/");
	if (segments.length === 0) return [];
	let [first, ...rest] = segments;
	let isOptional = first.endsWith("?");
	let required = first.replace(/\?$/, "");
	if (rest.length === 0) return isOptional ? [required, ""] : [required];
	let restExploded = explodeOptionalSegments(rest.join("/"));
	let result = [];
	result.push(...restExploded.map((subpath) => subpath === "" ? required : [required, subpath].join("/")));
	if (isOptional) result.push(...restExploded);
	return result.map((exploded) => path.startsWith("/") && exploded === "" ? "/" : exploded);
}
function rankRouteBranches(branches) {
	branches.sort((a, b) => a.score !== b.score ? b.score - a.score : compareIndexes(a.routesMeta.map((meta) => meta.childrenIndex), b.routesMeta.map((meta) => meta.childrenIndex)));
}
const paramRe = /^:[\w-]+$/;
const partialParamRe = /^:[\w-]+/;
const partialDynamicSegmentValue = 3.5;
const dynamicSegmentValue = 3;
const indexRouteValue = 2;
const emptySegmentValue = 1;
const staticSegmentValue = 10;
const splatPenalty = -2;
const isSplat = (s) => s === "*";
function computeScore(path, index) {
	let segments = path.split("/");
	let initialScore = segments.length;
	if (segments.some(isSplat)) initialScore += splatPenalty;
	if (index) initialScore += indexRouteValue;
	return segments.filter((s) => !isSplat(s)).reduce((score, segment) => score + (paramRe.test(segment) ? dynamicSegmentValue : partialParamRe.test(segment) ? partialDynamicSegmentValue : segment === "" ? emptySegmentValue : staticSegmentValue), initialScore);
}
function compareIndexes(a, b) {
	return a.length === b.length && a.slice(0, -1).every((n, i) => n === b[i]) ? a[a.length - 1] - b[b.length - 1] : 0;
}
function matchRouteBranch(branch, pathname, allowPartial = false) {
	let { routesMeta } = branch;
	let matchedParams = {};
	let matchedPathname = "/";
	let matches = [];
	for (let i = 0; i < routesMeta.length; ++i) {
		let meta = routesMeta[i];
		let end = i === routesMeta.length - 1;
		let remainingPathname = matchedPathname === "/" ? pathname : pathname.slice(matchedPathname.length) || "/";
		let pattern = {
			path: meta.relativePath,
			caseSensitive: meta.caseSensitive,
			end
		};
		let match = meta.matcher && meta.compiledParams ? matchPathImpl(pattern, remainingPathname, meta.matcher, meta.compiledParams) : matchPath(pattern, remainingPathname);
		let route = meta.route;
		if (!match && end && allowPartial && !routesMeta[routesMeta.length - 1].route.index) match = matchPath({
			path: meta.relativePath,
			caseSensitive: meta.caseSensitive,
			end: false
		}, remainingPathname);
		if (!match) return null;
		Object.assign(matchedParams, match.params);
		matches.push({
			params: matchedParams,
			pathname: joinPaths([matchedPathname, match.pathname]),
			pathnameBase: normalizePathname(joinPaths([matchedPathname, match.pathnameBase])),
			route
		});
		if (match.pathnameBase !== "/") matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
	}
	return matches;
}
/**
* Performs pattern matching on a URL pathname and returns information about
* the match.
*
* @public
* @category Utils
* @param pattern The pattern to match against the URL pathname. This can be a
* string or a {@link PathPattern} object. If a string is provided, it will be
* treated as a pattern with `caseSensitive` set to `false` and `end` set to
* `true`.
* @param pathname The URL pathname to match against the pattern.
* @returns A path match object if the pattern matches the pathname,
* or `null` if it does not match.
*/
function matchPath(pattern, pathname) {
	if (typeof pattern === "string") pattern = {
		path: pattern,
		caseSensitive: false,
		end: true
	};
	let [matcher, compiledParams] = compilePath(pattern.path, pattern.caseSensitive, pattern.end);
	return matchPathImpl(pattern, pathname, matcher, compiledParams);
}
function matchPathImpl(pattern, pathname, matcher, compiledParams) {
	let match = pathname.match(matcher);
	if (!match) return null;
	let matchedPathname = match[0];
	let pathnameBase = matchedPathname.replace(/(.)\/+$/, "$1");
	let captureGroups = match.slice(1);
	return {
		params: compiledParams.reduce((memo, { paramName, isOptional }, index) => {
			if (paramName === "*") {
				let splatValue = captureGroups[index] || "";
				pathnameBase = matchedPathname.slice(0, matchedPathname.length - splatValue.length).replace(/(.)\/+$/, "$1");
			}
			const value = captureGroups[index];
			if (isOptional && !value) memo[paramName] = void 0;
			else memo[paramName] = (value || "").replace(/%2F/g, "/");
			return memo;
		}, {}),
		pathname: matchedPathname,
		pathnameBase,
		pattern
	};
}
function compilePath(path, caseSensitive = false, end = true) {
	warning(path === "*" || !path.endsWith("*") || path.endsWith("/*"), `Route path "${path}" will be treated as if it were "${path.replace(/\*$/, "/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${path.replace(/\*$/, "/*")}".`);
	let params = [];
	let regexpSource = "^" + path.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(/\/:([\w-]+)(\?)?/g, (match, paramName, isOptional, index, str) => {
		params.push({
			paramName,
			isOptional: isOptional != null
		});
		if (isOptional) {
			let nextChar = str.charAt(index + match.length);
			if (nextChar && nextChar !== "/") return "/([^\\/]*)";
			return "(?:/([^\\/]*))?";
		}
		return "/([^\\/]+)";
	}).replace(/\/([\w-]+)\?(?=\/|$|\()/g, "(?:/$1)?");
	if (path.endsWith("*")) {
		params.push({ paramName: "*" });
		regexpSource += path === "*" || path === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$";
	} else if (end) regexpSource += "\\/*$";
	else if (path !== "" && path !== "/") regexpSource += "(?:(?=\\/|$))";
	return [new RegExp(regexpSource, caseSensitive ? void 0 : "i"), params];
}
function decodePath(value) {
	try {
		return value.split("/").map((v) => decodeURIComponent(v).replace(/\//g, "%2F")).join("/");
	} catch (error) {
		warning(false, `The URL path "${value}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${error}).`);
		return value;
	}
}
function stripBasename(pathname, basename) {
	if (basename === "/") return pathname;
	if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) return null;
	let startIndex = basename.endsWith("/") ? basename.length - 1 : basename.length;
	let nextChar = pathname.charAt(startIndex);
	if (nextChar && nextChar !== "/") return null;
	return pathname.slice(startIndex) || "/";
}
function prependBasename({ basename, pathname }) {
	return pathname === "/" ? basename : joinPaths([basename, pathname]);
}
const isAbsoluteUrl = (url) => ABSOLUTE_URL_REGEX.test(url);
/**
* Returns a resolved {@link Path} object relative to the given pathname.
*
* @public
* @category Utils
* @param to The path to resolve, either a string or a partial {@link Path}
* object.
* @param fromPathname The pathname to resolve the path from. Defaults to `/`.
* @returns A {@link Path} object with the resolved pathname, search, and hash.
*/
function resolvePath(to, fromPathname = "/") {
	let { pathname: toPathname, search = "", hash = "" } = typeof to === "string" ? parsePath(to) : to;
	let pathname;
	if (toPathname) {
		toPathname = removeDoubleSlashes(toPathname);
		if (toPathname.startsWith("/")) pathname = resolvePathname(toPathname.substring(1), "/");
		else pathname = resolvePathname(toPathname, fromPathname);
	} else pathname = fromPathname;
	return {
		pathname,
		search: normalizeSearch(search),
		hash: normalizeHash(hash)
	};
}
function resolvePathname(relativePath, fromPathname) {
	let segments = removeTrailingSlash(fromPathname).split("/");
	relativePath.split("/").forEach((segment) => {
		if (segment === "..") {
			if (segments.length > 1) segments.pop();
		} else if (segment !== ".") segments.push(segment);
	});
	return segments.length > 1 ? segments.join("/") : "/";
}
function getInvalidPathError(char, field, dest, path) {
	return `Cannot include a '${char}' character in a manually specified \`to.${field}\` field [${JSON.stringify(path)}].  Please separate it out to the \`to.${dest}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`;
}
function getPathContributingMatches(matches) {
	return matches.filter((match, index) => index === 0 || match.route.path && match.route.path.length > 0);
}
function getResolveToMatches(matches) {
	let pathMatches = getPathContributingMatches(matches);
	return pathMatches.map((match, idx) => idx === pathMatches.length - 1 ? match.pathname : match.pathnameBase);
}
function resolveTo(toArg, routePathnames, locationPathname, isPathRelative = false) {
	let to;
	if (typeof toArg === "string") to = parsePath(toArg);
	else {
		to = { ...toArg };
		invariant$1(!to.pathname || !to.pathname.includes("?"), getInvalidPathError("?", "pathname", "search", to));
		invariant$1(!to.pathname || !to.pathname.includes("#"), getInvalidPathError("#", "pathname", "hash", to));
		invariant$1(!to.search || !to.search.includes("#"), getInvalidPathError("#", "search", "hash", to));
	}
	let isEmptyPath = toArg === "" || to.pathname === "";
	let toPathname = isEmptyPath ? "/" : to.pathname;
	let from;
	if (toPathname == null) from = locationPathname;
	else {
		let routePathnameIndex = routePathnames.length - 1;
		if (!isPathRelative && toPathname.startsWith("..")) {
			let toSegments = toPathname.split("/");
			while (toSegments[0] === "..") {
				toSegments.shift();
				routePathnameIndex -= 1;
			}
			to.pathname = toSegments.join("/");
		}
		from = routePathnameIndex >= 0 ? routePathnames[routePathnameIndex] : "/";
	}
	let path = resolvePath(to, from);
	let hasExplicitTrailingSlash = toPathname && toPathname !== "/" && toPathname.endsWith("/");
	let hasCurrentTrailingSlash = (isEmptyPath || toPathname === ".") && locationPathname.endsWith("/");
	if (!path.pathname.endsWith("/") && (hasExplicitTrailingSlash || hasCurrentTrailingSlash)) path.pathname += "/";
	return path;
}
const removeDoubleSlashes = (path) => path.replace(/[\\/]{2,}/g, "/");
const joinPaths = (paths) => removeDoubleSlashes(paths.join("/"));
const removeTrailingSlash = (path) => path.replace(/\/+$/, "");
const normalizePathname = (pathname) => removeTrailingSlash(pathname).replace(/^\/*/, "/");
const normalizeSearch = (search) => !search || search === "?" ? "" : search.startsWith("?") ? search : "?" + search;
const normalizeHash = (hash) => !hash || hash === "#" ? "" : hash.startsWith("#") ? hash : "#" + hash;
var DataWithResponseInit = class {
	type = "DataWithResponseInit";
	data;
	init;
	constructor(data, init) {
		this.data = data;
		this.init = init || null;
	}
};
/**
* Create "responses" that contain `headers`/`status` without forcing
* serialization into an actual [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
*
* @example
* import { data } from "react-router";
*
* export async function action({ request }: Route.ActionArgs) {
*   let formData = await request.formData();
*   let item = await createItem(formData);
*   return data(item, {
*     headers: { "X-Custom-Header": "value" }
*     status: 201,
*   });
* }
*
* @public
* @category Utils
* @mode framework
* @mode data
* @param data The data to be included in the response.
* @param init The status code or a `ResponseInit` object to be included in the
* response.
* @returns A {@link DataWithResponseInit} instance containing the data and
* response init.
*/
function data(data, init) {
	return new DataWithResponseInit(data, typeof init === "number" ? { status: init } : init);
}
/**
* A redirect [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response).
* Sets the status code and the [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
* header. Defaults to [`302 Found`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302).
*
* This utility accepts absolute URLs and can navigate to external domains, so
* the application should validate any user-supplied inputs to redirects.
*
* @example
* import { redirect } from "react-router";
*
* export async function loader({ request }: Route.LoaderArgs) {
*   if (!isLoggedIn(request))
*     throw redirect("/login");
*   }
*
*   // ...
* }
*
* @public
* @category Utils
* @mode framework
* @mode data
* @param url The URL to redirect to.
* @param init The status code or a `ResponseInit` object to be included in the
* response.
* @returns A [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
* object with the redirect status and [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
* header.
*/
const redirect$1 = (url, init = 302) => {
	let responseInit = init;
	if (typeof responseInit === "number") responseInit = { status: responseInit };
	else if (typeof responseInit.status === "undefined") responseInit.status = 302;
	let headers = new Headers(responseInit.headers);
	headers.set("Location", url);
	return new Response(null, {
		...responseInit,
		headers
	});
};
/**
* A redirect [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
* that will force a document reload to the new location. Sets the status code
* and the [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
* header. Defaults to [`302 Found`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302).
*
* This utility accepts absolute URLs and can navigate to external domains, so
* the application should validate any user-supplied inputs to redirects.
*
* ```tsx filename=routes/logout.tsx
* import { redirectDocument } from "react-router";
*
* import { destroySession } from "../sessions.server";
*
* export async function action({ request }: Route.ActionArgs) {
*   let session = await getSession(request.headers.get("Cookie"));
*   return redirectDocument("/", {
*     headers: { "Set-Cookie": await destroySession(session) }
*   });
* }
* ```
*
* @public
* @category Utils
* @mode framework
* @mode data
* @param url The URL to redirect to.
* @param init The status code or a `ResponseInit` object to be included in the
* response.
* @returns A [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
* object with the redirect status and [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
* header.
*/
const redirectDocument$1 = (url, init) => {
	let response = redirect$1(url, init);
	response.headers.set("X-Remix-Reload-Document", "true");
	return response;
};
/**
* A redirect [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
* that will perform a [`history.replaceState`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)
* instead of a [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)
* for client-side navigation redirects. Sets the status code and the [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
* header. Defaults to [`302 Found`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302).
*
* @example
* import { replace } from "react-router";
*
* export async function loader() {
*   return replace("/new-location");
* }
*
* @public
* @category Utils
* @mode framework
* @mode data
* @param url The URL to redirect to.
* @param init The status code or a `ResponseInit` object to be included in the
* response.
* @returns A [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
* object with the redirect status and [`Location`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
* header.
*/
const replace$1 = (url, init) => {
	let response = redirect$1(url, init);
	response.headers.set("X-Remix-Replace", "true");
	return response;
};
var ErrorResponseImpl = class {
	status;
	statusText;
	data;
	error;
	internal;
	constructor(status, statusText, data, internal = false) {
		this.status = status;
		this.statusText = statusText || "";
		this.internal = internal;
		if (data instanceof Error) {
			this.data = data.toString();
			this.error = data;
		} else this.data = data;
	}
};
/**
* Check if the given error is an {@link ErrorResponse} generated from a 4xx/5xx
* [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
* thrown from an [`action`](../../start/framework/route-module#action) or
* [`loader`](../../start/framework/route-module#loader) function.
*
* @example
* import { isRouteErrorResponse } from "react-router";
*
* export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
*   if (isRouteErrorResponse(error)) {
*     return (
*       <>
*         <p>Error: `${error.status}: ${error.statusText}`</p>
*         <p>{error.data}</p>
*       </>
*     );
*   }
*
*   return (
*     <p>Error: {error instanceof Error ? error.message : "Unknown Error"}</p>
*   );
* }
*
* @public
* @category Utils
* @mode framework
* @mode data
* @param error The error to check.
* @returns `true` if the error is an {@link ErrorResponse}, `false` otherwise.
*/
function isRouteErrorResponse(error) {
	return error != null && typeof error.status === "number" && typeof error.statusText === "string" && typeof error.internal === "boolean" && "data" in error;
}
function getRoutePattern(matches) {
	return joinPaths(matches.map((m) => m.route.path).filter(Boolean)) || "/";
}
function createDataFunctionUrl(request, path) {
	let url = new URL(typeof request === "string" || request instanceof URL ? request : request.url);
	let parsed = typeof path === "string" ? parsePath(path) : path;
	url.pathname = parsed.pathname || "/";
	if (parsed.search) {
		let searchParams = new URLSearchParams(parsed.search);
		let indexValues = searchParams.getAll("index");
		searchParams.delete("index");
		for (let value of indexValues.filter(Boolean)) searchParams.append("index", value);
		let search = searchParams.toString();
		url.search = search ? `?${search}` : "";
	} else url.search = "";
	url.hash = parsed.hash || "";
	return url;
}
typeof window !== "undefined" && typeof window.document !== "undefined" && window.document.createElement;
//#endregion
//#region lib/router/instrumentation.ts
const UninstrumentedSymbol = Symbol("Uninstrumented");
function getRouteInstrumentationUpdates(fns, route) {
	let aggregated = {
		lazy: [],
		"lazy.loader": [],
		"lazy.action": [],
		"lazy.middleware": [],
		middleware: [],
		loader: [],
		action: []
	};
	fns.forEach((fn) => fn({
		id: route.id,
		index: route.index,
		path: route.path,
		instrument(i) {
			if (i.lazy != null) aggregated.lazy.push(i.lazy);
			if (i["lazy.loader"] != null) aggregated["lazy.loader"].push(i["lazy.loader"]);
			if (i["lazy.action"] != null) aggregated["lazy.action"].push(i["lazy.action"]);
			if (i["lazy.middleware"] != null) aggregated["lazy.middleware"].push(i["lazy.middleware"]);
			if (i.middleware != null) aggregated.middleware.push(i.middleware);
			if (i.loader != null) aggregated.loader.push(i.loader);
			if (i.action != null) aggregated.action.push(i.action);
		}
	}));
	let updates = {};
	if (typeof route.lazy === "function" && aggregated.lazy.length > 0) {
		let lazy = route.lazy;
		updates.lazy = async (...args) => {
			return throwOrReturnResult(await recurseRight(aggregated.lazy, void 0, () => lazy(...args), getInstrumentationInnerResult));
		};
	}
	if (typeof route.lazy === "object") {
		let lazyObject = route.lazy;
		if (typeof lazyObject.middleware === "function" && aggregated["lazy.middleware"].length > 0) {
			let middleware = lazyObject.middleware;
			updates.lazy = Object.assign(updates.lazy || {}, { middleware: async (...args) => {
				return throwOrReturnResult(await recurseRight(aggregated["lazy.middleware"], void 0, () => middleware(...args), getInstrumentationInnerResult));
			} });
		}
		if (typeof lazyObject.loader === "function" && aggregated["lazy.loader"].length > 0) {
			let loader = lazyObject.loader;
			updates.lazy = Object.assign(updates.lazy || {}, { loader: async (...args) => {
				return throwOrReturnResult(await recurseRight(aggregated["lazy.loader"], void 0, () => loader(...args), getInstrumentationInnerResult));
			} });
		}
		if (typeof lazyObject.action === "function" && aggregated["lazy.action"].length > 0) {
			let action = lazyObject.action;
			updates.lazy = Object.assign(updates.lazy || {}, { action: async (...args) => {
				return throwOrReturnResult(await recurseRight(aggregated["lazy.action"], void 0, () => action(...args), getInstrumentationInnerResult));
			} });
		}
	}
	if (typeof route.loader === "function" && aggregated.loader.length > 0) {
		let original = getUninstrumentedHandler(route.loader);
		let instrumented = async (...args) => {
			return throwOrReturnResult(await recurseRight(aggregated.loader, getHandlerInfo(args[0]), () => original(...args), getInstrumentationInnerResult));
		};
		if (original.hydrate === true) instrumented.hydrate = true;
		setUninstrumentedHandler(instrumented, original);
		updates.loader = instrumented;
	}
	if (typeof route.action === "function" && aggregated.action.length > 0) {
		let original = getUninstrumentedHandler(route.action);
		let instrumented = async (...args) => {
			return throwOrReturnResult(await recurseRight(aggregated.action, getHandlerInfo(args[0]), () => original(...args), getInstrumentationInnerResult));
		};
		setUninstrumentedHandler(instrumented, original);
		updates.action = instrumented;
	}
	if (route.middleware && route.middleware.length > 0 && aggregated.middleware.length > 0) updates.middleware = route.middleware.map((middleware) => {
		let original = getUninstrumentedHandler(middleware);
		let instrumented = async (...args) => {
			return throwOrReturnResult(await recurseRight(aggregated.middleware, getHandlerInfo(args[0]), () => original(...args), getInstrumentationInnerResult));
		};
		setUninstrumentedHandler(instrumented, original);
		return instrumented;
	});
	return updates;
}
function getUninstrumentedHandler(handler) {
	return handler[UninstrumentedSymbol] ?? handler;
}
function setUninstrumentedHandler(handler, uninstrumentedHandler) {
	handler[UninstrumentedSymbol] = uninstrumentedHandler;
}
function throwOrReturnResult(result) {
	if (result.type === "error") throw result.value;
	return result.value;
}
async function recurseRight(impls, info, handler, getInnerResult, state = {
	result: null,
	innerResult: null
}, index = impls.length - 1) {
	let impl = impls[index];
	if (!impl) {
		try {
			state.result = {
				type: "success",
				value: await handler()
			};
		} catch (e) {
			state.result = {
				type: "error",
				value: e
			};
		}
		state.innerResult = getInnerResult(state.result, info);
	} else {
		let handlerPromise = void 0;
		let callHandler = async () => {
			if (handlerPromise) console.error("You cannot call instrumented handlers more than once");
			else handlerPromise = recurseRight(impls, info, handler, getInnerResult, state, index - 1);
			await handlerPromise;
			invariant$1(state.innerResult, "Expected an inner result");
			return state.innerResult;
		};
		try {
			await impl(callHandler, info);
		} catch (e) {
			console.error("An instrumentation function threw an error:", e);
		}
		if (!handlerPromise) await callHandler();
		await handlerPromise;
	}
	if (state.result) return state.result;
	state.result = {
		type: "error",
		value: /* @__PURE__ */ new Error("No result assigned in instrumentation chain.")
	};
	state.innerResult = getInnerResult(state.result, info);
	return state.result;
}
function getInstrumentationInnerResult(result) {
	if (result.type === "error" && result.value instanceof Error) return {
		status: "error",
		error: result.value
	};
	return {
		status: "success",
		error: void 0
	};
}
function getHandlerInfo(args) {
	let { request, context, params } = args;
	return {
		...args,
		request: getReadonlyRequest(request),
		params: { ...params },
		context: getReadonlyContext(context)
	};
}
function getReadonlyRequest(request) {
	return {
		method: request.method,
		url: request.url,
		headers: { get: (...args) => request.headers.get(...args) }
	};
}
function getReadonlyContext(context) {
	return { get: (ctx) => context.get(ctx) };
}
//#endregion
//#region lib/router/router.ts
const validMutationMethodsArr = [
	"POST",
	"PUT",
	"PATCH",
	"DELETE"
];
const validMutationMethods = new Set(validMutationMethodsArr);
const validRequestMethodsArr = ["GET", ...validMutationMethodsArr];
const validRequestMethods = new Set(validRequestMethodsArr);
const redirectStatusCodes = new Set([
	301,
	302,
	303,
	307,
	308
]);
const ResetLoaderDataSymbol = Symbol("ResetLoaderData");
/**
* Create a static handler to perform server-side data loading
*
* @example
* export async function handleRequest(request: Request) {
*   let { query, dataRoutes } = createStaticHandler(routes);
*   let context = await query(request);
*
*   if (context instanceof Response) {
*     return context;
*   }
*
*   let router = createStaticRouter(dataRoutes, context);
*   return new Response(
*     ReactDOMServer.renderToString(<StaticRouterProvider ... />),
*     { headers: { "Content-Type": "text/html" } }
*   );
* }
*
* @public
* @category Data Routers
* @mode data
* @param routes The {@link RouteObject | route objects} to create a static
* handler for
* @param opts Options
* @param opts.basename The base URL for the static handler (default: `/`)
* @param opts.future Future flags for the static handler
* @returns A static handler that can be used to query data for the provided
* routes
*/
function createStaticHandler(routes, opts) {
	invariant$1(routes.length > 0, "You must provide a non-empty routes array to createStaticHandler");
	let manifest = {};
	let basename = (opts ? opts.basename : null) || "/";
	let _mapRouteProperties = opts?.mapRouteProperties;
	let mapRouteProperties = _mapRouteProperties ? _mapRouteProperties : () => ({});
	({ ...opts?.future });
	if (opts?.instrumentations) {
		let instrumentations = opts.instrumentations;
		mapRouteProperties = (route) => {
			return {
				..._mapRouteProperties?.(route),
				...getRouteInstrumentationUpdates(instrumentations.map((i) => i.route).filter(Boolean), route)
			};
		};
	}
	let dataRoutes = convertRoutesToDataRoutes(routes, mapRouteProperties, void 0, manifest);
	let routeBranches = flattenAndRankRoutes(dataRoutes);
	/**
	* The query() method is intended for document requests, in which we want to
	* call an optional action and potentially multiple loaders for all nested
	* routes.  It returns a StaticHandlerContext object, which is very similar
	* to the router state (location, loaderData, actionData, errors, etc.) and
	* also adds SSR-specific information such as the statusCode and headers
	* from action/loaders Responses.
	*
	* It _should_ never throw and should report all errors through the
	* returned handlerContext.errors object, properly associating errors to
	* their error boundary.  Additionally, it tracks _deepestRenderedBoundaryId
	* which can be used to emulate React error boundaries during SSR by performing
	* a second pass only down to the boundaryId.
	*
	* The one exception where we do not return a StaticHandlerContext is when a
	* redirect response is returned or thrown from any action/loader.  We
	* propagate that out and return the raw Response so the HTTP server can
	* return it directly.
	*
	* - `opts.requestContext` is an optional server context that will be passed
	*   to actions/loaders in the `context` parameter
	* - `opts.skipLoaderErrorBubbling` is an optional parameter that will prevent
	*   the bubbling of errors which allows single-fetch-type implementations
	*   where the client will handle the bubbling and we may need to return data
	*   for the handling route
	*/
	async function query(request, { requestContext, filterMatchesToLoad, skipLoaderErrorBubbling, skipRevalidation, dataStrategy, generateMiddlewareResponse, normalizePath } = {}) {
		let normalizePathImpl = normalizePath || defaultNormalizePath;
		let method = request.method;
		let location = createLocation("", normalizePathImpl(request), null, "default");
		let matches = matchRoutesImpl(dataRoutes, location, basename, false, routeBranches);
		requestContext = requestContext != null ? requestContext : new RouterContextProvider();
		if (!isValidMethod(method) && method !== "HEAD") {
			let error = getInternalRouterError(405, { method });
			let { matches: methodNotAllowedMatches, route } = getShortCircuitMatches(dataRoutes);
			let staticContext = {
				basename,
				location,
				matches: methodNotAllowedMatches,
				loaderData: {},
				actionData: null,
				errors: { [route.id]: error },
				statusCode: error.status,
				loaderHeaders: {},
				actionHeaders: {}
			};
			return generateMiddlewareResponse ? generateMiddlewareResponse(() => Promise.resolve(staticContext)) : staticContext;
		} else if (!matches) {
			let error = getInternalRouterError(404, { pathname: location.pathname });
			let { matches: notFoundMatches, route } = getShortCircuitMatches(dataRoutes);
			let staticContext = {
				basename,
				location,
				matches: notFoundMatches,
				loaderData: {},
				actionData: null,
				errors: { [route.id]: error },
				statusCode: error.status,
				loaderHeaders: {},
				actionHeaders: {}
			};
			return generateMiddlewareResponse ? generateMiddlewareResponse(() => Promise.resolve(staticContext)) : staticContext;
		}
		if (generateMiddlewareResponse) {
			invariant$1(requestContext instanceof RouterContextProvider, "When using middleware in `staticHandler.query()`, any provided `requestContext` must be an instance of `RouterContextProvider`");
			try {
				await loadLazyMiddlewareForMatches(matches, manifest, mapRouteProperties);
				let renderedStaticContext;
				let response = await runServerMiddlewarePipeline({
					request,
					url: createDataFunctionUrl(request, location),
					pattern: getRoutePattern(matches),
					matches,
					params: matches[0].params,
					context: requestContext
				}, async () => {
					return await generateMiddlewareResponse(async (revalidationRequest, opts = {}) => {
						let result = await queryImpl(revalidationRequest, location, matches, requestContext, dataStrategy || null, skipLoaderErrorBubbling === true, null, "filterMatchesToLoad" in opts ? opts.filterMatchesToLoad ?? null : filterMatchesToLoad ?? null, skipRevalidation === true);
						if (isResponse(result)) return result;
						renderedStaticContext = {
							location,
							basename,
							...result
						};
						return renderedStaticContext;
					});
				}, async (error, routeId) => {
					if (isRedirectResponse(error)) return error;
					if (isResponse(error)) try {
						error = new ErrorResponseImpl(error.status, error.statusText, await parseResponseBody(error));
					} catch (e) {
						error = e;
					}
					if (isDataWithResponseInit(error)) error = dataWithResponseInitToErrorResponse(error);
					if (renderedStaticContext) {
						if (routeId in renderedStaticContext.loaderData) renderedStaticContext.loaderData[routeId] = void 0;
						let staticContext = getStaticContextFromError(dataRoutes, renderedStaticContext, error, skipLoaderErrorBubbling ? routeId : findNearestBoundary(matches, routeId).route.id);
						return generateMiddlewareResponse(() => Promise.resolve(staticContext));
					} else {
						let staticContext = {
							matches,
							location,
							basename,
							loaderData: {},
							actionData: null,
							errors: { [skipLoaderErrorBubbling ? routeId : findNearestBoundary(matches, matches.find((m) => m.route.id === routeId || m.route.loader)?.route.id || routeId).route.id]: error },
							statusCode: isRouteErrorResponse(error) ? error.status : 500,
							actionHeaders: {},
							loaderHeaders: {}
						};
						return generateMiddlewareResponse(() => Promise.resolve(staticContext));
					}
				});
				invariant$1(isResponse(response), "Expected a response in query()");
				return response;
			} catch (e) {
				if (isResponse(e)) return e;
				throw e;
			}
		}
		let result = await queryImpl(request, location, matches, requestContext, dataStrategy || null, skipLoaderErrorBubbling === true, null, filterMatchesToLoad || null, skipRevalidation === true);
		if (isResponse(result)) return result;
		return {
			location,
			basename,
			...result
		};
	}
	/**
	* The queryRoute() method is intended for targeted route requests, either
	* for fetch ?_data requests or resource route requests.  In this case, we
	* are only ever calling a single action or loader, and we are returning the
	* returned value directly.  In most cases, this will be a Response returned
	* from the action/loader, but it may be a primitive or other value as well -
	* and in such cases the calling context should handle that accordingly.
	*
	* We do respect the throw/return differentiation, so if an action/loader
	* throws, then this method will throw the value.  This is important so we
	* can do proper boundary identification in Remix where a thrown Response
	* must go to the Catch Boundary but a returned Response is happy-path.
	*
	* One thing to note is that any Router-initiated Errors that make sense
	* to associate with a status code will be thrown as an ErrorResponse
	* instance which include the raw Error, such that the calling context can
	* serialize the error as they see fit while including the proper response
	* code.  Examples here are 404 and 405 errors that occur prior to reaching
	* any user-defined loaders.
	*
	* - `opts.routeId` allows you to specify the specific route handler to call.
	*   If not provided the handler will determine the proper route by matching
	*   against `request.url`
	* - `opts.requestContext` is an optional server context that will be passed
	*    to actions/loaders in the `context` parameter
	*/
	async function queryRoute(request, { routeId, requestContext, dataStrategy, generateMiddlewareResponse, normalizePath } = {}) {
		let normalizePathImpl = normalizePath || defaultNormalizePath;
		let method = request.method;
		let location = createLocation("", normalizePathImpl(request), null, "default");
		let matches = matchRoutesImpl(dataRoutes, location, basename, false, routeBranches);
		requestContext = requestContext != null ? requestContext : new RouterContextProvider();
		if (!isValidMethod(method) && method !== "HEAD" && method !== "OPTIONS") throw getInternalRouterError(405, { method });
		else if (!matches) throw getInternalRouterError(404, { pathname: location.pathname });
		let match = routeId ? matches.find((m) => m.route.id === routeId) : getTargetMatch(matches, location);
		if (routeId && !match) throw getInternalRouterError(403, {
			pathname: location.pathname,
			routeId
		});
		else if (!match) throw getInternalRouterError(404, { pathname: location.pathname });
		if (generateMiddlewareResponse) {
			invariant$1(requestContext instanceof RouterContextProvider, "When using middleware in `staticHandler.queryRoute()`, any provided `requestContext` must be an instance of `RouterContextProvider`");
			await loadLazyMiddlewareForMatches(matches, manifest, mapRouteProperties);
			return await runServerMiddlewarePipeline({
				request,
				url: createDataFunctionUrl(request, location),
				pattern: getRoutePattern(matches),
				matches,
				params: matches[0].params,
				context: requestContext
			}, async () => {
				return await generateMiddlewareResponse(async (innerRequest) => {
					let processed = handleQueryResult(await queryImpl(innerRequest, location, matches, requestContext, dataStrategy || null, false, match, null, false));
					return isResponse(processed) ? processed : typeof processed === "string" ? new Response(processed) : Response.json(processed);
				});
			}, (error) => {
				if (isDataWithResponseInit(error)) return Promise.resolve(dataWithResponseInitToResponse(error));
				if (isResponse(error)) return Promise.resolve(error);
				throw error;
			});
		}
		return handleQueryResult(await queryImpl(request, location, matches, requestContext, dataStrategy || null, false, match, null, false));
		function handleQueryResult(result) {
			if (isResponse(result)) return result;
			let error = result.errors ? Object.values(result.errors)[0] : void 0;
			if (error !== void 0) throw error;
			if (result.actionData) return Object.values(result.actionData)[0];
			if (result.loaderData) return Object.values(result.loaderData)[0];
		}
	}
	async function queryImpl(request, location, matches, requestContext, dataStrategy, skipLoaderErrorBubbling, routeMatch, filterMatchesToLoad, skipRevalidation) {
		invariant$1(request.signal, "query()/queryRoute() requests must contain an AbortController signal");
		try {
			if (isMutationMethod(request.method)) return await submit(request, location, matches, routeMatch || getTargetMatch(matches, location), requestContext, dataStrategy, skipLoaderErrorBubbling, routeMatch != null, filterMatchesToLoad, skipRevalidation);
			let result = await loadRouteData(request, location, matches, requestContext, dataStrategy, skipLoaderErrorBubbling, routeMatch, filterMatchesToLoad);
			return isResponse(result) ? result : {
				...result,
				actionData: null,
				actionHeaders: {}
			};
		} catch (e) {
			if (isDataStrategyResult(e) && isResponse(e.result)) {
				if (e.type === "error") throw e.result;
				return e.result;
			}
			if (isRedirectResponse(e)) return e;
			throw e;
		}
	}
	async function submit(request, location, matches, actionMatch, requestContext, dataStrategy, skipLoaderErrorBubbling, isRouteRequest, filterMatchesToLoad, skipRevalidation) {
		let result;
		if (!actionMatch.route.action && !actionMatch.route.lazy) {
			let error = getInternalRouterError(405, {
				method: request.method,
				pathname: new URL(request.url).pathname,
				routeId: actionMatch.route.id
			});
			if (isRouteRequest) throw error;
			result = {
				type: "error",
				error
			};
		} else {
			result = (await callDataStrategy(request, location, getTargetedDataStrategyMatches(mapRouteProperties, manifest, request, location, matches, actionMatch, [], requestContext), isRouteRequest, requestContext, dataStrategy))[actionMatch.route.id];
			if (request.signal.aborted) throwStaticHandlerAbortedError(request, isRouteRequest);
		}
		if (isRedirectResult(result)) throw new Response(null, {
			status: result.response.status,
			headers: { Location: result.response.headers.get("Location") }
		});
		if (isRouteRequest) {
			if (isErrorResult(result)) throw result.error;
			return {
				matches: [actionMatch],
				loaderData: {},
				actionData: { [actionMatch.route.id]: result.data },
				errors: null,
				statusCode: 200,
				loaderHeaders: {},
				actionHeaders: {}
			};
		}
		if (skipRevalidation) if (isErrorResult(result)) {
			let boundaryMatch = skipLoaderErrorBubbling ? actionMatch : findNearestBoundary(matches, actionMatch.route.id);
			return {
				statusCode: isRouteErrorResponse(result.error) ? result.error.status : result.statusCode != null ? result.statusCode : 500,
				actionData: null,
				actionHeaders: { ...result.headers ? { [actionMatch.route.id]: result.headers } : {} },
				matches,
				loaderData: {},
				errors: { [boundaryMatch.route.id]: result.error },
				loaderHeaders: {}
			};
		} else return {
			actionData: { [actionMatch.route.id]: result.data },
			actionHeaders: result.headers ? { [actionMatch.route.id]: result.headers } : {},
			matches,
			loaderData: {},
			errors: null,
			statusCode: result.statusCode || 200,
			loaderHeaders: {}
		};
		let loaderRequest = new Request(request.url, {
			headers: request.headers,
			redirect: request.redirect,
			signal: request.signal
		});
		if (isErrorResult(result)) return {
			...await loadRouteData(loaderRequest, location, matches, requestContext, dataStrategy, skipLoaderErrorBubbling, null, filterMatchesToLoad, [(skipLoaderErrorBubbling ? actionMatch : findNearestBoundary(matches, actionMatch.route.id)).route.id, result]),
			statusCode: isRouteErrorResponse(result.error) ? result.error.status : result.statusCode != null ? result.statusCode : 500,
			actionData: null,
			actionHeaders: { ...result.headers ? { [actionMatch.route.id]: result.headers } : {} }
		};
		return {
			...await loadRouteData(loaderRequest, location, matches, requestContext, dataStrategy, skipLoaderErrorBubbling, null, filterMatchesToLoad),
			actionData: { [actionMatch.route.id]: result.data },
			...result.statusCode ? { statusCode: result.statusCode } : {},
			actionHeaders: result.headers ? { [actionMatch.route.id]: result.headers } : {}
		};
	}
	async function loadRouteData(request, location, matches, requestContext, dataStrategy, skipLoaderErrorBubbling, routeMatch, filterMatchesToLoad, pendingActionResult) {
		let isRouteRequest = routeMatch != null;
		if (isRouteRequest && !routeMatch?.route.loader && !routeMatch?.route.lazy) throw getInternalRouterError(400, {
			method: request.method,
			pathname: new URL(request.url).pathname,
			routeId: routeMatch?.route.id
		});
		let dsMatches;
		if (routeMatch) dsMatches = getTargetedDataStrategyMatches(mapRouteProperties, manifest, request, location, matches, routeMatch, [], requestContext);
		else {
			let maxIdx = pendingActionResult && isErrorResult(pendingActionResult[1]) ? matches.findIndex((m) => m.route.id === pendingActionResult[0]) - 1 : void 0;
			let pattern = getRoutePattern(matches);
			dsMatches = matches.map((match, index) => {
				if (maxIdx != null && index > maxIdx) return getDataStrategyMatch(mapRouteProperties, manifest, request, location, pattern, match, [], requestContext, false);
				return getDataStrategyMatch(mapRouteProperties, manifest, request, location, pattern, match, [], requestContext, (match.route.loader || match.route.lazy) != null && (!filterMatchesToLoad || filterMatchesToLoad(match)));
			});
		}
		if (!dataStrategy && !dsMatches.some((m) => m.shouldLoad)) return {
			matches,
			loaderData: {},
			errors: pendingActionResult && isErrorResult(pendingActionResult[1]) ? { [pendingActionResult[0]]: pendingActionResult[1].error } : null,
			statusCode: 200,
			loaderHeaders: {}
		};
		let results = await callDataStrategy(request, location, dsMatches, isRouteRequest, requestContext, dataStrategy);
		if (request.signal.aborted) throwStaticHandlerAbortedError(request, isRouteRequest);
		return {
			...processRouteLoaderData(matches, results, pendingActionResult, true, skipLoaderErrorBubbling),
			matches
		};
	}
	async function callDataStrategy(request, location, matches, isRouteRequest, requestContext, dataStrategy) {
		let results = await callDataStrategyImpl(dataStrategy || defaultDataStrategy, request, location, matches, null, requestContext, true);
		let dataResults = {};
		await Promise.all(matches.map(async (match) => {
			if (!(match.route.id in results)) return;
			let result = results[match.route.id];
			if (isRedirectDataStrategyResult(result)) {
				let response = result.result;
				throw normalizeRelativeRoutingRedirectResponse(response, request, match.route.id, matches, basename);
			}
			if (isRouteRequest) {
				if (isResponse(result.result)) throw result;
				else if (isDataWithResponseInit(result.result)) throw dataWithResponseInitToResponse(result.result);
			}
			dataResults[match.route.id] = await convertDataStrategyResultToDataResult(result);
		}));
		return dataResults;
	}
	return {
		dataRoutes,
		_internalRouteBranches: routeBranches,
		query,
		queryRoute
	};
}
/**
* Given an existing StaticHandlerContext and an error thrown at render time,
* provide an updated StaticHandlerContext suitable for a second SSR render
*
* @category Utils
*/
function getStaticContextFromError(routes, handlerContext, error, boundaryId) {
	let errorBoundaryId = boundaryId || handlerContext._deepestRenderedBoundaryId || routes[0].id;
	return {
		...handlerContext,
		statusCode: isRouteErrorResponse(error) ? error.status : 500,
		errors: { [errorBoundaryId]: error }
	};
}
function throwStaticHandlerAbortedError(request, isRouteRequest) {
	if (request.signal.reason !== void 0) throw request.signal.reason;
	throw new Error(`${isRouteRequest ? "queryRoute" : "query"}() call aborted without an \`AbortSignal.reason\`: ${request.method} ${request.url}`);
}
function defaultNormalizePath(request) {
	let url = new URL(request.url);
	return {
		pathname: url.pathname,
		search: url.search,
		hash: url.hash
	};
}
function normalizeTo(location, matches, basename, to, fromRouteId, relative) {
	let contextualMatches;
	let activeRouteMatch;
	if (fromRouteId) {
		contextualMatches = [];
		for (let match of matches) {
			contextualMatches.push(match);
			if (match.route.id === fromRouteId) {
				activeRouteMatch = match;
				break;
			}
		}
	} else {
		contextualMatches = matches;
		activeRouteMatch = matches[matches.length - 1];
	}
	let path = resolveTo(to ? to : ".", getResolveToMatches(contextualMatches), stripBasename(location.pathname, basename) || location.pathname, relative === "path");
	if (to == null) {
		path.search = location.search;
		path.hash = location.hash;
	}
	if ((to == null || to === "" || to === ".") && activeRouteMatch) {
		let nakedIndex = hasNakedIndexQuery(path.search);
		if (activeRouteMatch.route.index && !nakedIndex) path.search = path.search ? path.search.replace(/^\?/, "?index&") : "?index";
		else if (!activeRouteMatch.route.index && nakedIndex) {
			let params = new URLSearchParams(path.search);
			let indexValues = params.getAll("index");
			params.delete("index");
			indexValues.filter((v) => v).forEach((v) => params.append("index", v));
			let qs = params.toString();
			path.search = qs ? `?${qs}` : "";
		}
	}
	if (basename !== "/") path.pathname = prependBasename({
		basename,
		pathname: path.pathname
	});
	return createPath(path);
}
function shouldRevalidateLoader(loaderMatch, arg) {
	if (loaderMatch.route.shouldRevalidate) {
		let routeChoice = loaderMatch.route.shouldRevalidate(arg);
		if (typeof routeChoice === "boolean") return routeChoice;
	}
	return arg.defaultShouldRevalidate;
}
const lazyRoutePropertyCache = /* @__PURE__ */ new WeakMap();
const loadLazyRouteProperty = ({ key, route, manifest, mapRouteProperties }) => {
	let routeToUpdate = manifest[route.id];
	invariant$1(routeToUpdate, "No route found in manifest");
	if (!routeToUpdate.lazy || typeof routeToUpdate.lazy !== "object") return;
	let lazyFn = routeToUpdate.lazy[key];
	if (!lazyFn) return;
	let cache = lazyRoutePropertyCache.get(routeToUpdate);
	if (!cache) {
		cache = {};
		lazyRoutePropertyCache.set(routeToUpdate, cache);
	}
	let cachedPromise = cache[key];
	if (cachedPromise) return cachedPromise;
	let propertyPromise = (async () => {
		let isUnsupported = isUnsupportedLazyRouteObjectKey(key);
		let isStaticallyDefined = routeToUpdate[key] !== void 0;
		if (isUnsupported) {
			warning(!isUnsupported, "Route property " + key + " is not a supported lazy route property. This property will be ignored.");
			cache[key] = Promise.resolve();
		} else if (isStaticallyDefined) warning(false, `Route "${routeToUpdate.id}" has a static property "${key}" defined. The lazy property will be ignored.`);
		else {
			let value = await lazyFn();
			if (value != null) {
				Object.assign(routeToUpdate, { [key]: value });
				Object.assign(routeToUpdate, mapRouteProperties(routeToUpdate));
			}
		}
		if (typeof routeToUpdate.lazy === "object") {
			routeToUpdate.lazy[key] = void 0;
			if (Object.values(routeToUpdate.lazy).every((value) => value === void 0)) routeToUpdate.lazy = void 0;
		}
	})();
	cache[key] = propertyPromise;
	return propertyPromise;
};
const lazyRouteFunctionCache = /* @__PURE__ */ new WeakMap();
/**
* Execute route.lazy functions to lazily load route modules (loader, action,
* shouldRevalidate) and update the routeManifest in place which shares objects
* with dataRoutes so those get updated as well.
*/
function loadLazyRoute(route, type, manifest, mapRouteProperties, lazyRoutePropertiesToSkip) {
	let routeToUpdate = manifest[route.id];
	invariant$1(routeToUpdate, "No route found in manifest");
	if (!route.lazy) return {
		lazyRoutePromise: void 0,
		lazyHandlerPromise: void 0
	};
	if (typeof route.lazy === "function") {
		let cachedPromise = lazyRouteFunctionCache.get(routeToUpdate);
		if (cachedPromise) return {
			lazyRoutePromise: cachedPromise,
			lazyHandlerPromise: cachedPromise
		};
		let lazyRoutePromise = (async () => {
			invariant$1(typeof route.lazy === "function", "No lazy route function found");
			let lazyRoute = await route.lazy();
			let routeUpdates = {};
			for (let lazyRouteProperty in lazyRoute) {
				let lazyValue = lazyRoute[lazyRouteProperty];
				if (lazyValue === void 0) continue;
				let isUnsupported = isUnsupportedLazyRouteFunctionKey(lazyRouteProperty);
				let isStaticallyDefined = routeToUpdate[lazyRouteProperty] !== void 0;
				if (isUnsupported) warning(!isUnsupported, "Route property " + lazyRouteProperty + " is not a supported property to be returned from a lazy route function. This property will be ignored.");
				else if (isStaticallyDefined) warning(!isStaticallyDefined, `Route "${routeToUpdate.id}" has a static property "${lazyRouteProperty}" defined but its lazy function is also returning a value for this property. The lazy route property "${lazyRouteProperty}" will be ignored.`);
				else routeUpdates[lazyRouteProperty] = lazyValue;
			}
			Object.assign(routeToUpdate, routeUpdates);
			Object.assign(routeToUpdate, {
				...mapRouteProperties(routeToUpdate),
				lazy: void 0
			});
		})();
		lazyRouteFunctionCache.set(routeToUpdate, lazyRoutePromise);
		lazyRoutePromise.catch(() => {});
		return {
			lazyRoutePromise,
			lazyHandlerPromise: lazyRoutePromise
		};
	}
	let lazyKeys = Object.keys(route.lazy);
	let lazyPropertyPromises = [];
	let lazyHandlerPromise = void 0;
	for (let key of lazyKeys) {
		if (lazyRoutePropertiesToSkip && lazyRoutePropertiesToSkip.includes(key)) continue;
		let promise = loadLazyRouteProperty({
			key,
			route,
			manifest,
			mapRouteProperties
		});
		if (promise) {
			lazyPropertyPromises.push(promise);
			if (key === type) lazyHandlerPromise = promise;
		}
	}
	let lazyRoutePromise = lazyPropertyPromises.length > 0 ? Promise.all(lazyPropertyPromises).then(() => {}) : void 0;
	lazyRoutePromise?.catch(() => {});
	lazyHandlerPromise?.catch(() => {});
	return {
		lazyRoutePromise,
		lazyHandlerPromise
	};
}
function isNonNullable(value) {
	return value !== void 0;
}
function loadLazyMiddlewareForMatches(matches, manifest, mapRouteProperties) {
	let promises = matches.map(({ route }) => {
		if (typeof route.lazy !== "object" || !route.lazy.middleware) return;
		return loadLazyRouteProperty({
			key: "middleware",
			route,
			manifest,
			mapRouteProperties
		});
	}).filter(isNonNullable);
	return promises.length > 0 ? Promise.all(promises) : void 0;
}
async function defaultDataStrategy(args) {
	let matchesToLoad = args.matches.filter((m) => m.shouldLoad);
	let keyedResults = {};
	(await Promise.all(matchesToLoad.map((m) => m.resolve()))).forEach((result, i) => {
		keyedResults[matchesToLoad[i].route.id] = result;
	});
	return keyedResults;
}
function runServerMiddlewarePipeline(args, handler, errorHandler) {
	return runMiddlewarePipeline(args, handler, processResult, isResponse, errorHandler);
	function processResult(result) {
		return isDataWithResponseInit(result) ? dataWithResponseInitToResponse(result) : result;
	}
}
function runClientMiddlewarePipeline(args, handler) {
	return runMiddlewarePipeline(args, handler, (r) => {
		if (isRedirectResponse(r)) throw r;
		return r;
	}, isDataStrategyResults, errorHandler);
	async function errorHandler(error, routeId, nextResult) {
		if (nextResult) return Object.assign(nextResult.value, { [routeId]: {
			type: "error",
			result: error
		} });
		else {
			let { matches } = args;
			let maxBoundaryIdx = Math.min(Math.max(matches.findIndex((m) => m.route.id === routeId), 0), Math.max(matches.findIndex((m) => m.shouldCallHandler()), 0));
			let deepestRouteId = matches[maxBoundaryIdx].route.id;
			for (let match of matches.slice(0, maxBoundaryIdx + 1)) try {
				await match._lazyPromises?.route;
			} catch {
				deepestRouteId = match.route.id;
				break;
			}
			return { [findNearestBoundary(matches, deepestRouteId).route.id]: {
				type: "error",
				result: error
			} };
		}
	}
}
async function runMiddlewarePipeline(args, handler, processResult, isResult, errorHandler) {
	let { matches, ...dataFnArgs } = args;
	return await callRouteMiddleware(dataFnArgs, matches.flatMap((m) => m.route.middleware ? m.route.middleware.map((fn) => [m.route.id, fn]) : []), handler, processResult, isResult, errorHandler);
}
async function callRouteMiddleware(args, middlewares, handler, processResult, isResult, errorHandler, idx = 0) {
	let { request } = args;
	if (request.signal.aborted) throw request.signal.reason ?? /* @__PURE__ */ new Error(`Request aborted: ${request.method} ${request.url}`);
	let tuple = middlewares[idx];
	if (!tuple) return await handler();
	let [routeId, middleware] = tuple;
	let nextResult;
	let next = async () => {
		if (nextResult) throw new Error("You may only call `next()` once per middleware");
		try {
			nextResult = { value: await callRouteMiddleware(args, middlewares, handler, processResult, isResult, errorHandler, idx + 1) };
			return nextResult.value;
		} catch (error) {
			nextResult = { value: await errorHandler(error, routeId, nextResult) };
			return nextResult.value;
		}
	};
	try {
		let value = await middleware(args, next);
		let result = value != null ? processResult(value) : void 0;
		if (isResult(result)) return result;
		else if (nextResult) return result ?? nextResult.value;
		else {
			nextResult = { value: await next() };
			return nextResult.value;
		}
	} catch (error) {
		return await errorHandler(error, routeId, nextResult);
	}
}
function getDataStrategyMatchLazyPromises(mapRouteProperties, manifest, request, match, lazyRoutePropertiesToSkip) {
	let lazyMiddlewarePromise = loadLazyRouteProperty({
		key: "middleware",
		route: match.route,
		manifest,
		mapRouteProperties
	});
	let lazyRoutePromises = loadLazyRoute(match.route, isMutationMethod(request.method) ? "action" : "loader", manifest, mapRouteProperties, lazyRoutePropertiesToSkip);
	return {
		middleware: lazyMiddlewarePromise,
		route: lazyRoutePromises.lazyRoutePromise,
		handler: lazyRoutePromises.lazyHandlerPromise
	};
}
function getDataStrategyMatch(mapRouteProperties, manifest, request, path, pattern, match, lazyRoutePropertiesToSkip, scopedContext, shouldLoad, shouldRevalidateArgs = null, callSiteDefaultShouldRevalidate) {
	let isUsingNewApi = false;
	let _lazyPromises = getDataStrategyMatchLazyPromises(mapRouteProperties, manifest, request, match, lazyRoutePropertiesToSkip);
	return {
		...match,
		_lazyPromises,
		shouldLoad,
		shouldRevalidateArgs,
		shouldCallHandler(defaultShouldRevalidate) {
			isUsingNewApi = true;
			if (!shouldRevalidateArgs) return shouldLoad;
			if (typeof callSiteDefaultShouldRevalidate === "boolean") return shouldRevalidateLoader(match, {
				...shouldRevalidateArgs,
				defaultShouldRevalidate: callSiteDefaultShouldRevalidate
			});
			if (typeof defaultShouldRevalidate === "boolean") return shouldRevalidateLoader(match, {
				...shouldRevalidateArgs,
				defaultShouldRevalidate
			});
			return shouldRevalidateLoader(match, shouldRevalidateArgs);
		},
		resolve(handlerOverride) {
			let { lazy, loader, middleware } = match.route;
			let callHandler = isUsingNewApi || shouldLoad || handlerOverride && !isMutationMethod(request.method) && (lazy || loader);
			let isMiddlewareOnlyRoute = middleware && middleware.length > 0 && !loader && !lazy;
			if (callHandler && (isMutationMethod(request.method) || !isMiddlewareOnlyRoute)) return callLoaderOrAction({
				request,
				path,
				pattern,
				match,
				lazyHandlerPromise: _lazyPromises?.handler,
				lazyRoutePromise: _lazyPromises?.route,
				handlerOverride,
				scopedContext
			});
			return Promise.resolve({
				type: "data",
				result: void 0
			});
		}
	};
}
function getTargetedDataStrategyMatches(mapRouteProperties, manifest, request, path, matches, targetMatch, lazyRoutePropertiesToSkip, scopedContext, shouldRevalidateArgs = null) {
	return matches.map((match) => {
		if (match.route.id !== targetMatch.route.id) return {
			...match,
			shouldLoad: false,
			shouldRevalidateArgs,
			shouldCallHandler: () => false,
			_lazyPromises: getDataStrategyMatchLazyPromises(mapRouteProperties, manifest, request, match, lazyRoutePropertiesToSkip),
			resolve: () => Promise.resolve({
				type: "data",
				result: void 0
			})
		};
		return getDataStrategyMatch(mapRouteProperties, manifest, request, path, getRoutePattern(matches), match, lazyRoutePropertiesToSkip, scopedContext, true, shouldRevalidateArgs);
	});
}
async function callDataStrategyImpl(dataStrategyImpl, request, path, matches, fetcherKey, scopedContext, isStaticHandler) {
	if (matches.some((m) => m._lazyPromises?.middleware)) await Promise.all(matches.map((m) => m._lazyPromises?.middleware));
	let dataStrategyArgs = {
		request,
		url: createDataFunctionUrl(request, path),
		pattern: getRoutePattern(matches),
		params: matches[0].params,
		context: scopedContext,
		matches
	};
	let runClientMiddleware = isStaticHandler ? () => {
		throw new Error("You cannot call `runClientMiddleware()` from a static handler `dataStrategy`. Middleware is run outside of `dataStrategy` during SSR in order to bubble up the Response.  You can enable middleware via the `respond` API in `query`/`queryRoute`");
	} : (cb) => {
		let typedDataStrategyArgs = dataStrategyArgs;
		return runClientMiddlewarePipeline(typedDataStrategyArgs, () => {
			return cb({
				...typedDataStrategyArgs,
				fetcherKey,
				runClientMiddleware: () => {
					throw new Error("Cannot call `runClientMiddleware()` from within an `runClientMiddleware` handler");
				}
			});
		});
	};
	let results = await dataStrategyImpl({
		...dataStrategyArgs,
		fetcherKey,
		runClientMiddleware
	});
	try {
		await Promise.all(matches.flatMap((m) => [m._lazyPromises?.handler, m._lazyPromises?.route]));
	} catch (e) {}
	return results;
}
async function callLoaderOrAction({ request, path, pattern, match, lazyHandlerPromise, lazyRoutePromise, handlerOverride, scopedContext }) {
	let result;
	let onReject;
	let isAction = isMutationMethod(request.method);
	let type = isAction ? "action" : "loader";
	let runHandler = (handler) => {
		let reject;
		let abortPromise = new Promise((_, r) => reject = r);
		onReject = () => reject();
		request.signal.addEventListener("abort", onReject);
		let actualHandler = (ctx) => {
			if (typeof handler !== "function") return Promise.reject(/* @__PURE__ */ new Error(`You cannot call the handler for a route which defines a boolean "${type}" [routeId: ${match.route.id}]`));
			return handler({
				request,
				url: createDataFunctionUrl(request, path),
				pattern,
				params: match.params,
				context: scopedContext
			}, ...ctx !== void 0 ? [ctx] : []);
		};
		let handlerPromise = (async () => {
			try {
				return {
					type: "data",
					result: await (handlerOverride ? handlerOverride((ctx) => actualHandler(ctx)) : actualHandler())
				};
			} catch (e) {
				return {
					type: "error",
					result: e
				};
			}
		})();
		return Promise.race([handlerPromise, abortPromise]);
	};
	try {
		let handler = isAction ? match.route.action : match.route.loader;
		if (lazyHandlerPromise || lazyRoutePromise) if (handler) {
			let handlerError;
			let [value] = await Promise.all([
				runHandler(handler).catch((e) => {
					handlerError = e;
				}),
				lazyHandlerPromise,
				lazyRoutePromise
			]);
			if (handlerError !== void 0) throw handlerError;
			result = value;
		} else {
			await lazyHandlerPromise;
			let handler = isAction ? match.route.action : match.route.loader;
			if (handler) [result] = await Promise.all([runHandler(handler), lazyRoutePromise]);
			else if (type === "action") {
				let url = new URL(request.url);
				let pathname = url.pathname + url.search;
				throw getInternalRouterError(405, {
					method: request.method,
					pathname,
					routeId: match.route.id
				});
			} else return {
				type: "data",
				result: void 0
			};
		}
		else if (!handler) {
			let url = new URL(request.url);
			throw getInternalRouterError(404, { pathname: url.pathname + url.search });
		} else result = await runHandler(handler);
	} catch (e) {
		return {
			type: "error",
			result: e
		};
	} finally {
		if (onReject) request.signal.removeEventListener("abort", onReject);
	}
	return result;
}
async function parseResponseBody(response) {
	let contentType = response.headers.get("Content-Type");
	if (contentType && /\bapplication\/json\b/.test(contentType)) return response.body == null ? null : response.json();
	return response.text();
}
async function convertDataStrategyResultToDataResult(dataStrategyResult) {
	let { result, type } = dataStrategyResult;
	if (isResponse(result)) {
		let data;
		try {
			data = await parseResponseBody(result);
		} catch (e) {
			return {
				type: "error",
				error: e
			};
		}
		if (type === "error") return {
			type: "error",
			error: new ErrorResponseImpl(result.status, result.statusText, data),
			statusCode: result.status,
			headers: result.headers
		};
		return {
			type: "data",
			data,
			statusCode: result.status,
			headers: result.headers
		};
	}
	if (type === "error") {
		if (isDataWithResponseInit(result)) {
			if (result.data instanceof Error) return {
				type: "error",
				error: result.data,
				statusCode: result.init?.status,
				headers: result.init?.headers ? new Headers(result.init.headers) : void 0
			};
			return {
				type: "error",
				error: dataWithResponseInitToErrorResponse(result),
				statusCode: isRouteErrorResponse(result) ? result.status : void 0,
				headers: result.init?.headers ? new Headers(result.init.headers) : void 0
			};
		}
		return {
			type: "error",
			error: result,
			statusCode: isRouteErrorResponse(result) ? result.status : void 0
		};
	}
	if (isDataWithResponseInit(result)) return {
		type: "data",
		data: result.data,
		statusCode: result.init?.status,
		headers: result.init?.headers ? new Headers(result.init.headers) : void 0
	};
	return {
		type: "data",
		data: result
	};
}
function normalizeRelativeRoutingRedirectResponse(response, request, routeId, matches, basename) {
	let location = response.headers.get("Location");
	invariant$1(location, "Redirects returned/thrown from loaders/actions must have a Location header");
	if (!isAbsoluteUrl(location)) {
		let trimmedMatches = matches.slice(0, matches.findIndex((m) => m.route.id === routeId) + 1);
		location = normalizeTo(new URL(request.url), trimmedMatches, basename, location);
		response.headers.set("Location", location);
	}
	return response;
}
function processRouteLoaderData(matches, results, pendingActionResult, isStaticHandler = false, skipLoaderErrorBubbling = false) {
	let loaderData = {};
	let errors = null;
	let statusCode;
	let foundError = false;
	let loaderHeaders = {};
	let pendingError = pendingActionResult && isErrorResult(pendingActionResult[1]) ? pendingActionResult[1].error : void 0;
	matches.forEach((match) => {
		if (!(match.route.id in results)) return;
		let id = match.route.id;
		let result = results[id];
		invariant$1(!isRedirectResult(result), "Cannot handle redirect results in processLoaderData");
		if (isErrorResult(result)) {
			let error = result.error;
			if (pendingError !== void 0) {
				error = pendingError;
				pendingError = void 0;
			}
			errors = errors || {};
			if (skipLoaderErrorBubbling) errors[id] = error;
			else {
				let boundaryMatch = findNearestBoundary(matches, id);
				if (errors[boundaryMatch.route.id] == null) errors[boundaryMatch.route.id] = error;
			}
			if (!isStaticHandler) loaderData[id] = ResetLoaderDataSymbol;
			if (!foundError) {
				foundError = true;
				statusCode = isRouteErrorResponse(result.error) ? result.error.status : 500;
			}
			if (result.headers) loaderHeaders[id] = result.headers;
		} else {
			loaderData[id] = result.data;
			if (result.statusCode && result.statusCode !== 200 && !foundError) statusCode = result.statusCode;
			if (result.headers) loaderHeaders[id] = result.headers;
		}
	});
	if (pendingError !== void 0 && pendingActionResult) {
		errors = { [pendingActionResult[0]]: pendingError };
		if (pendingActionResult[2]) loaderData[pendingActionResult[2]] = void 0;
	}
	return {
		loaderData,
		errors,
		statusCode: statusCode || 200,
		loaderHeaders
	};
}
function findNearestBoundary(matches, routeId) {
	return (routeId ? matches.slice(0, matches.findIndex((m) => m.route.id === routeId) + 1) : [...matches]).reverse().find((m) => m.route.ErrorBoundary != null || m.route.errorElement != null) || matches[0];
}
function getShortCircuitMatches(routes) {
	let route = routes.length === 1 ? routes[0] : routes.find((r) => r.index || !r.path || r.path === "/") || { id: `__shim-error-route__` };
	return {
		matches: [{
			params: {},
			pathname: "",
			pathnameBase: "",
			route
		}],
		route
	};
}
function getInternalRouterError(status, { pathname, routeId, method, type, message } = {}) {
	let statusText = "Unknown Server Error";
	let errorMessage = "Unknown @remix-run/router error";
	if (status === 400) {
		statusText = "Bad Request";
		if (method && pathname && routeId) errorMessage = `You made a ${method} request to "${pathname}" but did not provide a \`loader\` for route "${routeId}", so there is no way to handle the request.`;
		else if (type === "invalid-body") errorMessage = "Unable to encode submission body";
	} else if (status === 403) {
		statusText = "Forbidden";
		errorMessage = `Route "${routeId}" does not match URL "${pathname}"`;
	} else if (status === 404) {
		statusText = "Not Found";
		errorMessage = `No route matches URL "${pathname}"`;
	} else if (status === 405) {
		statusText = "Method Not Allowed";
		if (method && pathname && routeId) errorMessage = `You made a ${method.toUpperCase()} request to "${pathname}" but did not provide an \`action\` for route "${routeId}", so there is no way to handle the request.`;
		else if (method) errorMessage = `Invalid request method "${method.toUpperCase()}"`;
	}
	return new ErrorResponseImpl(status || 500, statusText, new Error(errorMessage), true);
}
function dataWithResponseInitToResponse(data) {
	return Response.json(data.data, data.init ?? void 0);
}
function dataWithResponseInitToErrorResponse(data) {
	return new ErrorResponseImpl(data.init?.status ?? 500, data.init?.statusText ?? "Internal Server Error", data.data);
}
function isDataStrategyResults(result) {
	return result != null && typeof result === "object" && Object.entries(result).every(([key, value]) => typeof key === "string" && isDataStrategyResult(value));
}
function isDataStrategyResult(result) {
	return result != null && typeof result === "object" && "type" in result && "result" in result && (result.type === "data" || result.type === "error");
}
function isRedirectDataStrategyResult(result) {
	return isResponse(result.result) && redirectStatusCodes.has(result.result.status);
}
function isErrorResult(result) {
	return result.type === "error";
}
function isRedirectResult(result) {
	return (result && result.type) === "redirect";
}
function isDataWithResponseInit(value) {
	return typeof value === "object" && value != null && "type" in value && "data" in value && "init" in value && value.type === "DataWithResponseInit";
}
function isResponse(value) {
	return value != null && typeof value.status === "number" && typeof value.statusText === "string" && typeof value.headers === "object" && typeof value.body !== "undefined";
}
function isRedirectStatusCode(statusCode) {
	return redirectStatusCodes.has(statusCode);
}
function isRedirectResponse(result) {
	return isResponse(result) && isRedirectStatusCode(result.status) && result.headers.has("Location");
}
function isValidMethod(method) {
	return validRequestMethods.has(method.toUpperCase());
}
function isMutationMethod(method) {
	return validMutationMethods.has(method.toUpperCase());
}
function hasNakedIndexQuery(search) {
	return new URLSearchParams(search).getAll("index").some((v) => v === "");
}
function getTargetMatch(matches, location) {
	let search = typeof location === "string" ? parsePath(location).search : location.search;
	if (matches[matches.length - 1].route.index && hasNakedIndexQuery(search || "")) return matches[matches.length - 1];
	let pathMatches = getPathContributingMatches(matches);
	return pathMatches[pathMatches.length - 1];
}
//#endregion
//#region lib/server-runtime/invariant.ts
function invariant(value, message) {
	if (value === false || value === null || typeof value === "undefined") {
		console.error("The following error is a bug in React Router; please open an issue! https://github.com/remix-run/react-router/issues/new/choose");
		throw new Error(message);
	}
}
//#endregion
//#region lib/server-runtime/headers.ts
function getDocumentHeadersImpl(context, getRouteHeadersFn, _defaultHeaders) {
	let boundaryIdx = context.errors ? context.matches.findIndex((m) => context.errors[m.route.id]) : -1;
	let matches = boundaryIdx >= 0 ? context.matches.slice(0, boundaryIdx + 1) : context.matches;
	let errorHeaders;
	if (boundaryIdx >= 0) {
		let { actionHeaders, actionData, loaderHeaders, loaderData } = context;
		context.matches.slice(boundaryIdx).some((match) => {
			let id = match.route.id;
			if (actionHeaders[id] && (!actionData || !actionData.hasOwnProperty(id))) errorHeaders = actionHeaders[id];
			else if (loaderHeaders[id] && !loaderData.hasOwnProperty(id)) errorHeaders = loaderHeaders[id];
			return errorHeaders != null;
		});
	}
	const defaultHeaders = new Headers(_defaultHeaders);
	return matches.reduce((parentHeaders, match, idx) => {
		let { id } = match.route;
		let loaderHeaders = context.loaderHeaders[id] || new Headers();
		let actionHeaders = context.actionHeaders[id] || new Headers();
		let includeErrorHeaders = errorHeaders != null && idx === matches.length - 1;
		let includeErrorCookies = includeErrorHeaders && errorHeaders !== loaderHeaders && errorHeaders !== actionHeaders;
		let headersFn = getRouteHeadersFn(match);
		if (headersFn == null) {
			let headers = new Headers(parentHeaders);
			if (includeErrorCookies) prependCookies(errorHeaders, headers);
			prependCookies(actionHeaders, headers);
			prependCookies(loaderHeaders, headers);
			return headers;
		}
		let headers = new Headers(typeof headersFn === "function" ? headersFn({
			loaderHeaders,
			parentHeaders,
			actionHeaders,
			errorHeaders: includeErrorHeaders ? errorHeaders : void 0
		}) : headersFn);
		if (includeErrorCookies) prependCookies(errorHeaders, headers);
		prependCookies(actionHeaders, headers);
		prependCookies(loaderHeaders, headers);
		prependCookies(parentHeaders, headers);
		return headers;
	}, new Headers(defaultHeaders));
}
function prependCookies(parentHeaders, childHeaders) {
	let parentSetCookieString = parentHeaders.get("Set-Cookie");
	if (parentSetCookieString) {
		let cookies = splitSetCookieString(parentSetCookieString);
		let childCookies = new Set(childHeaders.getSetCookie());
		cookies.forEach((cookie) => {
			if (!childCookies.has(cookie)) childHeaders.append("Set-Cookie", cookie);
		});
	}
}
//#endregion
//#region lib/server-runtime/warnings.ts
const alreadyWarned = {};
function warnOnce(condition, message) {
	if (!condition && !alreadyWarned[message]) {
		alreadyWarned[message] = true;
		console.warn(message);
	}
}
//#endregion
//#region lib/errors.ts
const ERROR_DIGEST_BASE = "REACT_ROUTER_ERROR";
const ERROR_DIGEST_REDIRECT = "REDIRECT";
const ERROR_DIGEST_ROUTE_ERROR_RESPONSE = "ROUTE_ERROR_RESPONSE";
function createRedirectErrorDigest(response) {
	return `${ERROR_DIGEST_BASE}:${ERROR_DIGEST_REDIRECT}:${JSON.stringify({
		status: response.status,
		statusText: response.statusText,
		location: response.headers.get("Location"),
		reloadDocument: response.headers.get("X-Remix-Reload-Document") === "true",
		replace: response.headers.get("X-Remix-Replace") === "true"
	})}`;
}
function createRouteErrorResponseDigest(response) {
	let status = 500;
	let statusText = "";
	let data;
	if (isDataWithResponseInit(response)) {
		status = response.init?.status ?? status;
		statusText = response.init?.statusText ?? statusText;
		data = response.data;
	} else {
		status = response.status;
		statusText = response.statusText;
		data = void 0;
	}
	return `${ERROR_DIGEST_BASE}:${ERROR_DIGEST_ROUTE_ERROR_RESPONSE}:${JSON.stringify({
		status,
		statusText,
		data
	})}`;
}
function getPathsWithAncestors(paths) {
	let result = /* @__PURE__ */ new Set();
	paths.forEach((path) => {
		if (!path.startsWith("/")) path = `/${path}`;
		for (let i = 1; i < path.length; i++) if (path[i] === "/") result.add(path.slice(0, i));
		result.add(path);
	});
	return Array.from(result);
}
//#endregion
//#region lib/actions.ts
function throwIfPotentialCSRFAttack(request, allowedActionOrigins) {
	let originHeader = request.headers.get("origin");
	let originDomain = null;
	try {
		originDomain = typeof originHeader === "string" && originHeader !== "null" ? new URL(originHeader).host : originHeader;
	} catch {
		throw new Error(`\`origin\` header is not a valid URL. Aborting the action.`);
	}
	let host = new URL(request.url).host;
	if (originDomain && originDomain !== host) {
		if (!isAllowedOrigin(originDomain, allowedActionOrigins)) throw new Error("The `request.url` host does not match `origin` header from a forwarded action request. Aborting the action.");
	}
}
function matchWildcardDomain(domain, pattern) {
	const domainParts = domain.split(".");
	const patternParts = pattern.split(".");
	if (patternParts.length < 1) return false;
	if (domainParts.length < patternParts.length) return false;
	while (patternParts.length) {
		const patternPart = patternParts.pop();
		const domainPart = domainParts.pop();
		switch (patternPart) {
			case "": return false;
			case "*": if (domainPart) continue;
			else return false;
			case "**":
				if (patternParts.length > 0) return false;
				return domainPart !== void 0;
			case void 0:
			default: if (domainPart !== patternPart) return false;
		}
	}
	return domainParts.length === 0;
}
function isAllowedOrigin(originDomain, allowedActionOrigins = []) {
	return allowedActionOrigins.some((allowedOrigin) => allowedOrigin && (allowedOrigin === originDomain || matchWildcardDomain(originDomain, allowedOrigin)));
}
//#endregion
//#region lib/server-runtime/urls.ts
function getNormalizedPath(request) {
	let url = new URL(request.url);
	let pathname = url.pathname;
	if (pathname.endsWith("/_.data")) pathname = pathname.replace(/_\.data$/, "");
	else pathname = pathname.replace(/\.data$/, "");
	let searchParams = new URLSearchParams(url.search);
	searchParams.delete("_routes");
	let search = searchParams.toString();
	if (search) search = `?${search}`;
	return {
		pathname,
		search,
		hash: ""
	};
}
//#endregion
//#region lib/rsc/server.rsc.ts
const Outlet$2 = Outlet$1;
const WithComponentProps = UNSAFE_WithComponentProps;
const WithErrorBoundaryProps = UNSAFE_WithErrorBoundaryProps;
const WithHydrateFallbackProps = UNSAFE_WithHydrateFallbackProps;
const globalVar = typeof globalThis !== "undefined" ? globalThis : global;
const ServerStorage = globalVar.___reactRouterServerStorage___ ??= new AsyncLocalStorage();
function getRequest() {
	const ctx = ServerStorage.getStore();
	if (!ctx) throw new Error("getRequest must be called from within a React Server render context");
	return ctx.request;
}
const redirect = (...args) => {
	const response = redirect$1(...args);
	const ctx = ServerStorage.getStore();
	if (ctx && ctx.runningAction) ctx.redirect = response;
	return response;
};
const redirectDocument = (...args) => {
	const response = redirectDocument$1(...args);
	const ctx = ServerStorage.getStore();
	if (ctx && ctx.runningAction) ctx.redirect = response;
	return response;
};
const replace = (...args) => {
	const response = replace$1(...args);
	const ctx = ServerStorage.getStore();
	if (ctx && ctx.runningAction) ctx.redirect = response;
	return response;
};
const cachedResolvePromise = React.cache(async (resolve) => {
	return Promise.allSettled([resolve]).then((r) => r[0]);
});
const Await = (async ({ children, resolve, errorElement }) => {
	let resolved = await cachedResolvePromise(resolve);
	if (resolved.status === "rejected" && !errorElement) throw resolved.reason;
	if (resolved.status === "rejected") return React.createElement(UNSAFE_AwaitContextProvider, {
		children: React.createElement(React.Fragment, null, errorElement),
		value: {
			_tracked: true,
			_error: resolved.reason
		}
	});
	const toRender = typeof children === "function" ? children(resolved.value) : children;
	return React.createElement(UNSAFE_AwaitContextProvider, {
		children: toRender,
		value: {
			_tracked: true,
			_data: resolved.value
		}
	});
});
/**
* Matches the given routes to a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
* and returns an [RSC](https://react.dev/reference/rsc/server-components)
* [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
* encoding an {@link unstable_RSCPayload} for consumption by an [RSC](https://react.dev/reference/rsc/server-components)
* enabled client router.
*
* @example
* import {
*   createTemporaryReferenceSet,
*   decodeAction,
*   decodeReply,
*   loadServerAction,
*   renderToReadableStream,
* } from "@vitejs/plugin-rsc/rsc";
* import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";
*
* matchRSCServerRequest({
*   createTemporaryReferenceSet,
*   decodeAction,
*   decodeFormState,
*   decodeReply,
*   loadServerAction,
*   request,
*   routes: routes(),
*   generateResponse(match) {
*     return new Response(
*       renderToReadableStream(match.payload),
*       {
*         status: match.statusCode,
*         headers: match.headers,
*       }
*     );
*   },
* });
*
* @name unstable_matchRSCServerRequest
* @public
* @category RSC
* @mode data
* @param opts Options
* @param opts.allowedActionOrigins Origin patterns that are allowed to execute actions.
* @param opts.basename The basename to use when matching the request.
* @param opts.createTemporaryReferenceSet A function that returns a temporary
* reference set for the request, used to track temporary references in the [RSC](https://react.dev/reference/rsc/server-components)
* stream.
* @param opts.decodeAction Your `react-server-dom-xyz/server`'s `decodeAction`
* function, responsible for loading a server action.
* @param opts.decodeFormState A function responsible for decoding form state for
* progressively enhanceable forms with React's [`useActionState`](https://react.dev/reference/react/useActionState)
* using your `react-server-dom-xyz/server`'s `decodeFormState`.
* @param opts.decodeReply Your `react-server-dom-xyz/server`'s `decodeReply`
* function, used to decode the server function's arguments and bind them to the
* implementation for invocation by the router.
* @param opts.generateResponse A function responsible for using your
* `renderToReadableStream` to generate a [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
* encoding the {@link unstable_RSCPayload}.
* @param opts.loadServerAction Your `react-server-dom-xyz/server`'s
* `loadServerAction` function, used to load a server action by ID.
* @param opts.onError An optional error handler that will be called with any
* errors that occur during the request processing.
* @param opts.request The [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
* to match against.
* @param opts.requestContext An instance of {@link RouterContextProvider}
* that should be created per request, to be passed to [`action`](../../start/data/route-object#action)s,
* [`loader`](../../start/data/route-object#loader)s and [middleware](../../how-to/middleware).
* @param opts.routeDiscovery The route discovery configuration, used to determine how the router should discover new routes during navigations.
* @param opts.routes Your {@link unstable_RSCRouteConfigEntry | route definitions}.
* @returns A [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
* that contains the [RSC](https://react.dev/reference/rsc/server-components)
* data for hydration.
*/
async function matchRSCServerRequest({ allowedActionOrigins, createTemporaryReferenceSet, basename, decodeReply, requestContext, routeDiscovery, loadServerAction, decodeAction, decodeFormState, onError, request, routes, generateResponse }) {
	let url = new URL(request.url);
	basename = basename || "/";
	let normalizedPath = url.pathname;
	if (url.pathname.endsWith("/_.rsc")) normalizedPath = url.pathname.replace(/_\.rsc$/, "");
	else if (url.pathname.endsWith(".rsc")) normalizedPath = url.pathname.replace(/\.rsc$/, "");
	if (stripBasename(normalizedPath, basename) !== "/" && normalizedPath.endsWith("/")) normalizedPath = normalizedPath.slice(0, -1);
	url.pathname = normalizedPath;
	basename = basename.length > normalizedPath.length ? normalizedPath : basename;
	let routerRequest = new Request(url.toString(), {
		method: request.method,
		headers: request.headers,
		body: request.body,
		signal: request.signal,
		duplex: request.body ? "half" : void 0
	});
	const temporaryReferences = createTemporaryReferenceSet();
	const requestUrl = new URL(request.url);
	if (isManifestRequest(requestUrl)) return await generateManifestResponse(routes, basename, request, generateResponse, temporaryReferences, routeDiscovery);
	let isDataRequest = isReactServerRequest(requestUrl);
	let matches = matchRoutes(routes, url.pathname, basename);
	if (matches) await Promise.all(matches.map((m) => explodeLazyRoute(m.route)));
	const leafMatch = matches?.[matches.length - 1];
	if (!isDataRequest && leafMatch && !leafMatch.route.Component && !leafMatch.route.ErrorBoundary) return generateResourceResponse(routerRequest, routes, basename, leafMatch.route.id, requestContext, onError);
	let response = await generateRenderResponse(routerRequest, routes, basename, isDataRequest, decodeReply, requestContext, loadServerAction, decodeAction, decodeFormState, onError, generateResponse, temporaryReferences, allowedActionOrigins, routeDiscovery);
	response.headers.set("X-Remix-Response", "yes");
	return response;
}
async function generateManifestResponse(routes, basename, request, generateResponse, temporaryReferences, routeDiscovery) {
	let url = new URL(request.url);
	if (url.toString().length > 7680) return new Response(null, {
		statusText: "Bad Request",
		status: 400
	});
	if (routeDiscovery?.mode === "initial") {
		let payload = {
			type: "manifest",
			patches: getAllRoutePatches(routes, basename)
		};
		return generateResponse({
			statusCode: 200,
			headers: new Headers({
				"Content-Type": "text/x-component",
				Vary: "Content-Type"
			}),
			payload
		}, {
			temporaryReferences,
			onError: defaultOnError
		});
	}
	let pathParam = url.searchParams.get("paths");
	let pathnames = pathParam ? pathParam.split(",").filter(Boolean) : [url.pathname.replace(/\.manifest$/, "")];
	let routeIds = /* @__PURE__ */ new Set();
	let matchedRoutes = pathnames.flatMap((pathname) => {
		let pathnameMatches = matchRoutes(routes, pathname, basename);
		return pathnameMatches?.map((m, i) => ({
			...m.route,
			parentId: pathnameMatches[i - 1]?.route.id
		})) ?? [];
	}).filter((route) => {
		if (!routeIds.has(route.id)) {
			routeIds.add(route.id);
			return true;
		}
		return false;
	});
	let payload = {
		type: "manifest",
		patches: Promise.all([...matchedRoutes.map((route) => getManifestRoute(route)), getAdditionalRoutePatches(pathnames, routes, basename, Array.from(routeIds))]).then((r) => r.flat(1))
	};
	return generateResponse({
		statusCode: 200,
		headers: new Headers({ "Content-Type": "text/x-component" }),
		payload
	}, {
		temporaryReferences,
		onError: defaultOnError
	});
}
function prependBasenameToRedirectResponse(response, basename = "/") {
	if (basename === "/") return response;
	let redirect = response.headers.get("Location");
	if (!redirect || isAbsoluteUrl(redirect)) return response;
	response.headers.set("Location", prependBasename({
		basename,
		pathname: redirect
	}));
	return response;
}
async function processServerAction(request, basename, decodeReply, loadServerAction, decodeAction, decodeFormState, onError, temporaryReferences) {
	const getRevalidationRequest = () => new Request(request.url, {
		method: "GET",
		headers: request.headers,
		signal: request.signal
	});
	const isFormRequest = canDecodeWithFormData(request.headers.get("Content-Type"));
	const actionId = request.headers.get("rsc-action-id");
	if (actionId) {
		if (!decodeReply || !loadServerAction) throw new Error("Cannot handle enhanced server action without decodeReply and loadServerAction functions");
		const actionArgs = await decodeReply(isFormRequest ? await request.formData() : await request.text(), { temporaryReferences });
		const serverAction = (await loadServerAction(actionId)).bind(null, ...actionArgs);
		let actionResult = Promise.resolve(serverAction());
		try {
			await actionResult;
		} catch (error) {
			if (isResponse(error)) return error;
			onError?.(error);
		}
		let maybeFormData = actionArgs.length === 1 ? actionArgs[0] : actionArgs[1];
		let skipRevalidation = (maybeFormData && typeof maybeFormData === "object" && maybeFormData instanceof FormData ? maybeFormData : null)?.has("$SKIP_REVALIDATION") ?? false;
		return {
			actionResult,
			revalidationRequest: getRevalidationRequest(),
			skipRevalidation
		};
	} else if (isFormRequest) {
		const formData = await request.clone().formData();
		if (Array.from(formData.keys()).some((k) => k.startsWith("$ACTION_"))) {
			if (!decodeAction) throw new Error("Cannot handle form actions without a decodeAction function");
			const action = await decodeAction(formData);
			let formState = void 0;
			try {
				let result = await action();
				if (isRedirectResponse(result)) result = prependBasenameToRedirectResponse(result, basename);
				formState = await decodeFormState?.(result, formData);
			} catch (error) {
				if (isRedirectResponse(error)) return prependBasenameToRedirectResponse(error, basename);
				if (isResponse(error)) return error;
				onError?.(error);
			}
			return {
				formState,
				revalidationRequest: getRevalidationRequest(),
				skipRevalidation: false
			};
		}
	}
}
async function generateResourceResponse(request, routes, basename, routeId, requestContext, onError) {
	try {
		return await createStaticHandler(routes, { basename }).queryRoute(request, {
			routeId,
			requestContext,
			async generateMiddlewareResponse(queryRoute) {
				try {
					return generateResourceResponse(await queryRoute(request));
				} catch (error) {
					return generateErrorResponse(error);
				}
			},
			normalizePath: (r) => getNormalizedPath(r)
		});
	} catch (error) {
		return generateErrorResponse(error);
	}
	function generateErrorResponse(error) {
		let response;
		if (isResponse(error)) response = error;
		else if (isRouteErrorResponse(error)) {
			onError?.(error);
			const errorMessage = typeof error.data === "string" ? error.data : error.statusText;
			response = new Response(errorMessage, {
				status: error.status,
				statusText: error.statusText
			});
		} else {
			onError?.(error);
			response = new Response("Internal Server Error", { status: 500 });
		}
		return generateResourceResponse(response);
	}
	function generateResourceResponse(response) {
		const headers = new Headers(response.headers);
		headers.set("React-Router-Resource", "true");
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers
		});
	}
}
async function generateRenderResponse(request, routes, basename, isDataRequest, decodeReply, requestContext, loadServerAction, decodeAction, decodeFormState, onError, generateResponse, temporaryReferences, allowedActionOrigins, routeDiscovery) {
	let statusCode = 200;
	let url = new URL(request.url);
	let isSubmission = isMutationMethod(request.method);
	let routeIdsToLoad = !isSubmission && url.searchParams.has("_routes") ? url.searchParams.get("_routes").split(",") : null;
	const staticHandler = createStaticHandler(routes, { basename });
	let actionResult;
	const ctx = {
		request,
		runningAction: false
	};
	const result = await ServerStorage.run(ctx, () => staticHandler.query(request, {
		requestContext,
		skipLoaderErrorBubbling: isDataRequest,
		skipRevalidation: isSubmission,
		...routeIdsToLoad ? { filterMatchesToLoad: (m) => routeIdsToLoad.includes(m.route.id) } : {},
		normalizePath: (r) => getNormalizedPath(r),
		async generateMiddlewareResponse(query) {
			let formState;
			let skipRevalidation = false;
			let potentialCSRFAttackError;
			if (isMutationMethod(request.method)) try {
				throwIfPotentialCSRFAttack(request, allowedActionOrigins);
				ctx.runningAction = true;
				let result = await processServerAction(request, basename, decodeReply, loadServerAction, decodeAction, decodeFormState, onError, temporaryReferences).finally(() => {
					ctx.runningAction = false;
				});
				if (isResponse(result)) return generateRedirectResponse(result, actionResult, basename, isDataRequest, generateResponse, temporaryReferences, ctx.redirect?.headers);
				skipRevalidation = result?.skipRevalidation ?? false;
				actionResult = result?.actionResult;
				formState = result?.formState;
				request = result?.revalidationRequest ?? request;
				if (ctx.redirect) return generateRedirectResponse(ctx.redirect, actionResult, basename, isDataRequest, generateResponse, temporaryReferences, void 0);
			} catch (error) {
				potentialCSRFAttackError = error;
			}
			let staticContext = await query(request, skipRevalidation || !!potentialCSRFAttackError ? { filterMatchesToLoad: () => false } : void 0);
			if (isResponse(staticContext)) return generateRedirectResponse(staticContext, actionResult, basename, isDataRequest, generateResponse, temporaryReferences, ctx.redirect?.headers);
			if (potentialCSRFAttackError) {
				staticContext.errors ??= {};
				staticContext.errors[staticContext.matches[0].route.id] = potentialCSRFAttackError;
				staticContext.statusCode = 400;
			}
			return generateStaticContextResponse(routes, basename, generateResponse, statusCode, routeIdsToLoad, isDataRequest, isSubmission, actionResult, formState, staticContext, temporaryReferences, skipRevalidation, ctx.redirect?.headers, routeDiscovery);
		}
	}));
	if (isRedirectResponse(result)) return generateRedirectResponse(result, actionResult, basename, isDataRequest, generateResponse, temporaryReferences, ctx.redirect?.headers);
	invariant(isResponse(result), "Expected a response from query");
	return result;
}
function generateRedirectResponse(response, actionResult, basename, isDataRequest, generateResponse, temporaryReferences, sideEffectRedirectHeaders) {
	let redirect = response.headers.get("Location");
	if (isDataRequest && basename) redirect = stripBasename(redirect, basename) || redirect;
	let payload = {
		type: "redirect",
		location: redirect,
		reload: response.headers.get("X-Remix-Reload-Document") === "true",
		replace: response.headers.get("X-Remix-Replace") === "true",
		status: response.status,
		actionResult
	};
	let headers = new Headers(sideEffectRedirectHeaders);
	for (const [key, value] of response.headers.entries()) headers.append(key, value);
	headers.delete("Location");
	headers.delete("X-Remix-Reload-Document");
	headers.delete("X-Remix-Replace");
	headers.delete("Content-Length");
	headers.set("Content-Type", "text/x-component");
	return generateResponse({
		statusCode: 202,
		headers,
		payload
	}, {
		temporaryReferences,
		onError: defaultOnError
	});
}
async function generateStaticContextResponse(routes, basename, generateResponse, statusCode, routeIdsToLoad, isDataRequest, isSubmission, actionResult, formState, staticContext, temporaryReferences, skipRevalidation, sideEffectRedirectHeaders, routeDiscovery) {
	statusCode = staticContext.statusCode ?? statusCode;
	if (staticContext.errors) staticContext.errors = Object.fromEntries(Object.entries(staticContext.errors).map(([key, error]) => [key, isRouteErrorResponse(error) ? Object.fromEntries(Object.entries(error)) : error]));
	staticContext.matches.forEach((m) => {
		const routeHasNoLoaderData = staticContext.loaderData[m.route.id] === void 0;
		const routeHasError = Boolean(staticContext.errors && m.route.id in staticContext.errors);
		if (routeHasNoLoaderData && !routeHasError) staticContext.loaderData[m.route.id] = null;
	});
	let headers = getDocumentHeadersImpl(staticContext, (match) => match.route.headers, sideEffectRedirectHeaders);
	headers.delete("Content-Length");
	const baseRenderPayload = {
		type: "render",
		basename: staticContext.basename,
		routeDiscovery: routeDiscovery ?? { mode: "lazy" },
		actionData: staticContext.actionData,
		errors: staticContext.errors,
		loaderData: staticContext.loaderData,
		location: staticContext.location,
		formState
	};
	const renderPayloadPromise = () => getRenderPayload(baseRenderPayload, routes, basename, routeIdsToLoad, isDataRequest, staticContext, routeDiscovery);
	let payload;
	if (actionResult) payload = {
		type: "action",
		actionResult,
		rerender: skipRevalidation ? void 0 : renderPayloadPromise()
	};
	else if (isSubmission && isDataRequest) payload = {
		...baseRenderPayload,
		matches: [],
		patches: Promise.resolve([])
	};
	else payload = await renderPayloadPromise();
	return generateResponse({
		statusCode,
		headers,
		payload
	}, {
		temporaryReferences,
		onError: defaultOnError
	});
}
async function getRenderPayload(baseRenderPayload, routes, basename, routeIdsToLoad, isDataRequest, staticContext, routeDiscovery) {
	let deepestRenderedRouteIdx = staticContext.matches.length - 1;
	let parentIds = {};
	staticContext.matches.forEach((m, i) => {
		if (i > 0) parentIds[m.route.id] = staticContext.matches[i - 1].route.id;
		if (staticContext.errors && m.route.id in staticContext.errors && deepestRenderedRouteIdx > i) deepestRenderedRouteIdx = i;
	});
	let matchesPromise = Promise.all(staticContext.matches.map((match, i) => {
		let isBelowErrorBoundary = i > deepestRenderedRouteIdx;
		let parentId = parentIds[match.route.id];
		return getRSCRouteMatch({
			staticContext,
			match,
			routeIdsToLoad,
			isBelowErrorBoundary,
			parentId
		});
	}));
	let patches = routeDiscovery?.mode === "initial" && !isDataRequest ? getAllRoutePatches(routes, basename).then((patches) => patches.filter((patch) => !staticContext.matches.some((m) => m.route.id === patch.id))) : getAdditionalRoutePatches(getPathsWithAncestors([staticContext.location.pathname]), routes, basename, staticContext.matches.map((m) => m.route.id));
	return {
		...baseRenderPayload,
		matches: await matchesPromise,
		patches
	};
}
async function getRSCRouteMatch({ staticContext, match, isBelowErrorBoundary, routeIdsToLoad, parentId }) {
	const route = match.route;
	await explodeLazyRoute(route);
	const Layout = route.Layout || React.Fragment;
	const Component = route.Component;
	const ErrorBoundary = route.ErrorBoundary;
	const HydrateFallback = route.HydrateFallback;
	const loaderData = staticContext.loaderData[route.id];
	const actionData = staticContext.actionData?.[route.id];
	const params = match.params;
	let element = void 0;
	let shouldLoadRoute = !routeIdsToLoad || routeIdsToLoad.includes(route.id);
	if (Component && shouldLoadRoute) element = !isBelowErrorBoundary ? React.createElement(Layout, null, isClientReference(Component) ? React.createElement(WithComponentProps, { children: React.createElement(Component) }) : React.createElement(Component, {
		loaderData,
		actionData,
		params,
		matches: staticContext.matches.map((match) => convertRouteMatchToUiMatch(match, staticContext.loaderData))
	})) : React.createElement(Outlet$2);
	let error = void 0;
	if (ErrorBoundary && staticContext.errors) error = staticContext.errors[route.id];
	const errorElement = ErrorBoundary ? React.createElement(Layout, null, isClientReference(ErrorBoundary) ? React.createElement(WithErrorBoundaryProps, { children: React.createElement(ErrorBoundary) }) : React.createElement(ErrorBoundary, {
		loaderData,
		actionData,
		params,
		error
	})) : void 0;
	const hydrateFallbackElement = HydrateFallback ? React.createElement(Layout, null, isClientReference(HydrateFallback) ? React.createElement(WithHydrateFallbackProps, { children: React.createElement(HydrateFallback) }) : React.createElement(HydrateFallback, {
		loaderData,
		actionData,
		params
	})) : void 0;
	const hmrRoute = route;
	return {
		clientAction: route.clientAction,
		clientLoader: route.clientLoader,
		element,
		errorElement,
		handle: route.handle,
		hasAction: !!route.action,
		hasComponent: !!Component,
		hasLoader: !!route.loader,
		hydrateFallbackElement,
		id: route.id,
		index: "index" in route ? route.index : void 0,
		links: route.links,
		meta: route.meta,
		params,
		parentId,
		path: route.path,
		pathname: match.pathname,
		pathnameBase: match.pathnameBase,
		shouldRevalidate: route.shouldRevalidate,
		...hmrRoute.__ensureClientRouteModuleForHMR ? { __ensureClientRouteModuleForHMR: hmrRoute.__ensureClientRouteModuleForHMR } : {}
	};
}
async function getManifestRoute(route) {
	await explodeLazyRoute(route);
	const Layout = route.Layout || React.Fragment;
	const errorElement = route.ErrorBoundary ? React.createElement(Layout, null, React.createElement(route.ErrorBoundary)) : void 0;
	return {
		clientAction: route.clientAction,
		clientLoader: route.clientLoader,
		handle: route.handle,
		hasAction: !!route.action,
		hasComponent: !!route.Component,
		errorElement,
		hasLoader: !!route.loader,
		id: route.id,
		parentId: route.parentId,
		path: route.path,
		index: "index" in route ? route.index : void 0,
		links: route.links,
		meta: route.meta
	};
}
async function explodeLazyRoute(route) {
	if ("lazy" in route && route.lazy) {
		let { default: lazyDefaultExport, Component: lazyComponentExport, ...lazyProperties } = await route.lazy();
		let Component = lazyComponentExport || lazyDefaultExport;
		if (Component && !route.Component) route.Component = Component;
		for (let [k, v] of Object.entries(lazyProperties)) if (k !== "id" && k !== "path" && k !== "index" && k !== "children" && route[k] == null) route[k] = v;
		route.lazy = void 0;
	}
}
async function getAllRoutePatches(routes, basename) {
	let patches = [];
	async function traverse(route, parentId) {
		let manifestRoute = await getManifestRoute({
			...route,
			parentId
		});
		patches.push(manifestRoute);
		if ("children" in route && route.children?.length) for (let child of route.children) await traverse(child, route.id);
	}
	for (let route of routes) await traverse(route, void 0);
	return patches.filter((p) => !!p.parentId);
}
async function getAdditionalRoutePatches(pathnames, routes, basename, matchedRouteIds) {
	let patchRouteMatches = /* @__PURE__ */ new Map();
	let matchedPaths = /* @__PURE__ */ new Set();
	for (const pathname of pathnames) {
		if (matchedPaths.has(pathname)) continue;
		matchedPaths.add(pathname);
		let matches = matchRoutes(routes, pathname, basename) || [];
		matches.forEach((m, i) => {
			if (patchRouteMatches.get(m.route.id)) return;
			patchRouteMatches.set(m.route.id, {
				...m.route,
				parentId: matches[i - 1]?.route.id
			});
		});
	}
	return await Promise.all([...patchRouteMatches.values()].filter((route) => !matchedRouteIds.some((id) => id === route.id)).map((route) => getManifestRoute(route)));
}
function isReactServerRequest(url) {
	return url.pathname.endsWith(".rsc");
}
function isManifestRequest(url) {
	return url.pathname.endsWith(".manifest");
}
function defaultOnError(error) {
	if (isRedirectResponse(error)) return createRedirectErrorDigest(error);
	if (isResponse(error) || isDataWithResponseInit(error)) return createRouteErrorResponseDigest(error);
}
function isClientReference(x) {
	try {
		return x.$$typeof === Symbol.for("react.client.reference");
	} catch {
		return false;
	}
}
function canDecodeWithFormData(contentType) {
	if (!contentType) return false;
	return contentType.match(/\bapplication\/x-www-form-urlencoded\b/) || contentType.match(/\bmultipart\/form-data\b/);
}
//#endregion
//#region lib/href.ts
function stringify(p) {
	return p == null ? "" : typeof p === "string" ? p : String(p);
}
/**
Returns a resolved URL path for the specified route.

```tsx
const h = href("/:lang?/about", { lang: "en" })
// -> `/en/about`

<Link to={href("/products/:id", { id: "abc123" })} />
```
*/
function href(path, ...args) {
	let params = args[0];
	let result = trimTrailingSplat(path).replace(/\/:([\w-]+)(\?)?/g, (_, param, questionMark) => {
		const isRequired = questionMark === void 0;
		const value = params?.[param];
		if (isRequired && value === void 0) throw new Error(`Path '${path}' requires param '${param}' but it was not provided`);
		return value == null ? "" : "/" + encodeURIComponent(stringify(value));
	});
	if (path.endsWith("*")) {
		const value = params?.["*"];
		if (value !== void 0) result += "/" + stringify(value).split("/").map(encodeURIComponent).join("/");
	}
	return result || "/";
}
/**
* Removes a trailing splat and any number of slashes from the end of the path.
*
* Benchmarked to be faster than `path.replace(/\/*\*?$/, "")`, which backtracks.
*/
function trimTrailingSplat(path) {
	let i = path.length - 1;
	let char = path[i];
	if (char !== "*" && char !== "/") return path;
	i--;
	for (; i >= 0; i--) if (path[i] !== "/") break;
	return path.slice(0, i + 1);
}
//#endregion
//#region lib/server-runtime/crypto.ts
const encoder = /* @__PURE__ */ new TextEncoder();
const sign = async (value, secret) => {
	let data = encoder.encode(value);
	let key = await createKey(secret, ["sign"]);
	let signature = await crypto.subtle.sign("HMAC", key, data);
	let hash = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=+$/, "");
	return value + "." + hash;
};
const unsign = async (cookie, secret) => {
	let index = cookie.lastIndexOf(".");
	let value = cookie.slice(0, index);
	let hash = cookie.slice(index + 1);
	let data = encoder.encode(value);
	let key = await createKey(secret, ["verify"]);
	try {
		let signature = byteStringToUint8Array(atob(hash));
		return await crypto.subtle.verify("HMAC", key, signature, data) ? value : false;
	} catch (e) {
		return false;
	}
};
const createKey = async (secret, usages) => crypto.subtle.importKey("raw", encoder.encode(secret), {
	name: "HMAC",
	hash: "SHA-256"
}, false, usages);
function byteStringToUint8Array(byteString) {
	let array = new Uint8Array(byteString.length);
	for (let i = 0; i < byteString.length; i++) array[i] = byteString.charCodeAt(i);
	return array;
}
//#endregion
//#region lib/server-runtime/cookies.ts
/**
* Creates a logical container for managing a browser cookie from the server.
*/
const createCookie = (name, cookieOptions = {}) => {
	let { secrets = [], ...options } = {
		path: "/",
		sameSite: "lax",
		...cookieOptions
	};
	warnOnceAboutExpiresCookie(name, options.expires);
	return {
		get name() {
			return name;
		},
		get isSigned() {
			return secrets.length > 0;
		},
		get expires() {
			return typeof options.maxAge !== "undefined" ? new Date(Date.now() + options.maxAge * 1e3) : options.expires;
		},
		async parse(cookieHeader, parseOptions) {
			if (!cookieHeader) return null;
			let cookies = parse(cookieHeader, {
				...options,
				...parseOptions
			});
			if (name in cookies) {
				let value = cookies[name];
				if (typeof value === "string" && value !== "") return await decodeCookieValue(value, secrets);
				else return "";
			} else return null;
		},
		async serialize(value, serializeOptions) {
			return serialize(name, value === "" ? "" : await encodeCookieValue(value, secrets), {
				...options,
				...serializeOptions
			});
		}
	};
};
/**
* Returns true if an object is a Remix cookie container.
*
* @see https://remix.run/utils/cookies#iscookie
*/
const isCookie = (object) => {
	return object != null && typeof object.name === "string" && typeof object.isSigned === "boolean" && typeof object.parse === "function" && typeof object.serialize === "function";
};
async function encodeCookieValue(value, secrets) {
	let encoded = encodeData(value);
	if (secrets.length > 0) encoded = await sign(encoded, secrets[0]);
	return encoded;
}
async function decodeCookieValue(value, secrets) {
	if (secrets.length > 0) {
		for (let secret of secrets) {
			let unsignedValue = await unsign(value, secret);
			if (unsignedValue !== false) return decodeData(unsignedValue);
		}
		return null;
	}
	return decodeData(value);
}
function encodeData(value) {
	return btoa(myUnescape(encodeURIComponent(JSON.stringify(value))));
}
function decodeData(value) {
	try {
		return JSON.parse(decodeURIComponent(myEscape(atob(value))));
	} catch (e) {
		return {};
	}
}
function myEscape(value) {
	let str = value.toString();
	let result = "";
	let index = 0;
	let chr, code;
	while (index < str.length) {
		chr = str.charAt(index++);
		if (/[\w*+\-./@]/.exec(chr)) result += chr;
		else {
			code = chr.charCodeAt(0);
			if (code < 256) result += "%" + hex(code, 2);
			else result += "%u" + hex(code, 4).toUpperCase();
		}
	}
	return result;
}
function hex(code, length) {
	let result = code.toString(16);
	while (result.length < length) result = "0" + result;
	return result;
}
function myUnescape(value) {
	let str = value.toString();
	let result = "";
	let index = 0;
	let chr, part;
	while (index < str.length) {
		chr = str.charAt(index++);
		if (chr === "%") if (str.charAt(index) === "u") {
			part = str.slice(index + 1, index + 5);
			if (/^[\da-f]{4}$/i.exec(part)) {
				result += String.fromCharCode(parseInt(part, 16));
				index += 5;
				continue;
			}
		} else {
			part = str.slice(index, index + 2);
			if (/^[\da-f]{2}$/i.exec(part)) {
				result += String.fromCharCode(parseInt(part, 16));
				index += 2;
				continue;
			}
		}
		result += chr;
	}
	return result;
}
function warnOnceAboutExpiresCookie(name, expires) {
	warnOnce(!expires, `The "${name}" cookie has an "expires" property set. This will cause the expires value to not be updated when the session is committed. Instead, you should set the expires value when serializing the cookie. You can use \`commitSession(session, { expires })\` if using a session storage object, or \`cookie.serialize("value", { expires })\` if you're using the cookie directly.`);
}
//#endregion
//#region lib/server-runtime/sessions.ts
function flash(name) {
	return `__flash_${name}__`;
}
/**
* Creates a new Session object.
*
* Note: This function is typically not invoked directly by application code.
* Instead, use a `SessionStorage` object's `getSession` method.
*/
const createSession = (initialData = {}, id = "") => {
	let map = new Map(Object.entries(initialData));
	return {
		get id() {
			return id;
		},
		get data() {
			return Object.fromEntries(map);
		},
		has(name) {
			return map.has(name) || map.has(flash(name));
		},
		get(name) {
			if (map.has(name)) return map.get(name);
			let flashName = flash(name);
			if (map.has(flashName)) {
				let value = map.get(flashName);
				map.delete(flashName);
				return value;
			}
		},
		set(name, value) {
			map.set(name, value);
		},
		flash(name, value) {
			map.set(flash(name), value);
		},
		unset(name) {
			map.delete(name);
		}
	};
};
/**
* Returns true if an object is a React Router session.
*
* @see https://reactrouter.com/api/utils/isSession
*/
const isSession = (object) => {
	return object != null && typeof object.id === "string" && typeof object.data !== "undefined" && typeof object.has === "function" && typeof object.get === "function" && typeof object.set === "function" && typeof object.flash === "function" && typeof object.unset === "function";
};
/**
* Creates a SessionStorage object using a SessionIdStorageStrategy.
*
* Note: This is a low-level API that should only be used if none of the
* existing session storage options meet your requirements.
*/
function createSessionStorage({ cookie: cookieArg, createData, readData, updateData, deleteData }) {
	let cookie = isCookie(cookieArg) ? cookieArg : createCookie(cookieArg?.name || "__session", cookieArg);
	warnOnceAboutSigningSessionCookie(cookie);
	return {
		async getSession(cookieHeader, options) {
			let id = cookieHeader && await cookie.parse(cookieHeader, options);
			return createSession(id && await readData(id) || {}, id || "");
		},
		async commitSession(session, options) {
			let { id, data } = session;
			let expires = options?.maxAge != null ? new Date(Date.now() + options.maxAge * 1e3) : options?.expires != null ? options.expires : cookie.expires;
			if (id) await updateData(id, data, expires);
			else id = await createData(data, expires);
			return cookie.serialize(id, options);
		},
		async destroySession(session, options) {
			await deleteData(session.id);
			return cookie.serialize("", {
				...options,
				maxAge: void 0,
				expires: /* @__PURE__ */ new Date(0)
			});
		}
	};
}
function warnOnceAboutSigningSessionCookie(cookie) {
	warnOnce(cookie.isSigned, `The "${cookie.name}" cookie is not signed, but session cookies should be signed to prevent tampering on the client before they are sent back to the server. See https://reactrouter.com/explanation/sessions-and-cookies#signing-cookies for more information.`);
}
//#endregion
//#region lib/server-runtime/sessions/cookieStorage.ts
/**
* Creates and returns a SessionStorage object that stores all session data
* directly in the session cookie itself.
*
* This has the advantage that no database or other backend services are
* needed, and can help to simplify some load-balanced scenarios. However, it
* also has the limitation that serialized session data may not exceed the
* browser's maximum cookie size. Trade-offs!
*/
function createCookieSessionStorage({ cookie: cookieArg } = {}) {
	let cookie = isCookie(cookieArg) ? cookieArg : createCookie(cookieArg?.name || "__session", cookieArg);
	warnOnceAboutSigningSessionCookie(cookie);
	return {
		async getSession(cookieHeader, options) {
			return createSession(cookieHeader && await cookie.parse(cookieHeader, options) || {});
		},
		async commitSession(session, options) {
			let serializedCookie = await cookie.serialize(session.data, options);
			if (serializedCookie.length > 4096) throw new Error("Cookie length will exceed browser maximum. Length: " + serializedCookie.length);
			return serializedCookie;
		},
		async destroySession(_session, options) {
			return cookie.serialize("", {
				...options,
				maxAge: void 0,
				expires: /* @__PURE__ */ new Date(0)
			});
		}
	};
}
//#endregion
//#region lib/server-runtime/sessions/memoryStorage.ts
/**
* Creates and returns a simple in-memory SessionStorage object, mostly useful
* for testing and as a reference implementation.
*
* Note: This storage does not scale beyond a single process, so it is not
* suitable for most production scenarios.
*/
function createMemorySessionStorage({ cookie } = {}) {
	let map = /* @__PURE__ */ new Map();
	return createSessionStorage({
		cookie,
		async createData(data, expires) {
			let id = Math.random().toString(36).substring(2, 10);
			map.set(id, {
				data,
				expires
			});
			return id;
		},
		async readData(id) {
			if (map.has(id)) {
				let { data, expires } = map.get(id);
				if (!expires || expires > /* @__PURE__ */ new Date()) return data;
				if (expires) map.delete(id);
			}
			return null;
		},
		async updateData(id, data, expires) {
			map.set(id, {
				data,
				expires
			});
		},
		async deleteData(id) {
			map.delete(id);
		}
	});
}
//#endregion
export { Await, BrowserRouter, Form, HashRouter, Link, Links, MemoryRouter, Meta, NavLink, Navigate, Outlet, Route, Router, RouterContextProvider, RouterProvider, Routes, ScrollRestoration, StaticRouter, StaticRouterProvider, createContext, createCookie, createCookieSessionStorage, createMemorySessionStorage, createSession, createSessionStorage, createStaticHandler, data, href, isCookie, isRouteErrorResponse, isSession, matchRoutes, redirect, redirectDocument, replace, unstable_HistoryRouter, getRequest as unstable_getRequest, matchRSCServerRequest as unstable_matchRSCServerRequest };
