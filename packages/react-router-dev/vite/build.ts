import type * as Vite from "vite";
import path from "node:path";
import fse from "fs-extra";
import colors from "picocolors";

import {
  type ReactRouterPluginContext,
  type ServerBundleBuildConfig,
  resolveViteConfig,
  extractPluginContext,
  getServerBuildDirectory,
} from "./plugin";
import {
  type BuildManifest,
  type ServerBundlesBuildManifest,
  configRouteToBranchRoute,
} from "../config/config";
import type { RouteManifestEntry, RouteManifest } from "../config/routes";
import invariant from "../invariant";
import { preloadViteEsm } from "./import-vite-esm-sync";

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
  const branch: RouteManifestEntry[] = [];
  let currentRouteId: string | undefined = routeId;

  while (currentRouteId) {
    const route: RouteManifestEntry = routes[currentRouteId];
    invariant(route, `Missing route for ${currentRouteId}`);
    branch.push(route);
    currentRouteId = route.parentId;
  }

  return branch.reverse();
}

type ReactRouterClientBuildArgs = {
  ssr: false;
  serverBundleBuildConfig?: never | undefined;
};

type ReactRouterServerBuildArgs = {
  ssr: true;
  serverBundleBuildConfig?: ServerBundleBuildConfig | undefined;
};

type ReactRouterBuildArgs =
  | ReactRouterClientBuildArgs
  | ReactRouterServerBuildArgs;

async function getServerBuilds(ctx: ReactRouterPluginContext): Promise<{
  serverBuilds: ReactRouterServerBuildArgs[];
  buildManifest: BuildManifest;
}> {
  let { rootDirectory } = ctx;
  const { routes, serverBuildFile, serverBundles, appDirectory } =
    ctx.reactRouterConfig;
  const serverBuildDirectory = getServerBuildDirectory(ctx);
  if (!serverBundles) {
    return {
      serverBuilds: [{ ssr: true }],
      buildManifest: { routes },
    };
  }

  let { normalizePath } = await import("vite");

  const resolvedAppDirectory = path.resolve(rootDirectory, appDirectory);
  const rootRelativeRoutes = Object.fromEntries(
    Object.entries(routes).map(([id, route]) => {
      const filePath = path.join(resolvedAppDirectory, route.file);
      const rootRelativeFilePath = normalizePath(
        path.relative(rootDirectory, filePath)
      );
      return [id, { ...route, file: rootRelativeFilePath }];
    })
  );

  const buildManifest: ServerBundlesBuildManifest = {
    serverBundles: {},
    routeIdToServerBundleId: {},
    routes: rootRelativeRoutes,
  };

  const serverBundleBuildConfigById = new Map<
    string,
    ServerBundleBuildConfig
  >();

  await Promise.all(
    getAddressableRoutes(routes).map(async (route) => {
      const branch = getRouteBranch(routes, route.id);
      const serverBundleId = await serverBundles({
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

      const relativeServerBundleDirectory = path.relative(
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

  const serverBuilds = Array.from(serverBundleBuildConfigById.values()).map(
    (serverBundleBuildConfig): ReactRouterServerBuildArgs => {
      const serverBuild: ReactRouterServerBuildArgs = {
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

async function cleanBuildDirectory(
  viteConfig: Vite.ResolvedConfig,
  ctx: ReactRouterPluginContext
) {
  const buildDirectory = ctx.reactRouterConfig.buildDirectory;
  const isWithinRoot = () => {
    const relativePath = path.relative(ctx.rootDirectory, buildDirectory);
    return !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
  };

  if (viteConfig.build.emptyOutDir ?? isWithinRoot()) {
    await fse.remove(buildDirectory);
  }
}

function getViteManifestPaths(
  ctx: ReactRouterPluginContext,
  serverBuilds: Array<ReactRouterServerBuildArgs>
) {
  let buildRelative = (pathname: string) =>
    path.resolve(ctx.reactRouterConfig.buildDirectory, pathname);

  let viteManifestPaths: Array<string> = [
    "client/.vite/manifest.json",
    ...serverBuilds.map(({ serverBundleBuildConfig }) => {
      let serverBundleId = serverBundleBuildConfig?.serverBundleId;
      let serverBundlePath = serverBundleId ? serverBundleId + "/" : "";
      return `server/${serverBundlePath}.vite/manifest.json`;
    }),
  ].map((srcPath) => buildRelative(srcPath));

  return viteManifestPaths;
}

export interface ViteBuildOptions {
  assetsInlineLimit?: number | undefined;
  clearScreen?: boolean | undefined;
  config?: string | undefined;
  emptyOutDir?: boolean | undefined;
  force?: boolean | undefined;
  logLevel?: Vite.LogLevel | undefined;
  minify?: Vite.BuildOptions["minify"] | undefined;
  mode?: string | undefined;
  profile?: boolean | undefined;
  sourcemapClient?: boolean | "inline" | "hidden" | undefined;
  sourcemapServer?: boolean | "inline" | "hidden" | undefined;
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
  // so it can be accessed synchronously via `importViteEsmSync`
  await preloadViteEsm();

  let viteConfig = await resolveViteConfig({ configFile, mode, root });

  const ctx = await extractPluginContext(viteConfig);

  if (!ctx) {
    console.error(
      colors.red("React Router Vite plugin not found in Vite config")
    );
    process.exit(1);
  }

  let { reactRouterConfig } = ctx;

  const vite = await import("vite");

  async function viteBuild({
    ssr,
    serverBundleBuildConfig,
  }: ReactRouterBuildArgs) {
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
      ...(serverBundleBuildConfig
        ? { __reactRouterServerBundleBuildConfig: serverBundleBuildConfig }
        : {}),
    });
  }

  await cleanBuildDirectory(viteConfig, ctx);

  // Run the Vite client build first
  await viteBuild({ ssr: false });

  // Then run Vite SSR builds in parallel
  let { serverBuilds, buildManifest } = await getServerBuilds(ctx);
  await Promise.all(serverBuilds.map(viteBuild));

  const viteManifestPaths = getViteManifestPaths(ctx, serverBuilds);
  await Promise.all(
    viteManifestPaths.map(async (viteManifestPath) => {
      const manifestExists = await fse.pathExists(viteManifestPath);
      if (!manifestExists) return;

      // Delete original Vite manifest file if consumer doesn't want it
      if (!ctx.viteManifestEnabled) {
        await fse.remove(viteManifestPath);
      }

      // Remove .vite dir if it's now empty
      const viteDir = path.dirname(viteManifestPath);
      const viteDirFiles = await fse.readdir(viteDir);
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
