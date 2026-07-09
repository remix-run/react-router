/**
 * react-router v8.1.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { invariant, parsePath, warning } from "./history.js";
import { decodePath, joinPaths, stripBasename } from "./utils.js";
import { createMultiMatcher } from "@remix-run/route-pattern/match";
//#region lib/router/matcher-route-pattern.ts
var RoutePatternDataRouteMatcher = class {
	#state;
	#basename;
	constructor(basename) {
		this.#basename = basename;
	}
	update(routes) {
		let branches = flattenRoutes(routes);
		let matcher = createMultiMatcher();
		let partialMatcher = createMultiMatcher();
		for (let branch of branches) {
			let routePattern = convertReactRouterPathToRoutePattern(branch.path);
			validateRoutePatternSplat(branch.path, routePattern);
			routePattern = addOptionalTrailingSlash(routePattern);
			matcher.add(routePattern, branch);
			if (!branch.routesMeta[branch.routesMeta.length - 1].route.index) partialMatcher.add(routePattern === "/" ? `/*__rr_partial` : `${routePattern}(/*__rr_partial)`, branch);
		}
		this.#state = {
			branches,
			matcher,
			partialMatcher
		};
		return branches;
	}
	match(locationArg, allowPartial) {
		let pathname = stripBasename((typeof locationArg === "string" ? parsePath(locationArg) : locationArg).pathname || "/", this.#basename);
		if (pathname == null) return null;
		let decoded = decodePath(pathname);
		let url = new URL(decoded, "http://reactrouter.local");
		invariant(this.#state, "Route pattern routes must be initialized before matching.");
		let matches = this.#state.matcher.matchAll(url);
		if (allowPartial) matches.push(...this.#state.partialMatcher.matchAll(url));
		for (let match of prioritizeValidatedMatches(matches)) {
			let routeMatches = convertRoutePatternMatchToRouteMatches(match, pathname, allowPartial);
			if (routeMatches && validateRouteMatchParams(routeMatches)) return routeMatches;
		}
		return null;
	}
};
function validateRoutePatternSplat(routePath, routePattern) {
	invariant(getRoutePatternSplatIndexes(routePattern).length <= 1 && isTerminalRoutePatternSplat(routePattern), `Route path "${routePath}" is not supported with \`future.unstable_routePatternMatching\` because React Router only supports a single splat at the end of a route path.`);
}
function getRoutePatternSplatIndexes(routePattern) {
	let splatIndexes = [];
	for (let i = 0; i < routePattern.length; i++) {
		let char = routePattern[i];
		if (char === "\\") {
			i++;
			continue;
		}
		if (char === "*") splatIndexes.push(i);
	}
	return splatIndexes;
}
function isTerminalRoutePatternSplat(routePattern) {
	for (let i = 0; i < routePattern.length; i++) {
		let char = routePattern[i];
		if (char === "\\") {
			i++;
			continue;
		}
		if (char !== "*") continue;
		let suffix = routePattern.slice(i + 1);
		return /^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(suffix) || suffix === "";
	}
	return true;
}
function addOptionalTrailingSlash(routePattern) {
	return routePattern === "/" ? routePattern : `${routePattern.replace(/\/+$/, "")}(/)`;
}
function flattenRoutes(routes, branches = [], parentsMeta = [], parentPath = "") {
	routes.forEach((route, index) => {
		invariant(route.caseSensitive !== true, "`caseSensitive` routes are not supported with `future.unstable_routePatternMatching`.");
		let meta = {
			relativePath: route.path || "",
			caseSensitive: false,
			childrenIndex: index,
			route
		};
		if (meta.relativePath.startsWith("/")) {
			invariant(meta.relativePath.startsWith(parentPath), `Absolute route path "${meta.relativePath}" nested under path "${parentPath}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`);
			meta.relativePath = meta.relativePath.slice(parentPath.length);
		}
		let routesMeta = parentsMeta.concat(meta);
		let path = meta.relativePath ? joinPaths([parentPath, meta.relativePath]) : parentPath;
		if (route.children && route.children.length > 0) {
			invariant(route.index !== true, `Index routes must not have child routes. Please remove all child routes from route path "${path}".`);
			flattenRoutes(route.children, branches, routesMeta, path);
			if (route.children?.some((child) => child.index)) return;
		}
		if (route.path != null || route.index) branches.push({
			path,
			score: 0,
			routesMeta
		});
	});
	return branches;
}
function convertReactRouterPathToRoutePattern(path) {
	warning(path === "*" || !path.endsWith("*") || path.endsWith("/*"), `Route path "${path}" will be treated as if it were "${path.replace(/\*$/, "/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${path.replace(/\*$/, "/*")}".`);
	if (path.endsWith("*") && path !== "*" && !path.endsWith("/*")) path = path.replace(/\*$/, "/*");
	path = path.replace(/^\/*/, "/");
	if (path === "") return "/";
	let segments = path.split("/");
	let pattern = segments.shift() || "";
	for (let i = 0; i < segments.length;) {
		let optionalRun = [];
		while (i < segments.length && isOptionalRouteSegment(segments[i])) {
			optionalRun.push(convertRouteSegment(segments[i].slice(0, -1)));
			i++;
		}
		if (optionalRun.length > 0) {
			let nested = optionalRun.reduceRight((child, segment) => `/${segment}${child ? `(${child})` : ""}`, "");
			pattern += `(${nested})`;
			continue;
		}
		pattern += `/${convertRouteSegment(segments[i])}`;
		i++;
	}
	return pattern || "/";
}
function isOptionalRouteSegment(segment) {
	return segment.endsWith("?");
}
function convertRouteSegment(segment) {
	if (segment === "*") return "*__rr_splat";
	let paramMatch = segment.match(/^:([\w-]+)(\?)?(.*)$/);
	if (paramMatch) {
		let [, paramName, optional, suffix] = paramMatch;
		let converted = `:${paramName}${escapeRoutePatternLiteral(suffix)}`;
		return optional ? `(:${paramName})${escapeRoutePatternLiteral(suffix)}` : converted;
	}
	return escapeRoutePatternLiteral(segment);
}
function escapeRoutePatternLiteral(value) {
	return value.replace(/[\\():*]/g, "\\$&");
}
function validateRouteMatchParams(matches) {
	return matches.every(({ route, params }) => {
		try {
			return typeof route.unstable_validateParams !== "function" || route.unstable_validateParams(params) === true;
		} catch (e) {
			warning(false, `Route "${route.id || route.path}" failed param validation with the following error:\n` + (e instanceof Error ? e.message : String(e)));
		}
	});
}
function prioritizeValidatedMatches(matches) {
	let validatedMatches = [];
	let unvalidatedMatches = [];
	for (let match of matches) if (match.data.routesMeta.some((meta) => typeof meta.route.unstable_validateParams === "function")) validatedMatches.push(match);
	else unvalidatedMatches.push(match);
	return validatedMatches.concat(unvalidatedMatches);
}
function convertRoutePatternMatchToRouteMatches(match, pathname, allowPartial) {
	let pathSegments = pathname.replace(/^\//, "").split("/").filter(Boolean);
	let splatParamName = match.paramsMeta.pathname.find((meta) => meta.type === "*")?.name;
	let matchedParams = Object.entries(match.params).reduce((params, [key, value]) => {
		if (key === "__rr_partial" || value === void 0) return params;
		params[key === "__rr_splat" || key === splatParamName ? "*" : key] = value;
		return params;
	}, {});
	let consumedSegments = 0;
	let matches = [];
	for (let i = 0; i < match.data.routesMeta.length; i++) {
		let meta = match.data.routesMeta[i];
		let splatBaseSegments = null;
		let routeSegments = meta.relativePath.replace(/^\//, "").split("/").filter(Boolean);
		for (let segment of routeSegments) {
			if (segment === "*") {
				splatBaseSegments = consumedSegments;
				consumedSegments = pathSegments.length;
				break;
			}
			if (segment.endsWith("?")) {
				let routeSegment = segment.slice(0, -1);
				if (routeSegment.startsWith(":")) {
					if (matchedParams[routeSegment.slice(1)] !== void 0) consumedSegments++;
				} else if (pathSegments[consumedSegments] === routeSegment) consumedSegments++;
				continue;
			}
			consumedSegments++;
		}
		let routePathname = getRoutePatternMatchPathname(pathSegments, consumedSegments);
		let pathnameBase = splatBaseSegments == null ? routePathname : getRoutePatternMatchPathname(pathSegments, splatBaseSegments);
		matches.push({
			params: matchedParams,
			pathname: routePathname,
			pathnameBase,
			route: meta.route
		});
	}
	if (!allowPartial && pathSegments.length > consumedSegments && !match.data.routesMeta[match.data.routesMeta.length - 1].route.index) return null;
	return matches;
}
function getRoutePatternMatchPathname(pathSegments, consumedSegments) {
	return consumedSegments === 0 ? "/" : `/${pathSegments.slice(0, consumedSegments).join("/")}`;
}
//#endregion
export { RoutePatternDataRouteMatcher };
