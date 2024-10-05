import fs from "node:fs";
import path from "node:path";
import { makeRe } from "minimatch";

import type { RouteManifest, RouteManifestEntry } from "./manifest";
import { normalizeSlashes } from "./normalizeSlashes";

export const routeModuleExts = [".js", ".jsx", ".ts", ".tsx", ".md", ".mdx"];

export let paramPrefixChar = "$" as const;
export let escapeStart = "[" as const;
export let escapeEnd = "]" as const;

export let optionalStart = "(" as const;
export let optionalEnd = ")" as const;

const PrefixLookupTrieEndSymbol = Symbol("PrefixLookupTrieEndSymbol");
type PrefixLookupNode = {
  [key: string]: PrefixLookupNode;
} & Record<typeof PrefixLookupTrieEndSymbol, boolean>;

class PrefixLookupTrie {
  root: PrefixLookupNode = {
    [PrefixLookupTrieEndSymbol]: false,
  };

  add(value: string) {
    if (!value) throw new Error("Cannot add empty string to PrefixLookupTrie");

    let node = this.root;
    for (let char of value) {
      if (!node[char]) {
        node[char] = {
          [PrefixLookupTrieEndSymbol]: false,
        };
      }
      node = node[char];
    }
    node[PrefixLookupTrieEndSymbol] = true;
  }

  findAndRemove(
    prefix: string,
    filter: (nodeValue: string) => boolean
  ): string[] {
    let node = this.root;
    for (let char of prefix) {
      if (!node[char]) return [];
      node = node[char];
    }

    return this.#findAndRemoveRecursive([], node, prefix, filter);
  }

  #findAndRemoveRecursive(
    values: string[],
    node: PrefixLookupNode,
    prefix: string,
    filter: (nodeValue: string) => boolean
  ): string[] {
    for (let char of Object.keys(node)) {
      this.#findAndRemoveRecursive(values, node[char], prefix + char, filter);
    }

    if (node[PrefixLookupTrieEndSymbol] && filter(prefix)) {
      node[PrefixLookupTrieEndSymbol] = false;
      values.push(prefix);
    }

    return values;
  }
}

export function flatRoutes(
  appDirectory: string,
  ignoredFilePatterns: string[] = [],
  prefix = "routes"
) {
  let ignoredFileRegex = Array.from(new Set(["**/.*", ...ignoredFilePatterns]))
    .map((re) => makeRe(re))
    .filter((re: any): re is RegExp => !!re);
  let routesDir = path.join(appDirectory, prefix);

  let rootRoute = findFile(appDirectory, "root", routeModuleExts);

  if (!rootRoute) {
    throw new Error(
      `Could not find a root route module in the app directory: ${appDirectory}`
    );
  }

  if (!fs.existsSync(rootRoute)) {
    throw new Error(
      `Could not find the routes directory: ${routesDir}. Did you forget to create it?`
    );
  }

  // Only read the routes directory
  let entries = fs.readdirSync(routesDir, {
    withFileTypes: true,
    encoding: "utf-8",
  });

  let routes: string[] = [];
  for (let entry of entries) {
    let filepath = normalizeSlashes(path.join(routesDir, entry.name));

    let route: string | null = null;
    // If it's a directory, don't recurse into it, instead just look for a route module
    if (entry.isDirectory()) {
      route = findRouteModuleForFolder(
        appDirectory,
        filepath,
        ignoredFileRegex
      );
    } else if (entry.isFile()) {
      route = findRouteModuleForFile(appDirectory, filepath, ignoredFileRegex);
    }

    if (route) routes.push(route);
  }

  let routeManifest = flatRoutesUniversal(appDirectory, routes, prefix);
  return routeManifest;
}

export function flatRoutesUniversal(
  appDirectory: string,
  routes: string[],
  prefix: string = "routes"
): RouteManifest {
  let urlConflicts = new Map<string, RouteManifestEntry[]>();
  let routeManifest: RouteManifest = {};
  let prefixLookup = new PrefixLookupTrie();
  let uniqueRoutes = new Map<string, RouteManifestEntry>();
  let routeIdConflicts = new Map<string, string[]>();

  // id -> file
  let routeIds = new Map<string, string>();

  for (let file of routes) {
    let normalizedFile = normalizeSlashes(file);
    let routeExt = path.extname(normalizedFile);
    let routeDir = path.dirname(normalizedFile);
    let normalizedApp = normalizeSlashes(appDirectory);
    let routeId =
      routeDir === path.posix.join(normalizedApp, prefix)
        ? path.posix
            .relative(normalizedApp, normalizedFile)
            .slice(0, -routeExt.length)
        : path.posix.relative(normalizedApp, routeDir);

    let conflict = routeIds.get(routeId);
    if (conflict) {
      let currentConflicts = routeIdConflicts.get(routeId);
      if (!currentConflicts) {
        currentConflicts = [path.posix.relative(normalizedApp, conflict)];
      }
      currentConflicts.push(path.posix.relative(normalizedApp, normalizedFile));
      routeIdConflicts.set(routeId, currentConflicts);
      continue;
    }

    routeIds.set(routeId, normalizedFile);
  }

  let sortedRouteIds = Array.from(routeIds).sort(
    ([a], [b]) => b.length - a.length
  );

  for (let [routeId, file] of sortedRouteIds) {
    let index = routeId.endsWith("_index");
    let [segments, raw] = getRouteSegments(routeId.slice(prefix.length + 1));
    let pathname = createRoutePath(segments, raw, index);

    routeManifest[routeId] = {
      file: file.slice(appDirectory.length + 1),
      id: routeId,
      path: pathname,
    };
    if (index) routeManifest[routeId].index = true;
    let childRouteIds = prefixLookup.findAndRemove(routeId, (value) => {
      return [".", "/"].includes(value.slice(routeId.length).charAt(0));
    });
    prefixLookup.add(routeId);

    if (childRouteIds.length > 0) {
      for (let childRouteId of childRouteIds) {
        routeManifest[childRouteId].parentId = routeId;
      }
    }
  }

  // path creation
  let parentChildrenMap = new Map<string, RouteManifestEntry[]>();
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
    if (parentConfig?.path && pathname) {
      pathname = pathname
        .slice(parentConfig.path.length)
        .replace(/^\//, "")
        .replace(/\/$/, "");
    }

    if (!config.parentId) config.parentId = "root";
    config.path = pathname || undefined;

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
    let lastRouteSegment = config.id
      .replace(new RegExp(`^${prefix}/`), "")
      .split(".")
      .pop();
    let isPathlessLayoutRoute =
      lastRouteSegment &&
      lastRouteSegment.startsWith("_") &&
      lastRouteSegment !== "_index";
    if (isPathlessLayoutRoute) {
      continue;
    }

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

  if (routeIdConflicts.size > 0) {
    for (let [routeId, files] of routeIdConflicts.entries()) {
      console.error(getRouteIdConflictErrorMessage(routeId, files));
    }
  }

  // report conflicts
  if (urlConflicts.size > 0) {
    for (let [path, routes] of urlConflicts.entries()) {
      // delete all but the first route from the manifest
      for (let i = 1; i < routes.length; i++) {
        delete routeManifest[routes[i].id];
      }
      let files = routes.map((r) => r.file);
      console.error(getRoutePathConflictErrorMessage(path, files));
    }
  }

  return routeManifest;
}

function findRouteModuleForFile(
  appDirectory: string,
  filepath: string,
  ignoredFileRegex: RegExp[]
): string | null {
  let relativePath = normalizeSlashes(path.relative(appDirectory, filepath));
  let isIgnored = ignoredFileRegex.some((regex) => regex.test(relativePath));
  if (isIgnored) return null;
  return filepath;
}

function findRouteModuleForFolder(
  appDirectory: string,
  filepath: string,
  ignoredFileRegex: RegExp[]
): string | null {
  let relativePath = path.relative(appDirectory, filepath);
  let isIgnored = ignoredFileRegex.some((regex) => regex.test(relativePath));
  if (isIgnored) return null;

  let routeRouteModule = findFile(filepath, "route", routeModuleExts);
  let routeIndexModule = findFile(filepath, "index", routeModuleExts);

  // if both a route and index module exist, throw a conflict error
  // preferring the route module over the index module
  if (routeRouteModule && routeIndexModule) {
    let [segments, raw] = getRouteSegments(
      path.relative(appDirectory, filepath)
    );
    let routePath = createRoutePath(segments, raw, false);
    console.error(
      getRoutePathConflictErrorMessage(routePath || "/", [
        routeRouteModule,
        routeIndexModule,
      ])
    );
  }

  return routeRouteModule || routeIndexModule || null;
}

type State =
  | // normal path segment normal character concatenation until we hit a special character or the end of the segment (i.e. `/`, `.`, '\')
  "NORMAL"
  // we hit a `[` and are now in an escape sequence until we hit a `]` - take characters literally and skip isSegmentSeparator checks
  | "ESCAPE"
  // we hit a `(` and are now in an optional segment until we hit a `)` or an escape sequence
  | "OPTIONAL"
  // we previously were in a opt fional segment and hit a `[` and are now in an escape sequence until we hit a `]` - take characters literally and skip isSegmentSeparator checks - afterwards go back to OPTIONAL state
  | "OPTIONAL_ESCAPE";

export function getRouteSegments(routeId: string): [string[], string[]] {
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

export function createRoutePath(
  routeSegments: string[],
  rawRouteSegments: string[],
  isIndex?: boolean
) {
  let result: string[] = [];

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

    result.push(segment);
  }

  return result.length ? result.join("/") : undefined;
}

export function getRoutePathConflictErrorMessage(
  pathname: string,
  routes: string[]
) {
  let [taken, ...others] = routes;

  if (!pathname.startsWith("/")) {
    pathname = "/" + pathname;
  }

  return (
    `⚠️ Route Path Collision: "${pathname}"\n\n` +
    `The following routes all define the same URL, only the first one will be used\n\n` +
    `🟢 ${taken}\n` +
    others.map((route) => `⭕️️ ${route}`).join("\n") +
    "\n"
  );
}

export function getRouteIdConflictErrorMessage(
  routeId: string,
  files: string[]
) {
  let [taken, ...others] = files;

  return (
    `⚠️ Route ID Collision: "${routeId}"\n\n` +
    `The following routes all define the same Route ID, only the first one will be used\n\n` +
    `🟢 ${taken}\n` +
    others.map((route) => `⭕️️ ${route}`).join("\n") +
    "\n"
  );
}

export function isSegmentSeparator(checkChar: string | undefined) {
  if (!checkChar) return false;
  return ["/", ".", path.win32.sep].includes(checkChar);
}

function findFile(
  dir: string,
  basename: string,
  extensions: string[]
): string | undefined {
  for (let ext of extensions) {
    let name = basename + ext;
    let file = path.join(dir, name);
    if (fs.existsSync(file)) return file;
  }

  return undefined;
}
