import { createMultiMatcher } from "@remix-run/route-pattern/match";
import type { Match, MultiMatcher } from "@remix-run/route-pattern/match";
import { descending } from "@remix-run/route-pattern/specificity";

import type { Location } from "./history";
import type {
  DataRouteObject,
  Params,
  RouteBranch,
  RouteMatch,
  RouteMeta,
  RouteObject,
} from "./utils";
import {
  decodePath,
  explodeOptionalSegments,
  joinPaths,
  matchPath,
  normalizePathname,
  stripBasename,
} from "./utils";
import { invariant, parsePath, warning } from "./history";
import type { DataRouteMatcher } from "./matcher";

type RoutePatternBranchMatcher<
  RouteObjectType extends RouteObject = RouteObject,
> = MultiMatcher<RouteBranch<RouteObjectType>>;

type RoutePatternMatcherState<
  RouteObjectType extends RouteObject = RouteObject,
> = {
  branches: RouteBranch<RouteObjectType>[];
  matcher: RoutePatternBranchMatcher<RouteObjectType>;
  partialMatcher: RoutePatternBranchMatcher<RouteObjectType>;
};

export class RoutePatternDataRouteMatcher implements DataRouteMatcher {
  #state: RoutePatternMatcherState<DataRouteObject> | undefined;
  #basename: string;

  constructor(basename: string) {
    this.#basename = basename;
  }

  update(routes: DataRouteObject[]): RouteBranch<DataRouteObject>[] {
    let branches = flattenRoutes(routes);
    let matcher = createMultiMatcher<RouteBranch<DataRouteObject>>({
      ignoreCase: true,
    });
    let partialMatcher = createMultiMatcher<RouteBranch<DataRouteObject>>({
      ignoreCase: true,
    });

    for (let branch of branches) {
      let routePattern = convertReactRouterPathToRoutePattern(branch.path);
      validateRoutePatternSplat(branch.path, routePattern);

      routePattern = addOptionalTrailingSlash(routePattern);
      matcher.add(routePattern, branch);

      if (!branch.routesMeta[branch.routesMeta.length - 1].route.index) {
        partialMatcher.add(
          routePattern === "/"
            ? `/*__rr_partial`
            : `${routePattern}(/*__rr_partial)`,
          branch,
        );
      }
    }

    this.#state = { branches, matcher, partialMatcher };
    return branches;
  }

  match(
    locationArg: Partial<Location> | string,
    allowPartial = false,
  ): RouteMatch<string, DataRouteObject>[] | null {
    let location =
      typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
    let pathname = stripBasename(location.pathname || "/", this.#basename);

    if (pathname == null) {
      return null;
    }

    let decoded = decodePath(pathname);
    let url = new URL("http://reactrouter.local");
    url.pathname = pathname;
    invariant(
      this.#state,
      "Route pattern routes must be initialized before matching.",
    );

    let matches = this.#state.matcher.matchAll(url);

    if (allowPartial) {
      matches.push(...this.#state.partialMatcher.matchAll(url));
    }

    for (let match of prioritizeValidatedMatches(matches)) {
      let routeMatches = convertRoutePatternMatchToRouteMatches(
        match,
        decoded,
        allowPartial,
      );

      if (routeMatches && validateRouteMatchParams(routeMatches)) {
        return routeMatches;
      }
    }

    return null;
  }
}

function validateRoutePatternSplat(
  routePath: string,
  routePattern: string,
): void {
  let splatIndexes = getRoutePatternSplatIndexes(routePattern);

  invariant(
    splatIndexes.length <= 1 && isTerminalRoutePatternSplat(routePattern),
    `Route path "${routePath}" is not supported with ` +
      "`future.unstable_routePatternMatching` because React Router only " +
      "supports a single splat at the end of a route path.",
  );
}

function getRoutePatternSplatIndexes(routePattern: string): number[] {
  let splatIndexes: number[] = [];

  for (let i = 0; i < routePattern.length; i++) {
    let char = routePattern[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === "*") {
      splatIndexes.push(i);
    }
  }

  return splatIndexes;
}

function isTerminalRoutePatternSplat(routePattern: string): boolean {
  for (let i = 0; i < routePattern.length; i++) {
    let char = routePattern[i];
    if (char === "\\") {
      i++;
      continue;
    }

    if (char !== "*") {
      continue;
    }

    let suffix = routePattern.slice(i + 1);
    return /^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(suffix) || suffix === "";
  }

  return true;
}

function addOptionalTrailingSlash(routePattern: string): string {
  return routePattern === "/"
    ? routePattern
    : `${routePattern.replace(/\/+$/, "")}(/)`;
}

function flattenRoutes<RouteObjectType extends RouteObject = RouteObject>(
  routes: RouteObjectType[],
  branches: RouteBranch<RouteObjectType>[] = [],
  parentsMeta: RouteMeta<RouteObjectType>[] = [],
  parentPath = "",
): RouteBranch<RouteObjectType>[] {
  routes.forEach((route, index) => {
    invariant(
      route.caseSensitive !== true,
      "`caseSensitive` routes are not supported with " +
        "`future.unstable_routePatternMatching`.",
    );

    let meta: RouteMeta<RouteObjectType> = {
      relativePath: route.path || "",
      caseSensitive: false,
      childrenIndex: index,
      route,
    };
    let absolutePath: string | undefined;

    if (meta.relativePath.startsWith("/")) {
      absolutePath = meta.relativePath;
      let parentPathMatch = explodeOptionalSegments(parentPath).find((path) =>
        meta.relativePath.startsWith(path),
      );

      invariant(
        parentPathMatch != null,
        `Absolute route path "${meta.relativePath}" nested under path ` +
          `"${parentPath}" is not valid. An absolute child route path ` +
          `must start with the combined path of all its parent routes.`,
      );

      meta.relativePath = meta.relativePath.slice(parentPathMatch.length);
    }

    let routesMeta = parentsMeta.concat(meta);
    let path =
      absolutePath ??
      (meta.relativePath
        ? joinPaths([parentPath, meta.relativePath])
        : parentPath);

    if (route.children && route.children.length > 0) {
      invariant(
        // Our types know better, but runtime JS may not!
        // @ts-expect-error
        route.index !== true,
        `Index routes must not have child routes. Please remove ` +
          `all child routes from route path "${path}".`,
      );

      flattenRoutes(route.children, branches, routesMeta, path);

      // Don't add layout route branch if an index child exists because it will never match.
      if (route.children?.some((child) => child.index)) {
        return;
      }
    }

    if (route.path != null || route.index) {
      branches.push({
        path,
        score: 0,
        routesMeta,
      });
    }
  });

  return branches;
}

function convertReactRouterPathToRoutePattern(path: string): string {
  warning(
    path === "*" || !path.endsWith("*") || path.endsWith("/*"),
    `Route path "${path}" will be treated as if it were ` +
      `"${path.replace(/\*$/, "/*")}" because the \`*\` character must ` +
      `always follow a \`/\` in the pattern. To get rid of this warning, ` +
      `please change the route path to "${path.replace(/\*$/, "/*")}".`,
  );

  if (path.endsWith("*") && path !== "*" && !path.endsWith("/*")) {
    path = path.replace(/\*$/, "/*");
  }

  path = path.replace(/^\/*/, "/");
  if (path === "") {
    return "/";
  }

  let segments = path.split("/");
  let pattern = segments.shift() || "";
  for (let i = 0; i < segments.length; ) {
    let optionalRun: string[] = [];
    while (i < segments.length && isOptionalRouteSegment(segments[i])) {
      optionalRun.push(convertRouteSegment(segments[i].slice(0, -1)));
      i++;
    }

    if (optionalRun.length > 0) {
      let nested = optionalRun.reduceRight(
        (child, segment) => `/${segment}${child ? `(${child})` : ""}`,
        "",
      );
      pattern += `(${nested})`;
      continue;
    }

    pattern += `/${convertRouteSegment(segments[i])}`;
    i++;
  }

  return pattern || "/";
}

function isOptionalRouteSegment(segment: string): boolean {
  return segment.endsWith("?");
}

function convertRouteSegment(segment: string): string {
  if (segment === "*") {
    return "*__rr_splat";
  }

  let paramMatch = segment.match(/^:([\w-]+)(\?)?(.*)$/);
  if (paramMatch) {
    let [, paramName, optional, suffix] = paramMatch;
    let converted = `:${paramName}${escapeRoutePatternLiteral(suffix)}`;
    return optional
      ? `(:${paramName})${escapeRoutePatternLiteral(suffix)}`
      : converted;
  }

  return escapeRoutePatternLiteral(segment);
}

function escapeRoutePatternLiteral(value: string): string {
  return value.replace(/[\\():*]/g, "\\$&");
}

function validateRouteMatchParams<
  RouteObjectType extends RouteObject = RouteObject,
>(matches: RouteMatch<string, RouteObjectType>[]): boolean {
  return matches.every(
    ({ route, params }) =>
      route.unstable_validateParams == null ||
      Object.keys(route.unstable_validateParams).length === 0 ||
      Object.entries(route.unstable_validateParams).every(([param, re]) =>
        params[param] != null
          ? new RegExp(re.source, re.flags).test(params[param])
          : true,
      ),
  );
}

function prioritizeValidatedMatches<
  RouteObjectType extends RouteObject = RouteObject,
>(
  matches: Match<string, RouteBranch<RouteObjectType>>[],
): Match<string, RouteBranch<RouteObjectType>>[] {
  return matches.sort((a, b) => {
    let specificity = descending(a, b);
    if (specificity !== 0) {
      return specificity;
    }

    return Number(hasParamValidators(b)) - Number(hasParamValidators(a));
  });
}

function hasParamValidators<RouteObjectType extends RouteObject = RouteObject>(
  match: Match<string, RouteBranch<RouteObjectType>>,
): boolean {
  return match.data.routesMeta.some(
    (meta) =>
      meta.route.unstable_validateParams != null &&
      Object.keys(meta.route.unstable_validateParams).length > 0,
  );
}

function convertRoutePatternMatchToRouteMatches<
  RouteObjectType extends RouteObject = RouteObject,
>(
  match: Match<string, RouteBranch<RouteObjectType>>,
  pathname: string,
  allowPartial: boolean,
): RouteMatch<string, RouteObjectType>[] | null {
  let result = matchRoutePatternBranch(
    match.data,
    pathname,
    allowPartial,
    0,
    "/",
    {},
  );

  if (result == null) {
    return null;
  }

  for (let routeMatch of result.matches) {
    routeMatch.params = result.params;
  }

  return result.matches;
}

function matchRoutePatternBranch<
  RouteObjectType extends RouteObject = RouteObject,
>(
  branch: RouteBranch<RouteObjectType>,
  pathname: string,
  allowPartial: boolean,
  metaIndex: number,
  matchedPathname: string,
  matchedParams: Params,
): {
  matches: RouteMatch<string, RouteObjectType>[];
  params: Params;
} | null {
  let meta = branch.routesMeta[metaIndex];
  let end = metaIndex === branch.routesMeta.length - 1;
  let remainingPathname =
    matchedPathname === "/"
      ? pathname
      : pathname.slice(matchedPathname.length) || "/";

  for (let relativePath of explodeOptionalSegments(meta.relativePath)) {
    let pattern = {
      path: relativePath,
      caseSensitive: false,
      end,
    };
    let pathMatch = matchPath(pattern, remainingPathname);

    if (!pathMatch && end && allowPartial && !meta.route.index) {
      pathMatch = matchPath({ ...pattern, end: false }, remainingPathname);
    }

    if (!pathMatch) {
      continue;
    }

    let params = { ...matchedParams, ...pathMatch.params };
    let routeMatch: RouteMatch<string, RouteObjectType> = {
      params,
      pathname: joinPaths([matchedPathname, pathMatch.pathname]),
      pathnameBase: normalizePathname(
        joinPaths([matchedPathname, pathMatch.pathnameBase]),
      ),
      route: meta.route,
    };
    let nextMatchedPathname =
      pathMatch.pathnameBase === "/"
        ? matchedPathname
        : joinPaths([matchedPathname, pathMatch.pathnameBase]);

    if (end) {
      return { matches: [routeMatch], params };
    }

    let childResult = matchRoutePatternBranch(
      branch,
      pathname,
      allowPartial,
      metaIndex + 1,
      nextMatchedPathname,
      params,
    );

    if (childResult) {
      return {
        matches: [routeMatch, ...childResult.matches],
        params: childResult.params,
      };
    }
  }

  return null;
}
