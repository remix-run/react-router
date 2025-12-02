import type * as Vite from "vite";
import { init as initEsModuleLexer } from "es-module-lexer";
import * as Path from "pathe";
import * as babel from "@babel/core";
import colors from "picocolors";

import { create } from "../virtual-module";
import * as Typegen from "../../typegen";
import { readFileSync } from "fs";
import { readFile } from "fs/promises";
import path, { join, dirname } from "pathe";
import invariant from "../../invariant";
import {
  type ConfigLoader,
  type ResolvedReactRouterConfig,
  createConfigLoader,
} from "../../config/config";
import { preloadVite } from "../vite";
import { hasDependency } from "../has-dependency";
import { getOptimizeDepsEntries } from "../optimize-deps-entries";
import { createVirtualRouteConfig } from "./virtual-route-config";
import {
  transformVirtualRouteModules,
  parseRouteExports,
  isVirtualClientRouteModuleId,
  CLIENT_NON_COMPONENT_EXPORTS,
} from "./virtual-route-modules";
import { loadDotenv } from "../load-dotenv";
import { validatePluginOrder } from "../plugins/validate-plugin-order";
import { warnOnClientSourceMaps } from "../plugins/warn-on-client-source-maps";

export function reactRouterRSCVitePlugin(): Vite.PluginOption[] {
  let configLoader: ConfigLoader;
  let typegenWatcherPromise: Promise<Typegen.Watcher> | undefined;
  let viteCommand: Vite.ConfigEnv["command"];
  let resolvedViteConfig: Vite.ResolvedConfig;
  let routeIdByFile: Map<string, string> | undefined;
  let logger: Vite.Logger;

  const defaultEntries = getDefaultEntries();

  let config: ResolvedReactRouterConfig;
  let rootRouteFile: string;
  function updateConfig(newConfig: ResolvedReactRouterConfig) {
    config = newConfig;
    rootRouteFile = Path.resolve(
      newConfig.appDirectory,
      newConfig.routes.root.file,
    );
  }

  return [
    {
      name: "react-router/rsc",
      async config(viteUserConfig, { command, mode }) {
        await initEsModuleLexer;
        await preloadVite();

        viteCommand = command;
        const rootDirectory = getRootDirectory(viteUserConfig);
        const watch = command === "serve";

        await loadDotenv({
          rootDirectory,
          viteUserConfig,
          mode,
        });

        configLoader = await createConfigLoader({
          rootDirectory,
          mode,
          watch,
          validateConfig: (userConfig) => {
            let errors: string[] = [];
            if (userConfig.buildEnd) errors.push("buildEnd");
            if (userConfig.prerender) errors.push("prerender");
            if (userConfig.presets?.length) errors.push("presets");
            if (userConfig.routeDiscovery) errors.push("routeDiscovery");
            if (userConfig.serverBundles) errors.push("serverBundles");
            if (userConfig.ssr === false) errors.push("ssr: false");
            if (userConfig.future?.v8_middleware === false)
              errors.push("future.v8_middleware: false");
            if (userConfig.future?.v8_splitRouteModules)
              errors.push("future.v8_splitRouteModules");
            if (userConfig.future?.v8_viteEnvironmentApi === false)
              errors.push("future.v8_viteEnvironmentApi: false");
            if (userConfig.future?.unstable_subResourceIntegrity)
              errors.push("future.unstable_subResourceIntegrity");
            if (errors.length) {
              return `RSC Framework Mode does not currently support the following React Router config:\n${errors.map((x) => ` - ${x}`).join("\n")}\n`;
            }
          },
        });

        const configResult = await configLoader.getConfig();
        if (!configResult.ok) throw new Error(configResult.error);
        updateConfig(configResult.value);

        if (
          viteUserConfig.base &&
          config.basename !== "/" &&
          viteCommand === "serve" &&
          !viteUserConfig.server?.middlewareMode &&
          !config.basename.startsWith(viteUserConfig.base)
        ) {
          throw new Error(
            "When using the React Router `basename` and the Vite `base` config, " +
              "the `basename` config must begin with `base` for the default " +
              "Vite dev server.",
          );
        }

        const vite = await import("vite");
        logger = vite.createLogger(viteUserConfig.logLevel, {
          prefix: "[react-router]",
        });

        return {
          resolve: {
            dedupe: [
              // https://react.dev/warnings/invalid-hook-call-warning#duplicate-react
              "react",
              "react-dom",
              // Avoid router duplicates since mismatching routers cause `Error:
              // You must render this element inside a <Remix> element`.
              "react-router",
              "react-router/dom",
              ...(hasDependency({ name: "react-router-dom", rootDirectory })
                ? ["react-router-dom"]
                : []),
            ],
          },
          optimizeDeps: {
            entries: getOptimizeDepsEntries({
              entryClientFilePath: defaultEntries.client,
              reactRouterConfig: config,
            }),
            esbuildOptions: {
              jsx: "automatic",
            },
            include: [
              // Pre-bundle React dependencies to avoid React duplicates,
              // even if React dependencies are not direct dependencies.
              // https://react.dev/warnings/invalid-hook-call-warning#duplicate-react
              "react",
              "react/jsx-runtime",
              "react/jsx-dev-runtime",
              "react-dom",
              "react-dom/client",
              "react-router/internal/react-server-client",
            ],
          },
          esbuild: {
            jsx: "automatic",
            jsxDev: viteCommand !== "build",
          },
          environments: {
            client: {
              build: {
                rollupOptions: {
                  input: {
                    index: defaultEntries.client,
                  },
                },
                outDir: join(config.buildDirectory, "client"),
              },
              optimizeDeps: {
                include: [
                  "react-router > cookie",
                  "react-router > set-cookie-parser",
                ],
              },
            },
            rsc: {
              build: {
                rollupOptions: {
                  input: {
                    // We use a virtual entry here so that consumers can import
                    // it as `virtual:react-router/unstable_rsc/rsc-entry`
                    // without needing to know the actual file path, which is
                    // important when using the default entries.
                    index: defaultEntries.rsc,
                  },
                  output: {
                    entryFileNames: config.serverBuildFile,
                    format: config.serverModuleFormat,
                  },
                },
                outDir: join(config.buildDirectory, "server"),
              },
            },
            ssr: {
              build: {
                rollupOptions: {
                  input: {
                    index: defaultEntries.ssr,
                  },
                  output: {
                    // Note: We don't set `entryFileNames` here because it's
                    // considered private to the RSC environment build, and
                    // @vitejs/plugin-rsc currently breaks if it's set to
                    // something other than `index.js`.
                    format: config.serverModuleFormat,
                  },
                },
                outDir: join(config.buildDirectory, "server/__ssr_build"),
              },
            },
          },
          build: {
            rollupOptions: {
              // Copied from https://github.com/vitejs/vite-plugin-react/blob/c602225271d4acf462ba00f8d6d8a2e42492c5cd/packages/common/warning.ts
              onwarn(warning, defaultHandler) {
                if (
                  warning.code === "MODULE_LEVEL_DIRECTIVE" &&
                  (warning.message.includes("use client") ||
                    warning.message.includes("use server"))
                ) {
                  return;
                }
                // https://github.com/vitejs/vite/issues/15012
                if (
                  warning.code === "SOURCEMAP_ERROR" &&
                  warning.message.includes("resolve original location") &&
                  warning.pos === 0
                ) {
                  return;
                }
                if (viteUserConfig.build?.rollupOptions?.onwarn) {
                  viteUserConfig.build.rollupOptions.onwarn(
                    warning,
                    defaultHandler,
                  );
                } else {
                  defaultHandler(warning);
                }
              },
            },
          },
        };
      },
      configResolved(viteConfig) {
        resolvedViteConfig = viteConfig;
      },
      async configureServer(viteDevServer) {
        configLoader.onChange(
          async ({
            result,
            configCodeChanged,
            routeConfigCodeChanged,
            configChanged,
            routeConfigChanged,
          }) => {
            if (!result.ok) {
              invalidateVirtualModules(viteDevServer);
              logger.error(result.error, {
                clear: true,
                timestamp: true,
              });
              return;
            }

            // prettier-ignore
            let message =
              configChanged ? "Config changed." :
              routeConfigChanged ? "Route config changed." :
              configCodeChanged ? "Config saved." :
              routeConfigCodeChanged ? " Route config saved." :
              "Config saved";

            logger.info(colors.green(message), {
              clear: true,
              timestamp: true,
            });

            // Update shared plugin config reference
            updateConfig(result.value);

            if (configChanged || routeConfigChanged) {
              invalidateVirtualModules(viteDevServer);
            }
          },
        );
      },
      async buildEnd() {
        await configLoader.close();
      },
    },
    (() => {
      let logged = false;
      function logExperimentalNotice() {
        if (logged) return;
        logged = true;
        logger.info(
          colors.yellow(
            `${viteCommand === "serve" ? "  " : ""}🧪 Using React Router's RSC Framework Mode (experimental)`,
          ),
        );
      }
      return {
        name: "react-router/rsc/log-experimental-notice",
        sharedDuringBuild: true,
        buildStart: logExperimentalNotice,
        configureServer: logExperimentalNotice,
      };
    })(),
    {
      name: "react-router/rsc/typegen",
      async config(viteUserConfig, { command, mode }) {
        if (command === "serve") {
          const vite = await import("vite");
          typegenWatcherPromise = Typegen.watch(
            getRootDirectory(viteUserConfig),
            {
              mode,
              rsc: true,
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
      name: "react-router/rsc/virtual-rsc-entry",
      resolveId(id) {
        if (id === virtual.rscEntry.id) return defaultEntries.rsc;
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
        if (!routeIdByFile) return;
        return transformVirtualRouteModules({
          code,
          id,
          viteCommand,
          routeIdByFile,
          rootRouteFile,
          viteEnvironment: this.environment,
        });
      },
    },
    {
      name: "react-router/rsc/virtual-basename",
      resolveId(id) {
        if (id === virtual.basename.id) {
          return virtual.basename.resolvedId;
        }
      },
      load(id) {
        if (id === virtual.basename.resolvedId) {
          return `export default ${JSON.stringify(config.basename)};`;
        }
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

        return viteCommand === "serve"
          ? [
              `import RefreshRuntime from "${virtual.hmrRuntime.id}"`,
              "RefreshRuntime.injectIntoGlobalHook(window)",
              "window.$RefreshReg$ = () => {}",
              "window.$RefreshSig$ = () => (type) => type",
              "window.__vite_plugin_react_preamble_installed__ = true",
            ].join("\n")
          : "";
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

        if (isVirtualClientRouteModuleId(id)) {
          const routeId = routeIdByFile?.get(filepath);
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
      async hotUpdate(this, { server, file, modules }) {
        if (this.environment.name !== "rsc") return;

        const clientModules =
          server.environments.client.moduleGraph.getModulesByFile(file);

        const vite = await import("vite");
        const isServerOnlyChange =
          !clientModules ||
          clientModules.size === 0 ||
          // Handle CSS injected from server-first routes (with ?direct query
          // string) since the client graph has a reference to the CSS
          (vite.isCSSRequest(file) &&
            Array.from(clientModules).some((mod) =>
              mod.id?.includes("?direct"),
            ));

        for (const mod of getModulesWithImporters(modules)) {
          if (!mod.file) continue;

          const normalizedPath = path.normalize(mod.file);
          const routeId = routeIdByFile?.get(normalizedPath);
          if (routeId !== undefined) {
            const routeSource = await readFile(normalizedPath, "utf8");
            const virtualRouteModuleCode = (
              await server.environments.rsc.pluginContainer.transform(
                routeSource,
                `${normalizedPath}?route-module`,
              )
            ).code;
            const { staticExports } = parseRouteExports(virtualRouteModuleCode);
            const hasAction = staticExports.includes("action");
            const hasComponent = staticExports.includes("default");
            const hasErrorBoundary = staticExports.includes("ErrorBoundary");
            const hasLoader = staticExports.includes("loader");

            server.hot.send({
              type: "custom",
              event: "react-router:hmr",
              data: {
                routeId,
                isServerOnlyChange,
                hasAction,
                hasComponent,
                hasErrorBoundary,
                hasLoader,
              },
            });
          }
        }

        return modules;
      },
    },
    {
      name: "react-router/rsc/virtual-react-router-serve-config",
      resolveId(id) {
        if (id === virtual.reactRouterServeConfig.id) {
          return virtual.reactRouterServeConfig.resolvedId;
        }
      },
      load(id) {
        if (id === virtual.reactRouterServeConfig.resolvedId) {
          const rscOutDir = resolvedViteConfig.environments.rsc?.build?.outDir;
          invariant(rscOutDir, "RSC build directory config not found");
          const clientOutDir =
            resolvedViteConfig.environments.client?.build?.outDir;
          invariant(clientOutDir, "Client build directory config not found");
          const assetsBuildDirectory = Path.relative(rscOutDir, clientOutDir);
          const publicPath = resolvedViteConfig.base;

          return `export default ${JSON.stringify({
            assetsBuildDirectory,
            publicPath,
          })};`;
        }
      },
    },
    validatePluginOrder(),
    warnOnClientSourceMaps(),
  ];
}

const virtual = {
  routeConfig: create("unstable_rsc/routes"),
  injectHmrRuntime: create("unstable_rsc/inject-hmr-runtime"),
  hmrRuntime: create("unstable_rsc/runtime"),
  basename: create("unstable_rsc/basename"),
  rscEntry: create("unstable_rsc/rsc-entry"),
  reactRouterServeConfig: create("unstable_rsc/react-router-serve-config"),
};

function invalidateVirtualModules(viteDevServer: Vite.ViteDevServer) {
  for (const vmod of Object.values(virtual)) {
    for (const env of Object.values(viteDevServer.environments)) {
      const mod = env.moduleGraph.getModuleById(vmod.resolvedId);
      if (mod) {
        env.moduleGraph.invalidateModule(mod);
      }
    }
  }
}

function getRootDirectory(viteUserConfig: Vite.UserConfig) {
  return viteUserConfig.root ?? process.env.REACT_ROUTER_ROOT ?? process.cwd();
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

function getDefaultEntries() {
  const defaultEntriesDir = join(
    getDevPackageRoot(),
    "dist",
    "config",
    "default-rsc-entries",
  );
  return {
    rsc: join(defaultEntriesDir, "entry.rsc.tsx"),
    ssr: join(defaultEntriesDir, "entry.ssr.tsx"),
    client: join(defaultEntriesDir, "entry.client.tsx"),
  };
}

function getModulesWithImporters(
  modules: Vite.EnvironmentModuleNode[],
): Set<Vite.EnvironmentModuleNode> {
  const visited = new Set<Vite.EnvironmentModuleNode>();
  const result = new Set<Vite.EnvironmentModuleNode>();

  function walk(module: Vite.EnvironmentModuleNode) {
    if (visited.has(module)) return;

    visited.add(module);
    result.add(module);

    for (const importer of module.importers) {
      walk(importer);
    }
  }

  for (const module of modules) {
    walk(module);
  }

  return result;
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
