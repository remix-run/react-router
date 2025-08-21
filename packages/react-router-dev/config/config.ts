import fs from "node:fs";
import { execSync } from "node:child_process";
import PackageJson from "@npmcli/package-json";
import * as ViteNode from "../vite/vite-node";
import type * as Vite from "vite";
import Path from "pathe";
import chokidar, {
  type FSWatcher,
  type EmitArgs as ChokidarEmitArgs,
} from "chokidar";
import colors from "picocolors";
import pick from "lodash/pick";
import omit from "lodash/omit";
import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";

import {
  type RouteManifest,
  type RouteManifestEntry,
  type RouteConfigEntry,
  setAppDirectory,
  validateRouteConfig,
  configRoutesToRouteManifest,
} from "./routes";
import { detectPackageManager } from "../cli/detectPackageManager";

const excludedConfigPresetKeys = ["presets"] as const satisfies ReadonlyArray<
  keyof ReactRouterConfig
>;

type ExcludedConfigPresetKey = (typeof excludedConfigPresetKeys)[number];

type ConfigPreset = Omit<ReactRouterConfig, ExcludedConfigPresetKey>;

export type Preset = {
  name: string;
  reactRouterConfig?: (args: {
    reactRouterUserConfig: ReactRouterConfig;
  }) => ConfigPreset | Promise<ConfigPreset>;
  reactRouterConfigResolved?: (args: {
    reactRouterConfig: ResolvedReactRouterConfig;
  }) => void | Promise<void>;
};

// Only expose a subset of route properties to the "serverBundles" function
const branchRouteProperties = [
  "id",
  "path",
  "file",
  "index",
] as const satisfies ReadonlyArray<keyof RouteManifestEntry>;
type BranchRoute = Pick<
  RouteManifestEntry,
  (typeof branchRouteProperties)[number]
>;

export const configRouteToBranchRoute = (
  configRoute: RouteManifestEntry,
): BranchRoute => pick(configRoute, branchRouteProperties);

export type ServerBundlesFunction = (args: {
  branch: BranchRoute[];
}) => string | Promise<string>;

type BaseBuildManifest = {
  routes: RouteManifest;
};

type DefaultBuildManifest = BaseBuildManifest & {
  serverBundles?: never;
  routeIdToServerBundleId?: never;
};

type ServerBundlesBuildManifest = BaseBuildManifest & {
  serverBundles: {
    [serverBundleId: string]: {
      id: string;
      file: string;
    };
  };
  routeIdToServerBundleId: Record<string, string>;
};

type ServerModuleFormat = "esm" | "cjs";

interface FutureConfig {
  /**
   * Enable route middleware
   */
  v8_middleware: boolean;
  unstable_optimizeDeps: boolean;
  /**
   * Automatically split route modules into multiple chunks when possible.
   */
  unstable_splitRouteModules: boolean | "enforce";
  unstable_subResourceIntegrity: boolean;
  /**
   * Use Vite Environment API (experimental)
   */
  unstable_viteEnvironmentApi: boolean;
}

export type BuildManifest = DefaultBuildManifest | ServerBundlesBuildManifest;

type BuildEndHook = (args: {
  buildManifest: BuildManifest | undefined;
  reactRouterConfig: ResolvedReactRouterConfig;
  viteConfig: Vite.ResolvedConfig;
}) => void | Promise<void>;

/**
 * Config to be exported via the default export from `react-router.config.ts`.
 */
export type ReactRouterConfig = {
  /**
   * The path to the `app` directory, relative to the root directory. Defaults
   * to `"app"`.
   */
  appDirectory?: string;

  /**
   * The output format of the server build. Defaults to "esm".
   */
  serverModuleFormat?: ServerModuleFormat;

  /**
   * Enabled future flags
   */
  future?: [keyof FutureConfig] extends [never]
    ? // Partial<FutureConfig> doesn't work when it's empty so just prevent any keys
      { [key: string]: never }
    : Partial<FutureConfig>;

  /**
   * The React Router app basename.  Defaults to `"/"`.
   */
  basename?: string;
  /**
   * The path to the build directory, relative to the project. Defaults to
   * `"build"`.
   */
  buildDirectory?: string;
  /**
   * A function that is called after the full React Router build is complete.
   */
  buildEnd?: BuildEndHook;
  /**
   * An array of URLs to prerender to HTML files at build time.  Can also be a
   * function returning an array to dynamically generate URLs.
   */
  prerender?:
    | boolean
    | Array<string>
    | ((args: {
        getStaticPaths: () => string[];
      }) => Array<string> | Promise<Array<string>>);
  /**
   * An array of React Router plugin config presets to ease integration with
   * other platforms and tools.
   */
  presets?: Array<Preset>;
  /**
   * Control the "Lazy Route Discovery" behavior
   *
   * - `routeDiscovery.mode`: By default, this resolves to `lazy` which will
   *   lazily discover routes as the user navigates around your application.
   *   You can set this to `initial` to opt-out of this behavior and load all
   *   routes with the initial HTML document load.
   * - `routeDiscovery.manifestPath`: The path to serve the manifest file from.
   *    Only applies to `mode: "lazy"` and defaults to `/__manifest`.
   */
  routeDiscovery?:
    | {
        mode: "lazy";
        manifestPath?: string;
      }
    | {
        mode: "initial";
      };
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
  serverBundles?: ServerBundlesFunction;
  /**
   * Enable server-side rendering for your application. Disable to use "SPA
   * Mode", which will request the `/` path at build-time and save it as an
   * `index.html` file with your assets so your application can be deployed as a
   * SPA without server-rendering. Default's to `true`.
   */
  ssr?: boolean;
};

export type ResolvedReactRouterConfig = Readonly<{
  /**
   * The absolute path to the application source directory.
   */
  appDirectory: string;
  /**
   * The React Router app basename.  Defaults to `"/"`.
   */
  basename: string;
  /**
   * The absolute path to the build directory.
   */
  buildDirectory: string;
  /**
   * A function that is called after the full React Router build is complete.
   */
  buildEnd?: BuildEndHook;
  /**
   * Enabled future flags
   */
  future: FutureConfig;
  /**
   * An array of URLs to prerender to HTML files at build time.  Can also be a
   * function returning an array to dynamically generate URLs.
   */
  prerender: ReactRouterConfig["prerender"];
  /**
   * Control the "Lazy Route Discovery" behavior
   *
   * - `routeDiscovery.mode`: By default, this resolves to `lazy` which will
   *   lazily discover routes as the user navigates around your application.
   *   You can set this to `initial` to opt-out of this behavior and load all
   *   routes with the initial HTML document load.
   * - `routeDiscovery.manifestPath`: The path to serve the manifest file from.
   *    Only applies to `mode: "lazy"` and defaults to `/__manifest`.
   */
  routeDiscovery: ReactRouterConfig["routeDiscovery"];
  /**
   * An object of all available routes, keyed by route id.
   */
  routes: RouteManifest;
  /**
   * The file name of the server build output. This file
   * should end in a `.js` extension and should be deployed to your server.
   * Defaults to `"index.js"`.
   */
  serverBuildFile: string;
  /**
   * A function for assigning routes to different server bundles. This
   * function should return a server bundle ID which will be used as the
   * bundle's directory name within the server build directory.
   */
  serverBundles?: ServerBundlesFunction;
  /**
   * The output format of the server build. Defaults to "esm".
   */
  serverModuleFormat: ServerModuleFormat;
  /**
   * Enable server-side rendering for your application. Disable to use "SPA
   * Mode", which will request the `/` path at build-time and save it as an
   * `index.html` file with your assets so your application can be deployed as a
   * SPA without server-rendering. Default's to `true`.
   */
  ssr: boolean;
  /**
   * The resolved array of route config entries exported from `routes.ts`
   */
  unstable_routeConfig: RouteConfigEntry[];
}>;

let mergeReactRouterConfig = (
  ...configs: ReactRouterConfig[]
): ReactRouterConfig => {
  let reducer = (
    configA: ReactRouterConfig,
    configB: ReactRouterConfig,
  ): ReactRouterConfig => {
    let mergeRequired = (key: keyof ReactRouterConfig) =>
      configA[key] !== undefined && configB[key] !== undefined;

    return {
      ...configA,
      ...configB,
      ...(mergeRequired("buildEnd")
        ? {
            buildEnd: async (...args) => {
              await Promise.all([
                configA.buildEnd?.(...args),
                configB.buildEnd?.(...args),
              ]);
            },
          }
        : {}),
      ...(mergeRequired("future")
        ? {
            future: {
              ...configA.future,
              ...configB.future,
            },
          }
        : {}),
      ...(mergeRequired("presets")
        ? {
            presets: [...(configA.presets ?? []), ...(configB.presets ?? [])],
          }
        : {}),
    };
  };

  return configs.reduce(reducer, {});
};

// Inlined from https://github.com/jsdf/deep-freeze
let deepFreeze = (o: any) => {
  Object.freeze(o);
  let oIsFunction = typeof o === "function";
  let hasOwnProp = Object.prototype.hasOwnProperty;
  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (
      hasOwnProp.call(o, prop) &&
      (oIsFunction
        ? prop !== "caller" && prop !== "callee" && prop !== "arguments"
        : true) &&
      o[prop] !== null &&
      (typeof o[prop] === "object" || typeof o[prop] === "function") &&
      !Object.isFrozen(o[prop])
    ) {
      deepFreeze(o[prop]);
    }
  });
  return o;
};

type Result<T> =
  | {
      ok: true;
      value: T;
      error?: undefined;
    }
  | {
      ok: false;
      value?: undefined;
      error: string;
    };

function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

function err<T>(error: string): Result<T> {
  return { ok: false, error };
}

async function resolveConfig({
  root,
  viteNodeContext,
  reactRouterConfigFile,
  skipRoutes,
}: {
  root: string;
  viteNodeContext: ViteNode.Context;
  reactRouterConfigFile?: string;
  skipRoutes?: boolean;
}): Promise<Result<ResolvedReactRouterConfig>> {
  let reactRouterUserConfig: ReactRouterConfig = {};

  if (reactRouterConfigFile) {
    try {
      if (!fs.existsSync(reactRouterConfigFile)) {
        return err(`${reactRouterConfigFile} no longer exists`);
      }

      let configModule = await viteNodeContext.runner.executeFile(
        reactRouterConfigFile,
      );

      if (configModule.default === undefined) {
        return err(`${reactRouterConfigFile} must provide a default export`);
      }

      if (typeof configModule.default !== "object") {
        return err(`${reactRouterConfigFile} must export a config`);
      }

      reactRouterUserConfig = configModule.default;
    } catch (error) {
      return err(`Error loading ${reactRouterConfigFile}: ${error}`);
    }
  }

  // Prevent mutations to the user config
  reactRouterUserConfig = deepFreeze(cloneDeep(reactRouterUserConfig));

  let presets: ReactRouterConfig[] = (
    await Promise.all(
      (reactRouterUserConfig.presets ?? []).map(async (preset) => {
        if (!preset.name) {
          throw new Error(
            "React Router presets must have a `name` property defined.",
          );
        }

        if (!preset.reactRouterConfig) {
          return null;
        }

        let configPreset: ReactRouterConfig = omit(
          await preset.reactRouterConfig({ reactRouterUserConfig }),
          excludedConfigPresetKeys,
        );

        return configPreset;
      }),
    )
  ).filter(function isNotNull<T>(value: T | null): value is T {
    return value !== null;
  });

  let defaults = {
    basename: "/",
    buildDirectory: "build",
    serverBuildFile: "index.js",
    serverModuleFormat: "esm",
    ssr: true,
  } as const satisfies Partial<ReactRouterConfig>;

  let userAndPresetConfigs = mergeReactRouterConfig(
    ...presets,
    reactRouterUserConfig,
  );

  let {
    appDirectory: userAppDirectory,
    basename,
    buildDirectory: userBuildDirectory,
    buildEnd,
    prerender,
    routeDiscovery: userRouteDiscovery,
    serverBuildFile,
    serverBundles,
    serverModuleFormat,
    ssr,
  } = {
    ...defaults, // Default values should be completely overridden by user/preset config, not merged
    ...userAndPresetConfigs,
  };

  if (!ssr && serverBundles) {
    serverBundles = undefined;
  }

  let isValidPrerenderConfig =
    prerender == null ||
    typeof prerender === "boolean" ||
    Array.isArray(prerender) ||
    typeof prerender === "function";

  if (!isValidPrerenderConfig) {
    return err(
      "The `prerender` config must be a boolean, an array of string paths, " +
        "or a function returning a boolean or array of string paths",
    );
  }

  let routeDiscovery: ResolvedReactRouterConfig["routeDiscovery"];
  if (userRouteDiscovery == null) {
    if (ssr) {
      routeDiscovery = {
        mode: "lazy",
        manifestPath: "/__manifest",
      };
    } else {
      routeDiscovery = { mode: "initial" };
    }
  } else if (userRouteDiscovery.mode === "initial") {
    routeDiscovery = userRouteDiscovery;
  } else if (userRouteDiscovery.mode === "lazy") {
    if (!ssr) {
      return err(
        'The `routeDiscovery.mode` config cannot be set to "lazy" when setting `ssr:false`',
      );
    }

    let { manifestPath } = userRouteDiscovery;
    if (manifestPath != null && !manifestPath.startsWith("/")) {
      return err(
        "The `routeDiscovery.manifestPath` config must be a root-relative " +
          'pathname beginning with a slash (i.e., "/__manifest")',
      );
    }

    routeDiscovery = userRouteDiscovery;
  }

  let appDirectory = Path.resolve(root, userAppDirectory || "app");
  let buildDirectory = Path.resolve(root, userBuildDirectory);

  let rootRouteFile = findEntry(appDirectory, "root");
  if (!rootRouteFile) {
    let rootRouteDisplayPath = Path.relative(
      root,
      Path.join(appDirectory, "root.tsx"),
    );
    return err(
      `Could not find a root route module in the app directory as "${rootRouteDisplayPath}"`,
    );
  }

  let routes: RouteManifest;
  let routeConfig: RouteConfigEntry[] = [];

  if (skipRoutes) {
    routes = {};
  } else {
    let routeConfigFile = findEntry(appDirectory, "routes");

    try {
      if (!routeConfigFile) {
        let routeConfigDisplayPath = Path.relative(
          root,
          Path.join(appDirectory, "routes.ts"),
        );
        return err(
          `Route config file not found at "${routeConfigDisplayPath}".`,
        );
      }

      setAppDirectory(appDirectory);
      let routeConfigExport = (
        await viteNodeContext.runner.executeFile(
          Path.join(appDirectory, routeConfigFile),
        )
      ).default;
      let result = validateRouteConfig({
        routeConfigFile,
        routeConfig: await routeConfigExport,
      });

      if (!result.valid) {
        return err(result.message);
      }

      // Nest the route config under the resolved root route
      routeConfig = [
        {
          id: "root",
          path: "",
          file: rootRouteFile,
          children: result.routeConfig,
        },
      ];

      routes = configRoutesToRouteManifest(appDirectory, routeConfig);
    } catch (error: any) {
      return err(
        [
          colors.red(`Route config in "${routeConfigFile}" is invalid.`),
          "",
          error.loc?.file && error.loc?.column && error.frame
            ? [
                Path.relative(appDirectory, error.loc.file) +
                  ":" +
                  error.loc.line +
                  ":" +
                  error.loc.column,
                error.frame.trim?.(),
              ]
            : error.stack,
        ]
          .flat()
          .join("\n"),
      );
    }
  }

  let future: FutureConfig = {
    middleware: reactRouterUserConfig.future?.middleware ?? false,
    unstable_optimizeDeps:
      reactRouterUserConfig.future?.unstable_optimizeDeps ?? false,
    unstable_splitRouteModules:
      reactRouterUserConfig.future?.unstable_splitRouteModules ?? false,
    unstable_subResourceIntegrity:
      reactRouterUserConfig.future?.unstable_subResourceIntegrity ?? false,
    unstable_viteEnvironmentApi:
      reactRouterUserConfig.future?.unstable_viteEnvironmentApi ?? false,
  };

  let reactRouterConfig: ResolvedReactRouterConfig = deepFreeze({
    appDirectory,
    basename,
    buildDirectory,
    buildEnd,
    future,
    prerender,
    routes,
    routeDiscovery,
    serverBuildFile,
    serverBundles,
    serverModuleFormat,
    ssr,
    unstable_routeConfig: routeConfig,
  } satisfies ResolvedReactRouterConfig);

  for (let preset of reactRouterUserConfig.presets ?? []) {
    await preset.reactRouterConfigResolved?.({ reactRouterConfig });
  }

  return ok(reactRouterConfig);
}

type ChokidarEventName = ChokidarEmitArgs[0];

type ChangeHandler = (args: {
  result: Result<ResolvedReactRouterConfig>;
  configCodeChanged: boolean;
  routeConfigCodeChanged: boolean;
  configChanged: boolean;
  routeConfigChanged: boolean;
  path: string;
  event: ChokidarEventName;
}) => void;

export type ConfigLoader = {
  getConfig: () => Promise<Result<ResolvedReactRouterConfig>>;
  onChange: (handler: ChangeHandler) => () => void;
  close: () => Promise<void>;
};

export async function createConfigLoader({
  rootDirectory: root,
  watch,
  mode,
  skipRoutes,
}: {
  watch: boolean;
  rootDirectory?: string;
  mode: string;
  skipRoutes?: boolean;
}): Promise<ConfigLoader> {
  root = Path.normalize(root ?? process.env.REACT_ROUTER_ROOT ?? process.cwd());

  let vite = await import("vite");
  let viteNodeContext = await ViteNode.createContext({
    root,
    mode,
    // Filter out any info level logs from vite-node
    customLogger: vite.createLogger("warn", {
      prefix: "[react-router]",
    }),
  });

  let reactRouterConfigFile: string | undefined;

  let updateReactRouterConfigFile = () => {
    reactRouterConfigFile = findEntry(root, "react-router.config", {
      absolute: true,
    });
  };

  updateReactRouterConfigFile();

  let getConfig = () =>
    resolveConfig({ root, viteNodeContext, reactRouterConfigFile, skipRoutes });

  let appDirectory: string;

  let initialConfigResult = await getConfig();

  if (!initialConfigResult.ok) {
    throw new Error(initialConfigResult.error);
  }

  appDirectory = Path.normalize(initialConfigResult.value.appDirectory);

  let currentConfig = initialConfigResult.value;

  let fsWatcher: FSWatcher | undefined;
  let changeHandlers: ChangeHandler[] = [];

  return {
    getConfig,
    onChange: (handler: ChangeHandler) => {
      if (!watch) {
        throw new Error(
          "onChange is not supported when watch mode is disabled",
        );
      }

      changeHandlers.push(handler);

      if (!fsWatcher) {
        fsWatcher = chokidar.watch([root, appDirectory], {
          ignoreInitial: true,
          ignored: (path) => {
            let dirname = Path.dirname(path);

            return (
              !dirname.startsWith(appDirectory) &&
              // Ensure we're only watching files outside of the app directory
              // that are at the root level, not nested in subdirectories
              path !== root && // Watch the root directory itself
              dirname !== root // Watch files at the root level
            );
          },
        });

        fsWatcher.on("all", async (...args) => {
          let [event, rawFilepath] = args;
          let filepath = Path.normalize(rawFilepath);

          let fileAddedOrRemoved = event === "add" || event === "unlink";

          let appFileAddedOrRemoved =
            fileAddedOrRemoved &&
            filepath.startsWith(Path.normalize(appDirectory));

          let rootRelativeFilepath = Path.relative(root, filepath);

          let configFileAddedOrRemoved =
            fileAddedOrRemoved &&
            isEntryFile("react-router.config", rootRelativeFilepath);

          if (configFileAddedOrRemoved) {
            updateReactRouterConfigFile();
          }

          let moduleGraphChanged =
            configFileAddedOrRemoved ||
            Boolean(
              viteNodeContext.devServer?.moduleGraph.getModuleById(filepath),
            );

          // Bail out if no relevant changes detected
          if (!moduleGraphChanged && !appFileAddedOrRemoved) {
            return;
          }

          viteNodeContext.devServer?.moduleGraph.invalidateAll();
          viteNodeContext.runner?.moduleCache.clear();

          let result = await getConfig();

          let prevAppDirectory = appDirectory;
          appDirectory = Path.normalize(
            (result.value ?? currentConfig).appDirectory,
          );

          if (appDirectory !== prevAppDirectory) {
            fsWatcher!.unwatch(prevAppDirectory);
            fsWatcher!.add(appDirectory);
          }

          let configCodeChanged =
            configFileAddedOrRemoved ||
            (reactRouterConfigFile !== undefined &&
              isEntryFileDependency(
                viteNodeContext.devServer.moduleGraph,
                reactRouterConfigFile,
                filepath,
              ));

          let routeConfigFile = !skipRoutes
            ? findEntry(appDirectory, "routes", {
                absolute: true,
              })
            : undefined;
          let routeConfigCodeChanged =
            routeConfigFile !== undefined &&
            isEntryFileDependency(
              viteNodeContext.devServer.moduleGraph,
              routeConfigFile,
              filepath,
            );

          let configChanged =
            result.ok &&
            !isEqual(omitRoutes(currentConfig), omitRoutes(result.value));

          let routeConfigChanged =
            result.ok && !isEqual(currentConfig?.routes, result.value.routes);

          for (let handler of changeHandlers) {
            handler({
              result,
              configCodeChanged,
              routeConfigCodeChanged,
              configChanged,
              routeConfigChanged,
              path: filepath,
              event,
            });
          }

          if (result.ok) {
            currentConfig = result.value;
          }
        });
      }

      return () => {
        changeHandlers = changeHandlers.filter(
          (changeHandler) => changeHandler !== handler,
        );
      };
    },
    close: async () => {
      changeHandlers = [];
      await viteNodeContext.devServer.close();
      await fsWatcher?.close();
    },
  };
}

export async function loadConfig({
  rootDirectory,
  mode,
  skipRoutes,
}: {
  rootDirectory: string;
  mode: string;
  skipRoutes?: boolean;
}) {
  let configLoader = await createConfigLoader({
    rootDirectory,
    mode,
    skipRoutes,
    watch: false,
  });
  let config = await configLoader.getConfig();
  await configLoader.close();
  return config;
}

export async function resolveEntryFiles({
  rootDirectory,
  reactRouterConfig,
}: {
  rootDirectory: string;
  reactRouterConfig: ResolvedReactRouterConfig;
}) {
  let { appDirectory } = reactRouterConfig;

  let defaultsDirectory = Path.resolve(
    Path.dirname(require.resolve("@react-router/dev/package.json")),
    "dist",
    "config",
    "defaults",
  );

  let userEntryClientFile = findEntry(appDirectory, "entry.client");
  let userEntryServerFile = findEntry(appDirectory, "entry.server");

  let entryServerFile: string;
  let entryClientFile = userEntryClientFile || "entry.client.tsx";

  if (userEntryServerFile) {
    entryServerFile = userEntryServerFile;
  } else {
    let packageJsonPath = findEntry(rootDirectory, "package", {
      extensions: [".json"],
      absolute: true,
      walkParents: true,
    });

    if (!packageJsonPath) {
      throw new Error(
        `Could not find package.json in ${rootDirectory} or any of its parent directories. Please add a package.json, or provide a custom entry.server.tsx/jsx file in your app directory.`,
      );
    }

    let packageJsonDirectory = Path.dirname(packageJsonPath);
    let pkgJson = await PackageJson.load(packageJsonDirectory);
    let deps = pkgJson.content.dependencies ?? {};

    if (!deps["@react-router/node"]) {
      throw new Error(
        `Could not determine server runtime. Please install @react-router/node, or provide a custom entry.server.tsx/jsx file in your app directory.`,
      );
    }

    if (!deps["isbot"]) {
      console.log(
        "adding `isbot@5` to your package.json, you should commit this change",
      );

      pkgJson.update({
        dependencies: {
          ...pkgJson.content.dependencies,
          isbot: "^5",
        },
      });

      await pkgJson.save();

      let packageManager = detectPackageManager() ?? "npm";

      execSync(`${packageManager} install`, {
        cwd: packageJsonDirectory,
        stdio: "inherit",
      });
    }

    entryServerFile = `entry.server.node.tsx`;
  }

  let entryClientFilePath = userEntryClientFile
    ? Path.resolve(reactRouterConfig.appDirectory, userEntryClientFile)
    : Path.resolve(defaultsDirectory, entryClientFile);

  let entryServerFilePath = userEntryServerFile
    ? Path.resolve(reactRouterConfig.appDirectory, userEntryServerFile)
    : Path.resolve(defaultsDirectory, entryServerFile);

  return { entryClientFilePath, entryServerFilePath };
}

function omitRoutes(
  config: ResolvedReactRouterConfig,
): ResolvedReactRouterConfig {
  return {
    ...config,
    routes: {},
  };
}

const entryExts = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".mts"];

function isEntryFile(entryBasename: string, filename: string) {
  return entryExts.some((ext) => filename === `${entryBasename}${ext}`);
}

function findEntry(
  dir: string,
  basename: string,
  options?: {
    absolute?: boolean;
    extensions?: string[];
    walkParents?: boolean;
  },
): string | undefined {
  let currentDir = Path.resolve(dir);
  let { root } = Path.parse(currentDir);

  while (true) {
    for (let ext of options?.extensions ?? entryExts) {
      let file = Path.resolve(currentDir, basename + ext);
      if (fs.existsSync(file)) {
        return (options?.absolute ?? false) ? file : Path.relative(dir, file);
      }
    }

    if (!options?.walkParents) {
      return undefined;
    }

    let parentDir = Path.dirname(currentDir);
    // Break out when we've reached the root directory or we're about to get
    // stuck in a loop where `path.dirname` keeps returning "/"
    if (currentDir === root || parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

function isEntryFileDependency(
  moduleGraph: Vite.ModuleGraph,
  entryFilepath: string,
  filepath: string,
  visited = new Set<string>(),
): boolean {
  // Ensure normalized paths
  entryFilepath = Path.normalize(entryFilepath);
  filepath = Path.normalize(filepath);

  if (visited.has(filepath)) {
    return false;
  }

  visited.add(filepath);

  if (filepath === entryFilepath) {
    return true;
  }

  let mod = moduleGraph.getModuleById(filepath);

  if (!mod) {
    return false;
  }

  // Recursively check all importers to see if any of them are the entry file
  for (let importer of mod.importers) {
    if (!importer.id) {
      continue;
    }

    if (
      importer.id === entryFilepath ||
      isEntryFileDependency(moduleGraph, entryFilepath, importer.id, visited)
    ) {
      return true;
    }
  }

  return false;
}
