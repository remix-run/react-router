import type * as Vite from "vite";
import rsc, { type RscPluginOptions } from "@vitejs/plugin-rsc";
import { init as initEsModuleLexer } from "es-module-lexer";
import * as babel from "@babel/core";

import { create } from "../virtual-module";
import * as Typegen from "../../typegen";
import { readFileSync } from "fs";
import { readFile } from "fs/promises";
import path, { join, dirname } from "path";
import {
  type ConfigLoader,
  type ResolvedReactRouterConfig,
  createConfigLoader,
} from "../../config/config";
import { createVirtualRouteConfig } from "./virtual-route-config";
import {
  transformVirtualRouteModules,
  parseRouteExports,
  CLIENT_NON_COMPONENT_EXPORTS,
} from "./virtual-route-modules";

export function reactRouterRSCVitePlugin(): Vite.PluginOption[] {
  let configLoader: ConfigLoader;
  let config: ResolvedReactRouterConfig;
  let typegenWatcherPromise: Promise<Typegen.Watcher> | undefined;
  let viteCommand: Vite.ConfigEnv["command"];
  let routeIdByFile: Map<string, string> | undefined;

  return [
    {
      name: "react-router/rsc/config",
      async config(viteUserConfig, { command, mode }) {
        await initEsModuleLexer;
        viteCommand = command;
        const rootDirectory = getRootDirectory(viteUserConfig);
        const watch = command === "serve";

        configLoader = await createConfigLoader({ rootDirectory, mode, watch });

        const configResult = await configLoader.getConfig();
        if (!configResult.ok) throw new Error(configResult.error);
        config = configResult.value;

        return {
          esbuild: {
            jsx: "automatic",
          },
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
          const result = createVirtualRouteConfig({
            appDirectory: config.appDirectory,
            routeConfig: config.unstable_routeConfig,
          });
          routeIdByFile = result.routeIdByFile;
          return result.code;
        }
      },
    },
    {
      name: "react-router/rsc/virtual-route-modules",
      transform(code, id) {
        return transformVirtualRouteModules({ code, id });
      },
    },
    {
      name: "react-router/rsc/hmr/inject-runtime",
      enforce: "pre",
      resolveId(id) {
        if (id === virtual.injectHmrRuntime.id) {
          return virtual.injectHmrRuntime.resolvedId;
        }
      },
      async load(id) {
        if (id !== virtual.injectHmrRuntime.resolvedId) return;

        return [
          `import RefreshRuntime from "${virtual.hmrRuntime.id}"`,
          "RefreshRuntime.injectIntoGlobalHook(window)",
          "window.$RefreshReg$ = () => {}",
          "window.$RefreshSig$ = () => (type) => type",
          "window.__vite_plugin_react_preamble_installed__ = true",
        ].join("\n");
      },
    },
    {
      name: "react-router/rsc/hmr/runtime",
      enforce: "pre",
      resolveId(id) {
        if (id === virtual.hmrRuntime.id) return virtual.hmrRuntime.resolvedId;
      },
      async load(id) {
        if (id !== virtual.hmrRuntime.resolvedId) return;

        const reactRefreshDir = path.dirname(
          require.resolve("react-refresh/package.json"),
        );
        const reactRefreshRuntimePath = path.join(
          reactRefreshDir,
          "cjs/react-refresh-runtime.development.js",
        );

        return [
          "const exports = {}",
          await readFile(reactRefreshRuntimePath, "utf8"),
          await readFile(
            require.resolve("./static/rsc-refresh-utils.mjs"),
            "utf8",
          ),
          "export default exports",
        ].join("\n");
      },
    },
    {
      name: "react-router/rsc/hmr/react-refresh",
      async transform(code, id, options) {
        if (viteCommand !== "serve") return;
        if (id.includes("/node_modules/")) return;

        const filepath = id.split("?")[0];
        const extensionsRE = /\.(jsx?|tsx?|mdx?)$/;
        if (!extensionsRE.test(filepath)) return;

        const devRuntime = "react/jsx-dev-runtime";
        const ssr = options?.ssr === true;
        const isJSX = filepath.endsWith("x");
        const useFastRefresh = !ssr && (isJSX || code.includes(devRuntime));
        if (!useFastRefresh) return;

        const routeId = routeIdByFile?.get(filepath);
        if (routeId !== undefined) {
          return { code: addRefreshWrapper({ routeId, code, id }) };
        }

        const result = await babel.transformAsync(code, {
          babelrc: false,
          configFile: false,
          filename: id,
          sourceFileName: filepath,
          parserOpts: {
            sourceType: "module",
            allowAwaitOutsideFunction: true,
          },
          plugins: [[require("react-refresh/babel"), { skipEnvCheck: true }]],
          sourceMaps: true,
        });
        if (result === null) return;

        code = result.code!;
        const refreshContentRE = /\$Refresh(?:Reg|Sig)\$\(/;
        if (refreshContentRE.test(code)) {
          code = addRefreshWrapper({ code, id });
        }
        return { code, map: result.map };
      },
    },
    {
      name: "react-router/rsc/hmr/updates",
      async handleHotUpdate({ server, file, modules, read }) {
        const routeId = routeIdByFile?.get(file);

        if (routeId !== undefined) {
          const vite = await import("vite");

          const source = await read();

          const virtualRouteModuleCode = (
            await server.environments.rsc.pluginContainer.transform(
              source,
              `${vite.normalizePath(file)}?route-module`,
            )
          ).code;
          const { staticExports } = parseRouteExports(virtualRouteModuleCode);

          const virtualServerRouteModuleCode = (
            await server.environments.rsc.pluginContainer.transform(
              source,
              `${vite.normalizePath(file)}?server-route-module`,
            )
          ).code;
          const { isServerFirstRoute } = parseRouteExports(
            virtualServerRouteModuleCode,
          );

          const hasAction = staticExports.includes("action");
          const hasComponent = staticExports.includes("default");
          const hasErrorBoundary = staticExports.includes("ErrorBoundary");
          const hasLoader = staticExports.includes("loader");

          server.hot.send({
            type: "custom",
            event: "react-router:hmr",
            data: {
              routeId,
              isServerFirstRoute,
              hasAction,
              hasComponent,
              hasErrorBoundary,
              hasLoader,
            },
          });
        }

        return modules;
      },
    },
    // TODO: server-change-trigger-client-hmr?
    rsc({ entries: getRscEntries() }),
  ];
}

const virtual = {
  routeConfig: create("unstable_rsc/routes"),
  injectHmrRuntime: create("unstable_rsc/inject-hmr-runtime"),
  hmrRuntime: create("unstable_rsc/runtime"),
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

function addRefreshWrapper({
  routeId,
  code,
  id,
}: {
  routeId?: string;
  code: string;
  id: string;
}): string {
  const acceptExports =
    routeId !== undefined ? CLIENT_NON_COMPONENT_EXPORTS : [];
  return (
    REACT_REFRESH_HEADER.replaceAll("__SOURCE__", JSON.stringify(id)) +
    code +
    REACT_REFRESH_FOOTER.replaceAll("__SOURCE__", JSON.stringify(id))
      .replaceAll("__ACCEPT_EXPORTS__", JSON.stringify(acceptExports))
      .replaceAll("__ROUTE_ID__", JSON.stringify(routeId))
  );
}

const REACT_REFRESH_HEADER = `
import RefreshRuntime from "${virtual.hmrRuntime.id}";

const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
let prevRefreshReg;
let prevRefreshSig;

if (import.meta.hot && !inWebWorker) {
  if (!window.__vite_plugin_react_preamble_installed__) {
    throw new Error(
      "React Router Vite plugin can't detect preamble. Something is wrong."
    );
  }

  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    RefreshRuntime.register(type, __SOURCE__ + " " + id)
  };
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}`.replaceAll("\n", ""); // Header is all on one line so source maps aren't affected

const REACT_REFRESH_FOOTER = `
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh(__SOURCE__, currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      __ROUTE_ID__ && window.__reactRouterRouteModuleUpdates.set(__ROUTE_ID__, nextExports);
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate(currentExports, nextExports, __ACCEPT_EXPORTS__);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}`;
