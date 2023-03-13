import path from "node:path";
import fg from "fast-glob";

import type {
  ConfigRoute,
  DefineRouteFunction,
  DefineRouteOptions,
  RouteManifest,
} from "./routes";
import { normalizeSlashes } from "./routes";
import { createRouteId, defineRoutes } from "./routes";
import {
  escapeEnd,
  escapeStart,
  isSegmentSeparator,
  optionalEnd,
  optionalStart,
  paramPrefixChar,
  routeModuleExts,
} from "./routesConvention";

export function flatRoutes(
  appDirectory: string,
  ignoredFilePatterns?: string[]
): RouteManifest {
  let extensions = routeModuleExts.join(",");

  let routePaths = fg.sync(`**/*{${extensions}}`, {
    absolute: true,
    cwd: path.join(appDirectory, "routes"),
    ignore: ignoredFilePatterns,
    onlyFiles: true,
  });

  // fast-glob will return posix paths even on windows
  // convert posix to os specific paths
  let routePathsForOS = routePaths.map((routePath) => {
    return path.normalize(routePath);
  });

  return flatRoutesUniversal(appDirectory, routePathsForOS);
}

interface RouteInfo extends ConfigRoute {
  name: string;
  segments: string[];
}

/**
 * Create route configs from a list of routes using the flat routes conventions.
 * @param {string} appDirectory - The absolute root directory the routes were looked up from.
 * @param {string[]} routePaths - The absolute route paths.
 * @param {string} [prefix=routes] - The prefix to strip off of the routes.
 */
export function flatRoutesUniversal(
  appDirectory: string,
  routePaths: string[],
  prefix: string = "routes"
): RouteManifest {
  let routeMap = getRouteMap(appDirectory, routePaths, prefix);
  let routes = Array.from(routeMap.values());

  function defineNestedRoutes(
    defineRoute: DefineRouteFunction,
    parentId?: string
  ): void {
    let childRoutes = routes.filter((routeInfo) => {
      return routeInfo.parentId === parentId;
    });
    let parentRoute = parentId ? routeMap.get(parentId) : undefined;
    let parentRoutePath = parentRoute?.path ?? "/";
    for (let childRoute of childRoutes) {
      let routePath = childRoute.path?.slice(parentRoutePath.length) ?? "";
      // remove leading slash
      routePath = routePath.replace(/^\//, "");

      let childRouteOptions: DefineRouteOptions = {
        id: path.posix.join(prefix, childRoute.id),
        index: childRoute.index ? true : undefined,
      };

      if (childRoute.index) {
        let invalidChildRoutes = routes.filter(
          (routeInfo) => routeInfo.parentId === childRoute.id
        );

        if (invalidChildRoutes.length > 0) {
          throw new Error(
            `Child routes are not allowed in index routes. Please remove child routes of ${childRoute.id}`
          );
        }

        defineRoute(routePath, childRoute.file, childRouteOptions);
      } else {
        defineRoute(routePath, childRoute.file, childRouteOptions, () => {
          defineNestedRoutes(defineRoute, childRoute.id);
        });
      }
    }
  }

  return defineRoutes(defineNestedRoutes);
}

export function isIndexRoute(routeId: string) {
  return routeId.endsWith("_index");
}

type State =
  | // normal path segment normal character concatenation until we hit a special character or the end of the segment (i.e. `/`, `.`, '\')
  "NORMAL"
  // we hit a `[` and are now in an escape sequence until we hit a `]` - take characters literally and skip isSegmentSeparator checks
  | "ESCAPE"
  // we hit a `(` and are now in an optional segment until we hit a `)` or an escape sequence
  | "OPTIONAL"
  // we previously were in a optional segment and hit a `[` and are now in an escape sequence until we hit a `]` - take characters literally and skip isSegmentSeparator checks - afterwards go back to OPTIONAL state
  | "OPTIONAL_ESCAPE";

export function getRouteSegments(routeId: string) {
  let routeSegments: string[] = [];
  let rawRouteSegments: string[] = [];
  let index = 0;
  let routeSegment = "";
  let rawRouteSegment = "";
  let state: State = "NORMAL";

  let pushRouteSegment = (segment: string, rawSegment: string) => {
    if (!segment) return;

    let notSupportedInRR = (segment: string, char: string) => {
      throw new Error(
        `Route segment "${segment}" for "${routeId}" cannot contain "${char}".\n` +
          `If this is something you need, upvote this proposal for React Router https://github.com/remix-run/react-router/discussions/9822.`
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
    index++; //advance to next char

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
        if (!routeSegment && char == paramPrefixChar) {
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

  // process remaining segment
  pushRouteSegment(routeSegment, rawRouteSegment);
  return [routeSegments, rawRouteSegments];
}

function findParentRouteId(
  routeInfo: RouteInfo,
  nameMap: Map<string, RouteInfo>
) {
  let parentName = routeInfo.segments.slice(0, -1).join("/");
  while (parentName) {
    let parentRoute = nameMap.get(parentName);
    if (parentRoute) return parentRoute.id;
    parentName = parentName.substring(0, parentName.lastIndexOf("/"));
  }
  return undefined;
}

export function getRouteInfo(
  appDirectory: string,
  routeDirectory: string,
  filePath: string
): RouteInfo {
  let filePathWithoutApp = filePath.slice(appDirectory.length + 1);
  let routeId = createFlatRouteId(filePathWithoutApp);
  let routeIdWithoutRoutes = routeId.slice(routeDirectory.length + 1);
  let index = isIndexRoute(routeIdWithoutRoutes);
  let [routeSegments, rawRouteSegments] =
    getRouteSegments(routeIdWithoutRoutes);

  let routePath = createRoutePath(routeSegments, rawRouteSegments, index);

  return {
    id: routeIdWithoutRoutes,
    path: routePath,
    file: filePathWithoutApp,
    name: routeSegments.join("/"),
    segments: routeSegments,
    index,
  };
}

export function createRoutePath(
  routeSegments: string[],
  rawRouteSegments: string[],
  isIndex: boolean
) {
  let result = "";

  if (isIndex) {
    routeSegments = routeSegments.slice(0, -1);
  }

  for (let index = 0; index < routeSegments.length; index++) {
    let segment = routeSegments[index];
    let rawSegment = rawRouteSegments[index];

    // skip pathless layout segments
    if (segment.startsWith("_") && rawSegment.startsWith("_")) {
      continue;
    }

    // remove trailing slash
    if (segment.endsWith("_") && rawSegment.endsWith("_")) {
      segment = segment.slice(0, -1);
    }

    result += `/${segment}`;
  }

  return result || undefined;
}

function getRouteMap(
  appDirectory: string,
  routePaths: string[],
  prefix: string
): Readonly<Map<string, RouteInfo>> {
  let routeMap = new Map<string, RouteInfo>();
  let nameMap = new Map<string, RouteInfo>();
  let uniqueRoutes = new Map<string, RouteInfo>();
  let conflicts = new Map<string, RouteInfo[]>();

  for (let routePath of routePaths) {
    let routesDirectory = path.join(appDirectory, prefix);
    let pathWithoutAppRoutes = routePath.slice(routesDirectory.length + 1);
    if (isRouteModuleFile(pathWithoutAppRoutes)) {
      let routeInfo = getRouteInfo(appDirectory, prefix, routePath);

      let uniqueRouteId =
        (routeInfo.path || "") + (routeInfo.index ? "?index" : "");

      if (uniqueRouteId) {
        let conflict = uniqueRoutes.get(uniqueRouteId);
        // collect conflicts for later reporting
        if (conflict) {
          let currentConflicts = conflicts.get(routeInfo.path || "/");
          if (!currentConflicts) {
            conflicts.set(routeInfo.path || "/", [conflict, routeInfo]);
          } else {
            currentConflicts.push(routeInfo);
            conflicts.set(routeInfo.path || "/", currentConflicts);
          }

          continue;
        }
        uniqueRoutes.set(uniqueRouteId, routeInfo);
      }

      routeMap.set(routeInfo.id, routeInfo);
      nameMap.set(routeInfo.name, routeInfo);
    }
  }

  let routes = Array.from(routeMap.values()).sort((a, b) => {
    return b.segments.length - a.segments.length;
  });

  for (let routeInfo of routes) {
    // update parentIds for all routes
    routeInfo.parentId = findParentRouteId(routeInfo, nameMap);
  }

  // report conflicts
  if (conflicts.size > 0) {
    for (let [path, routes] of conflicts.entries()) {
      let filePaths = routes.map((r) => r.file);
      console.error(getRouteConflictErrorMessage(path, filePaths));
    }
  }

  return routeMap;
}

function isRouteModuleFile(filePath: string) {
  // flat files only need correct extension
  let normalizedFilePath = normalizeSlashes(filePath);
  let isFlatFile = !normalizedFilePath.includes(path.posix.sep);
  let hasExt = routeModuleExts.includes(path.extname(filePath));
  if (isFlatFile) return hasExt;
  let basename = normalizedFilePath.slice(0, -path.extname(filePath).length);
  return basename.endsWith(`/route`) || basename.endsWith(`/index`);
}

/**
 * @see https://github.com/remix-run/remix/pull/5160#issuecomment-1402157424
 * normalize routeId
 * remove `/index` and `/route` suffixes
 * they should be treated like if they weren't folders
 * e.g. `/dashboard` and `/dashboard/index` should be the same route
 * e.g. `/dashboard` and `/dashboard/route` should be the same route
 */
function isRouteInFolder(routeId: string) {
  return (
    (routeId.endsWith("/index") || routeId.endsWith("/route")) &&
    routeId.includes(path.posix.sep)
  );
}

export function createFlatRouteId(filePath: string) {
  let routeId = createRouteId(filePath);

  if (isRouteInFolder(routeId)) {
    let last = routeId.lastIndexOf(path.posix.sep);
    if (last >= 0) {
      routeId = routeId.substring(0, last);
    }
  }
  return routeId;
}

export function normalizePath(filePath: string) {
  return filePath.split("/").join(path.sep);
}

export function getRouteConflictErrorMessage(
  pathname: string,
  routes: string[]
) {
  let [taken, ...others] = routes;

  return (
    `⚠️ Route Path Collision: "${pathname}"\n\n` +
    `The following routes all define the same URL, only the first one will be used\n\n` +
    `🟢 ${normalizePath(taken)}\n` +
    others.map((route) => `⭕️️ ${normalizePath(route)}`).join("\n") +
    "\n"
  );
}
