// We can only import types from vite-node at the top level since we're in a CJS
// context but want to use vite-node's ESM build since Vite 7+ is ESM only
import type { ViteNodeServer as ViteNodeServerType } from "vite-node/server";
import type { ViteNodeRunner as ViteNodeRunnerType } from "vite-node/client";
import type * as Vite from "vite";

import { preloadVite, getVite } from "./vite";
import { ssrExternals } from "./ssr-externals";

export type Context = {
  devServer: Vite.ViteDevServer;
  server: ViteNodeServerType;
  runner: ViteNodeRunnerType;
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

  // Ensure we're using the ESM build of vite-node since Vite 7+ is ESM only
  const [{ ViteNodeServer }, { ViteNodeRunner }, { installSourcemapsSupport }] =
    await Promise.all([
      import("vite-node/server"),
      import("vite-node/client"),
      import("vite-node/source-map"),
    ]);

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
      // configure this internal usage of vite-node.
      postcss: {},
    },
    configFile: false,
    envFile: false,
    plugins: [],
  });
  await devServer.pluginContainer.buildStart({});

  const server = new ViteNodeServer(devServer);

  installSourcemapsSupport({
    getSourceMap: (source) => server.getSourceMap(source),
  });

  const runner = new ViteNodeRunner({
    root: devServer.config.root,
    base: devServer.config.base,
    fetchModule(id) {
      return server.fetchModule(id);
    },
    resolveId(id, importer) {
      return server.resolveId(id, importer);
    },
  });

  return { devServer, server, runner };
}
