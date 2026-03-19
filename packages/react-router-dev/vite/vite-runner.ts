import type * as Vite from "vite";

import { preloadVite, getVite } from "./vite";
import { ssrExternals } from "./ssr-externals";

export type Context = {
  server: Vite.ViteDevServer;
  env: Vite.RunnableDevEnvironment;
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

  const server = await vite.createServer({
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
      // configure this internal usage of vite.
      postcss: {},
    },
    configFile: false,
    envFile: false,
    plugins: [],
    appType: "custom",
    environments: {
      nodeRunnerEnv: {},
    },
  });
  await server.pluginContainer.buildStart({});

  const env = server.environments.nodeRunnerEnv;
  if (!env || !vite.isRunnableDevEnvironment(env)) {
    throw new Error("Vite environment is not runnable.");
  }

  return { server, env };
}
