import Chokidar from "chokidar";
import * as Path from "pathe";
import glob from "fast-glob";

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
  const actual = new Set(
    await glob(`**/*`, {
      cwd: getDirectory(ctx),
      absolute: true,
    })
  );
  const expected = new Set(
    Object.values(routes).map((route) =>
      Path.join(ctx.appDirectory, route.file)
    )
  );

  const remove = setDifference(actual, expected);
  if (remove.size > 0) {
    console.log(`TODO typegen remove: ${Array.from(remove).join(",")}`);
  }

  const add = setDifference(expected, actual);
  if (add.size > 0) {
    console.log(`TODO typegen add: ${Array.from(add).join(",")}`);
  }
}

function setDifference<T>(a: Set<T>, b: Set<T>) {
  const diff = new Set<T>();
  a.forEach((value) => {
    if (!b.has(value)) {
      diff.add(value);
    }
  });
  return diff;
}
