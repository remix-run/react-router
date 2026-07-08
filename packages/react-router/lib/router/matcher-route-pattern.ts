import { createMultiMatcher } from "@remix-run/route-pattern/match";
import type { Match, MultiMatcher } from "@remix-run/route-pattern/match";

import type { Location } from "./history";
import type {
  DataRouteObject,
  Params,
  RouteBranch,
  RouteMatch,
  RouteMeta,
  RouteObject,
} from "./utils";
import { decodePath, joinPaths, stripBasename, type Mutable } from "./utils";
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
    let matcher = createMultiMatcher<RouteBranch<DataRouteObject>>();
    let partialMatcher = createMultiMatcher<RouteBranch<DataRouteObject>>();

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
    allowPartial: boolean,
  ): RouteMatch<string, DataRouteObject>[] | null {
    let location =
      typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
    let pathname = stripBasename(location.pathname || "/", this.#basename);

    if (pathname == null) {
      return null;
    }

    let decoded = decodePath(pathname);
    let url = new URL(decoded, "http://reactrouter.local");
    invariant(
      this.#state,
      "Route pattern routes must be initialized before matching.",
    );

    let match =
      this.#state.matcher.match(url) ??
      (allowPartial ? this.#state.partialMatcher.match(url) : undefined);

    return match
      ? convertRoutePatternMatchToRouteMatches(match, pathname, allowPartial)
      : null;
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

    if (meta.relativePath.startsWith("/")) {
      invariant(
        meta.relativePath.startsWith(parentPath),
        `Absolute route path "${meta.relativePath}" nested under path ` +
          `"${parentPath}" is not valid. An absolute child route path ` +
          `must start with the combined path of all its parent routes.`,
      );

      meta.relativePath = meta.relativePath.slice(parentPath.length);
    }

    let routesMeta = parentsMeta.concat(meta);
    let path = meta.relativePath
      ? joinPaths([parentPath, meta.relativePath])
      : parentPath;

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

function convertRoutePatternMatchToRouteMatches<
  RouteObjectType extends RouteObject = RouteObject,
>(
  match: Match<string, RouteBranch<RouteObjectType>>,
  pathname: string,
  allowPartial: boolean,
): RouteMatch<string, RouteObjectType>[] | null {
  let pathSegments = pathname.replace(/^\//, "").split("/").filter(Boolean);
  let splatParamName = match.paramsMeta.pathname.find(
    (meta) => meta.type === "*",
  )?.name;
  let matchedParams = Object.entries(match.params).reduce<Mutable<Params>>(
    (params, [key, value]) => {
      if (key === "__rr_partial" || value === undefined) {
        return params;
      }
      params[key === "__rr_splat" || key === splatParamName ? "*" : key] =
        value;
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
      if (segment === "*") {
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
