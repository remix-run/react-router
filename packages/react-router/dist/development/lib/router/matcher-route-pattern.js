/**
 * react-router v8.4.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { invariant, parsePath, warning } from "./history.js";
import { decodePath, explodeOptionalSegments, joinPaths, matchPath, normalizePathname, stripBasename } from "./utils.js";
import { createMultiMatcher } from "@remix-run/route-pattern/match";
import { descending } from "@remix-run/route-pattern/specificity";
//#region lib/router/matcher-route-pattern.ts
var RoutePatternDataRouteMatcher = class {
	#state;
	#basename;
	constructor(basename) {
		this.#basename = basename;
	}
	update(routes) {
		let branches = flattenRoutes(routes);
		let matcher = createMultiMatcher({ ignoreCase: true });
		let partialMatcher = createMultiMatcher({ ignoreCase: true });
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
	match(locationArg, allowPartial = false) {
		let pathname = stripBasename((typeof locationArg === "string" ? parsePath(locationArg) : locationArg).pathname || "/", this.#basename);
		if (pathname == null) return null;
		let decoded = decodePath(pathname);
		let url = new URL("http://reactrouter.local");
		url.pathname = pathname;
		invariant(this.#state, "Route pattern routes must be initialized before matching.");
		let matches = this.#state.matcher.matchAll(url);
		if (allowPartial) matches.push(...this.#state.partialMatcher.matchAll(url));
		for (let match of prioritizeValidatedMatches(matches)) {
			let routeMatches = convertRoutePatternMatchToRouteMatches(match, decoded, allowPartial);
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
		let absolutePath;
		if (meta.relativePath.startsWith("/")) {
			absolutePath = meta.relativePath;
			let parentPathMatch = explodeOptionalSegments(parentPath).find((path) => meta.relativePath.startsWith(path));
			invariant(parentPathMatch != null, `Absolute route path "${meta.relativePath}" nested under path "${parentPath}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`);
			meta.relativePath = meta.relativePath.slice(parentPathMatch.length);
		}
		let routesMeta = parentsMeta.concat(meta);
		let path = absolutePath ?? (meta.relativePath ? joinPaths([parentPath, meta.relativePath]) : parentPath);
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
	return matches.every(({ route, params }) => route.unstable_validateParams == null || Object.keys(route.unstable_validateParams).length === 0 || Object.entries(route.unstable_validateParams).every(([param, re]) => params[param] != null ? new RegExp(re.source, re.flags).test(params[param]) : true));
}
function prioritizeValidatedMatches(matches) {
	return matches.sort((a, b) => {
		let specificity = descending(a, b);
		if (specificity !== 0) return specificity;
		return Number(hasParamValidators(b)) - Number(hasParamValidators(a));
	});
}
function hasParamValidators(match) {
	return match.data.routesMeta.some((meta) => meta.route.unstable_validateParams != null && Object.keys(meta.route.unstable_validateParams).length > 0);
}
function convertRoutePatternMatchToRouteMatches(match, pathname, allowPartial) {
	let result = matchRoutePatternBranch(match.data, pathname, allowPartial, 0, "/", {});
	if (result == null) return null;
	for (let routeMatch of result.matches) routeMatch.params = result.params;
	return result.matches;
}
function matchRoutePatternBranch(branch, pathname, allowPartial, metaIndex, matchedPathname, matchedParams) {
	let meta = branch.routesMeta[metaIndex];
	let end = metaIndex === branch.routesMeta.length - 1;
	let remainingPathname = matchedPathname === "/" ? pathname : pathname.slice(matchedPathname.length) || "/";
	for (let relativePath of explodeOptionalSegments(meta.relativePath)) {
		let pattern = {
			path: relativePath,
			caseSensitive: false,
			end
		};
		let pathMatch = matchPath(pattern, remainingPathname);
		if (!pathMatch && end && allowPartial && !meta.route.index) pathMatch = matchPath({
			...pattern,
			end: false
		}, remainingPathname);
		if (!pathMatch) continue;
		let params = {
			...matchedParams,
			...pathMatch.params
		};
		let routeMatch = {
			params,
			pathname: joinPaths([matchedPathname, pathMatch.pathname]),
			pathnameBase: normalizePathname(joinPaths([matchedPathname, pathMatch.pathnameBase])),
			route: meta.route
		};
		let nextMatchedPathname = pathMatch.pathnameBase === "/" ? matchedPathname : joinPaths([matchedPathname, pathMatch.pathnameBase]);
		if (end) return {
			matches: [routeMatch],
			params
		};
		let childResult = matchRoutePatternBranch(branch, pathname, allowPartial, metaIndex + 1, nextMatchedPathname, params);
		if (childResult) return {
			matches: [routeMatch, ...childResult.matches],
			params: childResult.params
		};
	}
	return null;
}
//#endregion
export { RoutePatternDataRouteMatcher };
