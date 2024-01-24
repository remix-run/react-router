import type * as Vite from "vite";
import path from "node:path";
import fse from "fs-extra";
import colors from "picocolors";

import {
  type RemixPluginContext,
  type BuildManifest,
  type ServerBundleBuildConfig,
  type ServerBundlesBuildManifest,
  configRouteToBranchRoute,
  getServerBuildDirectory,
} from "./plugin";
import type { ConfigRoute, RouteManifest } from "../config/routes";
import invariant from "../invariant";
import { preloadViteEsm } from "./import-vite-esm-sync";

async function resolveViteConfig({
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

  return viteConfig;
}

async function extractRemixPluginContext(viteConfig: Vite.ResolvedConfig) {
  let ctx = viteConfig["__remixPluginContext" as keyof typeof viteConfig] as
    | RemixPluginContext
    | undefined;

  if (!ctx) {
    console.error(colors.red("Remix Vite plugin not found in Vite config"));
    process.exit(1);
  }

  return ctx;
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

type RemixViteClientBuildArgs = {
  ssr: false;
  serverBundleBuildConfig?: never;
};

type RemixViteServerBuildArgs = {
  ssr: true;
  serverBundleBuildConfig?: ServerBundleBuildConfig;
};

type RemixViteBuildArgs = RemixViteClientBuildArgs | RemixViteServerBuildArgs;

async function getServerBuilds(ctx: RemixPluginContext): Promise<{
  serverBuilds: RemixViteServerBuildArgs[];
  buildManifest: BuildManifest;
}> {
  let { rootDirectory } = ctx;
  // eslint-disable-next-line prefer-let/prefer-let -- Improve type narrowing
  const { routes, serverBuildFile, serverBundles, appDirectory } =
    ctx.remixConfig;
  let serverBuildDirectory = getServerBuildDirectory(ctx);
  if (!serverBundles) {
    return {
      serverBuilds: [{ ssr: true }],
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

  let serverBundleBuildConfigById = new Map<string, ServerBundleBuildConfig>();

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
        throw new Error(
          `The "unstable_serverBundles" function must return a string`
        );
      }
      buildManifest.routeIdToServerBundleId[route.id] = serverBundleId;

      let relativeServerBundleDirectory = path.relative(
        rootDirectory,
        path.join(serverBuildDirectory, serverBundleId)
      );
      let serverBuildConfig = serverBundleBuildConfigById.get(serverBundleId);
      if (!serverBuildConfig) {
        buildManifest.serverBundles[serverBundleId] = {
          id: serverBundleId,
          file: normalizePath(
            path.join(relativeServerBundleDirectory, serverBuildFile)
          ),
        };
        serverBuildConfig = {
          routes: {},
          serverBundleId,
        };
        serverBundleBuildConfigById.set(serverBundleId, serverBuildConfig);
      }
      for (let route of branch) {
        serverBuildConfig.routes[route.id] = route;
      }
    })
  );

  let serverBuilds = Array.from(serverBundleBuildConfigById.values()).map(
    (serverBundleBuildConfig): RemixViteServerBuildArgs => {
      let serverBuild: RemixViteServerBuildArgs = {
        ssr: true,
        serverBundleBuildConfig,
      };
      return serverBuild;
    }
  );

  return {
    serverBuilds,
    buildManifest,
  };
}

async function cleanServerBuildDirectory(
  viteConfig: Vite.ResolvedConfig,
  ctx: RemixPluginContext
) {
  let serverBuildDirectory = getServerBuildDirectory(ctx);
  let isWithinRoot = () => {
    let relativePath = path.relative(ctx.rootDirectory, serverBuildDirectory);
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

  let viteConfig = await resolveViteConfig({ configFile, mode, root });
  let ctx = await extractRemixPluginContext(viteConfig);
  let { remixConfig } = ctx;

  let vite = await import("vite");

  async function viteBuild({
    ssr,
    serverBundleBuildConfig,
  }: RemixViteBuildArgs) {
    await vite.build({
      root,
      mode,
      configFile,
      build: { assetsInlineLimit, emptyOutDir, minify, ssr },
      optimizeDeps: { force },
      clearScreen,
      logLevel,
      ...(serverBundleBuildConfig
        ? { __remixServerBundleBuildConfig: serverBundleBuildConfig }
        : {}),
    });
  }

  // Since we're potentially running multiple Vite server builds with different
  // output directories, we need to clean the root server build directory
  // ourselves rather than relying on Vite to do it, otherwise you can end up
  // with stale server bundle directories in your build output
  await cleanServerBuildDirectory(viteConfig, ctx);

  // Run the Vite client build first
  await viteBuild({ ssr: false });

  // Then run Vite SSR builds in parallel
  let { serverBuilds, buildManifest } = await getServerBuilds(ctx);

  await Promise.all(serverBuilds.map(viteBuild));

  if (ctx.remixConfig.manifest) {
    await fse.writeFile(
      path.join(ctx.remixConfig.buildDirectory, "manifest.json"),
      JSON.stringify(buildManifest, null, 2),
      "utf-8"
    );
  }

  let { buildDirectory, serverBuildFile, ssr } = remixConfig;

  await remixConfig.adapter?.buildEnd?.({
    buildManifest,
    remixConfig: {
      buildDirectory,
      serverBuildFile,
      unstable_ssr: ssr,
    },
  });
}
