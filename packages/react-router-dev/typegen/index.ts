import fs from "node:fs";

import ts from "dedent";
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

function asJS(path: string) {
  return path.replace(/\.(js|ts)x?$/, ".js");
}

function formatRoute(
  ctx: Context,
  { id, path, file, parentId }: RouteManifestEntry
) {
  const modulePath = Path.relative(
    ctx.rootDirectory,
    Path.join(ctx.config.appDirectory, file)
  );
  return [
    `"${id}": {`,
    `  parentId: ${JSON.stringify(parentId)}`,
    `  path: ${JSON.stringify(path)}`,
    `  module: typeof import("${asJS(modulePath)}")`,
    `}`,
  ]
    .map((line) => `  ${line}`)
    .join("\n");
}

async function writeAll(ctx: Context): Promise<void> {
  let routes = Object.values(ctx.config.routes);

  let pathsToParams = new Map<string, Record<string, boolean>>();
  for (let route of routes) {
    if (route.path === undefined) continue;
    let lineage = getRouteLineage(ctx.config.routes, route);
    let path = lineage
      .filter((route) => route.path !== undefined)
      .map((route) => route.path)
      .join("/");
    if (path === "") path = "/";
    pathsToParams.set(path, parseParams(path));
  }
  let formattedPaths = `type Paths = {`;
  for (let [path, params] of pathsToParams.entries()) {
    let formattedParams = Object.entries(params).map(
      ([param, required]) => `"${param}"${required ? "" : "?"}: string`
    );
    let formattedEntry = `"${path}": {${formattedParams.join(",")}},\n`;
    formattedPaths += formattedEntry;
  }
  formattedPaths += `}`;

  const typegenDir = getTypesDir(ctx);
  fs.rmSync(typegenDir, { recursive: true, force: true });

  const newTypes = Path.join(typegenDir, "routes.ts");
  fs.mkdirSync(Path.dirname(newTypes), { recursive: true });
  fs.writeFileSync(
    newTypes,
    formattedPaths +
      "\n\n" +
      `type Routes = {\n${routes
        .map((route) => formatRoute(ctx, route))
        .join("\n")}\n}\n\n` +
      ts`
        declare module "react-router/types" {
          interface Register {
            paths: Paths
            routes: Routes
          }
        }

        export {}
    `
  );

  Object.values(ctx.config.routes).forEach((route) => {
    const typesPath = getTypesPath(ctx, route);
    const content = generate(route);
    fs.mkdirSync(Path.dirname(typesPath), { recursive: true });
    fs.writeFileSync(typesPath, content);
  });
}

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

function parseParams(urlpath: string): Record<string, boolean> {
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
