import type * as Vite from "vite";
import colors from "picocolors";

import { preloadViteEsm } from "./import-vite-esm-sync";
import * as profiler from "./profiler";

export interface ViteDevOptions {
  clearScreen?: boolean | undefined;
  config?: string | undefined;
  cors?: boolean | undefined;
  force?: boolean | undefined;
  host?: boolean | string | undefined;
  logLevel?: Vite.LogLevel | undefined;
  mode?: string | undefined;
  open?: boolean | string | undefined;
  port?: number | undefined;
  strictPort?: boolean | undefined;
  profile?: boolean | undefined;
}

export async function dev(
  root: string,
  {
    clearScreen,
    config: configFile,
    cors,
    force,
    host,
    logLevel,
    mode,
    open,
    port,
    strictPort,
  }: ViteDevOptions
) {
  // Ensure Vite's ESM build is preloaded at the start of the process
  // so it can be accessed synchronously via `importViteEsmSync`
  await preloadViteEsm();

  const vite = await import("vite");
  const server = await vite.createServer({
    root,
    mode,
    configFile,
    server: { open, cors, host, port, strictPort },
    optimizeDeps: { force },
    clearScreen,
    logLevel,
  });

  if (!server.config.plugins.find((plugin) => plugin.name === "react-router")) {
    console.error(
      colors.red("React Router Vite plugin not found in Vite config")
    );
    process.exit(1);
  }

  await server.listen();
  server.printUrls();

  let customShortcuts: Vite.CLIShortcut<typeof server>[] = [
    {
      key: "p",
      description: "start/stop the profiler",
      async action(server) {
        if (profiler.getSession()) {
          await profiler.stop(server.config.logger.info);
        } else {
          await profiler.start(() => {
            server.config.logger.info("Profiler started");
          });
        }
      },
    },
  ];

  server.bindCLIShortcuts({ print: true, customShortcuts });
}
