import { createMultiMatcher } from "@remix-run/route-pattern/match";
import type { Match, MultiMatcher } from "@remix-run/route-pattern/match";

import type { Location } from "./history";
import type {
  Params,
  RouteBranch,
  RouteMatch,
  RouteMeta,
  RouteObject,
} from "./utils";
import {
  compilePath,
  decodePath,
  joinPaths,
  matchRouteBranch,
  stripBasename,
  type Mutable,
} from "./utils";
import { invariant, parsePath, warning } from "./history";

type RoutePatternBranchMatcher<
  RouteObjectType extends RouteObject = RouteObject,
> = MultiMatcher<RouteBranch<RouteObjectType>>;

type RoutePatternRouteBranches<
  RouteObjectType extends RouteObject = RouteObject,
> = RouteBranch<RouteObjectType>[] & {
  routePatternMatcher?: RoutePatternBranchMatcher<RouteObjectType>;
  routePatternPartialMatcher?: RoutePatternBranchMatcher<RouteObjectType>;
};

export function createRoutePatternDataRouteMatcher<
  RouteObjectType extends RouteObject = RouteObject,
>(): {
  flatten(routes: RouteObjectType[]): RouteBranch<RouteObjectType>[];
  match(
    routes: RouteObjectType[],
    branches: RouteBranch<RouteObjectType>[],
    locationArg: Partial<Location> | string,
    basename: string,
    allowPartial: boolean,
  ): RouteMatch<string, RouteObjectType>[] | null;
} {
  return {
    flatten(routes) {
      return flattenRoutesWithRoutePatterns(routes);
    },
    match(_routes, branches, locationArg, basename, allowPartial) {
      let location =
        typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
      let pathname = stripBasename(location.pathname || "/", basename);

      if (pathname == null) {
        return null;
      }

      return matchRoutesWithRoutePatternBranches(
        branches as RoutePatternRouteBranches<RouteObjectType>,
        decodePath(pathname),
        allowPartial,
      );
    },
  };
}

export function unstable_convertRoutePathsToPatterns<
  RouteObjectType extends RouteObject = RouteObject,
>(routes: RouteObjectType[]): RouteObjectType[] {
  return routes.map((route) => {
    let path =
      route.path == null
        ? route.path
        : convertReactRouterRoutePathToRoutePattern(route.path);
    let children =
      "children" in route && route.children
        ? unstable_convertRoutePathsToPatterns(route.children)
        : undefined;

    return {
      ...route,
      path,
      ...(children ? { children } : {}),
    };
  }) as RouteObjectType[];
}

function convertReactRouterRoutePathToRoutePattern(path: string): string {
  if (path === "") {
    return path;
  }

  let routePattern = convertReactRouterPathToRoutePattern(path);
  return path.startsWith("/") ? routePattern : routePattern.replace(/^\//, "");
}

function flattenRoutesWithRoutePatterns<
  RouteObjectType extends RouteObject = RouteObject,
>(routes: RouteObjectType[]): RouteBranch<RouteObjectType>[] {
  let branches = flattenRoutesWithoutOptionalExploding(routes);
  let matcher = createMultiMatcher<RouteBranch<RouteObjectType>>();
  let partialMatcher = createMultiMatcher<RouteBranch<RouteObjectType>>();

  for (let branch of branches) {
    let routePattern = branch.path;
    if (!hasIndexChild(branch)) {
      matcher.add(addOptionalTrailingSlash(routePattern), branch);
    }

    if (!branch.routesMeta[branch.routesMeta.length - 1].route.index) {
      partialMatcher.add(
        routePattern === "/"
          ? `/*__rr_partial`
          : `${routePattern}(/*__rr_partial)`,
        branch,
      );
    }
  }

  let routePatternBranches =
    branches as RoutePatternRouteBranches<RouteObjectType>;
  routePatternBranches.routePatternMatcher = matcher;
  routePatternBranches.routePatternPartialMatcher = partialMatcher;
  return routePatternBranches;
}

function addOptionalTrailingSlash(routePattern: string): string {
  return routePattern === "/"
    ? routePattern
    : `${routePattern.replace(/\/+$/, "")}(/)`;
}

function hasIndexChild<RouteObjectType extends RouteObject = RouteObject>(
  branch: RouteBranch<RouteObjectType>,
): boolean {
  let route = branch.routesMeta[branch.routesMeta.length - 1].route;
  return route.children?.some((child) => child.index) === true;
}

function matchRoutesWithRoutePatternBranches<
  RouteObjectType extends RouteObject = RouteObject,
>(
  branches: RoutePatternRouteBranches<RouteObjectType>,
  pathname: string,
  allowPartial: boolean,
): RouteMatch<string, RouteObjectType>[] | null {
  let url = new URL(pathname, "http://reactrouter.local");
  let match =
    branches.routePatternMatcher!.match(url) ??
    (allowPartial
      ? branches.routePatternPartialMatcher!.match(url)
      : undefined);

  if (!match) {
    return null;
  }

  let legacyMatches = matchRouteBranch<string, RouteObjectType>(
    match.data,
    pathname,
    allowPartial,
  );

  return (
    legacyMatches ??
    convertRoutePatternMatchToRouteMatches(match, pathname, allowPartial)
  );
}

function flattenRoutesWithoutOptionalExploding<
  RouteObjectType extends RouteObject = RouteObject,
>(
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

    if (meta.relativePath.startsWith("/")) {
      invariant(
        meta.relativePath.startsWith(parentPath),
        `Absolute route path "${meta.relativePath}" nested under path ` +
          `"${parentPath}" is not valid. An absolute child route path ` +
          `must start with the combined path of all its parent routes.`,
      );

      meta.relativePath = meta.relativePath.slice(parentPath.length);
    }

    let path = joinPaths([parentPath, meta.relativePath]);
    let routesMeta = parentsMeta.concat(meta);

    if (route.children && route.children.length > 0) {
      invariant(
        // Our types know better, but runtime JS may not!
        // @ts-expect-error
        route.index !== true,
        `Index routes must not have child routes. Please remove ` +
          `all child routes from route path "${path}".`,
      );
      flattenRoutesWithoutOptionalExploding(
        route.children,
        branches,
        routesMeta,
        path,
      );
    }

    if (route.path == null && !route.index) {
      return;
    }

    branches.push({
      path,
      score: 0,
      routesMeta: routesMeta.map((meta, i) => {
        let [matcher, params] = compilePath(
          meta.relativePath,
          false,
          i === routesMeta.length - 1,
        );
        return {
          ...meta,
          matcher,
          compiledParams: params,
        } satisfies RouteMeta<RouteObjectType>;
      }),
    });
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

function convertRoutePatternMatchToRouteMatches<
  RouteObjectType extends RouteObject = RouteObject,
>(
  match: Match<string, RouteBranch<RouteObjectType>>,
  pathname: string,
  allowPartial: boolean,
): RouteMatch<string, RouteObjectType>[] | null {
  let pathSegments = pathname.replace(/^\//, "").split("/").filter(Boolean);
  let matchedParams = Object.entries(match.params).reduce<Mutable<Params>>(
    (params, [key, value]) => {
      if (key === "__rr_partial" || value === undefined) {
        return params;
      }
      params[key === "__rr_splat" ? "*" : key] = value;
      return params;
    },
    {},
  );
  let consumedSegments = 0;
  let matches: RouteMatch<string, RouteObjectType>[] = [];

  for (let i = 0; i < match.data.routesMeta.length; i++) {
    let meta = match.data.routesMeta[i];
    let splatBaseSegments: number | null = null;
    let routeSegments = meta.relativePath
      .replace(/^\//, "")
      .split("/")
      .filter(Boolean);

    for (let segment of routeSegments) {
      if (segment.startsWith("*")) {
        splatBaseSegments = consumedSegments;
        consumedSegments = pathSegments.length;
        break;
      }

      if (segment.endsWith("?")) {
        let routeSegment = segment.slice(0, -1);
        if (routeSegment.startsWith(":")) {
          let paramName = routeSegment.slice(1);
          if (matchedParams[paramName] !== undefined) {
            consumedSegments++;
          }
        } else if (pathSegments[consumedSegments] === routeSegment) {
          consumedSegments++;
        }
        continue;
      }

      consumedSegments++;
    }

    let routePathname = getRoutePatternMatchPathname(
      pathSegments,
      consumedSegments,
    );
    let pathnameBase =
      splatBaseSegments == null
        ? routePathname
        : getRoutePatternMatchPathname(pathSegments, splatBaseSegments);

    matches.push({
      params: matchedParams,
      pathname: routePathname,
      pathnameBase,
      route: meta.route,
    });
  }

  if (
    !allowPartial &&
    pathSegments.length > consumedSegments &&
    !match.data.routesMeta[match.data.routesMeta.length - 1].route.index
  ) {
    return null;
  }

  return matches;
}

function getRoutePatternMatchPathname(
  pathSegments: string[],
  consumedSegments: number,
): string {
  return consumedSegments === 0
    ? "/"
    : `/${pathSegments.slice(0, consumedSegments).join("/")}`;
}
