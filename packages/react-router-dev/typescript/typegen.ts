import fs from "node:fs";

import Chokidar from "chokidar";
import dedent from "dedent";
import * as Path from "pathe";
import * as Pathe from "pathe/utils";

import {
  configRoutesToRouteManifest,
  type RouteManifest,
  type RouteManifestEntry,
} from "../config/routes";
import * as ViteNode from "../vite/vite-node";
import type { Context } from "./context";

function getDirectory(ctx: Context) {
  return Path.join(ctx.config.rootDirectory, ".react-router/types");
}

export function getPath(
  ctx: Context,
  route: Pick<RouteManifestEntry, "file">
): string {
  return Path.join(
    getDirectory(ctx),
    "app",
    Path.dirname(route.file),
    "+types." + Path.basename(route.file)
  );
}

export async function watch(ctx: Context) {
  const appDirectory = Path.normalize(ctx.config.appDirectory);
  const routesTsPath = Path.join(appDirectory, "routes.ts");

  const routesViteNodeContext = await ViteNode.createContext();
  async function updateRoutes(): Promise<void> {
    routesViteNodeContext.devServer.moduleGraph.invalidateAll();
    routesViteNodeContext.runner.moduleCache.clear();

    const result = await routesViteNodeContext.runner.executeFile(routesTsPath);
    ctx.routes = configRoutesToRouteManifest(result.routes);
  }

  await updateRoutes();
  await typegenAll(ctx);

  const watcher = Chokidar.watch(appDirectory, { ignoreInitial: true });
  watcher.on("all", async (event, path) => {
    path = Path.normalize(path);
    await updateRoutes();

    const routeConfigChanged = Boolean(
      routesViteNodeContext.devServer.moduleGraph.getModuleById(path)
    );
    if (routeConfigChanged) {
      await typegenAll(ctx);
      return;
    }

    const isRoute = Object.values(ctx.routes).find(
      (route) => path === Path.join(ctx.config.appDirectory, route.file)
    );
    if (isRoute && (event === "add" || event === "unlink")) {
      await typegenAll(ctx);
      return;
    }
  });
}

export async function typegenAll(ctx: Context): Promise<void> {
  fs.rmSync(getDirectory(ctx), { recursive: true, force: true });
  Object.values(ctx.routes).forEach((route) => {
    const typesPath = getPath(ctx, route);
    const content = getModule(ctx, route);
    fs.mkdirSync(Path.dirname(typesPath), { recursive: true });
    fs.writeFileSync(typesPath, content);
  });
}

function getModule(ctx: Context, route: RouteManifestEntry): string {
  return dedent`
    // typegen: ${route.file}
    import * as T from "react-router/types"

    export type Params = {${formattedParamsProperties(ctx.routes, route)}}

    type Route = typeof import("./${Pathe.filename(route.file)}")

    export type LoaderData = T.LoaderData<Route>
    export type ActionData = T.ActionData<Route>

    export type ServerLoader = T.ServerLoader<Params>
    export type ClientLoader = T.ClientLoader<Params, Route>
    export type ServerAction = T.ServerAction<Params>
    export type ClientAction = T.ClientAction<Params, Route>

    export type HydrateFallback = T.HydrateFallback<Params>
    export type Default = T.Default<Params, LoaderData, ActionData>
    export type ErrorBoundary = T.ErrorBoundary<Params, LoaderData, ActionData>
  `;
}

function formattedParamsProperties(
  routes: RouteManifest,
  route: RouteManifestEntry
) {
  const urlpath = routeLineage(routes, route)
    .map((route) => route.path)
    .join("/");
  const params = parseParams(urlpath);
  const indent = "  ".repeat(3);
  const properties = Object.entries(params).map(([name, values]) => {
    if (values.length === 1) {
      const isOptional = values[0];
      return indent + (isOptional ? `${name}?: string` : `${name}: string`);
    }
    const items = values.map((isOptional) =>
      isOptional ? "string | undefined" : "string"
    );
    return indent + `${name}: [${items.join(", ")}]`;
  });

  // prettier-ignore
  const body =
    properties.length === 0 ? "" :
    "\n" + properties.join("\n") + "\n";

  return body;
}

function routeLineage(routes: RouteManifest, route: RouteManifestEntry) {
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
  const result: Record<string, boolean[]> = {};

  let segments = urlpath.split("/");
  segments
    .filter((s) => s.startsWith(":"))
    .forEach((param) => {
      param = param.slice(1); // omit leading `:`
      let isOptional = param.endsWith("?");
      if (isOptional) {
        param = param.slice(0, -1); // omit trailing `?`
      }

      result[param] ??= [];
      result[param].push(isOptional);
      return;
    });
  return result;
}
