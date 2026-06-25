import type * as Vite from "vite";

import { preloadVite, getVite } from "./vite";
import { ssrExternals } from "./ssr-externals";

export type Context = {
  devServer: Vite.ViteDevServer;
  environment: Vite.RunnableDevEnvironment;
  runner: Vite.RunnableDevEnvironment["runner"];
};

export async function createContext({
  root,
  mode,
  customLogger,
}: {
  root: Vite.UserConfig["root"];
  mode: Vite.ConfigEnv["mode"];
  customLogger: Vite.UserConfig["customLogger"];
}): Promise<Context> {
  await preloadVite();
  const vite = getVite();

  const devServer = await vite.createServer({
    root,
    mode,
    customLogger,
    server: {
      preTransformRequests: false,
      hmr: false,
      watch: null,
    },
    ssr: {
      external: ssrExternals,
    },
    optimizeDeps: {
      noDiscovery: true,
    },
    css: {
      // This empty PostCSS config object prevents the PostCSS config file from
      // being loaded. We don't need it in a React Router config context, and
      // there's also an issue in Vite 5 when using a .ts PostCSS config file in
      // an ESM project: https://github.com/vitejs/vite/issues/15869. Consumers
      // can work around this in their own Vite config file, but they can't
      // configure this internal usage of Vite's module runner.
      postcss: {},
    },
    configFile: false,
    envDir: false,
    plugins: [],
    environments: {
      __config_loader: {
        consumer: "server",
        dev: {
          createEnvironment: (name, config, context) =>
            vite.createRunnableDevEnvironment(name, config),
        },
      },
    },
  });

  const environment = devServer.environments.__config_loader;

  if (!vite.isRunnableDevEnvironment(environment)) {
    await devServer.close();
    throw new Error(
      "React Router config loading requires Vite's __config_loader environment to be runnable.",
    );
  }

  return { devServer, environment, runner: environment.runner };
}
