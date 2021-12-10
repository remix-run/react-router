import * as fs from "fs";
import * as path from "path";

import type { RouteManifest, DefineRoutesFunction } from "./config/routes";
import { defineRoutes } from "./config/routes";
import { defineConventionalRoutes } from "./config/routesConvention";
import { ServerMode, isValidServerMode } from "./config/serverModes";

export interface RemixMdxConfig {
  rehypePlugins?: any[];
  remarkPlugins?: any[];
}

export type RemixMdxConfigFunction = (
  filename: string
) => Promise<RemixMdxConfig | undefined> | RemixMdxConfig | undefined;

/**
 * The user-provided config in `remix.config.js`.
 */
export interface AppConfig {
  /**
   * The path to the `app` directory, relative to `remix.config.js`. Defaults
   * to "app".
   */
  appDirectory?: string;

  /**
   * The path to a directory Remix can use for caching things in development,
   * relative to `remix.config.js`. Defaults to ".cache".
   */
  cacheDirectory?: string;

  /**
   * A function for defining custom routes, in addition to those already defined
   * using the filesystem convention in `app/routes`.
   */
  routes?: (
    defineRoutes: DefineRoutesFunction
  ) => Promise<ReturnType<DefineRoutesFunction>>;

  /**
   * The path to the server build, relative to `remix.config.js`. Defaults to
   * "build".
   */
  serverBuildDirectory?: string;

  /**
   * The path to the browser build, relative to `remix.config.js`. Defaults to
   * "public/build".
   */
  assetsBuildDirectory?: string;

  /**
   * The path to the browser build, relative to remix.config.js. Defaults to
   * "public/build".
   *
   * @deprecated Use `assetsBuildDirectory` instead
   */
  browserBuildDirectory?: string;

  /**
   * The URL prefix of the browser build with a trailing slash. Defaults to
   * "/build/".
   */
  publicPath?: string;

  /**
   * The port number to use for the dev server. Defaults to 8002.
   */
  devServerPort?: number;
  /**
   * The delay before the dev server broadcasts a reload event.
   */
  devServerBroadcastDelay?: number;

  /**
   * Additional MDX remark / rehype plugins.
   */
  mdx?: RemixMdxConfig | RemixMdxConfigFunction;

  /**
   * The output format of the server build. Defaults to "cjs".
   */
  serverModuleFormat: "esm" | "cjs";
}

/**
 * Fully resolved configuration object we use throughout Remix.
 */
export interface RemixConfig {
  /**
   * The absolute path to the root of the Remix project.
   */
  rootDirectory: string;

  /**
   * The absolute path to the application source directory.
   */
  appDirectory: string;

  /**
   * The absolute path to the cache directory.
   */
  cacheDirectory: string;

  /**
   * The path to the entry.client file, relative to `config.appDirectory`.
   */
  entryClientFile: string;

  /**
   * The path to the entry.server file, relative to `config.appDirectory`.
   */
  entryServerFile: string;

  /**
   * An object of all available routes, keyed by route id.
   */
  routes: RouteManifest;

  /**
   * The absolute path to the server build directory.
   */
  serverBuildDirectory: string;

  /**
   * The absolute path to the assets build directory.
   */
  assetsBuildDirectory: string;

  /**
   * The URL prefix of the public build with a trailing slash.
   */
  publicPath: string;

  /**
   * The mode to use to run the server.
   */
  serverMode: ServerMode;

  /**
   * The port number to use for the dev (asset) server.
   */
  devServerPort: number;

  /**
   * The delay before the dev (asset) server broadcasts a reload event.
   */
  devServerBroadcastDelay: number;

  /**
   * Additional MDX remark / rehype plugins.
   */
  mdx?: RemixMdxConfig | RemixMdxConfigFunction;

  /**
   * The output format of the server build. Defaults to "cjs".
   */
  serverModuleFormat: "esm" | "cjs";
}

/**
 * Returns a fully resolved config object from the remix.config.js in the given
 * root directory.
 */
export async function readConfig(
  remixRoot?: string,
  serverMode = ServerMode.Production
): Promise<RemixConfig> {
  if (!remixRoot) {
    remixRoot = process.env.REMIX_ROOT || process.cwd();
  }

  if (!isValidServerMode(serverMode)) {
    throw new Error(`Invalid server mode "${serverMode}"`);
  }

  let rootDirectory = path.resolve(remixRoot);
  let configFile = path.resolve(rootDirectory, "remix.config.js");

  let appConfig: AppConfig;
  try {
    appConfig = require(configFile);
  } catch (error) {
    throw new Error(`Error loading Remix config in ${configFile}`);
  }

  let serverModuleFormat = appConfig.serverModuleFormat || "cjs";
  let mdx = appConfig.mdx;

  let appDirectory = path.resolve(
    rootDirectory,
    appConfig.appDirectory || "app"
  );

  let cacheDirectory = path.resolve(
    rootDirectory,
    appConfig.cacheDirectory || ".cache"
  );

  let entryClientFile = findEntry(appDirectory, "entry.client");
  if (!entryClientFile) {
    throw new Error(`Missing "entry.client" file in ${appDirectory}`);
  }

  let entryServerFile = findEntry(appDirectory, "entry.server");
  if (!entryServerFile) {
    throw new Error(`Missing "entry.server" file in ${appDirectory}`);
  }

  let serverBuildDirectory = path.resolve(
    rootDirectory,
    appConfig.serverBuildDirectory || "build"
  );

  let assetsBuildDirectory = path.resolve(
    rootDirectory,
    appConfig.assetsBuildDirectory ||
      appConfig.browserBuildDirectory ||
      path.join("public", "build")
  );

  let devServerPort = appConfig.devServerPort || 8002;
  let devServerBroadcastDelay = appConfig.devServerBroadcastDelay || 0;

  let publicPath = addTrailingSlash(appConfig.publicPath || "/build/");

  let rootRouteFile = findEntry(appDirectory, "root");
  if (!rootRouteFile) {
    throw new Error(`Missing "root" route file in ${appDirectory}`);
  }

  let routes: RouteManifest = {
    root: { path: "", id: "root", file: rootRouteFile }
  };
  if (fs.existsSync(path.resolve(appDirectory, "routes"))) {
    let conventionalRoutes = defineConventionalRoutes(appDirectory);
    for (let key of Object.keys(conventionalRoutes)) {
      let route = conventionalRoutes[key];
      routes[route.id] = { ...route, parentId: route.parentId || "root" };
    }
  }
  if (appConfig.routes) {
    let manualRoutes = await appConfig.routes(defineRoutes);
    for (let key of Object.keys(manualRoutes)) {
      let route = manualRoutes[key];
      routes[route.id] = { ...route, parentId: route.parentId || "root" };
    }
  }

  return {
    appDirectory,
    cacheDirectory,
    entryClientFile,
    entryServerFile,
    devServerPort,
    devServerBroadcastDelay,
    assetsBuildDirectory,
    publicPath,
    rootDirectory,
    routes,
    serverBuildDirectory,
    serverMode,
    serverModuleFormat,
    mdx
  };
}

function addTrailingSlash(path: string): string {
  return path.endsWith("/") ? path : path + "/";
}

const entryExts = [".js", ".jsx", ".ts", ".tsx"];

function findEntry(dir: string, basename: string): string | undefined {
  for (let ext of entryExts) {
    let file = path.resolve(dir, basename + ext);
    if (fs.existsSync(file)) return path.relative(dir, file);
  }

  return undefined;
}
