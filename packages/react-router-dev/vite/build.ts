import * as Vite from "vite";

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

  let builder = await Vite.createBuilder({
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
  await builder.buildApp();
}
