import type * as Vite from "vite";
import path from "node:path";
import fse from "fs-extra";
import colors from "picocolors";

import {
  type ReactRouterPluginContext,
  type BuildContext,
  type BuildEnvironmentOptionsResolvers,
  resolveViteConfig,
  extractPluginContext,
  getBuildManifest,
  getEnvironmentResolvers,
} from "./plugin";
import invariant from "../invariant";
import { preloadVite, getVite } from "./vite";

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
  environmentResolvers: BuildEnvironmentOptionsResolvers
) {
  return Object.values(environmentResolvers).map((resolver) => {
    invariant(resolver, "Expected build environment resolver");
    let options = resolver({
      viteCommand: "build",
      viteUserConfig: {},
    });
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
    environmentResolvers: BuildEnvironmentOptionsResolvers,
    environmentName: keyof BuildEnvironmentOptionsResolvers
  ) {
    let ssr = environmentName !== "client";

    let environmentResolver = environmentResolvers[environmentName];
    invariant(
      environmentResolver,
      `Missing environment resolver for ${environmentName}`
    );

    let buildContext: BuildContext = {
      name: environmentName,
      resolveOptions: environmentResolver,
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

  let buildManifest = await getBuildManifest(ctx);
  let environmentResolvers = await getEnvironmentResolvers(ctx, buildManifest);

  // Run the Vite client build first
  await viteBuild(environmentResolvers, "client");

  // Then run Vite SSR builds in parallel
  let serverEnvironmentNames = Object.keys(environmentResolvers).filter(
    (environmentName) => environmentName !== "client"
  );
  await Promise.all(
    serverEnvironmentNames.map((environmentName) =>
      viteBuild(
        environmentResolvers,
        environmentName as keyof BuildEnvironmentOptionsResolvers
      )
    )
  );

  let viteManifestPaths = getViteManifestPaths(environmentResolvers);
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
