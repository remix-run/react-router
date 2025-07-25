import type * as Vite from "vite";
import rsc, { type RscPluginOptions } from "@vitejs/plugin-rsc";
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

export function reactRouterRSCVitePlugin(): Vite.PluginOption[] {
  let configLoader: ConfigLoader;
  let config: ResolvedReactRouterConfig;
  let typegenWatcherPromise: Promise<Typegen.Watcher> | undefined;

  return [
    {
      name: "react-router/rsc/config",
      async config(viteUserConfig, { command, mode }) {
        await initEsModuleLexer;
        const rootDirectory = getRootDirectory(viteUserConfig);
        const watch = command === "serve";

        configLoader = await createConfigLoader({ rootDirectory, mode, watch });

        const configResult = await configLoader.getConfig();
        if (!configResult.ok) throw new Error(configResult.error);
        config = configResult.value;

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
      },
    },
    {
      name: "react-router/rsc/typegen",
      async config(viteUserConfig, { command, mode }) {
        if (command === "serve") {
          const vite = await import("vite");
          typegenWatcherPromise = Typegen.watch(
            getRootDirectory(viteUserConfig),
            {
              mode,
              // ignore `info` logs from typegen since they are
              // redundant when Vite plugin logs are active
              logger: vite.createLogger("warn", {
                prefix: "[react-router]",
              }),
            },
          );
        }
      },
      async buildEnd() {
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
    rsc({ entries: getRscEntries() }),
  ];
}

const virtual = {
  routeConfig: create("unstable_rsc/routes"),
};

function getRootDirectory(viteUserConfig: Vite.UserConfig) {
  return viteUserConfig.root ?? process.env.REACT_ROUTER_ROOT ?? process.cwd();
}

function getRscEntries(): NonNullable<RscPluginOptions["entries"]> {
  const entriesDir = join(
    getDevPackageRoot(),
    "dist",
    "config",
    "default-rsc-entries",
  );
  return {
    client: join(entriesDir, "entry.client.tsx"),
    rsc: join(entriesDir, "entry.rsc.tsx"),
    ssr: join(entriesDir, "entry.ssr.tsx"),
  };
}

function getDevPackageRoot(): string {
  const currentDir = dirname(__dirname);
  let dir = currentDir;
  while (dir !== dirname(dir)) {
    try {
      const packageJsonPath = join(dir, "package.json");
      readFileSync(packageJsonPath, "utf-8");
      return dir;
    } catch {
      dir = dirname(dir);
    }
  }
  throw new Error("Could not find package.json");
}
