import type * as Vite from "vite";
import path from "node:path";
import fse from "fs-extra";
import colors from "picocolors";

import {
  type ReactRouterPluginContext,
  type ReactRouterPluginBuildContext,
  type ReactRouterPluginBuildEnvironments,
  resolveViteConfig,
  extractPluginContext,
  getClientBuildDirectory,
  getServerBuildDirectory,
  virtual,
} from "./plugin";
import {
  type BuildManifest,
  type ServerBundlesBuildManifest,
  configRouteToBranchRoute,
} from "../config/config";
import type { RouteManifestEntry, RouteManifest } from "../config/routes";
import invariant from "../invariant";
import { preloadVite, getVite } from "./vite";

function getAddressableRoutes(routes: RouteManifest): RouteManifestEntry[] {
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
  let branch: RouteManifestEntry[] = [];
  let currentRouteId: string | undefined = routeId;

  while (currentRouteId) {
    let route: RouteManifestEntry = routes[currentRouteId];
    invariant(route, `Missing route for ${currentRouteId}`);
    branch.push(route);
    currentRouteId = route.parentId;
  }

  return branch.reverse();
}

async function getBuildContext(ctx: ReactRouterPluginContext): Promise<{
  environments: ReactRouterPluginBuildEnvironments;
  buildManifest: BuildManifest;
}> {
  let { rootDirectory } = ctx;
  const { routes, serverBuildFile, serverBundles, appDirectory } =
    ctx.reactRouterConfig;
  let serverBuildDirectory = getServerBuildDirectory(ctx);

  let environments: ReactRouterPluginBuildEnvironments = {
    client: {
      build: {
        outDir: getClientBuildDirectory(ctx.reactRouterConfig),
      },
    },
  };

  if (!serverBundles) {
    environments.ssr = {
      build: {
        outDir: getServerBuildDirectory(ctx),
        rollupOptions: {
          input: virtual.serverBuild.id,
        },
      },
    };

    return {
      environments,
      buildManifest: { routes },
    };
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

  let buildManifest: ServerBundlesBuildManifest = {
    serverBundles: {},
    routeIdToServerBundleId: {},
    routes: rootRelativeRoutes,
  };

  let routesByServerBundleId: Record<string, RouteManifest> = {};

  await Promise.all(
    getAddressableRoutes(routes).map(async (route) => {
      let branch = getRouteBranch(routes, route.id);
      let serverBundleId = await serverBundles({
        branch: branch.map((route) =>
          configRouteToBranchRoute({
            ...route,
            // Ensure absolute paths are passed to the serverBundles function
            file: path.join(resolvedAppDirectory, route.file),
          })
        ),
      });
      if (typeof serverBundleId !== "string") {
        throw new Error(`The "serverBundles" function must return a string`);
      }
      if (!/^[a-zA-Z0-9-_]+$/.test(serverBundleId)) {
        throw new Error(
          `The "serverBundles" function must only return strings containing alphanumeric characters, hyphens and underscores.`
        );
      }
      buildManifest.routeIdToServerBundleId[route.id] = serverBundleId;

      buildManifest.serverBundles[serverBundleId] ??= {
        id: serverBundleId,
        file: normalizePath(
          path.join(
            path.relative(
              rootDirectory,
              path.join(serverBuildDirectory, serverBundleId)
            ),
            serverBuildFile
          )
        ),
      };

      routesByServerBundleId[serverBundleId] ??= {};
      for (let route of branch) {
        routesByServerBundleId[serverBundleId][route.id] = route;
      }
    })
  );

  for (let [serverBundleId, routes] of Object.entries(routesByServerBundleId)) {
    environments[`server-bundle-${serverBundleId}`] = {
      build: {
        outDir: getServerBuildDirectory(ctx, { serverBundleId }),
        rollupOptions: {
          input: `${virtual.serverBuild.id}?route-ids=${Object.keys(
            routes
          ).join(",")}`,
        },
      },
    };
  }

  return {
    environments,
    buildManifest,
  };
}

async function cleanBuildDirectory(
  viteConfig: Vite.ResolvedConfig,
  ctx: ReactRouterPluginContext
) {
  let buildDirectory = ctx.reactRouterConfig.buildDirectory;
  let isWithinRoot = () => {
    let relativePath = path.relative(ctx.rootDirectory, buildDirectory);
    return !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
  };

  if (viteConfig.build.emptyOutDir ?? isWithinRoot()) {
    await fse.remove(buildDirectory);
  }
}

function getViteManifestPaths(
  environments: ReactRouterPluginBuildEnvironments
) {
  return Object.values(environments).map((options) => {
    invariant(options, "Expected build environment options");
    let outDir = options.build.outDir;
    invariant(outDir, "Expected build.outDir for build environment");
    return path.join(outDir, ".vite/manifest.json");
  });
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
  sourcemapClient?: boolean | "inline" | "hidden";
  sourcemapServer?: boolean | "inline" | "hidden";
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
    sourcemapClient,
    sourcemapServer,
  }: ViteBuildOptions
) {
  // Ensure Vite's ESM build is preloaded at the start of the process
  // so it can be accessed synchronously via `getVite`
  await preloadVite();

  let viteConfig = await resolveViteConfig({ configFile, mode, root });

  const ctx = await extractPluginContext(viteConfig);

  if (!ctx) {
    console.error(
      colors.red("React Router Vite plugin not found in Vite config")
    );
    process.exit(1);
  }

  let { reactRouterConfig } = ctx;

  let vite = getVite();

  async function viteBuild(
    environments: ReactRouterPluginBuildEnvironments,
    environmentName: keyof ReactRouterPluginBuildEnvironments
  ) {
    let ssr = environmentName !== "client";

    let envionmentOptions = environments[environmentName];
    invariant(
      envionmentOptions,
      `Missing environment options for ${environmentName}`
    );

    let buildContext: ReactRouterPluginBuildContext = {
      name: environmentName,
      options: envionmentOptions,
    };

    await vite.build({
      root,
      mode,
      configFile,
      build: {
        assetsInlineLimit,
        emptyOutDir,
        minify,
        ssr,
        sourcemap: ssr ? sourcemapServer : sourcemapClient,
      },
      optimizeDeps: { force },
      clearScreen,
      logLevel,
      ...{ __reactRouterBuildContext: buildContext },
    });
  }

  await cleanBuildDirectory(viteConfig, ctx);

  let { environments, buildManifest } = await getBuildContext(ctx);

  // Run the Vite client build first
  await viteBuild(environments, "client");

  // Then run Vite SSR builds in parallel
  let serverEnvironmentNames = Object.keys(environments).filter(
    (environmentName) => environmentName !== "client"
  );
  await Promise.all(
    serverEnvironmentNames.map((environmentName) =>
      viteBuild(
        environments,
        environmentName as keyof ReactRouterPluginBuildEnvironments
      )
    )
  );

  let viteManifestPaths = getViteManifestPaths(environments);
  await Promise.all(
    viteManifestPaths.map(async (viteManifestPath) => {
      let manifestExists = await fse.pathExists(viteManifestPath);
      if (!manifestExists) return;

      // Delete original Vite manifest file if consumer doesn't want it
      if (!ctx.viteManifestEnabled) {
        await fse.remove(viteManifestPath);
      }

      // Remove .vite dir if it's now empty
      let viteDir = path.dirname(viteManifestPath);
      let viteDirFiles = await fse.readdir(viteDir);
      if (viteDirFiles.length === 0) {
        await fse.remove(viteDir);
      }
    })
  );

  await reactRouterConfig.buildEnd?.({
    buildManifest,
    reactRouterConfig,
    viteConfig,
  });
}
