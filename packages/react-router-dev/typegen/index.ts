import fs from "node:fs";

import * as Path from "pathe";
import pc from "picocolors";
import type vite from "vite";

import { createConfigLoader } from "../config/config";

import { generate } from "./generate";
import type { Context } from "./context";
import { getTypesDir, getTypesPath } from "./paths";
import type { RouteManifest, RouteManifestEntry } from "../config/routes";

export async function run(rootDirectory: string) {
  const ctx = await createContext({ rootDirectory, watch: false });
  await writeAll(ctx);
}

export type Watcher = {
  close: () => Promise<void>;
};

export async function watch(
  rootDirectory: string,
  { logger }: { logger?: vite.Logger } = {}
): Promise<Watcher> {
  const ctx = await createContext({ rootDirectory, watch: true });
  await writeAll(ctx);
  logger?.info(pc.green("generated types"), { timestamp: true, clear: true });

  ctx.configLoader.onChange(async ({ result, routeConfigChanged }) => {
    if (!result.ok) {
      logger?.error(pc.red(result.error), { timestamp: true, clear: true });
      return;
    }

    ctx.config = result.value;
    if (routeConfigChanged) {
      await writeAll(ctx);
      logger?.info(pc.green("regenerated types"), {
        timestamp: true,
        clear: true,
      });
    }
  });

  return {
    close: async () => await ctx.configLoader.close(),
  };
}

async function createContext({
  rootDirectory,
  watch,
}: {
  rootDirectory: string;
  watch: boolean;
}): Promise<Context> {
  const configLoader = await createConfigLoader({ rootDirectory, watch });
  const configResult = await configLoader.getConfig();

  if (!configResult.ok) {
    throw new Error(configResult.error);
  }

  const config = configResult.value;

  return {
    configLoader,
    rootDirectory,
    config,
  };
}

// TODO:
// 1. commit as wip
// 2. normalized data per route

function getRouteLineage(routes: RouteManifest, route: RouteManifestEntry) {
  const result: RouteManifestEntry[] = [];
  while (route) {
    result.push(route);
    if (!route.parentId) break;
    route = routes[route.parentId];
  }
  result.reverse();
  return result;
}

function parseParams(urlpath: string) {
  const result: Record<string, boolean> = {};

  let segments = urlpath.split("/");
  segments.forEach((segment) => {
    const match = segment.match(/^:([\w-]+)(\?)?/);
    if (!match) return;
    const param = match[1];
    const isRequired = match[2] === undefined;

    result[param] ||= isRequired;
    return;
  });

  const hasSplat = segments.at(-1) === "*";
  if (hasSplat) result["*"] = true;
  return result;
}

type Route = {
  id: string;
  path: string;
  file: string;
  parent?: string;
};

function formatRoute({ id, path, parent }: Route) {
  let params = parseParams(path);
  return [
    `"${path}": {`,
    `  path: "${path}"`,
    `  params: ${formatParams(params)}`,
    `  module: typeof import("./app/${id}.js")`,
    `  parent: ${JSON.stringify(parent)}`,
    `}`,
  ]
    .map((line) => `  ${line}`)
    .join("\n");
}

function formatParams(params: Record<string, boolean>) {
  let entries = Object.entries(params);
  if (entries.length === 0) return `{}`;
  return [
    "{",
    ...entries.map(
      ([param, isRequired]) =>
        `  ${JSON.stringify(param)}${isRequired ? "" : "?"}: string`
    ),
    "}",
  ]
    .map((line, index) => (index === 0 ? line : `    ${line}`))
    .join("\n");
}

async function writeAll(ctx: Context): Promise<void> {
  let routes = Object.values(ctx.config.routes);

  let paths = new Map<string, string>();
  for (let route of routes) {
    let lineage = getRouteLineage(ctx.config.routes, route);
    let path = lineage.map((route) => route.path).join("/");
    if (path === "") path = "<root>";
    paths.set(route.id, path);
  }

  const typegenDir = getTypesDir(ctx);
  fs.rmSync(typegenDir, { recursive: true, force: true });

  let types: Array<Route> = [];
  for (let route of routes) {
    let path = paths.get(route.id);
    if (path === undefined) throw new Error();

    types.push({
      id: route.id,
      path,
      file: route.file,
      parent: route.parentId && paths.get(route.parentId),
    });
  }

  const newTypes = Path.join(typegenDir, "routes.ts");
  fs.mkdirSync(Path.dirname(newTypes), { recursive: true });
  fs.writeFileSync(
    newTypes,
    `export type Routes = {\n${types.map(formatRoute).join("\n")}\n}`
  );

  Object.values(ctx.config.routes).forEach((route) => {
    const typesPath = getTypesPath(ctx, route);
    const content = generate(ctx, route);
    fs.mkdirSync(Path.dirname(typesPath), { recursive: true });
    fs.writeFileSync(typesPath, content);
  });
}

/*
type GetParents<T extends keyof Routes> = Routes[T] extends {
  parent: infer P extends keyof Routes;
}
  ? [...GetParents<P>, P]
  : [];

type P1 = GetParents<"/products/:id/blah/:id?">;

type _GetChildren<T extends keyof Routes> = {
  [K in keyof Routes]: Routes[K] extends { parent: T }
    ? [K, ..._GetChildren<K>]
    : [];
}[keyof Routes];
type GetChildren<T extends keyof Routes> = Exclude<_GetChildren<T>, []>;

type C1 = GetChildren<"<root>">;

type GetBranches<T extends keyof Routes> = [
  ...GetParents<T>,
  T,
  ...GetChildren<T>
];
type B1 = GetBranches<"<root>">;
*/
