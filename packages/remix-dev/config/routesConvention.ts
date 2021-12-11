import * as fs from "fs";
import * as path from "path";

import type { RouteManifest, DefineRouteFunction } from "./routes";
import { defineRoutes, createRouteId } from "./routes";

const routeModuleExts = [".js", ".jsx", ".ts", ".tsx", ".md", ".mdx"];

export function isRouteModuleFile(filename: string): boolean {
  return routeModuleExts.includes(path.extname(filename));
}

/**
 * Defines routes using the filesystem convention in `app/routes`. The rules are:
 *
 * - Route paths are derived from the file path. A `.` in the filename indicates
 *   a `/` in the URL (a "nested" URL, but no route nesting). A `$` in the
 *   filename indicates a dynamic URL segment.
 * - Subdirectories are used for nested routes.
 *
 * For example, a file named `app/routes/gists/$username.tsx` creates a route
 * with a path of `gists/:username`.
 */
export function defineConventionalRoutes(appDir: string): RouteManifest {
  let files: { [routeId: string]: string } = {};

  // First, find all route modules in app/routes
  visitFiles(path.join(appDir, "routes"), file => {
    let routeId = createRouteId(path.join("routes", file));

    if (isRouteModuleFile(file)) {
      files[routeId] = path.join("routes", file);
      return;
    }

    // https://github.com/remix-run/remix/issues/391
    if (path.basename(file).startsWith(".")) {
      return;
    }

    throw new Error(
      `Invalid route module file: ${path.join(appDir, "routes", file)}`
    );
  });

  let routeIds = Object.keys(files).sort(byLongestFirst);

  let uniqueRoutes = new Map<string, string>();

  // Then, recurse through all routes using the public defineRoutes() API
  function defineNestedRoutes(
    defineRoute: DefineRouteFunction,
    parentId?: string
  ): void {
    let childRouteIds = routeIds.filter(
      id => findParentRouteId(routeIds, id) === parentId
    );

    for (let routeId of childRouteIds) {
      let routePath: string | undefined = createRoutePath(
        routeId.slice((parentId || "routes").length + 1)
      );

      let isIndexRoute = routeId.endsWith("/index");
      let fullPath = createRoutePath(routeId.slice("routes".length + 1));
      let uniqueRouteId = (fullPath || "") + (isIndexRoute ? "?index" : "");

      if (typeof uniqueRouteId !== "undefined") {
        if (uniqueRoutes.has(uniqueRouteId)) {
          throw new Error(
            `Path ${JSON.stringify(fullPath)} defined by route ${JSON.stringify(
              routeId
            )} conflicts with route ${JSON.stringify(
              uniqueRoutes.get(uniqueRouteId)
            )}`
          );
        } else {
          uniqueRoutes.set(uniqueRouteId, routeId);
        }
      }

      if (isIndexRoute) {
        let invalidChildRoutes = routeIds.filter(
          id => findParentRouteId(routeIds, id) === routeId
        );

        if (invalidChildRoutes.length > 0) {
          throw new Error(
            `Child routes are not allowed in index routes. Please remove child routes of ${routeId}`
          );
        }

        defineRoute(routePath, files[routeId], {
          index: true
        });
      } else {
        defineRoute(routePath, files[routeId], () => {
          defineNestedRoutes(defineRoute, routeId);
        });
      }
    }
  }

  return defineRoutes(defineNestedRoutes);
}

let escapeStart = "[";
let escapeEnd = "]";

// TODO: Cleanup and write some tests for this function
export function createRoutePath(partialRouteId: string): string | undefined {
  let result = "";
  let rawSegmentBuffer = "";

  let inEscapeSequence = 0;
  let skipSegment = false;
  for (let i = 0; i < partialRouteId.length; i++) {
    let char = partialRouteId.charAt(i);
    let lastChar = i > 0 ? partialRouteId.charAt(i - 1) : undefined;
    let nextChar =
      i < partialRouteId.length - 1 ? partialRouteId.charAt(i + 1) : undefined;

    function isNewEscapeSequence() {
      return (
        !inEscapeSequence && char === escapeStart && lastChar !== escapeStart
      );
    }

    function isCloseEscapeSequence() {
      return inEscapeSequence && char === escapeEnd && nextChar !== escapeEnd;
    }

    function isStartOfLayoutSegment() {
      return char === "_" && nextChar === "_" && !rawSegmentBuffer;
    }

    if (skipSegment) {
      if (char === "/" || char === "." || char === path.win32.sep) {
        skipSegment = false;
      }
      continue;
    }

    if (isNewEscapeSequence()) {
      inEscapeSequence++;
      continue;
    }

    if (isCloseEscapeSequence()) {
      inEscapeSequence--;
      continue;
    }

    if (inEscapeSequence) {
      result += char;
      continue;
    }

    if (char === "/" || char === path.win32.sep || char === ".") {
      if (rawSegmentBuffer === "index" && result.endsWith("index")) {
        result = result.replace(/\/?index$/, "");
      } else {
        result += "/";
      }
      rawSegmentBuffer = "";
      continue;
    }

    if (isStartOfLayoutSegment()) {
      skipSegment = true;
      continue;
    }

    rawSegmentBuffer += char;

    if (char === "$") {
      result += typeof nextChar === "undefined" ? "*" : ":";
      continue;
    }

    result += char;
  }

  if (rawSegmentBuffer === "index" && result.endsWith("index")) {
    result = result.replace(/\/?index$/, "");
  }

  return result || undefined;
}

function findParentRouteId(
  routeIds: string[],
  childRouteId: string
): string | undefined {
  return routeIds.find(id => childRouteId.startsWith(`${id}/`));
}

function byLongestFirst(a: string, b: string): number {
  return b.length - a.length;
}

function visitFiles(
  dir: string,
  visitor: (file: string) => void,
  baseDir = dir
): void {
  for (let filename of fs.readdirSync(dir)) {
    let file = path.resolve(dir, filename);
    let stat = fs.lstatSync(file);

    if (stat.isDirectory()) {
      visitFiles(file, visitor, baseDir);
    } else if (stat.isFile()) {
      visitor(path.relative(baseDir, file));
    }
  }
}

/*
eslint
  no-loop-func: "off",
*/
