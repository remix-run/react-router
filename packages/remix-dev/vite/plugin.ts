// We can only import types from Vite at the top level since we're in a CJS
// context but want to use Vite's ESM build to avoid deprecation warnings
import type * as Vite from "vite";
import { type BinaryLike, createHash } from "node:crypto";
import * as path from "node:path";
import * as url from "node:url";
import * as fse from "fs-extra";
import babel from "@babel/core";
import {
  type ServerBuild,
  unstable_setDevServerHooks as setDevServerHooks,
} from "@remix-run/server-runtime";
import {
  init as initEsModuleLexer,
  parse as esModuleLexer,
} from "es-module-lexer";
import jsesc from "jsesc";
import pick from "lodash/pick";
import omit from "lodash/omit";
import colors from "picocolors";

import { type ConfigRoute, type RouteManifest } from "../config/routes";
import {
  type AppConfig as RemixEsbuildUserConfig,
  type RemixConfig as ResolvedRemixEsbuildConfig,
  resolveConfig as resolveRemixEsbuildConfig,
} from "../config";
import { type Manifest as BrowserManifest } from "../manifest";
import invariant from "../invariant";
import { createRequestHandler } from "./node/adapter";
import { getStylesForUrl, isCssModulesFile } from "./styles";
import * as VirtualModule from "./vmod";
import { resolveFileUrl } from "./resolve-file-url";
import { removeExports } from "./remove-exports";
import { replaceImportSpecifier } from "./replace-import-specifier";
import { importViteEsmSync, preloadViteEsm } from "./import-vite-esm-sync";

const supportedRemixEsbuildConfigKeys = [
  "appDirectory",
  "future",
  "ignoredRouteFiles",
  "publicPath",
  "routes",
  "serverModuleFormat",
] as const satisfies ReadonlyArray<keyof RemixEsbuildUserConfig>;
type SupportedRemixEsbuildUserConfig = Pick<
  RemixEsbuildUserConfig,
  typeof supportedRemixEsbuildConfigKeys[number]
>;

const SERVER_ONLY_ROUTE_EXPORTS = ["loader", "action", "headers"];
const CLIENT_ROUTE_EXPORTS = [
  "clientAction",
  "clientLoader",
  "default",
  "ErrorBoundary",
  "handle",
  "HydrateFallback",
  "links",
  "meta",
  "shouldRevalidate",
];

const CLIENT_ROUTE_QUERY_STRING = "?client-route";

// We need to provide different JSDoc comments in some cases due to differences
// between the Remix config and the Vite plugin.
type RemixEsbuildUserConfigJsdocOverrides = {
  /**
   * The URL prefix of the browser build with a trailing slash. Defaults to
   * `"/"`. This is the path the browser will use to find assets.
   */
  publicPath?: SupportedRemixEsbuildUserConfig["publicPath"];
};

// Only expose a subset of route properties to the "serverBundles" function
const branchRouteProperties = [
  "id",
  "path",
  "file",
  "index",
] as const satisfies ReadonlyArray<keyof ConfigRoute>;
type BranchRoute = Pick<ConfigRoute, typeof branchRouteProperties[number]>;

export const configRouteToBranchRoute = (
  configRoute: ConfigRoute
): BranchRoute => pick(configRoute, branchRouteProperties);

type ServerBundlesFunction = (args: {
  branch: BranchRoute[];
}) => string | Promise<string>;

type BaseBuildManifest = {
  routes: RouteManifest;
};

type DefaultBuildManifest = BaseBuildManifest & {
  serverBundles?: never;
  routeIdToServerBundleId?: never;
};

export type ServerBundlesBuildManifest = BaseBuildManifest & {
  serverBundles: {
    [serverBundleId: string]: {
      id: string;
      file: string;
    };
  };
  routeIdToServerBundleId: Record<string, string>;
};

export type BuildManifest = DefaultBuildManifest | ServerBundlesBuildManifest;

const adapterRemixConfigOverrideKeys = [
  "unstable_serverBundles",
] as const satisfies ReadonlyArray<keyof VitePluginConfig>;

type AdapterRemixConfigOverrideKey =
  typeof adapterRemixConfigOverrideKeys[number];

type AdapterRemixConfigOverrides = Pick<
  VitePluginConfig,
  AdapterRemixConfigOverrideKey
>;

type AdapterConfig = AdapterRemixConfigOverrides & {
  buildEnd?: BuildEndHook;
};

type Adapter = Omit<AdapterConfig, AdapterRemixConfigOverrideKey>;

export type VitePluginAdapter = (args: {
  remixConfig: VitePluginConfig;
}) => AdapterConfig | Promise<AdapterConfig>;

export type VitePluginConfig = RemixEsbuildUserConfigJsdocOverrides &
  Omit<
    SupportedRemixEsbuildUserConfig,
    keyof RemixEsbuildUserConfigJsdocOverrides
  > & {
    /**
     * A function for adapting the build output and/or development environment
     * for different hosting providers.
     */
    adapter?: VitePluginAdapter;
    /**
     * The path to the build directory, relative to the project. Defaults to
     * `"build"`.
     */
    buildDirectory?: string;
    /**
     * Whether to write a `"manifest.json"` file to the build directory.
     * Defaults to `false`.
     */
    manifest?: boolean;
    /**
     * The file name of the server build output. This file
     * should end in a `.js` extension and should be deployed to your server.
     * Defaults to `"index.js"`.
     */
    serverBuildFile?: string;
    /**
     * A function for assigning routes to different server bundles. This
     * function should return a server bundle ID which will be used as the
     * bundle's directory name within the server build directory.
     */
    unstable_serverBundles?: ServerBundlesFunction;
    /**
     * Enable server-side rendering for your application. Disable to use Remix in
     * "SPA Mode", which will request the `/` path at build-time and save it as
     * an `index.html` file with your assets so your application can be deployed
     * as a SPA without server-rendering. Default's to `true`.
     */
    unstable_ssr?: boolean;
  };

type BuildEndHook = (args: {
  remixConfig: Pick<
    ResolvedVitePluginConfig,
    "buildDirectory" | "serverBuildFile"
  > & { unstable_ssr: boolean };
  buildManifest: BuildManifest | undefined;
}) => void | Promise<void>;

export type ResolvedVitePluginConfig = Pick<
  ResolvedRemixEsbuildConfig,
  | "appDirectory"
  | "rootDirectory"
  | "entryClientFilePath"
  | "entryServerFilePath"
  | "future"
  | "publicPath"
  | "routes"
  | "serverModuleFormat"
> & {
  adapter?: Adapter;
  buildDirectory: string;
  manifest: boolean;
  serverBuildFile: string;
  serverBundleId?: string;
  serverBundles?: ServerBundlesFunction;
  ssr: boolean;
};

export type ServerBundleBuildConfig = {
  routes: RouteManifest;
  serverBundleId: string;
};

let serverBuildId = VirtualModule.id("server-build");
let serverManifestId = VirtualModule.id("server-manifest");
let browserManifestId = VirtualModule.id("browser-manifest");
let remixReactProxyId = VirtualModule.id("remix-react-proxy");
let hmrRuntimeId = VirtualModule.id("hmr-runtime");
let injectHmrRuntimeId = VirtualModule.id("inject-hmr-runtime");

const resolveRelativeRouteFilePath = (
  route: ConfigRoute,
  pluginConfig: ResolvedVitePluginConfig
) => {
  let vite = importViteEsmSync();
  let file = route.file;
  let fullPath = path.resolve(pluginConfig.appDirectory, file);

  return vite.normalizePath(fullPath);
};

let vmods = [serverBuildId, serverManifestId, browserManifestId];

const invalidateVirtualModules = (viteDevServer: Vite.ViteDevServer) => {
  vmods.forEach((vmod) => {
    let mod = viteDevServer.moduleGraph.getModuleById(
      VirtualModule.resolve(vmod)
    );
    if (mod) {
      viteDevServer.moduleGraph.invalidateModule(mod);
    }
  });
};

const getHash = (source: BinaryLike, maxLength?: number): string => {
  let hash = createHash("sha256").update(source).digest("hex");
  return typeof maxLength === "number" ? hash.slice(0, maxLength) : hash;
};

const resolveChunk = (
  pluginConfig: ResolvedVitePluginConfig,
  viteManifest: Vite.Manifest,
  absoluteFilePath: string
) => {
  let vite = importViteEsmSync();
  let rootRelativeFilePath = vite.normalizePath(
    path.relative(pluginConfig.rootDirectory, absoluteFilePath)
  );
  let entryChunk =
    viteManifest[rootRelativeFilePath + CLIENT_ROUTE_QUERY_STRING] ??
    viteManifest[rootRelativeFilePath];

  if (!entryChunk) {
    let knownManifestKeys = Object.keys(viteManifest)
      .map((key) => '"' + key + '"')
      .join(", ");
    throw new Error(
      `No manifest entry found for "${rootRelativeFilePath}". Known manifest keys: ${knownManifestKeys}`
    );
  }

  return entryChunk;
};

const resolveBuildAssetPaths = (
  pluginConfig: ResolvedVitePluginConfig,
  viteManifest: Vite.Manifest,
  entryFilePath: string,
  prependedAssetFilePaths: string[] = []
): BrowserManifest["entry"] & { css: string[] } => {
  let entryChunk = resolveChunk(pluginConfig, viteManifest, entryFilePath);

  // This is here to support prepending client entry assets to the root route
  let prependedAssetChunks = prependedAssetFilePaths.map((filePath) =>
    resolveChunk(pluginConfig, viteManifest, filePath)
  );

  let chunks = resolveDependantChunks(viteManifest, [
    ...prependedAssetChunks,
    entryChunk,
  ]);

  return {
    module: `${pluginConfig.publicPath}${entryChunk.file}${CLIENT_ROUTE_QUERY_STRING}`,
    imports:
      dedupe(chunks.flatMap((e) => e.imports ?? [])).map((imported) => {
        return `${pluginConfig.publicPath}${viteManifest[imported].file}`;
      }) ?? [],
    css:
      dedupe(chunks.flatMap((e) => e.css ?? [])).map((href) => {
        return `${pluginConfig.publicPath}${href}`;
      }) ?? [],
  };
};

function resolveDependantChunks(
  viteManifest: Vite.Manifest,
  entryChunks: Vite.ManifestChunk[]
): Vite.ManifestChunk[] {
  let chunks = new Set<Vite.ManifestChunk>();

  function walk(chunk: Vite.ManifestChunk) {
    if (chunks.has(chunk)) {
      return;
    }

    if (chunk.imports) {
      for (let importKey of chunk.imports) {
        walk(viteManifest[importKey]);
      }
    }

    chunks.add(chunk);
  }

  for (let entryChunk of entryChunks) {
    walk(entryChunk);
  }

  return Array.from(chunks);
}

function dedupe<T>(array: T[]): T[] {
  return [...new Set(array)];
}

const writeFileSafe = async (file: string, contents: string): Promise<void> => {
  await fse.ensureDir(path.dirname(file));
  await fse.writeFile(file, contents);
};

const getRouteManifestModuleExports = async (
  viteChildCompiler: Vite.ViteDevServer | null,
  pluginConfig: ResolvedVitePluginConfig
): Promise<Record<string, string[]>> => {
  let entries = await Promise.all(
    Object.entries(pluginConfig.routes).map(async ([key, route]) => {
      let sourceExports = await getRouteModuleExports(
        viteChildCompiler,
        pluginConfig,
        route.file
      );
      return [key, sourceExports] as const;
    })
  );
  return Object.fromEntries(entries);
};

const getRouteModuleExports = async (
  viteChildCompiler: Vite.ViteDevServer | null,
  pluginConfig: ResolvedVitePluginConfig,
  routeFile: string,
  readRouteFile?: () => string | Promise<string>
): Promise<string[]> => {
  if (!viteChildCompiler) {
    throw new Error("Vite child compiler not found");
  }

  // We transform the route module code with the Vite child compiler so that we
  // can parse the exports from non-JS files like MDX. This ensures that we can
  // understand the exports from anything that Vite can compile to JS, not just
  // the route file formats that the Remix compiler historically supported.

  let ssr = true;
  let { pluginContainer, moduleGraph } = viteChildCompiler;
  let routePath = path.resolve(pluginConfig.appDirectory, routeFile);
  let url = resolveFileUrl(pluginConfig, routePath);

  let resolveId = async () => {
    let result = await pluginContainer.resolveId(url, undefined, { ssr });
    if (!result) throw new Error(`Could not resolve module ID for ${url}`);
    return result.id;
  };

  let [id, code] = await Promise.all([
    resolveId(),
    readRouteFile?.() ?? fse.readFile(routePath, "utf-8"),
    // pluginContainer.transform(...) fails if we don't do this first:
    moduleGraph.ensureEntryFromUrl(url, ssr),
  ]);

  let transformed = await pluginContainer.transform(code, id, { ssr });
  let [, exports] = esModuleLexer(transformed.code);
  let exportNames = exports.map((e) => e.n);

  return exportNames;
};

const getServerBundleBuildConfig = (
  viteUserConfig: Vite.UserConfig
): ServerBundleBuildConfig | null => {
  if (
    !("__remixServerBundleBuildConfig" in viteUserConfig) ||
    !viteUserConfig.__remixServerBundleBuildConfig
  ) {
    return null;
  }

  return viteUserConfig.__remixServerBundleBuildConfig as ServerBundleBuildConfig;
};

const getViteMajorVersion = (): number => {
  let vitePkg = require("vite/package.json");
  return parseInt(vitePkg.version.split(".")[0]!);
};

export let getServerBuildDirectory = (remixConfig: ResolvedVitePluginConfig) =>
  path.join(
    remixConfig.buildDirectory,
    "server",
    ...(typeof remixConfig.serverBundleId === "string"
      ? [remixConfig.serverBundleId]
      : [])
  );

let getClientBuildDirectory = (remixConfig: ResolvedVitePluginConfig) =>
  path.join(remixConfig.buildDirectory, "client");

export type RemixVitePlugin = (config?: VitePluginConfig) => Vite.Plugin[];
export const remixVitePlugin: RemixVitePlugin = (remixUserConfig = {}) => {
  let viteCommand: Vite.ResolvedConfig["command"];
  let viteUserConfig: Vite.UserConfig;
  let viteConfig: Vite.ResolvedConfig | undefined;

  let isViteV4 = getViteMajorVersion() === 4;

  let cssModulesManifest: Record<string, string> = {};
  let ssrBuildContext:
    | { isSsrBuild: false }
    | { isSsrBuild: true; getBrowserManifest: () => Promise<BrowserManifest> };

  let viteChildCompiler: Vite.ViteDevServer | null = null;

  // This is initialized during `config` hook, so most of the code can assume this is defined without null check.
  // During dev, this is updated on config file change or route file addition/removal.
  let remixConfig: ResolvedVitePluginConfig;

  let resolvePluginConfig = async (): Promise<ResolvedVitePluginConfig> => {
    let defaults = {
      buildDirectory: "build",
      manifest: false,
      publicPath: "/",
      serverBuildFile: "index.js",
      unstable_ssr: true,
    } as const satisfies Partial<VitePluginConfig>;

    let adapterConfig = remixUserConfig.adapter
      ? await remixUserConfig.adapter({
          // We only pass in the plugin config that the user defined. We don't
          // know the final resolved config until the adapter has been resolved.
          remixConfig: remixUserConfig,
        })
      : undefined;
    let adapter: Adapter | undefined =
      adapterConfig && omit(adapterConfig, adapterRemixConfigOverrideKeys);
    let adapterRemixConfigOverrides: AdapterRemixConfigOverrides | undefined =
      adapterConfig && pick(adapterConfig, adapterRemixConfigOverrideKeys);

    let resolvedRemixUserConfig = {
      ...defaults,
      ...remixUserConfig,
      ...(adapterRemixConfigOverrides ?? {}),
    } satisfies VitePluginConfig;

    let rootDirectory =
      viteUserConfig.root ?? process.env.REMIX_ROOT ?? process.cwd();

    let { manifest, unstable_ssr: ssr } = resolvedRemixUserConfig;

    let isSpaMode = !ssr;

    // Only select the Remix esbuild config options that the Vite plugin uses
    let {
      appDirectory,
      entryClientFilePath,
      entryServerFilePath,
      future,
      publicPath,
      routes,
      serverModuleFormat,
    } = await resolveRemixEsbuildConfig(
      pick(resolvedRemixUserConfig, supportedRemixEsbuildConfigKeys),
      { rootDirectory, isSpaMode }
    );

    let buildDirectory = path.resolve(
      rootDirectory,
      resolvedRemixUserConfig.buildDirectory
    );

    let { serverBuildFile, unstable_serverBundles: serverBundles } =
      resolvedRemixUserConfig;

    // Log warning for incompatible vite config flags
    if (isSpaMode && serverBundles) {
      console.warn(
        colors.yellow(
          colors.bold("⚠️  SPA Mode: ") +
            "the `unstable_serverBundles` config is invalid with " +
            "`unstable_ssr:false` and will be ignored`"
        )
      );
      serverBundles = undefined;
    }

    // Get the server bundle build config injected by the Remix CLI, if present.
    let serverBundleBuildConfig = getServerBundleBuildConfig(viteUserConfig);

    // For server bundle builds, override the relevant config. This lets us run
    // multiple server builds with each one targeting a subset of routes.
    let serverBundleId: string | undefined = undefined;
    if (serverBundleBuildConfig) {
      routes = serverBundleBuildConfig.routes;
      serverBundleId = serverBundleBuildConfig.serverBundleId;
    }

    let resolvedRemixConfig: ResolvedVitePluginConfig = {
      adapter,
      appDirectory,
      buildDirectory,
      entryClientFilePath,
      entryServerFilePath,
      future,
      manifest,
      publicPath,
      rootDirectory,
      routes,
      serverBuildFile,
      serverBundleId,
      serverBundles,
      serverModuleFormat,
      ssr,
    };

    return resolvedRemixConfig;
  };

  let getServerEntry = async () => {
    return `
    import * as entryServer from ${JSON.stringify(
      resolveFileUrl(remixConfig, remixConfig.entryServerFilePath)
    )};
    ${Object.keys(remixConfig.routes)
      .map((key, index) => {
        let route = remixConfig.routes[key]!;
        return `import * as route${index} from ${JSON.stringify(
          resolveFileUrl(
            remixConfig,
            resolveRelativeRouteFilePath(route, remixConfig)
          )
        )};`;
      })
      .join("\n")}
      export { default as assets } from ${JSON.stringify(serverManifestId)};
      export const assetsBuildDirectory = ${JSON.stringify(
        path.relative(
          remixConfig.rootDirectory,
          getClientBuildDirectory(remixConfig)
        )
      )};
      export const future = ${JSON.stringify(remixConfig.future)};
      export const isSpaMode = ${!remixConfig.ssr};
      export const publicPath = ${JSON.stringify(remixConfig.publicPath)};
      export const entry = { module: entryServer };
      export const routes = {
        ${Object.keys(remixConfig.routes)
          .map((key, index) => {
            let route = remixConfig.routes[key]!;
            return `${JSON.stringify(key)}: {
          id: ${JSON.stringify(route.id)},
          parentId: ${JSON.stringify(route.parentId)},
          path: ${JSON.stringify(route.path)},
          index: ${JSON.stringify(route.index)},
          caseSensitive: ${JSON.stringify(route.caseSensitive)},
          module: route${index}
        }`;
          })
          .join(",\n  ")}
      };`;
  };

  let loadViteManifest = async (directory: string) => {
    let manifestPath = isViteV4
      ? "manifest.json"
      : path.join(".vite", "manifest.json");
    let manifestContents = await fse.readFile(
      path.resolve(directory, manifestPath),
      "utf-8"
    );
    return JSON.parse(manifestContents) as Vite.Manifest;
  };

  let createBrowserManifestForBuild = async (): Promise<BrowserManifest> => {
    let viteManifest = await loadViteManifest(
      getClientBuildDirectory(remixConfig)
    );

    let entry = resolveBuildAssetPaths(
      remixConfig,
      viteManifest,
      remixConfig.entryClientFilePath
    );

    let routes: BrowserManifest["routes"] = {};

    let routeManifestExports = await getRouteManifestModuleExports(
      viteChildCompiler,
      remixConfig
    );

    for (let [key, route] of Object.entries(remixConfig.routes)) {
      let routeFilePath = path.join(remixConfig.appDirectory, route.file);
      let sourceExports = routeManifestExports[key];
      let isRootRoute = route.parentId === undefined;

      routes[key] = {
        id: route.id,
        parentId: route.parentId,
        path: route.path,
        index: route.index,
        caseSensitive: route.caseSensitive,
        hasAction: sourceExports.includes("action"),
        hasLoader: sourceExports.includes("loader"),
        hasClientAction: sourceExports.includes("clientAction"),
        hasClientLoader: sourceExports.includes("clientLoader"),
        hasErrorBoundary: sourceExports.includes("ErrorBoundary"),
        ...resolveBuildAssetPaths(
          remixConfig,
          viteManifest,
          routeFilePath,
          // If this is the root route, we also need to include assets from the
          // client entry file as this is a common way for consumers to import
          // global reset styles, etc.
          isRootRoute ? [remixConfig.entryClientFilePath] : []
        ),
      };
    }

    let fingerprintedValues = { entry, routes };
    let version = getHash(JSON.stringify(fingerprintedValues), 8);
    let manifestPath = `assets/manifest-${version}.js`;
    let url = `${remixConfig.publicPath}${manifestPath}`;
    let nonFingerprintedValues = { url, version };

    let manifest: BrowserManifest = {
      ...fingerprintedValues,
      ...nonFingerprintedValues,
    };

    await writeFileSafe(
      path.join(getClientBuildDirectory(remixConfig), manifestPath),
      `window.__remixManifest=${JSON.stringify(manifest)};`
    );

    return manifest;
  };

  let getBrowserManifestForDev = async (): Promise<BrowserManifest> => {
    let routes: BrowserManifest["routes"] = {};

    let routeManifestExports = await getRouteManifestModuleExports(
      viteChildCompiler,
      remixConfig
    );

    for (let [key, route] of Object.entries(remixConfig.routes)) {
      let sourceExports = routeManifestExports[key];
      routes[key] = {
        id: route.id,
        parentId: route.parentId,
        path: route.path,
        index: route.index,
        caseSensitive: route.caseSensitive,
        module: `${resolveFileUrl(
          remixConfig,
          resolveRelativeRouteFilePath(route, remixConfig)
        )}${CLIENT_ROUTE_QUERY_STRING}`,
        hasAction: sourceExports.includes("action"),
        hasLoader: sourceExports.includes("loader"),
        hasClientAction: sourceExports.includes("clientAction"),
        hasClientLoader: sourceExports.includes("clientLoader"),
        hasErrorBoundary: sourceExports.includes("ErrorBoundary"),
        imports: [],
      };
    }

    return {
      version: String(Math.random()),
      url: VirtualModule.url(browserManifestId),
      hmr: {
        runtime: VirtualModule.url(injectHmrRuntimeId),
      },
      entry: {
        module: resolveFileUrl(remixConfig, remixConfig.entryClientFilePath),
        imports: [],
      },
      routes,
    };
  };

  return [
    {
      name: "remix",
      config: async (_viteUserConfig, viteConfigEnv) => {
        // Preload Vite's ESM build up-front as soon as we're in an async context
        await preloadViteEsm();

        // Ensure sync import of Vite works after async preload
        let vite = importViteEsmSync();

        viteUserConfig = _viteUserConfig;
        viteCommand = viteConfigEnv.command;

        remixConfig = await resolvePluginConfig();

        Object.assign(
          process.env,
          vite.loadEnv(
            viteConfigEnv.mode,
            remixConfig.rootDirectory,
            // We override default prefix of "VITE_" with a blank string since
            // we're targeting the server, so we want to load all environment
            // variables, not just those explicitly marked for the client
            ""
          )
        );

        let isSsrBuild =
          "ssrBuild" in viteConfigEnv &&
          typeof viteConfigEnv.ssrBuild === "boolean"
            ? viteConfigEnv.ssrBuild // Vite v4 back compat
            : viteConfigEnv.isSsrBuild;

        return {
          __remixPluginResolvedConfig: remixConfig,
          appType: "custom",
          experimental: { hmrPartialAccept: true },
          optimizeDeps: {
            include: [
              // Pre-bundle React dependencies to avoid React duplicates,
              // even if React dependencies are not direct dependencies.
              // https://react.dev/warnings/invalid-hook-call-warning#duplicate-react
              "react",
              "react/jsx-runtime",
              "react/jsx-dev-runtime",
              "react-dom/client",

              // Pre-bundle Remix dependencies to avoid Remix router duplicates.
              // Our remix-remix-react-proxy plugin does not process default client and
              // server entry files since those come from within `node_modules`.
              // That means that before Vite pre-bundles dependencies (e.g. first time dev server is run)
              // mismatching Remix routers cause `Error: You must render this element inside a <Remix> element`.
              "@remix-run/react",

              // For some reason, the `vite-dotenv` integration test consistently fails on webkit
              // with `504 (Outdated Optimize Dep)` from Vite  unless `@remix-run/node` is included
              // in `optimizeDeps.include`. 🤷
              // This could be caused by how we copy `node_modules/` into integration test fixtures,
              // so maybe this will be unnecessary once we switch to pnpm
              "@remix-run/node",
            ],
          },
          esbuild: {
            jsx: "automatic",
            jsxDev: viteCommand !== "build",
          },
          resolve: {
            dedupe: [
              // https://react.dev/warnings/invalid-hook-call-warning#duplicate-react
              "react",
              "react-dom",

              // see description for `@remix-run/react` in `optimizeDeps.include`
              "@remix-run/react",
            ],
          },
          ...(viteCommand === "build" && {
            base: remixConfig.publicPath,
            build: {
              ...viteUserConfig.build,
              ...(!isSsrBuild
                ? {
                    manifest: true,
                    outDir: getClientBuildDirectory(remixConfig),
                    rollupOptions: {
                      ...viteUserConfig.build?.rollupOptions,
                      preserveEntrySignatures: "exports-only",
                      input: [
                        remixConfig.entryClientFilePath,
                        ...Object.values(remixConfig.routes).map(
                          (route) =>
                            `${path.resolve(
                              remixConfig.appDirectory,
                              route.file
                            )}${CLIENT_ROUTE_QUERY_STRING}`
                        ),
                      ],
                    },
                  }
                : {
                    // We move SSR-only assets to client assets. Note that the
                    // SSR build can also emit code-split JS files (e.g. by
                    // dynamic import) under the same assets directory
                    // regardless of "ssrEmitAssets" option, so we also need to
                    // keep these JS files have to be kept as-is.
                    ssrEmitAssets: true,
                    copyPublicDir: false, // Assets in the public directory are only used by the client
                    manifest: true, // We need the manifest to detect SSR-only assets
                    outDir: getServerBuildDirectory(remixConfig),
                    rollupOptions: {
                      ...viteUserConfig.build?.rollupOptions,
                      preserveEntrySignatures: "exports-only",
                      input: serverBuildId,
                      output: {
                        entryFileNames: remixConfig.serverBuildFile,
                        format: remixConfig.serverModuleFormat,
                      },
                    },
                  }),
            },
          }),
        };
      },
      async configResolved(resolvedViteConfig) {
        await initEsModuleLexer;

        viteConfig = resolvedViteConfig;

        ssrBuildContext =
          viteConfig.build.ssr && viteCommand === "build"
            ? {
                isSsrBuild: true,
                getBrowserManifest: createBrowserManifestForBuild,
              }
            : {
                isSsrBuild: false,
              };

        // We load the same Vite config file again for the child compiler so
        // that both parent and child compiler's plugins have independent state.
        // If we re-used the `viteUserConfig.plugins` array for the child
        // compiler, it could lead to mutating shared state between plugin
        // instances in unexpected ways, e.g. during `vite build` the
        // `configResolved` plugin hook would be called with `command = "build"`
        // by parent and then `command = "serve"` by child, which some plugins
        // may respond to by updating state referenced by the parent.
        if (!viteConfig.configFile) {
          throw new Error(
            "The Remix Vite plugin requires the use of a Vite config file"
          );
        }

        let vite = importViteEsmSync();

        let childCompilerConfigFile = await vite.loadConfigFromFile(
          {
            command: viteConfig.command,
            mode: viteConfig.mode,
            ...(isViteV4
              ? { ssrBuild: ssrBuildContext.isSsrBuild }
              : { isSsrBuild: ssrBuildContext.isSsrBuild }),
          },
          viteConfig.configFile
        );

        invariant(
          childCompilerConfigFile,
          "Vite config file was unable to be resolved for Remix child compiler"
        );

        viteChildCompiler = await vite.createServer({
          ...viteUserConfig,
          mode: viteConfig.mode,
          server: {
            watch: viteConfig.command === "build" ? null : undefined,
            preTransformRequests: false,
            hmr: false,
          },
          configFile: false,
          envFile: false,
          plugins: [
            ...(childCompilerConfigFile.config.plugins ?? [])
              .flat()
              // Exclude this plugin from the child compiler to prevent an
              // infinite loop (plugin creates a child compiler with the same
              // plugin that creates another child compiler, repeat ad
              // infinitum), and to prevent the manifest from being written to
              // disk from the child compiler. This is important in the
              // production build because the child compiler is a Vite dev
              // server and will generate incorrect manifests.
              .filter(
                (plugin) =>
                  typeof plugin === "object" &&
                  plugin !== null &&
                  "name" in plugin &&
                  plugin.name !== "remix" &&
                  plugin.name !== "remix-hmr-updates"
              ),
          ],
        });
        await viteChildCompiler.pluginContainer.buildStart({});
      },
      async transform(code, id) {
        if (isCssModulesFile(id)) {
          cssModulesManifest[id] = code;
        }

        if (id.endsWith(CLIENT_ROUTE_QUERY_STRING)) {
          let routeModuleId = id.replace(CLIENT_ROUTE_QUERY_STRING, "");
          let sourceExports = await getRouteModuleExports(
            viteChildCompiler,
            remixConfig,
            routeModuleId
          );

          let routeFileName = path.basename(routeModuleId);
          let clientExports = sourceExports
            .filter((exportName) => CLIENT_ROUTE_EXPORTS.includes(exportName))
            .join(", ");

          return `export { ${clientExports} } from "./${routeFileName}";`;
        }
      },
      buildStart() {
        invariant(viteConfig);

        if (
          viteCommand === "build" &&
          viteConfig.mode === "production" &&
          !viteConfig.build.ssr &&
          viteConfig.build.sourcemap
        ) {
          viteConfig.logger.warn(
            colors.yellow(
              "\n" +
                colors.bold("  ⚠️  Source maps are enabled in production\n") +
                [
                  "This makes your server code publicly",
                  "visible in the browser. This is highly",
                  "discouraged! If you insist, ensure that",
                  "you are using environment variables for",
                  "secrets and not hard-coding them in",
                  "your source code.",
                ]
                  .map((line) => "     " + line)
                  .join("\n") +
                "\n"
            )
          );
        }
      },
      configureServer(viteDevServer) {
        setDevServerHooks({
          // Give the request handler access to the critical CSS in dev to avoid a
          // flash of unstyled content since Vite injects CSS file contents via JS
          getCriticalCss: async (build, url) => {
            return getStylesForUrl(
              viteDevServer,
              remixConfig,
              cssModulesManifest,
              build,
              url
            );
          },
          // If an error is caught within the request handler, let Vite fix the
          // stack trace so it maps back to the actual source code
          processRequestError: (error) => {
            if (error instanceof Error) {
              viteDevServer.ssrFixStacktrace(error);
            }
          },
        });

        // Invalidate virtual modules and update cached plugin config via file watcher
        viteDevServer.watcher.on("all", async (eventName, filepath) => {
          let { normalizePath } = importViteEsmSync();

          let appFileAddedOrRemoved =
            (eventName === "add" || eventName === "unlink") &&
            normalizePath(filepath).startsWith(
              normalizePath(remixConfig.appDirectory)
            );

          invariant(viteConfig?.configFile);
          let viteConfigChanged =
            eventName === "change" &&
            normalizePath(filepath) === normalizePath(viteConfig.configFile);

          if (appFileAddedOrRemoved || viteConfigChanged) {
            let lastPluginConfig = remixConfig;
            remixConfig = await resolvePluginConfig();

            if (!isEqualJson(lastPluginConfig, remixConfig)) {
              invalidateVirtualModules(viteDevServer);
            }
          }
        });

        return () => {
          // Let user servers handle SSR requests in middleware mode,
          // otherwise the Vite plugin will handle the request
          if (!viteDevServer.config.server.middlewareMode) {
            viteDevServer.middlewares.use(async (req, res, next) => {
              try {
                let build = (await viteDevServer.ssrLoadModule(
                  serverBuildId
                )) as ServerBuild;

                let handle = createRequestHandler(build, {
                  mode: "development",
                });

                await handle(req, res);
              } catch (error) {
                next(error);
              }
            });
          }
        };
      },
      writeBundle: {
        // After the SSR build is finished, we inspect the Vite manifest for
        // the SSR build and move server-only assets to client assets directory
        async handler() {
          if (!ssrBuildContext.isSsrBuild) {
            return;
          }

          invariant(viteConfig);

          let { serverBuildFile, rootDirectory } = remixConfig;
          let serverBuildDirectory = getServerBuildDirectory(remixConfig);
          let clientBuildDirectory = getClientBuildDirectory(remixConfig);

          let ssrViteManifest = await loadViteManifest(serverBuildDirectory);
          let clientViteManifest = await loadViteManifest(clientBuildDirectory);

          let clientAssetPaths = new Set(
            Object.values(clientViteManifest).flatMap(
              (chunk) => chunk.assets ?? []
            )
          );

          let ssrAssetPaths = new Set(
            Object.values(ssrViteManifest).flatMap(
              (chunk) => chunk.assets ?? []
            )
          );

          // We only move assets that aren't in the client build, otherwise we
          // remove them. These assets only exist because we explicitly set
          // `ssrEmitAssets: true` in the SSR Vite config. These assets
          // typically wouldn't exist by default, which is why we assume it's
          // safe to remove them. We're aiming for a clean build output so that
          // unnecessary assets don't get deployed alongside the server code.
          let movedAssetPaths: string[] = [];
          for (let ssrAssetPath of ssrAssetPaths) {
            let src = path.join(serverBuildDirectory, ssrAssetPath);
            if (!clientAssetPaths.has(ssrAssetPath)) {
              let dest = path.join(clientBuildDirectory, ssrAssetPath);
              await fse.move(src, dest);
              movedAssetPaths.push(dest);
            } else {
              await fse.remove(src);
            }
          }

          // We assume CSS files from the SSR build are unnecessary and remove
          // them for the same reasons as above.
          let ssrCssPaths = Object.values(ssrViteManifest).flatMap(
            (chunk) => chunk.css ?? []
          );
          await Promise.all(
            ssrCssPaths.map((cssPath) =>
              fse.remove(path.join(serverBuildDirectory, cssPath))
            )
          );

          if (movedAssetPaths.length) {
            viteConfig.logger.info(
              [
                "",
                `${colors.green("✓")} ${movedAssetPaths.length} asset${
                  movedAssetPaths.length > 1 ? "s" : ""
                } moved from Remix server build to client assets.`,
                ...movedAssetPaths.map((movedAssetPath) =>
                  colors.dim(path.relative(rootDirectory, movedAssetPath))
                ),
                "",
              ].join("\n")
            );
          }

          if (!remixConfig.ssr) {
            await handleSpaMode(
              serverBuildDirectory,
              serverBuildFile,
              clientBuildDirectory,
              viteConfig
            );
          }
        },
      },
      async buildEnd() {
        await viteChildCompiler?.close();
      },
    },
    {
      name: "remix-virtual-modules",
      enforce: "pre",
      resolveId(id) {
        if (vmods.includes(id)) return VirtualModule.resolve(id);
      },
      async load(id) {
        switch (id) {
          case VirtualModule.resolve(serverBuildId): {
            return await getServerEntry();
          }
          case VirtualModule.resolve(serverManifestId): {
            let browserManifest = ssrBuildContext.isSsrBuild
              ? await ssrBuildContext.getBrowserManifest()
              : await getBrowserManifestForDev();

            return `export default ${jsesc(browserManifest, { es6: true })};`;
          }
          case VirtualModule.resolve(browserManifestId): {
            if (viteCommand === "build") {
              throw new Error("This module only exists in development");
            }

            let browserManifest = await getBrowserManifestForDev();
            let browserManifestString = jsesc(browserManifest, { es6: true });

            return `window.__remixManifest=${browserManifestString};`;
          }
        }
      },
    },
    {
      name: "remix-dot-server",
      enforce: "pre",
      async resolveId(id, importer, options) {
        if (options?.ssr) return;

        let isResolving = options?.custom?.["remix-dot-server"] ?? false;
        if (isResolving) return;
        options.custom = { ...options.custom, "remix-dot-server": true };
        let resolved = await this.resolve(id, importer, options);
        if (!resolved) return;

        let serverFileRE = /\.server(\.[cm]?[jt]sx?)?$/;
        let serverDirRE = /\/\.server\//;
        let isDotServer =
          serverFileRE.test(resolved!.id) || serverDirRE.test(resolved!.id);
        if (!isDotServer) return;

        if (!importer) return;
        if (viteCommand !== "build" && importer.endsWith(".html")) {
          // Vite has a special `index.html` importer for `resolveId` within `transformRequest`
          // https://github.com/vitejs/vite/blob/5684fcd8d27110d098b3e1c19d851f44251588f1/packages/vite/src/node/server/transformRequest.ts#L158
          // https://github.com/vitejs/vite/blob/5684fcd8d27110d098b3e1c19d851f44251588f1/packages/vite/src/node/server/pluginContainer.ts#L668
          return;
        }

        let vite = importViteEsmSync();
        let importerShort = vite.normalizePath(
          path.relative(remixConfig.rootDirectory, importer)
        );
        let isRoute = getRoute(remixConfig, importer);

        if (isRoute) {
          let serverOnlyExports = SERVER_ONLY_ROUTE_EXPORTS.map(
            (xport) => `\`${xport}\``
          ).join(", ");
          throw Error(
            [
              colors.red(`Server-only module referenced by client`),
              "",
              `    '${id}' imported by route '${importerShort}'`,
              "",
              `  Remix automatically removes server-code from these exports:`,
              `    ${serverOnlyExports}`,
              "",
              `  But other route exports in '${importerShort}' depend on '${id}'.`,
              "",
              "  See https://remix.run/docs/en/main/future/vite#splitting-up-client-and-server-code",
              "",
            ].join("\n")
          );
        }

        throw Error(
          [
            colors.red(`Server-only module referenced by client`),
            "",
            `    '${id}' imported by '${importerShort}'`,
            "",
            "  See https://remix.run/docs/en/main/future/vite#splitting-up-client-and-server-code",
            "",
          ].join("\n")
        );
      },
    },
    {
      name: "remix-dot-client",
      enforce: "post",
      async transform(code, id, options) {
        if (!options?.ssr) return;
        let clientFileRE = /\.client(\.[cm]?[jt]sx?)?$/;
        let clientDirRE = /\/\.client\//;
        if (clientFileRE.test(id) || clientDirRE.test(id)) {
          let exports = esModuleLexer(code)[1];
          return {
            code: exports
              .map(({ n: name }) =>
                name === "default"
                  ? "export default undefined;"
                  : `export const ${name} = undefined;`
              )
              .join("\n"),
            map: null,
          };
        }
      },
    },
    {
      name: "remix-route-exports",
      enforce: "post", // Ensure we're operating on the transformed code to support MDX etc.
      async transform(code, id, options) {
        if (options?.ssr) return;

        let route = getRoute(remixConfig, id);
        if (!route) return;

        if (!remixConfig.ssr) {
          let serverOnlyExports = esModuleLexer(code)[1]
            .map((exp) => exp.n)
            .filter((exp) => SERVER_ONLY_ROUTE_EXPORTS.includes(exp));
          if (serverOnlyExports.length > 0) {
            let str = serverOnlyExports.map((e) => `\`${e}\``).join(", ");
            let message =
              `SPA Mode: ${serverOnlyExports.length} invalid route export(s) in ` +
              `\`${route.file}\`: ${str}. See https://remix.run/future/spa-mode ` +
              `for more information.`;
            throw Error(message);
          }

          if (route.id !== "root") {
            let hasHydrateFallback = esModuleLexer(code)[1]
              .map((exp) => exp.n)
              .some((exp) => exp === "HydrateFallback");
            if (hasHydrateFallback) {
              let message =
                `SPA Mode: Invalid \`HydrateFallback\` export found in ` +
                `\`${route.file}\`. \`HydrateFallback\` is only permitted on ` +
                `the root route in SPA Mode. See https://remix.run/future/spa-mode ` +
                `for more information.`;
              throw Error(message);
            }
          }
        }

        return {
          code: removeExports(code, SERVER_ONLY_ROUTE_EXPORTS),
          map: null,
        };
      },
    },
    {
      name: "remix-remix-react-proxy",
      enforce: "post", // Ensure we're operating on the transformed code to support MDX etc.
      resolveId(id) {
        if (id === remixReactProxyId) {
          return VirtualModule.resolve(remixReactProxyId);
        }
      },
      transform(code, id) {
        // Don't transform the proxy itself, otherwise it will import itself
        if (id === VirtualModule.resolve(remixReactProxyId)) {
          return;
        }

        let hasLiveReloadHints =
          code.includes("LiveReload") && code.includes("@remix-run/react");

        // Don't transform files that don't need the proxy
        if (!hasLiveReloadHints) {
          return;
        }

        // Rewrite imports to use the proxy
        return replaceImportSpecifier({
          code,
          specifier: "@remix-run/react",
          replaceWith: remixReactProxyId,
        });
      },
      load(id) {
        if (id === VirtualModule.resolve(remixReactProxyId)) {
          // TODO: ensure react refresh is initialized before `<Scripts />`
          return [
            'import { createElement } from "react";',
            'export * from "@remix-run/react";',
            `export const LiveReload = ${
              viteCommand !== "serve"
            } ? () => null : `,
            '({ nonce = undefined }) => createElement("script", {',
            "  nonce,",
            "  dangerouslySetInnerHTML: { ",
            "    __html: `window.__remixLiveReloadEnabled = true`",
            "  }",
            "});",
          ].join("\n");
        }
      },
    },
    {
      name: "remix-inject-hmr-runtime",
      enforce: "pre",
      resolveId(id) {
        if (id === injectHmrRuntimeId)
          return VirtualModule.resolve(injectHmrRuntimeId);
      },
      async load(id) {
        if (id !== VirtualModule.resolve(injectHmrRuntimeId)) return;

        return [
          `import RefreshRuntime from "${hmrRuntimeId}"`,
          "RefreshRuntime.injectIntoGlobalHook(window)",
          "window.$RefreshReg$ = () => {}",
          "window.$RefreshSig$ = () => (type) => type",
          "window.__vite_plugin_react_preamble_installed__ = true",
        ].join("\n");
      },
    },
    {
      name: "remix-hmr-runtime",
      enforce: "pre",
      resolveId(id) {
        if (id === hmrRuntimeId) return VirtualModule.resolve(hmrRuntimeId);
      },
      async load(id) {
        if (id !== VirtualModule.resolve(hmrRuntimeId)) return;

        let reactRefreshDir = path.dirname(
          require.resolve("react-refresh/package.json")
        );
        let reactRefreshRuntimePath = path.join(
          reactRefreshDir,
          "cjs/react-refresh-runtime.development.js"
        );

        return [
          "const exports = {}",
          await fse.readFile(reactRefreshRuntimePath, "utf8"),
          await fse.readFile(
            require.resolve("./static/refresh-utils.cjs"),
            "utf8"
          ),
          "export default exports",
        ].join("\n");
      },
    },
    {
      name: "remix-react-refresh-babel",
      enforce: "post", // jsx and typescript (in ts, jsx, tsx files) are already transpiled by vite
      async transform(code, id, options) {
        if (viteCommand !== "serve") return;
        if (id.includes("/node_modules/")) return;

        let [filepath] = id.split("?");
        if (!/.[tj]sx?$/.test(filepath)) return;

        let devRuntime = "react/jsx-dev-runtime";
        let ssr = options?.ssr === true;
        let isJSX = filepath.endsWith("x");
        let useFastRefresh = !ssr && (isJSX || code.includes(devRuntime));
        if (!useFastRefresh) return;

        if (id.endsWith(CLIENT_ROUTE_QUERY_STRING)) {
          return { code: addRefreshWrapper(remixConfig, code, id) };
        }

        let result = await babel.transformAsync(code, {
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
        let refreshContentRE = /\$Refresh(?:Reg|Sig)\$\(/;
        if (refreshContentRE.test(code)) {
          code = addRefreshWrapper(remixConfig, code, id);
        }
        return { code, map: result.map };
      },
    },
    {
      name: "remix-hmr-updates",
      async handleHotUpdate({ server, file, modules, read }) {
        let route = getRoute(remixConfig, file);

        type ManifestRoute = BrowserManifest["routes"][string];
        type HmrEventData = { route: ManifestRoute | null };
        let hmrEventData: HmrEventData = { route: null };

        if (route) {
          // invalidate manifest on route exports change
          let serverManifest = (await server.ssrLoadModule(serverManifestId))
            .default as BrowserManifest;

          let oldRouteMetadata = serverManifest.routes[route.id];
          let newRouteMetadata = await getRouteMetadata(
            remixConfig,
            viteChildCompiler,
            route,
            read
          );

          hmrEventData.route = newRouteMetadata;

          if (
            !oldRouteMetadata ||
            (
              [
                "hasLoader",
                "hasClientLoader",
                "hasAction",
                "hasClientAction",
                "hasErrorBoundary",
              ] as const
            ).some((key) => oldRouteMetadata[key] !== newRouteMetadata[key])
          ) {
            invalidateVirtualModules(server);
          }
        }

        server.ws.send({
          type: "custom",
          event: "remix:hmr",
          data: hmrEventData,
        });

        return modules;
      },
    },
  ];
};

function isEqualJson(v1: unknown, v2: unknown) {
  return JSON.stringify(v1) === JSON.stringify(v2);
}

function addRefreshWrapper(
  pluginConfig: ResolvedVitePluginConfig,
  code: string,
  id: string
): string {
  let isRoute = getRoute(pluginConfig, id);
  let acceptExports = isRoute
    ? [
        "clientAction",
        "clientLoader",
        "handle",
        "meta",
        "links",
        "shouldRevalidate",
      ]
    : [];
  return (
    REACT_REFRESH_HEADER.replace("__SOURCE__", JSON.stringify(id)) +
    code +
    REACT_REFRESH_FOOTER.replace("__SOURCE__", JSON.stringify(id)).replace(
      "__ACCEPT_EXPORTS__",
      JSON.stringify(acceptExports)
    )
  );
}

const REACT_REFRESH_HEADER = `
import RefreshRuntime from "${hmrRuntimeId}";

const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
let prevRefreshReg;
let prevRefreshSig;

if (import.meta.hot && !inWebWorker && window.__remixLiveReloadEnabled) {
  if (!window.__vite_plugin_react_preamble_installed__) {
    throw new Error(
      "Remix Vite plugin can't detect preamble. Something is wrong."
    );
  }

  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    RefreshRuntime.register(type, __SOURCE__ + " " + id)
  };
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}`.replace(/\n+/g, "");

const REACT_REFRESH_FOOTER = `
if (import.meta.hot && !inWebWorker && window.__remixLiveReloadEnabled) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh(__SOURCE__, currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate(currentExports, nextExports, __ACCEPT_EXPORTS__);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}`;

function getRoute(
  pluginConfig: ResolvedVitePluginConfig,
  file: string
): ConfigRoute | undefined {
  let vite = importViteEsmSync();
  if (!file.startsWith(vite.normalizePath(pluginConfig.appDirectory))) return;
  let routePath = vite.normalizePath(
    path.relative(pluginConfig.appDirectory, file)
  );
  let route = Object.values(pluginConfig.routes).find(
    (r) => r.file === routePath
  );
  return route;
}

async function getRouteMetadata(
  pluginConfig: ResolvedVitePluginConfig,
  viteChildCompiler: Vite.ViteDevServer | null,
  route: ConfigRoute,
  readRouteFile?: () => string | Promise<string>
) {
  let sourceExports = await getRouteModuleExports(
    viteChildCompiler,
    pluginConfig,
    route.file,
    readRouteFile
  );

  let info = {
    id: route.id,
    parentId: route.parentId,
    path: route.path,
    index: route.index,
    caseSensitive: route.caseSensitive,
    url:
      "/" +
      path.relative(
        pluginConfig.rootDirectory,
        resolveRelativeRouteFilePath(route, pluginConfig)
      ),
    module: `${resolveFileUrl(
      pluginConfig,
      resolveRelativeRouteFilePath(route, pluginConfig)
    )}?import`, // Ensure the Vite dev server responds with a JS module
    hasAction: sourceExports.includes("action"),
    hasClientAction: sourceExports.includes("clientAction"),
    hasLoader: sourceExports.includes("loader"),
    hasClientLoader: sourceExports.includes("clientLoader"),
    hasErrorBoundary: sourceExports.includes("ErrorBoundary"),
    imports: [],
  };
  return info;
}

async function handleSpaMode(
  serverBuildDirectoryPath: string,
  serverBuildFile: string,
  clientBuildDirectory: string,
  viteConfig: Vite.ResolvedConfig
) {
  // Create a handler and call it for the `/` path - rendering down to the
  // proper HydrateFallback ... or not!  Maybe they have a static landing page
  // generated from routes/_index.tsx.
  let serverBuildPath = path.join(serverBuildDirectoryPath, serverBuildFile);
  let build = await import(url.pathToFileURL(serverBuildPath).toString());
  let { createRequestHandler: createHandler } = await import("@remix-run/node");
  let handler = createHandler(build, viteConfig.mode);
  let response = await handler(new Request("http://localhost/"));
  let html = await response.text();
  if (response.status !== 200) {
    throw new Error(
      `SPA Mode: Received a ${response.status} status code from ` +
        `\`entry.server.tsx\` while generating the \`index.html\` file.\n${html}`
    );
  }

  if (
    !html.includes("window.__remixContext =") ||
    !html.includes("window.__remixRouteModules =")
  ) {
    throw new Error(
      "SPA Mode: Did you forget to include <Scripts/> in your `root.tsx` " +
        "`HydrateFallback` component?  Your `index.html` file cannot hydrate " +
        "into a SPA without `<Scripts />`."
    );
  }

  // Write out the index.html file for the SPA
  await fse.writeFile(path.join(clientBuildDirectory, "index.html"), html);

  viteConfig.logger.info(
    "SPA Mode: index.html has been written to your " +
      colors.bold(path.relative(process.cwd(), clientBuildDirectory)) +
      " directory"
  );

  // Cleanup - we no longer need the server build assets
  fse.removeSync(serverBuildDirectoryPath);
}
