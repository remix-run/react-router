import fs from "node:fs";

import Chokidar from "chokidar";
import * as Path from "pathe";
import pc from "picocolors";

import * as Logger from "../logger";
import type { RouteConfig } from "../config/routes";
import { configRoutesToRouteManifest } from "../config/routes";
import * as ViteNode from "../vite/vite-node";
import { findEntry } from "../vite/config";
import { loadPluginContext } from "../vite/plugin";
import { generate } from "./generate";
import type { Context } from "./context";
import { getTypesDir, getTypesPath } from "./paths";

export async function run(rootDirectory: string, configFile?: string) {
  const ctx = await createContext(rootDirectory, configFile);
  await writeAll(ctx);
}

export async function watch(rootDirectory: string, configFile?: string) {
  const watchStart = performance.now();
  const ctx = await createContext(rootDirectory, configFile);

  await writeAll(ctx);
  Logger.info("generated initial types", {
    durationMs: performance.now() - watchStart,
  });

  const watcher = Chokidar.watch(ctx.appDirectory, { ignoreInitial: true });
  watcher.on("all", async (event, path) => {
    path = Path.normalize(path);
    const eventStart = performance.now();

    const didRouteConfigChange = Boolean(
      ctx.routeConfigEnv.devServer.moduleGraph.getModuleById(path)
    );
    if (didRouteConfigChange) {
      await writeAll(ctx);
      Logger.info("changed route config", {
        durationMs: performance.now() - eventStart,
      });
      return;
    }

    ctx.routes = await getRoutes(ctx);

    const route = findRoute(ctx, path);
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

async function createContext(
  rootDirectory: string,
  configFile?: string
): Promise<Context> {
  const appDirectory = await getAppDirectory(rootDirectory, configFile);
  const routeConfigEnv = await ViteNode.createContext({
    root: rootDirectory,
  });
  return {
    rootDirectory,
    appDirectory,
    routeConfigEnv,
    routes: await getRoutes({ rootDirectory, appDirectory, routeConfigEnv }),
  };
}

async function getAppDirectory(
  rootDirectory: string,
  configFile?: string
): Promise<string> {
  const { reactRouterConfig } = await loadPluginContext({
    root: rootDirectory,
    configFile,
  });
  return reactRouterConfig.appDirectory;
}

function findRoute(ctx: Context, path: string) {
  return Object.values(ctx.routes).find(
    (route) => path === Path.join(ctx.appDirectory, route.file)
  );
}

async function getRoutes(
  ctx: Pick<Context, "rootDirectory" | "appDirectory" | "routeConfigEnv">
) {
  ctx.routeConfigEnv.devServer.moduleGraph.invalidateAll();
  ctx.routeConfigEnv.runner.moduleCache.clear();

  const routeConfigFile = findEntry(ctx.appDirectory, "routes");
  if (!routeConfigFile) {
    Logger.warn(
      `Could not find route config within ${pc.blue(
        Path.relative(ctx.rootDirectory, ctx.appDirectory)
      )}`
    );
    process.exit(1);
  }
  const routeConfigPath = Path.join(ctx.appDirectory, routeConfigFile);

  const routeConfig: RouteConfig = (
    await ctx.routeConfigEnv.runner.executeFile(routeConfigPath)
  ).routes;
  const routes = configRoutesToRouteManifest(await routeConfig);

  const rootRouteFile = findEntry(ctx.appDirectory, "root");
  if (!rootRouteFile) throw new Error("Could not find `root` route");
  routes.root = { path: "", id: "root", file: rootRouteFile };

  return routes;
}

async function writeAll(ctx: Context): Promise<void> {
  const typegenDir = getTypesDir(ctx);

  fs.rmSync(typegenDir, { recursive: true, force: true });
  Object.values(ctx.routes).forEach((route) => {
    if (!fs.existsSync(Path.join(ctx.appDirectory, route.file))) return;
    const typesPath = getTypesPath(ctx, route);
    const content = generate(ctx, route);
    fs.mkdirSync(Path.dirname(typesPath), { recursive: true });
    fs.writeFileSync(typesPath, content);
  });
}
