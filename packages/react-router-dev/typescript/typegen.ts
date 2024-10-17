import fs from "node:fs";

import Chokidar from "chokidar";
import dedent from "dedent";
import * as Path from "pathe";
import * as Pathe from "pathe/utils";

import type { RouteConfig } from "../config/routes";
import {
  configRoutesToRouteManifest,
  type RouteManifest,
  type RouteManifestEntry,
} from "../config/routes";
import * as ViteNode from "../vite/vite-node";
import { findEntry } from "../vite/config";
import { loadPluginContext } from "../vite/plugin";

type Context = {
  rootDirectory: string;
  appDirectory: string;
  routes: RouteManifest;
};

function getDirectory(ctx: Context) {
  return Path.join(ctx.rootDirectory, ".react-router/types");
}

export function getPath(ctx: Context, route: RouteManifestEntry): string {
  return Path.join(
    getDirectory(ctx),
    "app",
    Path.dirname(route.file),
    "+types." + Pathe.filename(route.file) + ".d.ts"
  );
}

export async function watch(rootDirectory: string) {
  const vitePluginCtx = await loadPluginContext({ root: rootDirectory });
  const routesTsPath = Path.join(
    vitePluginCtx.reactRouterConfig.appDirectory,
    "routes.ts"
  );

  const routesViteNodeContext = await ViteNode.createContext({
    root: rootDirectory,
  });
  async function getRoutes(): Promise<RouteManifest> {
    const routes: RouteManifest = {};
    const rootRouteFile = findEntry(
      vitePluginCtx.reactRouterConfig.appDirectory,
      "root"
    );
    if (rootRouteFile) {
      routes.root = { path: "", id: "root", file: rootRouteFile };
    }

    routesViteNodeContext.devServer.moduleGraph.invalidateAll();
    routesViteNodeContext.runner.moduleCache.clear();

    const routeConfig: RouteConfig = (
      await routesViteNodeContext.runner.executeFile(routesTsPath)
    ).routes;

    return {
      ...routes,
      ...configRoutesToRouteManifest(await routeConfig),
    };
  }

  const ctx: Context = {
    rootDirectory,
    appDirectory: vitePluginCtx.reactRouterConfig.appDirectory,
    routes: await getRoutes(),
  };
  await writeAll(ctx);

  const watcher = Chokidar.watch(ctx.appDirectory, { ignoreInitial: true });
  watcher.on("all", async (event, path) => {
    path = Path.normalize(path);
    ctx.routes = await getRoutes();

    const routeConfigChanged = Boolean(
      routesViteNodeContext.devServer.moduleGraph.getModuleById(path)
    );
    if (routeConfigChanged) {
      await writeAll(ctx);
      return;
    }

    const isRoute = Object.values(ctx.routes).find(
      (route) => path === Path.join(ctx.appDirectory, route.file)
    );
    if (isRoute && (event === "add" || event === "unlink")) {
      await writeAll(ctx);
      return;
    }
  });
}

export async function writeAll(ctx: Context): Promise<void> {
  fs.rmSync(getDirectory(ctx), { recursive: true, force: true });
  Object.values(ctx.routes).forEach((route) => {
    if (!fs.existsSync(Path.join(ctx.appDirectory, route.file))) return;
    const typesPath = getPath(ctx, route);
    const content = getModule(ctx.routes, route);
    fs.mkdirSync(Path.dirname(typesPath), { recursive: true });
    fs.writeFileSync(typesPath, content);
  });
}

function getModule(routes: RouteManifest, route: RouteManifestEntry): string {
  return dedent`
    // React Router generated types for route:
    // ${route.file}

    import * as T from "react-router/types"

    export type Params = {${formattedParamsProperties(routes, route)}}

    type Route = typeof import("./${Pathe.filename(route.file)}")

    export type LoaderData = T.CreateLoaderData<Route>
    export type ActionData = T.CreateActionData<Route>

    export type LoaderArgs = T.CreateServerLoaderArgs<Params>
    export type ClientLoaderArgs = T.CreateClientLoaderArgs<Params, Route>
    export type ActionArgs = T.CreateServerActionArgs<Params>
    export type ClientActionArgs = T.CreateClientActionArgs<Params, Route>

    export type HydrateFallbackProps = T.CreateHydrateFallbackProps<Params>
    export type ComponentProps = T.CreateComponentProps<Params, LoaderData, ActionData>
    export type ErrorBoundaryProps = T.CreateErrorBoundaryProps<Params, LoaderData, ActionData>
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
      // If there was an escaped dot, we need to remove it (eg $lang[.]xml => lang.xml => lang)
      if (param.includes(".")) {
        param = param.split(".")[0];
      }
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
