import fs from "node:fs";

import Chokidar from "chokidar";
import dedent from "dedent";
import * as Path from "pathe";
import * as Pathe from "pathe/utils";
import pc from "picocolors";

import * as Logger from "./logger";
import type { RouteConfig } from "./config/routes";
import {
  configRoutesToRouteManifest,
  type RouteManifest,
  type RouteManifestEntry,
} from "./config/routes";
import * as ViteNode from "./vite/vite-node";
import { findEntry } from "./vite/config";
import { loadPluginContext } from "./vite/plugin";

type Context = {
  rootDirectory: string;
  appDirectory: string;
  routes: RouteManifest;
};

function getDirectory(ctx: Context) {
  return Path.join(ctx.rootDirectory, ".react-router/types");
}

export async function watch(
  rootDirectory: string,
  options: { configFile?: string } = {}
) {
  const watchStart = performance.now();

  const vitePluginCtx = await loadPluginContext({
    root: rootDirectory,
    configFile: options.configFile,
  });
  const routeConfigFile = findEntry(
    vitePluginCtx.reactRouterConfig.appDirectory,
    "routes"
  );
  if (!routeConfigFile) {
    Logger.warn(
      `Could not find route config within ${pc.blue(
        Path.relative(
          vitePluginCtx.rootDirectory,
          vitePluginCtx.reactRouterConfig.appDirectory
        )
      )}`
    );
    process.exit(1);
  }
  const routeConfigPath = Path.join(
    vitePluginCtx.reactRouterConfig.appDirectory,
    routeConfigFile
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
    } else {
      Logger.warn(`Could not find \`root\` route`);
    }

    routesViteNodeContext.devServer.moduleGraph.invalidateAll();
    routesViteNodeContext.runner.moduleCache.clear();

    const routeConfig: RouteConfig = (
      await routesViteNodeContext.runner.executeFile(routeConfigPath)
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
  Logger.info("generated initial types", {
    durationMs: performance.now() - watchStart,
  });

  const watcher = Chokidar.watch(ctx.appDirectory, { ignoreInitial: true });
  watcher.on("all", async (event, path) => {
    const eventStart = performance.now();

    path = Path.normalize(path);
    ctx.routes = await getRoutes();

    const routeConfigChanged = Boolean(
      routesViteNodeContext.devServer.moduleGraph.getModuleById(path)
    );
    if (routeConfigChanged) {
      await writeAll(ctx);
      Logger.info("changed route config", {
        durationMs: performance.now() - eventStart,
      });
      return;
    }

    const route = Object.values(ctx.routes).find(
      (route) => path === Path.join(ctx.appDirectory, route.file)
    );
    if (route && (event === "add" || event === "unlink")) {
      await writeAll(ctx);
      Logger.info(
        `${event === "add" ? "added" : "removed"} route ${pc.blue(route.file)}`,
        { durationMs: performance.now() - eventStart }
      );
      return;
    }
  });
}

export async function writeAll(ctx: Context): Promise<void> {
  fs.rmSync(getDirectory(ctx), { recursive: true, force: true });
  Object.values(ctx.routes).forEach((route) => {
    if (!fs.existsSync(Path.join(ctx.appDirectory, route.file))) return;
    const typesPath = Path.join(
      getDirectory(ctx),
      Path.relative(ctx.rootDirectory, ctx.appDirectory),
      Path.dirname(route.file),
      "+types." + Pathe.filename(route.file) + ".d.ts"
    );
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

    type RouteModule = typeof import("./${Pathe.filename(route.file)}")

    export namespace Route {
      export type LoaderData = T.CreateLoaderData<RouteModule>
      export type ActionData = T.CreateActionData<RouteModule>

      export type LoaderArgs = T.CreateServerLoaderArgs<Params>
      export type ClientLoaderArgs = T.CreateClientLoaderArgs<Params, RouteModule>
      export type ActionArgs = T.CreateServerActionArgs<Params>
      export type ClientActionArgs = T.CreateClientActionArgs<Params, RouteModule>

      export type HydrateFallbackProps = T.CreateHydrateFallbackProps<Params>
      export type ComponentProps = T.CreateComponentProps<Params, LoaderData, ActionData>
      export type ErrorBoundaryProps = T.CreateErrorBoundaryProps<Params, LoaderData, ActionData>
    }
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
