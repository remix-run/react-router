import fs from "node:fs";
import * as ViteNode from "../vite/vite-node";
import type * as Vite from "vite";
import path from "pathe";
import chokidar, {
  type FSWatcher,
  type EmitArgs as ChokidarEmitArgs,
} from "chokidar";
import colors from "picocolors";
import pick from "lodash/pick";
import omit from "lodash/omit";
import cloneDeep from "lodash/cloneDeep";

import {
  type RouteManifest,
  type RouteManifestEntry,
  type RouteConfig,
  setAppDirectory,
  validateRouteConfig,
  configRoutesToRouteManifest,
} from "./routes";
import { ssrExternals } from "../vite/ssr-externals";

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
  configRoute: RouteManifestEntry
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

export type ServerBundlesBuildManifest = BaseBuildManifest & {
  serverBundles: {
    [serverBundleId: string]: {
      id: string;
      file: string;
    };
  };
  routeIdToServerBundleId: Record<string, string>;
};

type ServerModuleFormat = "esm" | "cjs";

interface FutureConfig {}

export type BuildManifest = DefaultBuildManifest | ServerBundlesBuildManifest;

type BuildEndHook = (args: {
  buildManifest: BuildManifest | undefined;
  reactRouterConfig: ResolvedReactRouterConfig;
  viteConfig: Vite.ResolvedConfig;
}) => void | Promise<void>;

export type ReactRouterConfig = {
  /**
   * The path to the `app` directory, relative to `remix.config.js`. Defaults
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
}>;

let mergeReactRouterConfig = (
  ...configs: ReactRouterConfig[]
): ReactRouterConfig => {
  let reducer = (
    configA: ReactRouterConfig,
    configB: ReactRouterConfig
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
}: {
  root: string;
  viteNodeContext: ViteNode.Context;
  reactRouterConfigFile?: string;
}): Promise<Result<ResolvedReactRouterConfig>> {
  let reactRouterUserConfig: ReactRouterConfig = {};

  if (reactRouterConfigFile) {
    try {
      let configModule = await viteNodeContext.runner.executeFile(
        reactRouterConfigFile
      );

      if (typeof configModule.default !== "object") {
        return err(`${reactRouterConfigFile} must export an object`);
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
            "React Router presets must have a `name` property defined."
          );
        }

        if (!preset.reactRouterConfig) {
          return null;
        }

        let configPreset: ReactRouterConfig = omit(
          await preset.reactRouterConfig({ reactRouterUserConfig }),
          excludedConfigPresetKeys
        );

        return configPreset;
      })
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

  let {
    appDirectory: userAppDirectory,
    basename,
    buildDirectory: userBuildDirectory,
    buildEnd,
    prerender,
    serverBuildFile,
    serverBundles,
    serverModuleFormat,
    ssr,
  } = {
    ...defaults, // Default values should be completely overridden by user/preset config, not merged
    ...mergeReactRouterConfig(...presets, reactRouterUserConfig),
  };

  let isValidPrerenderConfig =
    prerender == null ||
    typeof prerender === "boolean" ||
    Array.isArray(prerender) ||
    typeof prerender === "function";

  if (!isValidPrerenderConfig) {
    return err(
      "The `prerender` config must be a boolean, an array of string paths, " +
        "or a function returning a boolean or array of string paths"
    );
  }

  let appDirectory = path.resolve(root, userAppDirectory || "app");
  let buildDirectory = path.resolve(root, userBuildDirectory);

  let rootRouteFile = findEntry(appDirectory, "root");
  if (!rootRouteFile) {
    let rootRouteDisplayPath = path.relative(
      root,
      path.join(appDirectory, "root.tsx")
    );
    return err(
      `Could not find a root route module in the app directory as "${rootRouteDisplayPath}"`
    );
  }

  let routes: RouteManifest = {
    root: { path: "", id: "root", file: rootRouteFile },
  };

  let routeConfigFile = findEntry(appDirectory, "routes");

  try {
    if (!routeConfigFile) {
      let routeConfigDisplayPath = path.normalize(
        path.relative(root, path.join(appDirectory, "routes.ts"))
      );
      return err(`Route config file not found at "${routeConfigDisplayPath}".`);
    }

    setAppDirectory(appDirectory);
    let routeConfigExport: RouteConfig = (
      await viteNodeContext.runner.executeFile(
        path.join(appDirectory, routeConfigFile)
      )
    ).routes;

    let routeConfig = await routeConfigExport;

    let result = validateRouteConfig({
      routeConfigFile,
      routeConfig,
    });

    if (!result.valid) {
      return err(result.message);
    }

    routes = {
      ...routes,
      ...configRoutesToRouteManifest(routeConfig),
    };
  } catch (error: any) {
    return err(
      [
        colors.red(`Route config in "${routeConfigFile}" is invalid.`),
        "",
        error.loc?.file && error.loc?.column && error.frame
          ? [
              path.relative(appDirectory, error.loc.file) +
                ":" +
                error.loc.line +
                ":" +
                error.loc.column,
              error.frame.trim?.(),
            ]
          : error.stack,
      ]
        .flat()
        .join("\n")
    );
  }

  let future: FutureConfig = {};

  let reactRouterConfig: ResolvedReactRouterConfig = deepFreeze({
    appDirectory,
    basename,
    buildDirectory,
    buildEnd,
    future,
    prerender,
    routes,
    serverBuildFile,
    serverBundles,
    serverModuleFormat,
    ssr,
  });

  for (let preset of reactRouterUserConfig.presets ?? []) {
    await preset.reactRouterConfigResolved?.({ reactRouterConfig });
  }

  return ok(reactRouterConfig);
}

type ChokidarEventName = ChokidarEmitArgs[0];

type ChangeHandler = (args: {
  result: Result<ResolvedReactRouterConfig>;
  configCodeUpdated: boolean;
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
  rootDirectory: userRoot,
  command,
}: {
  command: "dev" | "build";
  rootDirectory?: string;
}): Promise<ConfigLoader> {
  let root = userRoot ?? process.env.REACT_ROUTER_ROOT ?? process.cwd();

  let viteNodeContext = await ViteNode.createContext({
    root,
    mode: command === "build" ? "production" : "development",
    server: {
      watch: command === "build" ? null : undefined,
    },
    ssr: {
      external: ssrExternals,
    },
  });

  let reactRouterConfigFile = findEntry(root, "react-router.config", {
    absolute: true,
  });

  let getConfig = () =>
    resolveConfig({ root, viteNodeContext, reactRouterConfigFile });

  let appDirectory: string | undefined;

  let initialConfigResult = await getConfig();
  if (initialConfigResult.ok) {
    appDirectory = initialConfigResult.value.appDirectory;
  }

  let lastConfig = initialConfigResult.value;

  let fsWatcher: FSWatcher | undefined;
  let changeHandlers: ChangeHandler[] = [];

  return {
    getConfig,
    onChange: (handler: ChangeHandler) => {
      changeHandlers.push(handler);

      if (!fsWatcher) {
        fsWatcher = chokidar.watch(
          [
            ...(reactRouterConfigFile ? [reactRouterConfigFile] : []),
            ...(appDirectory ? [appDirectory] : []),
          ],
          { ignoreInitial: true }
        );

        fsWatcher.on("all", async (...args: ChokidarEmitArgs) => {
          let [event, rawFilepath] = args;
          let filepath = path.normalize(rawFilepath);

          let appFileAddedOrRemoved =
            appDirectory &&
            (event === "add" || event === "unlink") &&
            filepath.startsWith(path.normalize(appDirectory));

          let reactRouterConfigFileChanged =
            reactRouterConfigFile &&
            event === "change" &&
            filepath === path.normalize(reactRouterConfigFile);

          let configCodeUpdated = Boolean(
            viteNodeContext.devServer?.moduleGraph.getModuleById(filepath)
          );

          if (configCodeUpdated || appFileAddedOrRemoved) {
            viteNodeContext.devServer?.moduleGraph.invalidateAll();
            viteNodeContext.runner?.moduleCache.clear();
          }

          if (
            appFileAddedOrRemoved ||
            reactRouterConfigFileChanged ||
            configCodeUpdated
          ) {
            let result = await getConfig();

            let configChanged =
              result.ok && !isEqualJson(lastConfig, result.value);

            let routeConfigChanged =
              result.ok &&
              !isEqualJson(lastConfig?.routes, result.value.routes);

            for (let handler of changeHandlers) {
              handler({
                result,
                configCodeUpdated,
                configChanged,
                routeConfigChanged,
                path: filepath,
                event,
              });
            }

            if (result.ok) {
              lastConfig = result.value;
            }
          }
        });
      }

      return () => {
        changeHandlers = changeHandlers.filter(
          (changeHandler) => changeHandler !== handler
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

export async function loadConfig({ rootDirectory }: { rootDirectory: string }) {
  let configLoader = await createConfigLoader({ rootDirectory });
  let config = await configLoader.getConfig();
  await configLoader.close();
  return config;
}

const entryExts = [".js", ".jsx", ".ts", ".tsx"];

function findEntry(
  dir: string,
  basename: string,
  options?: { absolute?: boolean }
): string | undefined {
  for (let ext of entryExts) {
    let file = path.resolve(dir, basename + ext);
    if (fs.existsSync(file)) {
      return options?.absolute ?? false ? file : path.relative(dir, file);
    }
  }

  return undefined;
}

function isEqualJson(v1: unknown, v2: unknown) {
  return JSON.stringify(v1) === JSON.stringify(v2);
}
