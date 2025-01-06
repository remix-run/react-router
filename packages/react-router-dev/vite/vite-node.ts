import { ViteNodeServer } from "vite-node/server";
import { ViteNodeRunner } from "vite-node/client";
import { installSourcemapsSupport } from "vite-node/source-map";
import type * as Vite from "vite";

import { preloadVite, getVite } from "./vite";

export type Context = {
  devServer: Vite.ViteDevServer;
  server: ViteNodeServer;
  runner: ViteNodeRunner;
};

export async function createContext(
  viteConfig: Vite.InlineConfig = {}
): Promise<Context> {
  await preloadVite();
  const vite = getVite();

  const devServer = await vite.createServer(
    vite.mergeConfig(
      {
        server: {
          preTransformRequests: false,
          hmr: false,
        },
        optimizeDeps: {
          noDiscovery: true,
        },
        configFile: false,
        envFile: false,
        plugins: [],
      },
      viteConfig
    )
  );
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
