import type { PluginOption } from "vite";
import rsc from "@vitejs/plugin-rsc";
import react from "@vitejs/plugin-react";
import { init as initEsModuleLexer } from "es-module-lexer";

import { create } from "../virtual-module";
import * as Typegen from "../../typegen";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import {
  type ConfigLoader,
  type ResolvedReactRouterConfig,
  createConfigLoader,
} from "../../config/config";
import { createVirtualRouteConfigCode } from "./virtual-route-config";
import { transformVirtualRouteModules } from "./virtual-route-modules";

const virtual = {
  routeConfig: create("unstable_rsc/routes"),
};

function getEntriesDir(): string {
  const currentDir = dirname(__dirname);
  let dir = currentDir;
  while (dir !== dirname(dir)) {
    try {
      const packageJsonPath = join(dir, "package.json");
      readFileSync(packageJsonPath, "utf-8");
      return join(dir, "dist", "config", "default-rsc-entries");
    } catch {
      dir = dirname(dir);
    }
  }
  throw new Error("Could not find package.json");
}

export async function reactRouterRSCVitePlugin(): Promise<PluginOption[]> {
  // TODO: support custom entries
  const entriesDir = getEntriesDir();
  const clientEntryPath = join(entriesDir, "entry.client.tsx");
  const rscEntryPath = join(entriesDir, "entry.rsc.tsx");
  const ssrEntryPath = join(entriesDir, "entry.ssr.tsx");

  let rootDirectory: string;
  let configLoader: ConfigLoader;
  let typegenWatcherPromise: Promise<Typegen.Watcher> | undefined;
  let config: ResolvedReactRouterConfig;

  return [
    {
      name: "react-router/rsc/config",
      config: async (viteUserConfig, { command, mode }) => {
        await initEsModuleLexer;

        rootDirectory =
          viteUserConfig.root ?? process.env.REACT_ROUTER_ROOT ?? process.cwd();
        configLoader = await createConfigLoader({
          rootDirectory,
          mode,
          watch: command === "serve",
        });
        const configResult = await configLoader.getConfig();
        if (!configResult.ok) {
          throw new Error(configResult.error);
        }
        config = configResult.value;

        if (command === "serve") {
          const vite = await import("vite");
          typegenWatcherPromise = Typegen.watch(rootDirectory, {
            mode,
            // ignore `info` logs from typegen since they are redundant when
            // Vite plugin logs are active
            logger: vite.createLogger("warn", {
              prefix: "[react-router]",
            }),
          });
        }
        return {
          environments: {
            client: { build: { outDir: "build/client" } },
            rsc: { build: { outDir: "build/server" } },
            ssr: { build: { outDir: "build/server/__ssr_build" } },
          },
        };
      },
      async buildEnd() {
        await configLoader.close();
        (await typegenWatcherPromise)?.close();
      },
    },
    {
      name: "react-router/rsc/virtual-route-config",
      resolveId(id) {
        if (id === virtual.routeConfig.id) {
          return virtual.routeConfig.resolvedId;
        }
      },
      load(id) {
        if (id === virtual.routeConfig.resolvedId) {
          return createVirtualRouteConfigCode({
            appDirectory: config.appDirectory,
            routeConfig: config.unstable_routeConfig,
          });
        }
      },
    },
    {
      name: "react-router/rsc/virtual-route-modules",
      transform(code, id) {
        return transformVirtualRouteModules({ code, id });
      },
    },
    react(),
    rsc({
      entries: {
        client: clientEntryPath,
        rsc: rscEntryPath,
        ssr: ssrEntryPath,
      },
    }),
  ];
}
