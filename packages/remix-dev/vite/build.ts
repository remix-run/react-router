import type * as Vite from "vite";
import path from "node:path";
import fse from "fs-extra";
import colors from "picocolors";

import {
  type ResolvedVitePluginConfig,
  type ServerBuildConfig,
  type ServerBundlesManifest,
  configRouteToBranchRoute,
} from "./plugin";
import type { ConfigRoute, RouteManifest } from "../config/routes";
import invariant from "../invariant";
import { preloadViteEsm } from "./import-vite-esm-sync";

async function extractConfig({
  configFile,
  mode,
  root,
}: {
  configFile?: string;
  mode?: string;
  root: string;
}) {
  let vite = await import("vite");

  // Leverage the Vite config as a way to configure the entire multi-step build
  // process so we don't need to have a separate Remix config
  let viteConfig = await vite.resolveConfig(
    { mode, configFile, root },
    "build", // command
    "production", // default mode
    "production" // default NODE_ENV
  );

  let remixConfig = viteConfig[
    "__remixPluginResolvedConfig" as keyof typeof viteConfig
  ] as ResolvedVitePluginConfig | undefined;
  if (!remixConfig) {
    console.error(colors.red("Remix Vite plugin not found in Vite config"));
    process.exit(1);
  }

  return { remixConfig, viteConfig };
}

function getAddressableRoutes(routes: RouteManifest): ConfigRoute[] {
  let nonAddressableIds = new Set<string>();

  for (let id in routes) {
    let route = routes[id];

    // We omit the parent route of index routes since the index route takes ownership of its parent's path
    if (route.index) {
      invariant(
        route.parentId,
        `Expected index route "${route.id}" to have "parentId" set`
      );
      nonAddressableIds.add(route.parentId);
    }

    // We omit pathless routes since they can only be addressed via descendant routes
    if (typeof route.path !== "string" && !route.index) {
      nonAddressableIds.add(id);
    }
  }

  return Object.values(routes).filter(
    (route) => !nonAddressableIds.has(route.id)
  );
}

function getRouteBranch(routes: RouteManifest, routeId: string) {
  let branch: ConfigRoute[] = [];
  let currentRouteId: string | undefined = routeId;

  while (currentRouteId) {
    let route: ConfigRoute = routes[currentRouteId];
    invariant(route, `Missing route for ${currentRouteId}`);
    branch.push(route);
    currentRouteId = route.parentId;
  }

  return branch.reverse();
}

async function getServerBuilds({
  routes,
  serverBuildDirectory,
  serverBuildFile,
  serverBundles,
  rootDirectory,
  appDirectory,
}: ResolvedVitePluginConfig): Promise<{
  serverBuilds: ServerBuildConfig[];
  serverBundlesManifest?: ServerBundlesManifest;
}> {
  if (!serverBundles) {
    return { serverBuilds: [{ routes, serverBuildDirectory }] };
  }

  let { normalizePath } = await import("vite");

  let resolvedAppDirectory = path.resolve(rootDirectory, appDirectory);
  let rootRelativeRoutes = Object.fromEntries(
    Object.entries(routes).map(([id, route]) => {
      let filePath = path.join(resolvedAppDirectory, route.file);
      let rootRelativeFilePath = normalizePath(
        path.relative(rootDirectory, filePath)
      );
      return [id, { ...route, file: rootRelativeFilePath }];
    })
  );

  let serverBundlesManifest: ServerBundlesManifest = {
    serverBundles: {},
    routeIdToServerBundleId: {},
    routes: rootRelativeRoutes,
  };

  let serverBuildConfigByBundleId = new Map<string, ServerBuildConfig>();

  await Promise.all(
    getAddressableRoutes(routes).map(async (route) => {
      let branch = getRouteBranch(routes, route.id);
      let bundleId = await serverBundles({
        branch: branch.map((route) =>
          configRouteToBranchRoute({
            ...route,
            // Ensure absolute paths are passed to the serverBundles function
            file: path.join(resolvedAppDirectory, route.file),
          })
        ),
      });
      if (typeof bundleId !== "string") {
        throw new Error(
          `The "unstable_serverBundles" function must return a string`
        );
      }
      serverBundlesManifest.routeIdToServerBundleId[route.id] = bundleId;

      let serverBundleDirectory = path.join(serverBuildDirectory, bundleId);
      let serverBuildConfig = serverBuildConfigByBundleId.get(bundleId);
      if (!serverBuildConfig) {
        serverBundlesManifest.serverBundles[bundleId] = {
          id: bundleId,
          file: normalizePath(
            path.join(serverBundleDirectory, serverBuildFile)
          ),
        };
        serverBuildConfig = {
          routes: {},
          serverBuildDirectory: serverBundleDirectory,
        };
        serverBuildConfigByBundleId.set(bundleId, serverBuildConfig);
      }
      for (let route of branch) {
        serverBuildConfig.routes[route.id] = route;
      }
    })
  );

  return {
    serverBuilds: Array.from(serverBuildConfigByBundleId.values()),
    serverBundlesManifest,
  };
}

async function cleanServerBuildDirectory(
  viteConfig: Vite.ResolvedConfig,
  { rootDirectory, serverBuildDirectory }: ResolvedVitePluginConfig
) {
  let isWithinRoot = () => {
    let relativePath = path.relative(rootDirectory, serverBuildDirectory);
    return !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
  };

  if (viteConfig.build.emptyOutDir ?? isWithinRoot()) {
    await fse.remove(serverBuildDirectory);
  }
}

export interface ViteBuildOptions {
  assetsInlineLimit?: number;
  clearScreen?: boolean;
  config?: string;
  emptyOutDir?: boolean;
  force?: boolean;
  logLevel?: Vite.LogLevel;
  minify?: Vite.BuildOptions["minify"];
  mode?: string;
  profile?: boolean;
}

export async function build(
  root: string,
  {
    assetsInlineLimit,
    clearScreen,
    config: configFile,
    emptyOutDir,
    force,
    logLevel,
    minify,
    mode,
  }: ViteBuildOptions
) {
  // Ensure Vite's ESM build is preloaded at the start of the process
  // so it can be accessed synchronously via `importViteEsmSync`
  await preloadViteEsm();

  let { remixConfig, viteConfig } = await extractConfig({
    configFile,
    mode,
    root,
  });

  let vite = await import("vite");

  async function viteBuild(serverBuildConfig?: ServerBuildConfig) {
    let ssr = Boolean(serverBuildConfig);
    await vite.build({
      root,
      mode,
      configFile,
      build: { assetsInlineLimit, emptyOutDir, minify, ssr },
      optimizeDeps: { force },
      clearScreen,
      logLevel,
      ...(serverBuildConfig
        ? { __remixServerBuildConfig: serverBuildConfig }
        : {}),
    });
  }

  // Since we're potentially running multiple Vite server builds with different
  // output directories, we need to clean the root server build directory
  // ourselves rather than relying on Vite to do it, otherwise you can end up
  // with stale server bundle directories in your build output
  await cleanServerBuildDirectory(viteConfig, remixConfig);

  // Run the Vite client build first
  await viteBuild();

  // Then run Vite SSR builds in parallel
  let { serverBuilds, serverBundlesManifest } = await getServerBuilds(
    remixConfig
  );

  await Promise.all(serverBuilds.map(viteBuild));

  if (serverBundlesManifest) {
    await fse.writeFile(
      path.join(remixConfig.serverBuildDirectory, "bundles.json"),
      JSON.stringify(serverBundlesManifest, null, 2),
      "utf-8"
    );
  }

  let {
    isSpaMode,
    assetsBuildDirectory,
    serverBuildDirectory,
    serverBuildFile,
  } = remixConfig;

  // Should this already be absolute on the resolved config object?
  // In the meantime, we make it absolute before passing to adapter hooks
  serverBuildDirectory = path.resolve(root, serverBuildDirectory);

  await remixConfig.adapter?.buildEnd?.({
    // Since this is public API, these properties need to mirror the options
    // passed to the Remix plugin. This means we need to translate our internal
    // names back to their original public counterparts. It's probably worth
    // aligning these internally so we don't need this translation layer.
    assetsBuildDirectory,
    serverBuildDirectory,
    serverBuildFile,
    unstable_serverBundlesManifest: serverBundlesManifest,
    unstable_ssr: !isSpaMode,
  });
}
