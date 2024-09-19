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

type Context = {
  rootDirectory: string;
  appDirectory: string;
};

function getDirectory(ctx: Context) {
  return Path.join(ctx.rootDirectory, ".react-router/types");
}

export function getPath(ctx: Context, route: RouteManifestEntry): string {
  return Path.join(
    getDirectory(ctx),
    "app",
    Path.dirname(route.file),
    "+types." + Path.basename(route.file)
  );
}

export async function watch(ctx: Context) {
  const appDirectory = Path.normalize(ctx.appDirectory);
  const routesTsPath = Path.join(appDirectory, "routes.ts");

  const routesViteNodeContext = await ViteNode.createContext();
  async function getRoutes(): Promise<RouteManifest> {
    routesViteNodeContext.devServer.moduleGraph.invalidateAll();
    routesViteNodeContext.runner.moduleCache.clear();

    const result = await routesViteNodeContext.runner.executeFile(routesTsPath);
    return configRoutesToRouteManifest(result.routes);
  }

  const initialRoutes = await getRoutes();
  await typegenAll(ctx, initialRoutes);

  const watcher = Chokidar.watch(appDirectory, { ignoreInitial: true });
  watcher.on("all", async (event, path) => {
    path = Path.normalize(path);

    const routes = await getRoutes();

    const routeConfigChanged = Boolean(
      routesViteNodeContext.devServer.moduleGraph.getModuleById(path)
    );
    if (routeConfigChanged) {
      await typegenAll(ctx, routes);
      return;
    }

    const isRoute = Object.values(routes).find(
      (route) => path === Path.join(ctx.appDirectory, route.file)
    );
    if (isRoute && (event === "add" || event === "unlink")) {
      await typegenAll(ctx, routes);
      return;
    }
  });
}

export async function typegenAll(
  ctx: Context,
  routes: RouteManifest
): Promise<void> {
  fs.rmSync(getDirectory(ctx), { recursive: true, force: true });
  Object.values(routes).forEach((route) => {
    const typesPath = getPath(ctx, route);
    const content = getModule(routes, route);
    fs.mkdirSync(Path.dirname(typesPath), { recursive: true });
    fs.writeFileSync(typesPath, content);
  });
}

function getModule(routes: RouteManifest, route: RouteManifestEntry): string {
  return dedent`
    // typegen: ${route.file}

    type Route = typeof import("./${Pathe.filename(route.file)}")

    export type Params = {${formattedParamsProperties(routes, route)}}

    export type LinksArgs = {} // TODO
    export type LinksReturn = {} // TODO

    export type ServerLoaderArgs = {} // TODO
    export type ClientLoaderArgs = {} // TODO
    export type LoaderData = {} // TODO

    export type HydrateFallbackArgs = {} // TODO
    export type HydrateFallbackReturn = import("react").ReactNode

    export type ServerActionArgs = {} // TODO
    export type ClientActionArgs = {} // TODO
    export type ActionData = {} // TODO

    export type DefaultArgs = {} // TODO
    export type DefaultReturn = import("react").ReactNode

    export type ErrorBoundaryArgs = {} // TODO
    export type ErrorBoundaryReturn = import("react").ReactNode
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
