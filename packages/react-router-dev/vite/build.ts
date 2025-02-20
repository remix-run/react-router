import type * as Vite from "vite";
import colors from "picocolors";

import { loadConfig } from "../config/config";
import {
  type EnvironmentName,
  type EnvironmentBuildContext,
  resolveViteConfig,
  extractPluginContext,
  cleanBuildDirectory,
  cleanViteManifests,
  getBuildManifest,
  getEnvironmentOptionsResolvers,
  resolveEnvironmentsOptions,
  getServerEnvironmentKeys,
} from "./plugin";
import invariant from "../invariant";
import { preloadVite, getVite } from "./vite";
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

export async function build(root: string, viteBuildOptions: ViteBuildOptions) {
  // Ensure Vite's ESM build is preloaded at the start of the process
  // so it can be accessed synchronously via `getVite`
  await preloadVite();
  let vite = getVite();

  let configResult = await loadConfig({ rootDirectory: root });

  if (!configResult.ok) {
    throw new Error(configResult.error);
  }

  let config = configResult.value;
  let unstable_viteEnvironmentApi = config.future.unstable_viteEnvironmentApi;
  let viteMajor = parseInt(vite.version.split(".")[0], 10);

  if (unstable_viteEnvironmentApi && viteMajor === 5) {
    throw new Error(
      "The future.unstable_viteEnvironmentApi option is not supported in Vite 5"
    );
  }

  return await (unstable_viteEnvironmentApi
    ? viteAppBuild(root, viteBuildOptions)
    : viteBuild(root, viteBuildOptions));
}

async function viteAppBuild(
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
  let vite = getVite();
  let builder = await vite.createBuilder({
    root,
    mode,
    configFile,
    build: {
      assetsInlineLimit,
      emptyOutDir,
      minify,
    },
    optimizeDeps: { force },
    clearScreen,
    logLevel,
    plugins: [
      {
        name: "react-router:cli-config",
        configEnvironment(name) {
          if (sourcemapClient && name === "client") {
            return {
              build: {
                sourcemap: sourcemapClient,
              },
            };
          }
          if (sourcemapServer && name !== "client") {
            return {
              build: {
                sourcemap: sourcemapServer,
              },
            };
          }
        },
        configResolved(config) {
          let hasReactRouterPlugin = config.plugins.find(
            (plugin) => plugin.name === "react-router"
          );
          if (!hasReactRouterPlugin) {
            throw new Error(
              "React Router Vite plugin not found in Vite config"
            );
          }
        },
      },
    ],
  });
  await builder.buildApp();
}

async function viteBuild(
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
  let viteUserConfig: Vite.UserConfig = {};
  let viteConfig = await resolveViteConfig({
    configFile,
    mode,
    root,
    plugins: [
      {
        name: "react-router:extract-vite-user-config",
        config(config) {
          viteUserConfig = config;
        },
      },
    ],
  });
  let ctx = await extractPluginContext(viteConfig);

  if (!ctx) {
    console.error(
      colors.red("React Router Vite plugin not found in Vite config")
    );
    process.exit(1);
  }

  async function buildEnvironment(environmentName: EnvironmentName) {
    let vite = getVite();
    let ssr = environmentName !== "client";

    let resolveOptions = environmentOptionsResolvers[environmentName];
    invariant(resolveOptions);

    let environmentBuildContext: EnvironmentBuildContext = {
      name: environmentName,
      resolveOptions,
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
      ...{ __reactRouterEnvironmentBuildContext: environmentBuildContext },
    });
  }

  let { reactRouterConfig } = ctx;
  let buildManifest = await getBuildManifest(ctx);
  let environmentOptionsResolvers = await getEnvironmentOptionsResolvers(
    ctx,
    buildManifest,
    "build"
  );
  let environmentsOptions = resolveEnvironmentsOptions(
    environmentOptionsResolvers,
    { viteUserConfig }
  );

  await cleanBuildDirectory(viteConfig, ctx);

  // Run the Vite client build first
  await buildEnvironment("client");

  // Then run Vite SSR builds in parallel
  let serverEnvironmentNames = getServerEnvironmentKeys(
    environmentOptionsResolvers,
    buildManifest
  );

  await Promise.all(serverEnvironmentNames.map(buildEnvironment));

  await cleanViteManifests(environmentsOptions, ctx);

  await reactRouterConfig.buildEnd?.({
    buildManifest,
    reactRouterConfig,
    viteConfig,
  });
}
