import type * as Vite from "vite";
import { preloadVite, getVite } from "./vite";

export interface ReactRouterBuildContext {
  close: () => Promise<void>;
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

export async function build(root: string, viteBuildOptions: ViteBuildOptions) {
  // Ensure Vite's ESM build is preloaded at the start of the process
  // so it can be accessed synchronously via `getVite`
  await preloadVite();
  let {
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
  } = viteBuildOptions;

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
            (plugin) =>
              plugin.name === "react-router" ||
              plugin.name === "react-router/rsc",
          );
          if (!hasReactRouterPlugin) {
            throw new Error(
              "React Router Vite plugin not found in Vite config",
            );
          }
        },
      },
    ],
  });
  try {
    await builder.buildApp();
  } finally {
    // Vite stops running buildApp hooks on failure, so the plugin's final
    // cleanup hook may not run. The CLI owns this boundary and can always close.
    let { __reactRouterBuildContext: buildContext } =
      builder.config as Vite.ResolvedConfig & {
        __reactRouterBuildContext?: ReactRouterBuildContext;
      };
    await buildContext?.close();
  }
}
