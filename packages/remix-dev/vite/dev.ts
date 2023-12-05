import type * as Vite from "vite";
import colors from "picocolors";

export interface ViteDevOptions {
  clearScreen?: boolean;
  config?: string;
  cors?: boolean;
  force?: boolean;
  host?: boolean | string;
  logLevel?: Vite.LogLevel;
  mode?: string;
  open?: boolean | string;
  port?: number;
  strictPort?: boolean;
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
  let vite = await import("vite");
  let server = await vite.createServer({
    root,
    mode,
    configFile,
    server: { open, cors, host, port, strictPort },
    optimizeDeps: { force },
    clearScreen,
    logLevel,
  });

  if (!server.config.plugins.find((plugin) => plugin.name === "remix")) {
    console.error(colors.red("Remix Vite plugin not found in Vite config"));
    process.exit(1);
  }

  await server.listen();
  server.printUrls();
  server.bindCLIShortcuts({ print: true });
}
