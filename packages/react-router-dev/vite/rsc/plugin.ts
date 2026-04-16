import type * as Vite from "vite";
import { init as initEsModuleLexer } from "es-module-lexer";
import * as Path from "pathe";
import colors from "picocolors";

import { create } from "../virtual-module";
import * as Typegen from "../../typegen";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path, { join } from "pathe";
import invariant from "../../invariant";
import {
  type ConfigLoader,
  type ResolvedReactRouterConfig,
  createConfigLoader,
  resolveRSCEntryFiles,
} from "../../config/config";
import {
  defineCompilerOptions,
  defineOptimizeDepsCompilerOptions,
  getVite,
  preloadVite,
} from "../vite";
import { hasDependency } from "../has-dependency";
import { getOptimizeDepsEntries } from "../optimize-deps-entries";
import { createVirtualRouteConfig } from "./virtual-route-config";
import { virtualRouteModulesPlugin } from "./virtual-route-modules";
import { loadDotenv } from "../load-dotenv";
import { validatePluginOrder } from "../plugins/validate-plugin-order";
import { warnOnClientSourceMaps } from "../plugins/warn-on-client-source-maps";
import { prerender } from "../plugins/prerender";
import { getPrerenderPaths } from "../plugin";

const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);

let configLoaderPromise: Promise<ConfigLoader>;
let typegenWatcherPromise: Promise<Typegen.Watcher> | undefined;

export function reactRouterRSCVitePlugin(): Vite.PluginOption[] {
  let runningWithinTheReactRouterMonoRepo = Boolean(
    arguments &&
      arguments.length === 1 &&
      typeof arguments[0] === "object" &&
      arguments[0] &&
      "__runningWithinTheReactRouterMonoRepo" in arguments[0] &&
      arguments[0].__runningWithinTheReactRouterMonoRepo === true,
  );
  let configLoader: ConfigLoader;
  let viteCommand: Vite.ConfigEnv["command"];
  let resolvedViteConfig: Vite.ResolvedConfig;
  let routeIdByFile: Map<string, string> | undefined;
  let logger: Vite.Logger;
  let entries: { client: string; rsc: string; ssr: string };

  let config: ResolvedReactRouterConfig;
  let rootRouteFile: string;
  function updateConfig(newConfig: ResolvedReactRouterConfig) {
    config = newConfig;
    rootRouteFile = Path.resolve(
      newConfig.appDirectory,
      newConfig.routes.root.file,
    );
  }

  function isRootRouteModule(id: string): boolean {
    return path.normalize(id) === path.normalize(rootRouteFile);
  }

  function getRouteIdForFile(file: string): string | undefined {
    let normalizedFile = path.normalize(file);
    let directMatch = routeIdByFile?.get(normalizedFile);
    if (directMatch) {
      return directMatch;
    }

    return Array.from(routeIdByFile ?? []).find(([routeFile]) =>
      path.normalize(routeFile).endsWith(normalizedFile),
    )?.[1];
  }

  function isMdxRouteModule(filename: string) {
    let extension = path.extname(filename).toLowerCase();
    return extension === ".md" || extension === ".mdx";
  }

  function getTransformLanguage(
    filename: string,
  ): "ts" | "tsx" | "jsx" | undefined {
    let extension = path.extname(filename).toLowerCase();

    switch (extension) {
      case ".ts":
      case ".cts":
      case ".mts":
        return "ts";
      case ".tsx":
        return "tsx";
      case ".js":
      case ".cjs":
      case ".mjs":
      case ".jsx":
      case ".md":
      case ".mdx":
        return "jsx";
      default:
        return undefined;
    }
  }

  async function transformToJs(
    code: string,
    filename: string,
  ): Promise<string> {
    await preloadVite();
    let vite = getVite();
    let lang = getTransformLanguage(filename);

    return (
      "transformWithOxc" in vite && typeof vite.transformWithOxc === "function"
        ? await vite.transformWithOxc(code, filename, {
            lang,
            jsx: {
              runtime: "automatic",
              development: viteCommand !== "build",
              target: "esnext",
            },
          })
        : await vite.transformWithEsbuild(code, filename, {
            loader: lang,
            target: "esnext",
            format: "esm",
            jsx: "automatic",
            jsxDev: viteCommand !== "build",
          })
    ).code;
  }

  return [
    {
      name: "react-router/rsc",
      async config(viteUserConfig, { command, mode }) {
        await initEsModuleLexer;
        await preloadVite();

        viteCommand = command;
        const rootDirectory = getRootDirectory(viteUserConfig);
        const watch =
          command === "serve" && process.env.IS_RR_BUILD_REQUEST !== "yes";

        await loadDotenv({
          rootDirectory,
          viteUserConfig,
          mode,
        });

        configLoaderPromise ??= createConfigLoader({
          rootDirectory,
          mode,
          watch,
          validateConfig: (userConfig) => {
            let errors: string[] = [];
            if (userConfig.buildEnd) errors.push("buildEnd");
            if (userConfig.presets?.length) errors.push("presets");
            if (userConfig.serverBundles) errors.push("serverBundles");
            if (userConfig.future?.v8_middleware === false)
              errors.push("future.v8_middleware: false");
            if (userConfig.future?.v8_viteEnvironmentApi === false)
              errors.push("future.v8_viteEnvironmentApi: false");
            if (userConfig.future?.unstable_subResourceIntegrity)
              errors.push("future.unstable_subResourceIntegrity");
            if (errors.length) {
              return `RSC Framework Mode does not currently support the following React Router config:\n${errors.map((x) => ` - ${x}`).join("\n")}\n`;
            }
          },
        });
        configLoader = await configLoaderPromise;

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

        entries = await resolveRSCEntryFiles({
          reactRouterConfig: config,
        });

        // Async import here to avoid CJS warnings on the console
        let viteNormalizePath = (await import("vite")).normalizePath;

        return {
          resolve: {
            dedupe: [
              // https://react.dev/warnings/invalid-hook-call-warning#duplicate-react
              "react",
              "react/jsx-runtime",
              "react/jsx-dev-runtime",
              "react-dom",
              "react-dom/client",
              // Avoid router duplicates since mismatching routers cause `Error:
              // You must render this element inside a <Remix> element`.
              "react-router",
              "react-router/dom",
              "react-router/internal/react-server-client",
              ...(hasDependency({ name: "react-router-dom", rootDirectory })
                ? ["react-router-dom"]
                : []),
              ...(hasDependency({
                name: "react-server-dom-webpack",
                rootDirectory,
              })
                ? ["react-server-dom-webpack"]
                : []),
            ],
          },
          optimizeDeps: {
            entries: getOptimizeDepsEntries({
              entryClientFilePath: entries.client,
              reactRouterConfig: config,
            }),
            ...defineOptimizeDepsCompilerOptions({
              rolldown: {
                transform: {
                  jsx: "react-jsx",
                },
              },
              esbuild: {
                jsx: "automatic",
              },
            }),
            include: [
              // Pre-bundle React dependencies to avoid React duplicates,
              // even if React dependencies are not direct dependencies.
              // https://react.dev/warnings/invalid-hook-call-warning#duplicate-react
              "react",
              "react/jsx-runtime",
              "react/jsx-dev-runtime",
              "react-dom",
              ...(hasDependency({
                name: "react-server-dom-webpack",
                rootDirectory,
              })
                ? ["react-server-dom-webpack"]
                : []),
              ...(runningWithinTheReactRouterMonoRepo
                ? []
                : [
                    "react-router",
                    "react-router/dom",
                    "react-router/internal/react-server-client",
                  ]),
              "react-router > cookie",
              "react-router > set-cookie-parser",
            ],
          },
          ...defineCompilerOptions({
            oxc: {
              jsx: {
                runtime: "automatic",
                development: viteCommand !== "build",
              },
            },
            esbuild: {
              jsx: "automatic",
              jsxDev: viteCommand !== "build",
            },
          }),
          environments: {
            client: {
              build: {
                rollupOptions: {
                  input: {
                    index: entries.client,
                  },
                  output: {
                    manualChunks(id) {
                      const normalized = viteNormalizePath(id);
                      if (
                        normalized.includes("node_modules/react/") ||
                        normalized.includes("node_modules/react-dom/") ||
                        normalized.includes(
                          "node_modules/react-server-dom-webpack/",
                        ) ||
                        normalized.includes("node_modules/@vitejs/plugin-rsc/")
                      ) {
                        return "react";
                      }
                      if (normalized.includes("node_modules/react-router/")) {
                        return "router";
                      }
                    },
                  },
                },
                outDir: join(config.buildDirectory, "client"),
              },
            },
            rsc: {
              build: {
                rollupOptions: {
                  input: {
                    index: entries.rsc,
                  },
                  output: {
                    entryFileNames: config.serverBuildFile,
                    format: config.serverModuleFormat,
                  },
                },
                outDir: join(config.buildDirectory, "server"),
              },
              resolve: {
                noExternal: [
                  "@react-router/dev/config/default-rsc-entries/entry.ssr",
                ],
              },
            },
            ssr: {
              build: {
                rollupOptions: {
                  input: {
                    index: entries.ssr,
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
              resolve: {
                noExternal: [
                  "@react-router/dev/config/default-rsc-entries/entry.rsc",
                ],
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
      configurePreviewServer(previewServer) {
        const clientBuildDirectory = getClientBuildDirectory(config);
        if (
          (config.prerender || config.ssr === false) &&
          process.env.IS_RR_BUILD_REQUEST !== "yes"
        ) {
          previewServer.middlewares.use(async (req, res, next) => {
            try {
              const htmlFileBase = (
                (req.url || "/") +
                (req.url?.endsWith("/") ? "" : "/") +
                "index.html"
              ).slice(1);
              const htmlFilePath = path.join(
                clientBuildDirectory,
                htmlFileBase,
              );
              if (existsSync(htmlFilePath)) {
                res.setHeader("Content-Type", "text/html");
                res.end(await readFile(htmlFilePath, "utf-8"));

                return;
              }
              next();
            } catch (error) {
              next(error);
            }
          });

          return () => {
            if (config.ssr === false) {
              previewServer.middlewares.use(async (req, res, next) => {
                try {
                  res.statusCode = 404;

                  const url = new URL(req.url || "/", `http://localhost`);

                  const htmlFilePath = path.join(
                    clientBuildDirectory,
                    url.pathname.endsWith(".rsc")
                      ? "__spa-fallback.rsc"
                      : "__spa-fallback.html",
                  );

                  if (existsSync(htmlFilePath)) {
                    res.setHeader("Content-Type", "text/html");
                    res.end(await readFile(htmlFilePath, "utf-8"));

                    return;
                  }
                  res.end();
                } catch (error) {
                  next(error);
                }
              });
            }
          };
        }
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
    process.env.IS_RR_BUILD_REQUEST !== "yes"
      ? {
          name: "react-router/rsc/typegen",
          async config(viteUserConfig, { command, mode }) {
            if (command === "serve") {
              const vite = await import("vite");
              typegenWatcherPromise ??= Typegen.watch(
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
        }
      : null,

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
    virtualRouteModulesPlugin({
      environments: {
        client: ["client", "ssr"],
        server: ["rsc"],
      },
      getRouteIdForFile,
      isRootRouteModule,
      transformToJs,
      enforceSplitRouteModules: () =>
        config.future.v8_splitRouteModules === "enforce",
    }),
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
      name: "react-router/rsc/virtual-route-discovery",
      resolveId(id) {
        if (id === virtual.routeDiscovery.id) {
          return virtual.routeDiscovery.resolvedId;
        }
      },
      load(id) {
        if (id === virtual.routeDiscovery.resolvedId) {
          return `export default ${JSON.stringify(
            config.ssr === false
              ? {
                  mode: "initial",
                }
              : (config.routeDiscovery ?? { mode: "lazy" }),
          )};`;
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
              `if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.on('rsc:update', () => {
    // Defer revalidation to the next animation frame so React Fast Refresh
    // can apply pending client component updates first. Without this delay,
    // the RSC payload (showing updated text) can arrive and be reconciled
    // against a DOM that still has the old text, causing a hydration mismatch.
    requestAnimationFrame(() => {
      __reactRouterDataRouter.revalidate()
    });
  })
}`,
            ].join("\n")
          : "";
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
    prerender({
      config() {
        return {
          buildDirectory: getClientBuildDirectory(config),
          concurrency: getPrerenderConcurrencyConfig(config),
        };
      },
      logFile: (path) => logger.info(`Prerendered ${colors.bold(path)}`),
      async requests() {
        const prerenderPaths = new Set(
          await getPrerenderPaths(
            config.prerender,
            config.ssr,
            config.routes,
            true,
          ),
        );

        let basename =
          !config.basename || config.basename === "/"
            ? "/"
            : config.basename.endsWith("/")
              ? config.basename
              : config.basename + "/";

        if (config.ssr === false) {
          prerenderPaths.add("/__spa-fallback.html");
        }

        return Array.from(prerenderPaths).map(
          (prerenderPath) =>
            `http://localhost${basename}${prerenderPath.slice(1)}`,
        );
      },
      async postProcess(request, response, metadata) {
        let url = new URL(request.url);

        let isRedirect = redirectStatusCodes.has(response.status);

        if (
          !isRedirect &&
          response.status !== 200 &&
          response.status !== 202 &&
          !(url.pathname === "/__spa-fallback.html" && response.status === 404)
        ) {
          throw new Error(
            `Prerender (data): Received a ${response.status} status code from ` +
              `\`entry.server.tsx\` while prerendering the \`${url.pathname}\` ` +
              `path.\n${url.pathname}`,
            { cause: response },
          );
        }

        if (metadata?.manifest) {
          return [
            {
              path: url.pathname,
              contents: await response.text(),
            },
          ];
        }

        let isHtml = response.headers
          .get("content-type")
          ?.includes("text/html");
        let htmlResponse = isHtml
          ? isRedirect
            ? response
            : response.clone()
          : null;

        // This isn't ideal but gets the job done as a fallback if the user can't
        // implement proper redirects via .htaccess or something else.  This is the
        // approach used by Astro as well, so there's some precedent.
        // https://github.com/withastro/roadmap/issues/466
        // https://github.com/withastro/astro/blob/main/packages/astro/src/core/routing/3xx.ts
        let location = response.headers.get("Location");
        // A short delay causes Google to interpret the redirect as temporary.
        // https://developers.google.com/search/docs/crawling-indexing/301-redirects#metarefresh
        let delay = response.status === 302 ? 2 : 0;
        let redirectBody = isRedirect
          ? `<!doctype html>
<head>
<title>Redirecting to: ${location}</title>
<meta http-equiv="refresh" content="${delay};url=${location}">
<meta name="robots" content="noindex">
</head>
<body>
	<a href="${location}">
  Redirecting from <code>${url.pathname}</code> to <code>${location}</code>
</a>
</body>
</html>`
          : "";

        let files: { path: string; contents: Uint8Array | string }[] = [
          {
            path:
              isHtml || redirectBody
                ? url.pathname === "/__spa-fallback.html"
                  ? "__spa-fallback.html"
                  : (url.pathname.endsWith("/")
                      ? url.pathname
                      : url.pathname + "/") + "index.html"
                : url.pathname,
            contents:
              redirectBody ||
              (isHtml
                ? await response.text()
                : new Uint8Array(await response.arrayBuffer())),
          },
        ];

        if (htmlResponse) {
          let body = await htmlResponse.text();

          let matches = Array.from(
            body.matchAll(
              /<script>\(self\.__FLIGHT_DATA\|\|=\[\]\)\.push\(("(?:[^"\\]|\\.)*")\)<\/script>/gim,
            ),
          );
          if (matches.length) {
            let rscData = "";
            for (const match of matches) {
              rscData += JSON.parse(match[1]);
            }

            files.push({
              path:
                url.pathname === "/"
                  ? "_.rsc"
                  : (url.pathname === "/__spa-fallback.html"
                      ? "__spa-fallback"
                      : url.pathname) + ".rsc",
              contents: rscData,
            });
          }
        } else if (!url.pathname.endsWith(".rsc")) {
          let dataUrl = new URL(url);
          dataUrl.pathname += ".rsc";
          return {
            files,
            requests: [dataUrl.href],
          };
        }

        return files;
      },
    }),
  ];
}

const virtual = {
  routeConfig: create("unstable_rsc/routes"),
  routeDiscovery: create("unstable_rsc/route-discovery"),
  injectHmrRuntime: create("unstable_rsc/inject-hmr-runtime"),
  basename: create("unstable_rsc/basename"),
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

const getClientBuildDirectory = (
  reactRouterConfig: ResolvedReactRouterConfig,
) => path.join(reactRouterConfig.buildDirectory, "client");

function getPrerenderConcurrencyConfig(
  reactRouterConfig: ResolvedReactRouterConfig,
): number {
  let concurrency = 1;
  let { prerender } = reactRouterConfig;
  if (typeof prerender === "object" && "unstable_concurrency" in prerender) {
    concurrency = prerender.unstable_concurrency ?? 1;
  }
  return concurrency;
}
