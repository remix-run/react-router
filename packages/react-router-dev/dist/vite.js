/**
 * @react-router/dev v7.14.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// vite.ts
var vite_exports = {};
__export(vite_exports, {
  reactRouter: () => reactRouterVitePlugin,
  unstable_reactRouterRSC: () => reactRouterRSCVitePlugin
});
module.exports = __toCommonJS(vite_exports);

// vite/plugin.ts
var import_node_crypto = require("crypto");
var import_node_fs2 = require("fs");
var import_promises3 = require("fs/promises");
var path7 = __toESM(require("path"));
var url = __toESM(require("url"));
var babel = __toESM(require("@babel/core"));
var import_react_router2 = require("react-router");
var import_es_module_lexer = require("es-module-lexer");
var import_pick3 = __toESM(require("lodash/pick"));
var import_jsesc = __toESM(require("jsesc"));
var import_picocolors4 = __toESM(require("picocolors"));
var import_kebabCase = __toESM(require("lodash/kebabCase"));

// typegen/index.ts
var import_promises = __toESM(require("fs/promises"));
var Path4 = __toESM(require("pathe"));
var import_picocolors2 = require("picocolors");

// config/config.ts
var import_node_fs = __toESM(require("fs"));
var import_node_child_process = require("child_process");

// vite/vite.ts
var import_pathe2 = __toESM(require("pathe"));

// invariant.ts
function invariant(value, message) {
  if (value === false || value === null || typeof value === "undefined") {
    console.error(
      "The following error is a bug in React Router; please open an issue! https://github.com/remix-run/react-router/issues/new/choose"
    );
    throw new Error(message);
  }
}

// config/is-react-router-repo.ts
var import_pathe = __toESM(require("pathe"));
function isReactRouterRepo() {
  let serverRuntimePath = import_pathe.default.dirname(
    require.resolve("@react-router/node/package.json")
  );
  let serverRuntimeParentDir = import_pathe.default.basename(
    import_pathe.default.resolve(serverRuntimePath, "..")
  );
  return serverRuntimeParentDir === "packages";
}

// vite/vite.ts
var vite;
var viteImportSpecifier = isReactRouterRepo() ? (
  // Support testing against different versions of Vite by ensuring that Vite
  // is resolved from the current working directory when running within this
  // repo. If we don't do this, Vite will always be imported relative to this
  // file, which means that it will always resolve to Vite 6.
  `file:///${import_pathe2.default.normalize(
    require.resolve("vite/package.json", { paths: [process.cwd()] })
  ).replace("package.json", "dist/node/index.js")}`
) : "vite";
async function preloadVite() {
  vite = await import(viteImportSpecifier);
}
function getVite() {
  invariant(vite, "getVite() called before preloadVite()");
  return vite;
}
function defineCompilerOptions(options) {
  let vite2 = getVite();
  return parseInt(vite2.version.split(".")[0], 10) >= 8 ? { oxc: options.oxc } : { esbuild: options.esbuild };
}
function defineOptimizeDepsCompilerOptions(options) {
  let vite2 = getVite();
  return parseInt(vite2.version.split(".")[0], 10) >= 8 ? { rolldownOptions: options.rolldown } : { esbuildOptions: options.esbuild };
}

// vite/ssr-externals.ts
var ssrExternals = isReactRouterRepo() ? [
  // This is only needed within this repo because these packages
  // are linked to a directory outside of node_modules so Vite
  // treats them as internal code by default.
  "react-router",
  "react-router-dom",
  "@react-router/architect",
  "@react-router/cloudflare",
  "@react-router/dev",
  "@react-router/express",
  "@react-router/node",
  "@react-router/serve"
] : void 0;

// vite/vite-node.ts
async function createContext({
  root,
  mode,
  customLogger
}) {
  await preloadVite();
  const vite2 = getVite();
  const [{ ViteNodeServer }, { ViteNodeRunner }, { installSourcemapsSupport }] = await Promise.all([
    import("vite-node/server"),
    import("vite-node/client"),
    import("vite-node/source-map")
  ]);
  const devServer = await vite2.createServer({
    root,
    mode,
    customLogger,
    server: {
      preTransformRequests: false,
      hmr: false,
      watch: null
    },
    ssr: {
      external: ssrExternals
    },
    optimizeDeps: {
      noDiscovery: true
    },
    css: {
      // This empty PostCSS config object prevents the PostCSS config file from
      // being loaded. We don't need it in a React Router config context, and
      // there's also an issue in Vite 5 when using a .ts PostCSS config file in
      // an ESM project: https://github.com/vitejs/vite/issues/15869. Consumers
      // can work around this in their own Vite config file, but they can't
      // configure this internal usage of vite-node.
      postcss: {}
    },
    configFile: false,
    envFile: false,
    plugins: []
  });
  await devServer.pluginContainer.buildStart({});
  const server = new ViteNodeServer(devServer);
  installSourcemapsSupport({
    getSourceMap: (source) => server.getSourceMap(source)
  });
  const runner = new ViteNodeRunner({
    root: devServer.config.root,
    base: devServer.config.base,
    fetchModule(id) {
      return server.fetchModule(id);
    },
    resolveId(id, importer) {
      return server.resolveId(id, importer);
    }
  });
  return { devServer, server, runner };
}

// config/config.ts
var import_pathe3 = __toESM(require("pathe"));
var import_chokidar = __toESM(require("chokidar"));
var import_picocolors = __toESM(require("picocolors"));
var import_pick2 = __toESM(require("lodash/pick"));
var import_omit = __toESM(require("lodash/omit"));
var import_cloneDeep = __toESM(require("lodash/cloneDeep"));
var import_isEqual = __toESM(require("lodash/isEqual"));

// config/routes.ts
var Path = __toESM(require("pathe"));
var v = __toESM(require("valibot"));
var import_pick = __toESM(require("lodash/pick"));
function setAppDirectory(directory) {
  globalThis.__reactRouterAppDirectory = directory;
}
var routeConfigEntrySchema = v.pipe(
  v.custom((value) => {
    return !(typeof value === "object" && value !== null && "then" in value && "catch" in value);
  }, "Invalid type: Expected object but received a promise. Did you forget to await?"),
  v.object({
    id: v.optional(
      v.pipe(
        v.string(),
        v.notValue("root", "A route cannot use the reserved id 'root'.")
      )
    ),
    path: v.optional(v.string()),
    index: v.optional(v.boolean()),
    caseSensitive: v.optional(v.boolean()),
    file: v.string(),
    children: v.optional(v.array(v.lazy(() => routeConfigEntrySchema)))
  })
);
var resolvedRouteConfigSchema = v.array(routeConfigEntrySchema);
function validateRouteConfig({
  routeConfigFile,
  routeConfig
}) {
  if (!routeConfig) {
    return {
      valid: false,
      message: `Route config must be the default export in "${routeConfigFile}".`
    };
  }
  if (!Array.isArray(routeConfig)) {
    return {
      valid: false,
      message: `Route config in "${routeConfigFile}" must be an array.`
    };
  }
  let { issues } = v.safeParse(resolvedRouteConfigSchema, routeConfig);
  if (issues?.length) {
    let { root, nested } = v.flatten(issues);
    return {
      valid: false,
      message: [
        `Route config in "${routeConfigFile}" is invalid.`,
        root ? `${root}` : [],
        nested ? Object.entries(nested).map(
          ([path10, message]) => `Path: routes.${path10}
${message}`
        ) : []
      ].flat().join("\n\n")
    };
  }
  return {
    valid: true,
    routeConfig
  };
}
function configRoutesToRouteManifest(appDirectory, routes) {
  let routeManifest = {};
  function walk(route, parentId) {
    let id = route.id || createRouteId(route.file);
    let manifestItem = {
      id,
      parentId,
      file: Path.isAbsolute(route.file) ? Path.relative(appDirectory, route.file) : route.file,
      path: route.path,
      index: route.index,
      caseSensitive: route.caseSensitive
    };
    if (routeManifest.hasOwnProperty(id)) {
      throw new Error(
        `Unable to define routes with duplicate route id: "${id}"`
      );
    }
    routeManifest[id] = manifestItem;
    if (route.children) {
      for (let child of route.children) {
        walk(child, id);
      }
    }
  }
  for (let route of routes) {
    walk(route);
  }
  return routeManifest;
}
function createRouteId(file) {
  return Path.normalize(stripFileExtension(file));
}
function stripFileExtension(file) {
  return file.replace(/\.[a-z0-9]+$/i, "");
}

// cli/detectPackageManager.ts
var detectPackageManager = () => {
  let { npm_config_user_agent } = process.env;
  if (!npm_config_user_agent) return void 0;
  try {
    let pkgManager = npm_config_user_agent.split("/")[0];
    if (pkgManager === "npm") return "npm";
    if (pkgManager === "pnpm") return "pnpm";
    if (pkgManager === "yarn") return "yarn";
    if (pkgManager === "bun") return "bun";
    return void 0;
  } catch {
    return void 0;
  }
};

// config/config.ts
var excludedConfigPresetKeys = ["presets"];
var branchRouteProperties = [
  "id",
  "path",
  "file",
  "index"
];
var configRouteToBranchRoute = (configRoute) => (0, import_pick2.default)(configRoute, branchRouteProperties);
var mergeReactRouterConfig = (...configs) => {
  let reducer = (configA, configB) => {
    let mergeRequired = (key) => configA[key] !== void 0 && configB[key] !== void 0;
    return {
      ...configA,
      ...configB,
      ...mergeRequired("buildEnd") ? {
        buildEnd: async (...args) => {
          await Promise.all([
            configA.buildEnd?.(...args),
            configB.buildEnd?.(...args)
          ]);
        }
      } : {},
      ...mergeRequired("future") ? {
        future: {
          ...configA.future,
          ...configB.future
        }
      } : {},
      ...mergeRequired("presets") ? {
        presets: [...configA.presets ?? [], ...configB.presets ?? []]
      } : {}
    };
  };
  return configs.reduce(reducer, {});
};
var deepFreeze = (o) => {
  Object.freeze(o);
  let oIsFunction = typeof o === "function";
  let hasOwnProp = Object.prototype.hasOwnProperty;
  Object.getOwnPropertyNames(o).forEach(function(prop) {
    if (hasOwnProp.call(o, prop) && (oIsFunction ? prop !== "caller" && prop !== "callee" && prop !== "arguments" : true) && o[prop] !== null && (typeof o[prop] === "object" || typeof o[prop] === "function") && !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });
  return o;
};
function ok(value) {
  return { ok: true, value };
}
function err(error) {
  return { ok: false, error };
}
async function resolveConfig({
  root,
  viteNodeContext,
  reactRouterConfigFile,
  skipRoutes,
  validateConfig
}) {
  let reactRouterUserConfig = {};
  if (reactRouterConfigFile) {
    try {
      if (!import_node_fs.default.existsSync(reactRouterConfigFile)) {
        return err(`${reactRouterConfigFile} no longer exists`);
      }
      let configModule = await viteNodeContext.runner.executeFile(
        reactRouterConfigFile
      );
      if (configModule.default === void 0) {
        return err(`${reactRouterConfigFile} must provide a default export`);
      }
      if (typeof configModule.default !== "object") {
        return err(`${reactRouterConfigFile} must export a config`);
      }
      reactRouterUserConfig = configModule.default;
      if (validateConfig) {
        const error = validateConfig(reactRouterUserConfig);
        if (error) {
          return err(error);
        }
      }
    } catch (error) {
      return err(`Error loading ${reactRouterConfigFile}: ${error}`);
    }
  }
  reactRouterUserConfig = deepFreeze((0, import_cloneDeep.default)(reactRouterUserConfig));
  let presets = (await Promise.all(
    (reactRouterUserConfig.presets ?? []).map(async (preset) => {
      if (!preset.name) {
        throw new Error(
          "React Router presets must have a `name` property defined."
        );
      }
      if (!preset.reactRouterConfig) {
        return null;
      }
      let configPreset = (0, import_omit.default)(
        await preset.reactRouterConfig({ reactRouterUserConfig }),
        excludedConfigPresetKeys
      );
      return configPreset;
    })
  )).filter(function isNotNull(value) {
    return value !== null;
  });
  let defaults = {
    basename: "/",
    buildDirectory: "build",
    serverBuildFile: "index.js",
    serverModuleFormat: "esm",
    ssr: true
  };
  let userAndPresetConfigs = mergeReactRouterConfig(
    ...presets,
    reactRouterUserConfig
  );
  let {
    appDirectory: userAppDirectory,
    basename: basename3,
    buildDirectory: userBuildDirectory,
    buildEnd,
    prerender: prerender2,
    routeDiscovery: userRouteDiscovery,
    serverBuildFile,
    serverBundles,
    serverModuleFormat,
    ssr
  } = {
    ...defaults,
    // Default values should be completely overridden by user/preset config, not merged
    ...userAndPresetConfigs
  };
  if (!ssr && serverBundles) {
    serverBundles = void 0;
  }
  if (prerender2) {
    let isValidPrerenderPathsConfig = (p) => typeof p === "boolean" || typeof p === "function" || Array.isArray(p);
    let isValidPrerenderConfig = isValidPrerenderPathsConfig(prerender2) || typeof prerender2 === "object" && "paths" in prerender2 && isValidPrerenderPathsConfig(prerender2.paths);
    if (!isValidPrerenderConfig) {
      return err(
        "The `prerender`/`prerender.paths` config must be a boolean, an array of string paths, or a function returning a boolean or array of string paths."
      );
    }
    let isValidConcurrencyConfig = typeof prerender2 != "object" || !("unstable_concurrency" in prerender2) || typeof prerender2.unstable_concurrency === "number" && Number.isInteger(prerender2.unstable_concurrency) && prerender2.unstable_concurrency > 0;
    if (!isValidConcurrencyConfig) {
      return err(
        "The `prerender.unstable_concurrency` config must be a positive integer if specified."
      );
    }
  }
  let routeDiscovery;
  if (userRouteDiscovery == null) {
    if (ssr) {
      routeDiscovery = {
        mode: "lazy",
        manifestPath: "/__manifest"
      };
    } else {
      routeDiscovery = { mode: "initial" };
    }
  } else if (userRouteDiscovery.mode === "initial") {
    routeDiscovery = userRouteDiscovery;
  } else if (userRouteDiscovery.mode === "lazy") {
    if (!ssr) {
      return err(
        'The `routeDiscovery.mode` config cannot be set to "lazy" when setting `ssr:false`'
      );
    }
    let { manifestPath } = userRouteDiscovery;
    if (manifestPath != null && !manifestPath.startsWith("/")) {
      return err(
        'The `routeDiscovery.manifestPath` config must be a root-relative pathname beginning with a slash (i.e., "/__manifest")'
      );
    }
    routeDiscovery = userRouteDiscovery;
  }
  let appDirectory = import_pathe3.default.resolve(root, userAppDirectory || "app");
  let buildDirectory = import_pathe3.default.resolve(root, userBuildDirectory);
  let rootRouteFile = findEntry(appDirectory, "root", { absolute: true });
  if (!rootRouteFile) {
    let rootRouteDisplayPath = import_pathe3.default.relative(
      root,
      import_pathe3.default.join(appDirectory, "root.tsx")
    );
    return err(
      `Could not find a root route module in the app directory as "${rootRouteDisplayPath}"`
    );
  }
  let routes;
  let routeConfig = [];
  if (skipRoutes) {
    routes = {};
  } else {
    let routeConfigFile = findEntry(appDirectory, "routes");
    try {
      if (!routeConfigFile) {
        let routeConfigDisplayPath = import_pathe3.default.relative(
          root,
          import_pathe3.default.join(appDirectory, "routes.ts")
        );
        return err(
          `Route config file not found at "${routeConfigDisplayPath}".`
        );
      }
      setAppDirectory(appDirectory);
      let routeConfigExport = (await viteNodeContext.runner.executeFile(
        import_pathe3.default.join(appDirectory, routeConfigFile)
      )).default;
      let result = validateRouteConfig({
        routeConfigFile,
        routeConfig: await routeConfigExport
      });
      if (!result.valid) {
        return err(result.message);
      }
      routeConfig = [
        {
          id: "root",
          path: "",
          file: import_pathe3.default.relative(appDirectory, rootRouteFile),
          children: result.routeConfig
        }
      ];
      routes = configRoutesToRouteManifest(appDirectory, routeConfig);
    } catch (error) {
      return err(
        [
          import_picocolors.default.red(`Route config in "${routeConfigFile}" is invalid.`),
          "",
          error.loc?.file && error.loc?.column && error.frame ? [
            import_pathe3.default.relative(appDirectory, error.loc.file) + ":" + error.loc.line + ":" + error.loc.column,
            error.frame.trim?.()
          ] : error.stack
        ].flat().join("\n")
      );
    }
  }
  let futureConfig = userAndPresetConfigs.future;
  if (futureConfig?.unstable_splitRouteModules !== void 0) {
    return err(
      'The "future.unstable_splitRouteModules" flag has been stabilized as "future.v8_splitRouteModules"'
    );
  }
  if (futureConfig?.unstable_viteEnvironmentApi !== void 0) {
    return err(
      'The "future.unstable_viteEnvironmentApi" flag has been stabilized as "future.v8_viteEnvironmentApi"'
    );
  }
  let future = {
    unstable_optimizeDeps: userAndPresetConfigs.future?.unstable_optimizeDeps ?? false,
    unstable_passThroughRequests: userAndPresetConfigs.future?.unstable_passThroughRequests ?? false,
    unstable_subResourceIntegrity: userAndPresetConfigs.future?.unstable_subResourceIntegrity ?? false,
    unstable_trailingSlashAwareDataRequests: userAndPresetConfigs.future?.unstable_trailingSlashAwareDataRequests ?? false,
    unstable_previewServerPrerendering: userAndPresetConfigs.future?.unstable_previewServerPrerendering ?? false,
    v8_middleware: userAndPresetConfigs.future?.v8_middleware ?? false,
    v8_splitRouteModules: userAndPresetConfigs.future?.v8_splitRouteModules ?? false,
    v8_viteEnvironmentApi: (userAndPresetConfigs.future?.v8_viteEnvironmentApi || userAndPresetConfigs.future?.unstable_previewServerPrerendering) ?? false
  };
  let allowedActionOrigins = userAndPresetConfigs.allowedActionOrigins ?? false;
  let reactRouterConfig = deepFreeze({
    appDirectory,
    basename: basename3,
    buildDirectory,
    buildEnd,
    future,
    prerender: prerender2,
    routes,
    routeDiscovery,
    serverBuildFile,
    serverBundles,
    serverModuleFormat,
    ssr,
    allowedActionOrigins,
    unstable_routeConfig: routeConfig
  });
  for (let preset of reactRouterUserConfig.presets ?? []) {
    await preset.reactRouterConfigResolved?.({ reactRouterConfig });
  }
  return ok(reactRouterConfig);
}
async function createConfigLoader({
  rootDirectory: root,
  watch: watch2,
  mode,
  skipRoutes,
  validateConfig
}) {
  root = import_pathe3.default.normalize(root ?? process.env.REACT_ROUTER_ROOT ?? process.cwd());
  let vite2 = await import("vite");
  let viteNodeContext = await createContext({
    root,
    mode,
    // Filter out any info level logs from vite-node
    customLogger: vite2.createLogger("warn", {
      prefix: "[react-router]"
    })
  });
  let reactRouterConfigFile;
  let updateReactRouterConfigFile = () => {
    reactRouterConfigFile = findEntry(root, "react-router.config", {
      absolute: true
    });
  };
  updateReactRouterConfigFile();
  let getConfig = () => resolveConfig({
    root,
    viteNodeContext,
    reactRouterConfigFile,
    skipRoutes,
    validateConfig
  });
  let appDirectory;
  let initialConfigResult = await getConfig();
  if (!initialConfigResult.ok) {
    throw new Error(initialConfigResult.error);
  }
  appDirectory = import_pathe3.default.normalize(initialConfigResult.value.appDirectory);
  let currentConfig = initialConfigResult.value;
  let fsWatcher;
  let changeHandlers = [];
  return {
    getConfig,
    onChange: (handler) => {
      if (!watch2) {
        throw new Error(
          "onChange is not supported when watch mode is disabled"
        );
      }
      changeHandlers.push(handler);
      if (!fsWatcher) {
        fsWatcher = import_chokidar.default.watch([root, appDirectory], {
          ignoreInitial: true,
          ignored: (path10) => isIgnoredByWatcher(path10, { root, appDirectory })
        });
        fsWatcher.on("error", (error) => {
          let message = error instanceof Error ? error.message : String(error);
          console.warn(import_picocolors.default.yellow(`File watcher error: ${message}`));
        });
        fsWatcher.on("all", async (...args) => {
          let [event, rawFilepath] = args;
          let filepath = import_pathe3.default.normalize(rawFilepath);
          let fileAddedOrRemoved = event === "add" || event === "unlink";
          let appFileAddedOrRemoved = fileAddedOrRemoved && filepath.startsWith(import_pathe3.default.normalize(appDirectory));
          let rootRelativeFilepath = import_pathe3.default.relative(root, filepath);
          let configFileAddedOrRemoved = fileAddedOrRemoved && isEntryFile("react-router.config", rootRelativeFilepath);
          if (configFileAddedOrRemoved) {
            updateReactRouterConfigFile();
          }
          let moduleGraphChanged = configFileAddedOrRemoved || Boolean(
            viteNodeContext.devServer?.moduleGraph.getModuleById(filepath)
          );
          if (!moduleGraphChanged && !appFileAddedOrRemoved) {
            return;
          }
          viteNodeContext.devServer?.moduleGraph.invalidateAll();
          viteNodeContext.runner?.moduleCache.clear();
          let result = await getConfig();
          let prevAppDirectory = appDirectory;
          appDirectory = import_pathe3.default.normalize(
            (result.value ?? currentConfig).appDirectory
          );
          if (appDirectory !== prevAppDirectory) {
            fsWatcher.unwatch(prevAppDirectory);
            fsWatcher.add(appDirectory);
          }
          let configCodeChanged = configFileAddedOrRemoved || reactRouterConfigFile !== void 0 && isEntryFileDependency(
            viteNodeContext.devServer.moduleGraph,
            reactRouterConfigFile,
            filepath
          );
          let routeConfigFile = !skipRoutes ? findEntry(appDirectory, "routes", {
            absolute: true
          }) : void 0;
          let routeConfigCodeChanged = routeConfigFile !== void 0 && isEntryFileDependency(
            viteNodeContext.devServer.moduleGraph,
            routeConfigFile,
            filepath
          );
          let configChanged = result.ok && !(0, import_isEqual.default)(omitRoutes(currentConfig), omitRoutes(result.value));
          let routeConfigChanged = result.ok && !(0, import_isEqual.default)(currentConfig?.routes, result.value.routes);
          for (let handler2 of changeHandlers) {
            handler2({
              result,
              configCodeChanged,
              routeConfigCodeChanged,
              configChanged,
              routeConfigChanged,
              path: filepath,
              event
            });
          }
          if (result.ok) {
            currentConfig = result.value;
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
    }
  };
}
async function resolveEntryFiles({
  rootDirectory,
  reactRouterConfig
}) {
  let { appDirectory } = reactRouterConfig;
  let defaultsDirectory = import_pathe3.default.resolve(
    import_pathe3.default.dirname(require.resolve("@react-router/dev/package.json")),
    "dist",
    "config",
    "defaults"
  );
  let userEntryClientFile = findEntry(appDirectory, "entry.client");
  let userEntryServerFile = findEntry(appDirectory, "entry.server");
  let entryServerFile;
  let entryClientFile = userEntryClientFile || "entry.client.tsx";
  if (userEntryServerFile) {
    entryServerFile = userEntryServerFile;
  } else {
    let packageJsonPath = findEntry(rootDirectory, "package", {
      extensions: [".json"],
      absolute: true,
      walkParents: true
    });
    if (!packageJsonPath) {
      throw new Error(
        `Could not find package.json in ${rootDirectory} or any of its parent directories. Please add a package.json, or provide a custom entry.server.tsx/jsx file in your app directory.`
      );
    }
    let { readPackageJSON, sortPackage, updatePackage } = await import("pkg-types");
    let packageJsonDirectory = import_pathe3.default.dirname(packageJsonPath);
    let pkgJson = await readPackageJSON(packageJsonDirectory);
    let deps = pkgJson.dependencies ?? {};
    if (!deps["@react-router/node"]) {
      throw new Error(
        `Could not determine server runtime. Please install @react-router/node, or provide a custom entry.server.tsx/jsx file in your app directory.`
      );
    }
    if (!deps["isbot"]) {
      console.log(
        "adding `isbot@5` to your package.json, you should commit this change"
      );
      await updatePackage(packageJsonPath, (pkg) => {
        pkg.dependencies ??= {};
        pkg.dependencies.isbot = "^5";
        sortPackage(pkg);
      });
      let packageManager = detectPackageManager() ?? "npm";
      (0, import_node_child_process.execSync)(`${packageManager} install`, {
        cwd: packageJsonDirectory,
        stdio: "inherit"
      });
    }
    entryServerFile = `entry.server.node.tsx`;
  }
  let entryClientFilePath = userEntryClientFile ? import_pathe3.default.resolve(reactRouterConfig.appDirectory, userEntryClientFile) : import_pathe3.default.resolve(defaultsDirectory, entryClientFile);
  let entryServerFilePath = userEntryServerFile ? import_pathe3.default.resolve(reactRouterConfig.appDirectory, userEntryServerFile) : import_pathe3.default.resolve(defaultsDirectory, entryServerFile);
  return { entryClientFilePath, entryServerFilePath };
}
async function resolveRSCEntryFiles({
  reactRouterConfig
}) {
  let { appDirectory } = reactRouterConfig;
  let defaultsDirectory = import_pathe3.default.resolve(
    import_pathe3.default.dirname(require.resolve("@react-router/dev/package.json")),
    "dist",
    "config",
    "default-rsc-entries"
  );
  let userEntryClientFile = findEntry(appDirectory, "entry.client", {
    absolute: true
  });
  let userEntryRSCFile = findEntry(appDirectory, "entry.rsc", {
    absolute: true
  });
  let userEntrySSRFile = findEntry(appDirectory, "entry.ssr", {
    absolute: true
  });
  let client = userEntryClientFile ?? import_pathe3.default.join(defaultsDirectory, "entry.client.tsx");
  let rsc = userEntryRSCFile ?? import_pathe3.default.join(defaultsDirectory, "entry.rsc.tsx");
  let ssr = userEntrySSRFile ?? import_pathe3.default.join(defaultsDirectory, "entry.ssr.tsx");
  return { client, rsc, ssr };
}
function omitRoutes(config) {
  return {
    ...config,
    routes: {}
  };
}
var entryExts = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".mts"];
function isEntryFile(entryBasename, filename2) {
  return entryExts.some((ext) => filename2 === `${entryBasename}${ext}`);
}
function findEntry(dir, basename3, options) {
  let currentDir = import_pathe3.default.resolve(dir);
  let { root } = import_pathe3.default.parse(currentDir);
  while (true) {
    for (let ext of options?.extensions ?? entryExts) {
      let file = import_pathe3.default.resolve(currentDir, basename3 + ext);
      if (import_node_fs.default.existsSync(file)) {
        return options?.absolute ?? false ? file : import_pathe3.default.relative(dir, file);
      }
    }
    if (!options?.walkParents) {
      return void 0;
    }
    let parentDir = import_pathe3.default.dirname(currentDir);
    if (currentDir === root || parentDir === currentDir) {
      return void 0;
    }
    currentDir = parentDir;
  }
}
function isEntryFileDependency(moduleGraph, entryFilepath, filepath, visited = /* @__PURE__ */ new Set()) {
  entryFilepath = import_pathe3.default.normalize(entryFilepath);
  filepath = import_pathe3.default.normalize(filepath);
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
  for (let importer of mod.importers) {
    if (!importer.id) {
      continue;
    }
    if (importer.id === entryFilepath || isEntryFileDependency(moduleGraph, entryFilepath, importer.id, visited)) {
      return true;
    }
  }
  return false;
}
function isIgnoredByWatcher(path10, { root, appDirectory }) {
  let dirname4 = import_pathe3.default.dirname(path10);
  let ignoredByPath = !dirname4.startsWith(appDirectory) && // Ensure we're only watching files outside of the app directory
  // that are at the root level, not nested in subdirectories
  path10 !== root && // Watch the root directory itself
  dirname4 !== root;
  if (ignoredByPath) {
    return true;
  }
  try {
    let stat = import_node_fs.default.statSync(path10, { throwIfNoEntry: false });
    if (stat && !stat.isFile() && !stat.isDirectory()) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

// typegen/context.ts
async function createContext2({
  rootDirectory,
  watch: watch2,
  mode,
  rsc
}) {
  const configLoader = await createConfigLoader({ rootDirectory, mode, watch: watch2 });
  const configResult = await configLoader.getConfig();
  if (!configResult.ok) {
    throw new Error(configResult.error);
  }
  const config = configResult.value;
  return {
    configLoader,
    rootDirectory,
    config,
    rsc
  };
}

// typegen/generate.ts
var import_dedent = __toESM(require("dedent"));
var Path3 = __toESM(require("pathe"));
var Pathe = __toESM(require("pathe/utils"));

// vite/babel.ts
var babel_exports = {};
__export(babel_exports, {
  generate: () => generate,
  parse: () => import_parser.parse,
  t: () => t,
  traverse: () => traverse
});
var import_parser = require("@babel/parser");
var t = __toESM(require("@babel/types"));
var traverse = require("@babel/traverse").default;
var generate = require("@babel/generator").default;

// typegen/params.ts
function parse2(fullpath2) {
  const result = {};
  let segments = fullpath2.split("/");
  segments.forEach((segment) => {
    const match = segment.match(/^:([\w-]+)(\?)?/);
    if (!match) return;
    const param = match[1];
    const isRequired = match[2] === void 0;
    result[param] ||= isRequired;
    return;
  });
  const hasSplat = segments.at(-1) === "*";
  if (hasSplat) result["*"] = true;
  return result;
}

// typegen/route.ts
function lineage(routes, route) {
  const result = [];
  while (route) {
    result.push(route);
    if (!route.parentId) break;
    route = routes[route.parentId];
  }
  result.reverse();
  return result;
}
function fullpath(lineage2) {
  const route = lineage2.at(-1);
  if (lineage2.length === 1 && route?.id === "root") return "/";
  const isLayout = route && route.index !== true && route.path === void 0;
  if (isLayout) return void 0;
  return "/" + lineage2.map((route2) => route2.path?.replace(/^\//, "")?.replace(/\/$/, "")).filter((path10) => path10 !== void 0 && path10 !== "").join("/");
}

// typegen/generate.ts
function typesDirectory(ctx) {
  return Path3.join(ctx.rootDirectory, ".react-router/types");
}
function generateFuture(ctx) {
  const filename2 = Path3.join(typesDirectory(ctx), "+future.ts");
  const content = import_dedent.default`
    // Generated by React Router

    import "react-router";

    declare module "react-router" {
      interface Future {
        v8_middleware: ${ctx.config.future.v8_middleware}
      }
    }
  `;
  return { filename: filename2, content };
}
function generateServerBuild(ctx) {
  const filename2 = Path3.join(typesDirectory(ctx), "+server-build.d.ts");
  const content = import_dedent.default`
    // Generated by React Router

    declare module "virtual:react-router/server-build" {
      import { ServerBuild } from "react-router";
      export const assets: ServerBuild["assets"];
      export const assetsBuildDirectory: ServerBuild["assetsBuildDirectory"];
      export const basename: ServerBuild["basename"];
      export const entry: ServerBuild["entry"];
      export const future: ServerBuild["future"];
      export const isSpaMode: ServerBuild["isSpaMode"];
      export const prerender: ServerBuild["prerender"];
      export const publicPath: ServerBuild["publicPath"];
      export const routeDiscovery: ServerBuild["routeDiscovery"];
      export const routes: ServerBuild["routes"];
      export const ssr: ServerBuild["ssr"];
      export const allowedActionOrigins: ServerBuild["allowedActionOrigins"];
      export const unstable_getCriticalCss: ServerBuild["unstable_getCriticalCss"];
    }
  `;
  return { filename: filename2, content };
}
var { t: t2 } = babel_exports;
function generateRoutes(ctx) {
  const fileToRoutes = /* @__PURE__ */ new Map();
  const lineages = /* @__PURE__ */ new Map();
  const allPages = /* @__PURE__ */ new Set();
  const routeToPages = /* @__PURE__ */ new Map();
  for (const route of Object.values(ctx.config.routes)) {
    let routeIds = fileToRoutes.get(route.file);
    if (!routeIds) {
      routeIds = /* @__PURE__ */ new Set();
      fileToRoutes.set(route.file, routeIds);
    }
    routeIds.add(route.id);
    const lineage2 = lineage(ctx.config.routes, route);
    lineages.set(route.id, lineage2);
    const fullpath2 = fullpath(lineage2);
    if (!fullpath2) continue;
    const pages = expand(fullpath2);
    pages.forEach((page) => allPages.add(page));
    lineage2.forEach(({ id }) => {
      let routePages = routeToPages.get(id);
      if (!routePages) {
        routePages = /* @__PURE__ */ new Set();
        routeToPages.set(id, routePages);
      }
      pages.forEach((page) => routePages.add(page));
    });
  }
  const routesTs = {
    filename: Path3.join(typesDirectory(ctx), "+routes.ts"),
    content: import_dedent.default`
        // Generated by React Router

        import "react-router"

        declare module "react-router" {
          interface Register {
            pages: Pages
            routeFiles: RouteFiles
            routeModules: RouteModules
          }
        }
      ` + "\n\n" + generate(pagesType(allPages)).code + "\n\n" + generate(routeFilesType({ fileToRoutes, routeToPages })).code + "\n\n" + generate(routeModulesType(ctx)).code
  };
  const allAnnotations = Array.from(fileToRoutes.entries()).filter(([file]) => isInAppDirectory(ctx, file)).map(
    ([file, routeIds]) => getRouteAnnotations({ ctx, file, routeIds, lineages })
  );
  return [routesTs, ...allAnnotations];
}
function pagesType(pages) {
  return t2.tsTypeAliasDeclaration(
    t2.identifier("Pages"),
    null,
    t2.tsTypeLiteral(
      Array.from(pages).map((page) => {
        return t2.tsPropertySignature(
          t2.stringLiteral(page),
          t2.tsTypeAnnotation(
            t2.tsTypeLiteral([
              t2.tsPropertySignature(
                t2.identifier("params"),
                t2.tsTypeAnnotation(paramsType(page))
              )
            ])
          )
        );
      })
    )
  );
}
function routeFilesType({
  fileToRoutes,
  routeToPages
}) {
  return t2.tsTypeAliasDeclaration(
    t2.identifier("RouteFiles"),
    null,
    t2.tsTypeLiteral(
      Array.from(fileToRoutes).map(
        ([file, routeIds]) => t2.tsPropertySignature(
          t2.stringLiteral(file),
          t2.tsTypeAnnotation(
            t2.tsUnionType(
              Array.from(routeIds).map((routeId) => {
                const pages = routeToPages.get(routeId) ?? /* @__PURE__ */ new Set();
                return t2.tsTypeLiteral([
                  t2.tsPropertySignature(
                    t2.identifier("id"),
                    t2.tsTypeAnnotation(
                      t2.tsLiteralType(t2.stringLiteral(routeId))
                    )
                  ),
                  t2.tsPropertySignature(
                    t2.identifier("page"),
                    t2.tsTypeAnnotation(
                      pages ? t2.tsUnionType(
                        Array.from(pages).map(
                          (page) => t2.tsLiteralType(t2.stringLiteral(page))
                        )
                      ) : t2.tsNeverKeyword()
                    )
                  )
                ]);
              })
            )
          )
        )
      )
    )
  );
}
function routeModulesType(ctx) {
  return t2.tsTypeAliasDeclaration(
    t2.identifier("RouteModules"),
    null,
    t2.tsTypeLiteral(
      Object.values(ctx.config.routes).map(
        (route) => t2.tsPropertySignature(
          t2.stringLiteral(route.id),
          t2.tsTypeAnnotation(
            isInAppDirectory(ctx, route.file) ? t2.tsTypeQuery(
              t2.tsImportType(
                t2.stringLiteral(
                  `./${Path3.relative(ctx.rootDirectory, ctx.config.appDirectory)}/${route.file}`
                )
              )
            ) : t2.tsUnknownKeyword()
          )
        )
      )
    )
  );
}
function isInAppDirectory(ctx, routeFile) {
  const path10 = Path3.resolve(ctx.config.appDirectory, routeFile);
  return path10.startsWith(ctx.config.appDirectory);
}
function getRouteAnnotations({
  ctx,
  file,
  routeIds,
  lineages
}) {
  const filename2 = Path3.join(
    typesDirectory(ctx),
    Path3.relative(ctx.rootDirectory, ctx.config.appDirectory),
    Path3.dirname(file),
    "+types",
    Pathe.filename(file) + ".ts"
  );
  const matchesType = t2.tsTypeAliasDeclaration(
    t2.identifier("Matches"),
    null,
    t2.tsUnionType(
      Array.from(routeIds).map((routeId) => {
        const lineage2 = lineages.get(routeId);
        return t2.tsTupleType(
          lineage2.map(
            (route) => t2.tsTypeLiteral([
              t2.tsPropertySignature(
                t2.identifier("id"),
                t2.tsTypeAnnotation(t2.tsLiteralType(t2.stringLiteral(route.id)))
              ),
              t2.tsPropertySignature(
                t2.identifier("module"),
                t2.tsTypeAnnotation(
                  t2.tsTypeQuery(
                    t2.tsImportType(
                      t2.stringLiteral(
                        relativeImportSource(
                          rootDirsPath(ctx, filename2),
                          Path3.resolve(ctx.config.appDirectory, route.file)
                        )
                      )
                    )
                  )
                )
              )
            ])
          )
        );
      })
    )
  );
  const routeImportSource = relativeImportSource(
    rootDirsPath(ctx, filename2),
    Path3.resolve(ctx.config.appDirectory, file)
  );
  const content = import_dedent.default`
      // Generated by React Router

      import type { GetInfo, GetAnnotations } from "react-router/internal";

      type Module = typeof import("${routeImportSource}")

      type Info = GetInfo<{
        file: "${file}",
        module: Module
      }>
    ` + "\n\n" + generate(matchesType).code + "\n\n" + import_dedent.default`
      type Annotations = GetAnnotations<Info & { module: Module, matches: Matches }>;

      export namespace Route {
        // links
        export type LinkDescriptors = Annotations["LinkDescriptors"];
        export type LinksFunction = Annotations["LinksFunction"];

        // meta
        export type MetaArgs = Annotations["MetaArgs"];
        export type MetaDescriptors = Annotations["MetaDescriptors"];
        export type MetaFunction = Annotations["MetaFunction"];

        // headers
        export type HeadersArgs = Annotations["HeadersArgs"];
        export type HeadersFunction = Annotations["HeadersFunction"];

        // middleware
        export type MiddlewareFunction = Annotations["MiddlewareFunction"];

        // clientMiddleware
        export type ClientMiddlewareFunction = Annotations["ClientMiddlewareFunction"];

        // loader
        export type LoaderArgs = Annotations["LoaderArgs"];

        // clientLoader
        export type ClientLoaderArgs = Annotations["ClientLoaderArgs"];

        // action
        export type ActionArgs = Annotations["ActionArgs"];

        // clientAction
        export type ClientActionArgs = Annotations["ClientActionArgs"];

        // HydrateFallback
        export type HydrateFallbackProps = Annotations["HydrateFallbackProps"];

        // ServerHydrateFallback
        export type ServerHydrateFallbackProps = Annotations["ServerHydrateFallbackProps"];

        // Component
        export type ComponentProps = Annotations["ComponentProps"];

        // ServerComponent
        export type ServerComponentProps = Annotations["ServerComponentProps"];

        // ErrorBoundary
        export type ErrorBoundaryProps = Annotations["ErrorBoundaryProps"];

        // ServerErrorBoundary
        export type ServerErrorBoundaryProps = Annotations["ServerErrorBoundaryProps"];
      }
    `;
  return { filename: filename2, content };
}
function relativeImportSource(from, to) {
  let path10 = Path3.relative(Path3.dirname(from), to);
  let extension = Path3.extname(path10);
  path10 = Path3.join(Path3.dirname(path10), Pathe.filename(path10));
  if (!path10.startsWith("../")) path10 = "./" + path10;
  if (!extension || /\.(js|ts)x?$/.test(extension)) {
    extension = ".js";
  }
  return path10 + extension;
}
function rootDirsPath(ctx, typesPath) {
  const rel = Path3.relative(typesDirectory(ctx), typesPath);
  return Path3.join(ctx.rootDirectory, rel);
}
function paramsType(path10) {
  const params = parse2(path10);
  return t2.tsTypeLiteral(
    Object.entries(params).map(([param, isRequired]) => {
      const property = t2.tsPropertySignature(
        t2.stringLiteral(param),
        t2.tsTypeAnnotation(t2.tsStringKeyword())
      );
      property.optional = !isRequired;
      return property;
    })
  );
}
function expand(fullpath2) {
  function recurse(segments2, index) {
    if (index === segments2.length) return [""];
    const segment = segments2[index];
    const isOptional = segment.endsWith("?");
    const isDynamic = segment.startsWith(":");
    const required = segment.replace(/\?$/, "");
    const keep = !isOptional || isDynamic;
    const kept = isDynamic ? segment : required;
    const withoutSegment = recurse(segments2, index + 1);
    const withSegment = withoutSegment.map((rest) => [kept, rest].join("/"));
    if (keep) return withSegment;
    return [...withoutSegment, ...withSegment];
  }
  const segments = fullpath2.split("/");
  const expanded = /* @__PURE__ */ new Set();
  for (let result of recurse(segments, 0)) {
    if (result !== "/") result = result.replace(/\/$/, "");
    expanded.add(result);
  }
  return expanded;
}

// typegen/index.ts
async function clearRouteModuleAnnotations(ctx) {
  await import_promises.default.rm(
    Path4.join(typesDirectory(ctx), Path4.basename(ctx.config.appDirectory)),
    { recursive: true, force: true }
  );
}
async function write(...files) {
  return Promise.all(
    files.map(async ({ filename: filename2, content }) => {
      await import_promises.default.mkdir(Path4.dirname(filename2), { recursive: true });
      await import_promises.default.writeFile(filename2, content);
    })
  );
}
async function watch(rootDirectory, { mode, logger, rsc }) {
  const ctx = await createContext2({ rootDirectory, mode, rsc, watch: true });
  await import_promises.default.rm(typesDirectory(ctx), { recursive: true, force: true });
  await write(
    generateFuture(ctx),
    generateServerBuild(ctx),
    ...generateRoutes(ctx)
  );
  logger?.info((0, import_picocolors2.green)("generated types"), { timestamp: true, clear: true });
  ctx.configLoader.onChange(
    async ({ result, configChanged, routeConfigChanged }) => {
      if (!result.ok) {
        logger?.error((0, import_picocolors2.red)(result.error), { timestamp: true, clear: true });
        return;
      }
      ctx.config = result.value;
      if (configChanged) {
        await write(generateFuture(ctx));
        logger?.info((0, import_picocolors2.green)("regenerated types"), {
          timestamp: true,
          clear: true
        });
      }
      if (routeConfigChanged) {
        await clearRouteModuleAnnotations(ctx);
        await write(...generateRoutes(ctx));
        logger?.info((0, import_picocolors2.green)("regenerated types"), {
          timestamp: true,
          clear: true
        });
      }
    }
  );
  return {
    close: async () => await ctx.configLoader.close()
  };
}

// vite/node-adapter.ts
async function fromNodeRequest(nodeReq, nodeRes) {
  invariant(
    nodeReq.originalUrl,
    "Expected `nodeReq.originalUrl` to be defined"
  );
  nodeReq.url = nodeReq.originalUrl;
  const { createRequest } = await import("@remix-run/node-fetch-server");
  return createRequest(nodeReq, nodeRes);
}

// vite/styles.ts
var path4 = __toESM(require("path"));
var import_react_router = require("react-router");

// vite/resolve-file-url.ts
var path3 = __toESM(require("path"));
var resolveFileUrl = ({ rootDirectory }, filePath) => {
  let vite2 = getVite();
  let relativePath = path3.relative(rootDirectory, filePath);
  let isWithinRoot = !relativePath.startsWith("..") && !path3.isAbsolute(relativePath);
  if (!isWithinRoot) {
    return path3.posix.join("/@fs", vite2.normalizePath(filePath));
  }
  return "/" + vite2.normalizePath(relativePath);
};

// vite/styles.ts
var cssFileRegExp = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
var cssModulesRegExp = new RegExp(`\\.module${cssFileRegExp.source}`);
var isCssFile = (file) => cssFileRegExp.test(file);
var isCssModulesFile = (file) => cssModulesRegExp.test(file);
var cssUrlParamsWithoutSideEffects = ["url", "inline", "raw", "inline-css"];
var isCssUrlWithoutSideEffects = (url2) => {
  let queryString = url2.split("?")[1];
  if (!queryString) {
    return false;
  }
  let params = new URLSearchParams(queryString);
  for (let paramWithoutSideEffects of cssUrlParamsWithoutSideEffects) {
    if (
      // Parameter is blank and not explicitly set, i.e. "?url", not "?url="
      params.get(paramWithoutSideEffects) === "" && !url2.includes(`?${paramWithoutSideEffects}=`) && !url2.includes(`&${paramWithoutSideEffects}=`)
    ) {
      return true;
    }
  }
  return false;
};
var getStylesForFiles = async ({
  viteDevServer,
  rootDirectory,
  loadCssContents,
  files
}) => {
  let styles = {};
  let deps = /* @__PURE__ */ new Set();
  try {
    for (let file of files) {
      let normalizedPath = path4.resolve(rootDirectory, file).replace(/\\/g, "/");
      let node = await viteDevServer.moduleGraph.getModuleById(normalizedPath);
      if (!node) {
        try {
          await viteDevServer.transformRequest(
            resolveFileUrl({ rootDirectory }, normalizedPath)
          );
        } catch (err2) {
          console.error(err2);
        }
        node = await viteDevServer.moduleGraph.getModuleById(normalizedPath);
      }
      if (!node) {
        console.log(`Could not resolve module for file: ${file}`);
        continue;
      }
      await findDeps(viteDevServer, node, deps);
    }
  } catch (err2) {
    console.error(err2);
  }
  for (let dep of deps) {
    if (dep.file && isCssFile(dep.file) && !isCssUrlWithoutSideEffects(dep.url)) {
      try {
        styles[dep.url] = await loadCssContents(viteDevServer, dep);
      } catch {
        console.warn(`Failed to load CSS for ${dep.file}`);
      }
    }
  }
  return Object.entries(styles).map(([fileName, css], i) => [
    `
/* ${fileName.replace(/\/\*/g, "/\\*").replace(/\*\//g, "*\\/")} */`,
    css
  ]).flat().join("\n") || void 0;
};
var findDeps = async (vite2, node, deps) => {
  let branches = [];
  async function addFromNode(node2) {
    if (!deps.has(node2)) {
      deps.add(node2);
      await findDeps(vite2, node2, deps);
    }
  }
  async function addFromUrl(url2) {
    let node2 = await vite2.moduleGraph.getModuleByUrl(url2);
    if (node2) {
      await addFromNode(node2);
    }
  }
  if (node.ssrTransformResult) {
    if (node.ssrTransformResult.deps) {
      node.ssrTransformResult.deps.forEach(
        (url2) => branches.push(addFromUrl(url2))
      );
    }
  } else {
    node.importedModules.forEach((node2) => branches.push(addFromNode(node2)));
  }
  await Promise.all(branches);
};
var groupRoutesByParentId = (manifest) => {
  let routes = {};
  Object.values(manifest).forEach((route) => {
    if (route) {
      let parentId = route.parentId || "";
      if (!routes[parentId]) {
        routes[parentId] = [];
      }
      routes[parentId].push(route);
    }
  });
  return routes;
};
var createRoutesWithChildren = (manifest, parentId = "", routesByParentId = groupRoutesByParentId(manifest)) => {
  return (routesByParentId[parentId] || []).map((route) => ({
    ...route,
    ...route.index ? {
      index: true
    } : {
      index: false,
      children: createRoutesWithChildren(
        manifest,
        route.id,
        routesByParentId
      )
    }
  }));
};
var getStylesForPathname = async ({
  viteDevServer,
  rootDirectory,
  reactRouterConfig,
  entryClientFilePath,
  loadCssContents,
  pathname
}) => {
  if (pathname === void 0 || pathname.includes("?_data=")) {
    return void 0;
  }
  let routesWithChildren = createRoutesWithChildren(reactRouterConfig.routes);
  let appPath = path4.relative(process.cwd(), reactRouterConfig.appDirectory);
  let documentRouteFiles = (0, import_react_router.matchRoutes)(routesWithChildren, pathname, reactRouterConfig.basename)?.map(
    (match) => path4.resolve(appPath, reactRouterConfig.routes[match.route.id].file)
  ) ?? [];
  let styles = await getStylesForFiles({
    viteDevServer,
    rootDirectory,
    loadCssContents,
    files: [
      // Always include the client entry file when crawling the module graph for CSS
      path4.relative(rootDirectory, entryClientFilePath),
      // Then include any styles from the matched routes
      ...documentRouteFiles
    ]
  });
  return styles;
};
var getCssStringFromViteDevModuleCode = (code) => {
  let cssContent = void 0;
  const ast = import_parser.parse(code, { sourceType: "module" });
  traverse(ast, {
    VariableDeclaration(path10) {
      const declaration = path10.node.declarations[0];
      if (declaration?.id?.type === "Identifier" && declaration.id.name === "__vite__css" && declaration.init?.type === "StringLiteral") {
        cssContent = declaration.init.value;
        path10.stop();
      }
    }
  });
  return cssContent;
};

// vite/virtual-module.ts
function create(name) {
  let id = `virtual:react-router/${name}`;
  return {
    id,
    resolvedId: `\0${id}`,
    url: `/@id/__x00__${id}`
  };
}

// vite/resolve-relative-route-file-path.ts
var import_pathe4 = __toESM(require("pathe"));
function resolveRelativeRouteFilePath(route, reactRouterConfig) {
  let vite2 = getVite();
  let file = route.file;
  let fullPath = import_pathe4.default.resolve(reactRouterConfig.appDirectory, file);
  return vite2.normalizePath(fullPath);
}

// vite/combine-urls.ts
function combineURLs(baseURL, relativeURL) {
  return relativeURL ? baseURL.replace(/\/+$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
}

// vite/remove-exports.ts
var import_babel_dead_code_elimination = require("babel-dead-code-elimination");
var removeExports = (ast, exportsToRemove) => {
  let previouslyReferencedIdentifiers = (0, import_babel_dead_code_elimination.findReferencedIdentifiers)(ast);
  let exportsFiltered = false;
  let markedForRemoval = /* @__PURE__ */ new Set();
  let removedExportLocalNames = /* @__PURE__ */ new Set();
  traverse(ast, {
    ExportDeclaration(path10) {
      if (path10.node.type === "ExportNamedDeclaration") {
        if (path10.node.specifiers.length) {
          path10.node.specifiers = path10.node.specifiers.filter((specifier) => {
            if (specifier.type === "ExportSpecifier" && specifier.exported.type === "Identifier") {
              if (exportsToRemove.includes(specifier.exported.name)) {
                exportsFiltered = true;
                if (specifier.local && specifier.local.name !== specifier.exported.name) {
                  removedExportLocalNames.add(specifier.local.name);
                }
                return false;
              }
            }
            return true;
          });
          if (path10.node.specifiers.length === 0) {
            markedForRemoval.add(path10);
          }
        }
        if (path10.node.declaration?.type === "VariableDeclaration") {
          let declaration = path10.node.declaration;
          declaration.declarations = declaration.declarations.filter(
            (declaration2) => {
              if (declaration2.id.type === "Identifier" && exportsToRemove.includes(declaration2.id.name)) {
                exportsFiltered = true;
                return false;
              }
              if (declaration2.id.type === "ArrayPattern" || declaration2.id.type === "ObjectPattern") {
                validateDestructuredExports(declaration2.id, exportsToRemove);
              }
              return true;
            }
          );
          if (declaration.declarations.length === 0) {
            markedForRemoval.add(path10);
          }
        }
        if (path10.node.declaration?.type === "FunctionDeclaration") {
          let id = path10.node.declaration.id;
          if (id && exportsToRemove.includes(id.name)) {
            markedForRemoval.add(path10);
          }
        }
        if (path10.node.declaration?.type === "ClassDeclaration") {
          let id = path10.node.declaration.id;
          if (id && exportsToRemove.includes(id.name)) {
            markedForRemoval.add(path10);
          }
        }
      }
      if (path10.node.type === "ExportDefaultDeclaration") {
        if (exportsToRemove.includes("default")) {
          markedForRemoval.add(path10);
          if (path10.node.declaration) {
            if (path10.node.declaration.type === "Identifier") {
              removedExportLocalNames.add(path10.node.declaration.name);
            } else if ((path10.node.declaration.type === "FunctionDeclaration" || path10.node.declaration.type === "ClassDeclaration") && path10.node.declaration.id) {
              removedExportLocalNames.add(path10.node.declaration.id.name);
            }
          }
        }
      }
    }
  });
  traverse(ast, {
    ExpressionStatement(path10) {
      if (!path10.parentPath.isProgram()) {
        return;
      }
      if (path10.node.expression.type === "AssignmentExpression") {
        const left = path10.node.expression.left;
        if (left.type === "MemberExpression" && left.object.type === "Identifier" && (exportsToRemove.includes(left.object.name) || removedExportLocalNames.has(left.object.name))) {
          markedForRemoval.add(path10);
        }
      }
    }
  });
  if (markedForRemoval.size > 0 || exportsFiltered) {
    for (let path10 of markedForRemoval) {
      path10.remove();
    }
    (0, import_babel_dead_code_elimination.deadCodeElimination)(ast, previouslyReferencedIdentifiers);
  }
};
function validateDestructuredExports(id, exportsToRemove) {
  if (id.type === "ArrayPattern") {
    for (let element of id.elements) {
      if (!element) {
        continue;
      }
      if (element.type === "Identifier" && exportsToRemove.includes(element.name)) {
        throw invalidDestructureError(element.name);
      }
      if (element.type === "RestElement" && element.argument.type === "Identifier" && exportsToRemove.includes(element.argument.name)) {
        throw invalidDestructureError(element.argument.name);
      }
      if (element.type === "ArrayPattern" || element.type === "ObjectPattern") {
        validateDestructuredExports(element, exportsToRemove);
      }
    }
  }
  if (id.type === "ObjectPattern") {
    for (let property of id.properties) {
      if (!property) {
        continue;
      }
      if (property.type === "ObjectProperty" && property.key.type === "Identifier") {
        if (property.value.type === "Identifier" && exportsToRemove.includes(property.value.name)) {
          throw invalidDestructureError(property.value.name);
        }
        if (property.value.type === "ArrayPattern" || property.value.type === "ObjectPattern") {
          validateDestructuredExports(property.value, exportsToRemove);
        }
      }
      if (property.type === "RestElement" && property.argument.type === "Identifier" && exportsToRemove.includes(property.argument.name)) {
        throw invalidDestructureError(property.argument.name);
      }
    }
  }
}
function invalidDestructureError(name) {
  return new Error(`Cannot remove destructured export "${name}"`);
}

// vite/has-dependency.ts
function hasDependency({
  name,
  rootDirectory
}) {
  try {
    return Boolean(require.resolve(name, { paths: [rootDirectory] }));
  } catch (err2) {
    return false;
  }
}

// vite/cache.ts
function getOrSetFromCache(cache, key, version, getValue) {
  if (!cache) {
    return getValue();
  }
  let entry = cache.get(key);
  if (entry?.version === version) {
    return entry.value;
  }
  let value = getValue();
  let newEntry = { value, version };
  cache.set(key, newEntry);
  return value;
}

// vite/route-chunks.ts
function codeToAst(code, cache, cacheKey) {
  return structuredClone(
    getOrSetFromCache(
      cache,
      `${cacheKey}::codeToAst`,
      code,
      () => (0, import_parser.parse)(code, { sourceType: "module" })
    )
  );
}
function assertNodePath(path10) {
  invariant(
    path10 && !Array.isArray(path10),
    `Expected a Path, but got ${Array.isArray(path10) ? "an array" : path10}`
  );
}
function assertNodePathIsStatement(path10) {
  invariant(
    path10 && !Array.isArray(path10) && t.isStatement(path10.node),
    `Expected a Statement path, but got ${Array.isArray(path10) ? "an array" : path10?.node?.type}`
  );
}
function assertNodePathIsVariableDeclarator(path10) {
  invariant(
    path10 && !Array.isArray(path10) && t.isVariableDeclarator(path10.node),
    `Expected an Identifier path, but got ${Array.isArray(path10) ? "an array" : path10?.node?.type}`
  );
}
function assertNodePathIsPattern(path10) {
  invariant(
    path10 && !Array.isArray(path10) && t.isPattern(path10.node),
    `Expected a Pattern path, but got ${Array.isArray(path10) ? "an array" : path10?.node?.type}`
  );
}
function getExportDependencies(code, cache, cacheKey) {
  return getOrSetFromCache(
    cache,
    `${cacheKey}::getExportDependencies`,
    code,
    () => {
      let exportDependencies = /* @__PURE__ */ new Map();
      let ast = codeToAst(code, cache, cacheKey);
      function handleExport(exportName, exportPath, identifiersPath = exportPath) {
        let identifiers = getDependentIdentifiersForPath(identifiersPath);
        let topLevelStatements = /* @__PURE__ */ new Set([
          exportPath.node,
          ...getTopLevelStatementsForPaths(identifiers)
        ]);
        let topLevelNonModuleStatements = new Set(
          Array.from(topLevelStatements).filter(
            (statement) => !t.isImportDeclaration(statement) && !t.isExportDeclaration(statement)
          )
        );
        let importedIdentifierNames = /* @__PURE__ */ new Set();
        for (let identifier of identifiers) {
          if (identifier.parentPath.parentPath?.isImportDeclaration()) {
            importedIdentifierNames.add(identifier.node.name);
          }
        }
        let exportedVariableDeclarators = /* @__PURE__ */ new Set();
        for (let identifier of identifiers) {
          if (identifier.parentPath.isVariableDeclarator() && identifier.parentPath.parentPath.parentPath?.isExportNamedDeclaration()) {
            exportedVariableDeclarators.add(identifier.parentPath.node);
            continue;
          }
          let isWithinExportDestructuring = Boolean(
            identifier.findParent(
              (path10) => Boolean(
                path10.isPattern() && path10.parentPath?.isVariableDeclarator() && path10.parentPath.parentPath?.parentPath?.isExportNamedDeclaration()
              )
            )
          );
          if (isWithinExportDestructuring) {
            let currentPath = identifier;
            while (currentPath) {
              if (
                // Check the identifier is within a variable declaration, and if
                // so, ensure we're on the left-hand side of the expression
                // since these identifiers are what make up the export names,
                // e.g. export const { foo } = { foo: bar }; should pick up
                // `foo` but not `bar`.
                currentPath.parentPath?.isVariableDeclarator() && currentPath.parentKey === "id"
              ) {
                exportedVariableDeclarators.add(currentPath.parentPath.node);
                break;
              }
              currentPath = currentPath.parentPath;
            }
          }
        }
        let dependencies = {
          topLevelStatements,
          topLevelNonModuleStatements,
          importedIdentifierNames,
          exportedVariableDeclarators
        };
        exportDependencies.set(exportName, dependencies);
      }
      traverse(ast, {
        ExportDeclaration(exportPath) {
          let { node } = exportPath;
          if (t.isExportAllDeclaration(node)) {
            return;
          }
          if (t.isExportDefaultDeclaration(node)) {
            handleExport("default", exportPath);
            return;
          }
          let { declaration } = node;
          if (t.isVariableDeclaration(declaration)) {
            let { declarations } = declaration;
            for (let i = 0; i < declarations.length; i++) {
              let declarator = declarations[i];
              if (t.isIdentifier(declarator.id)) {
                let declaratorPath = exportPath.get(
                  `declaration.declarations.${i}`
                );
                assertNodePathIsVariableDeclarator(declaratorPath);
                handleExport(declarator.id.name, exportPath, declaratorPath);
                continue;
              }
              if (t.isPattern(declarator.id)) {
                let exportedPatternPath = exportPath.get(
                  `declaration.declarations.${i}.id`
                );
                assertNodePathIsPattern(exportedPatternPath);
                let identifiers = getIdentifiersForPatternPath(exportedPatternPath);
                for (let identifier of identifiers) {
                  handleExport(identifier.node.name, exportPath, identifier);
                }
              }
            }
            return;
          }
          if (t.isFunctionDeclaration(declaration) || t.isClassDeclaration(declaration)) {
            invariant(
              declaration.id,
              "Expected exported function or class declaration to have a name when not the default export"
            );
            handleExport(declaration.id.name, exportPath);
            return;
          }
          if (t.isExportNamedDeclaration(node)) {
            for (let specifier of node.specifiers) {
              if (t.isIdentifier(specifier.exported)) {
                let name = specifier.exported.name;
                let specifierPath = exportPath.get("specifiers").find((path10) => path10.node === specifier);
                invariant(
                  specifierPath,
                  `Expected to find specifier path for ${name}`
                );
                handleExport(name, exportPath, specifierPath);
              }
            }
            return;
          }
          throw new Error(`Unknown export node type: ${node.type}`);
        }
      });
      return exportDependencies;
    }
  );
}
function getDependentIdentifiersForPath(path10, state) {
  let { visited, identifiers } = state ?? {
    visited: /* @__PURE__ */ new Set(),
    identifiers: /* @__PURE__ */ new Set()
  };
  if (visited.has(path10)) {
    return identifiers;
  }
  visited.add(path10);
  path10.traverse({
    Identifier(path11) {
      if (identifiers.has(path11)) {
        return;
      }
      identifiers.add(path11);
      let binding = path11.scope.getBinding(path11.node.name);
      if (!binding) {
        return;
      }
      getDependentIdentifiersForPath(binding.path, { visited, identifiers });
      for (let reference of binding.referencePaths) {
        if (reference.isExportNamedDeclaration()) {
          continue;
        }
        getDependentIdentifiersForPath(reference, {
          visited,
          identifiers
        });
      }
      for (let constantViolation of binding.constantViolations) {
        getDependentIdentifiersForPath(constantViolation, {
          visited,
          identifiers
        });
      }
    }
  });
  let topLevelStatement = getTopLevelStatementPathForPath(path10);
  let withinImportStatement = topLevelStatement.isImportDeclaration();
  let withinExportStatement = topLevelStatement.isExportDeclaration();
  if (!withinImportStatement && !withinExportStatement) {
    getDependentIdentifiersForPath(topLevelStatement, {
      visited,
      identifiers
    });
  }
  if (withinExportStatement && path10.isIdentifier() && (t.isPattern(path10.parentPath.node) || // [foo]
  t.isPattern(path10.parentPath.parentPath?.node))) {
    let variableDeclarator = path10.findParent((p) => p.isVariableDeclarator());
    assertNodePath(variableDeclarator);
    getDependentIdentifiersForPath(variableDeclarator, {
      visited,
      identifiers
    });
  }
  return identifiers;
}
function getTopLevelStatementPathForPath(path10) {
  let ancestry = path10.getAncestry();
  let topLevelStatement = ancestry[ancestry.length - 2];
  assertNodePathIsStatement(topLevelStatement);
  return topLevelStatement;
}
function getTopLevelStatementsForPaths(paths) {
  let topLevelStatements = /* @__PURE__ */ new Set();
  for (let path10 of paths) {
    let topLevelStatement = getTopLevelStatementPathForPath(path10);
    topLevelStatements.add(topLevelStatement.node);
  }
  return topLevelStatements;
}
function getIdentifiersForPatternPath(patternPath, identifiers = /* @__PURE__ */ new Set()) {
  function walk(currentPath) {
    if (currentPath.isIdentifier()) {
      identifiers.add(currentPath);
      return;
    }
    if (currentPath.isObjectPattern()) {
      let { properties } = currentPath.node;
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        if (t.isObjectProperty(property)) {
          let valuePath = currentPath.get(`properties.${i}.value`);
          assertNodePath(valuePath);
          walk(valuePath);
        } else if (t.isRestElement(property)) {
          let argumentPath = currentPath.get(`properties.${i}.argument`);
          assertNodePath(argumentPath);
          walk(argumentPath);
        }
      }
    } else if (currentPath.isArrayPattern()) {
      let { elements } = currentPath.node;
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (element) {
          let elementPath = currentPath.get(`elements.${i}`);
          assertNodePath(elementPath);
          walk(elementPath);
        }
      }
    } else if (currentPath.isRestElement()) {
      let argumentPath = currentPath.get("argument");
      assertNodePath(argumentPath);
      walk(argumentPath);
    }
  }
  walk(patternPath);
  return identifiers;
}
var getExportedName = (exported) => {
  return t.isIdentifier(exported) ? exported.name : exported.value;
};
function setsIntersect(set1, set2) {
  let smallerSet = set1;
  let largerSet = set2;
  if (set1.size > set2.size) {
    smallerSet = set2;
    largerSet = set1;
  }
  for (let element of smallerSet) {
    if (largerSet.has(element)) {
      return true;
    }
  }
  return false;
}
function hasChunkableExport(code, exportName, cache, cacheKey) {
  return getOrSetFromCache(
    cache,
    `${cacheKey}::hasChunkableExport::${exportName}`,
    code,
    () => {
      let exportDependencies = getExportDependencies(code, cache, cacheKey);
      let dependencies = exportDependencies.get(exportName);
      if (!dependencies) {
        return false;
      }
      for (let [currentExportName, currentDependencies] of exportDependencies) {
        if (currentExportName === exportName) {
          continue;
        }
        if (setsIntersect(
          currentDependencies.topLevelNonModuleStatements,
          dependencies.topLevelNonModuleStatements
        )) {
          return false;
        }
      }
      if (dependencies.exportedVariableDeclarators.size > 1) {
        return false;
      }
      if (dependencies.exportedVariableDeclarators.size > 0) {
        for (let [
          currentExportName,
          currentDependencies
        ] of exportDependencies) {
          if (currentExportName === exportName) {
            continue;
          }
          if (setsIntersect(
            currentDependencies.exportedVariableDeclarators,
            dependencies.exportedVariableDeclarators
          )) {
            return false;
          }
        }
      }
      return true;
    }
  );
}
function getChunkedExport(code, exportName, generateOptions = {}, cache, cacheKey) {
  return getOrSetFromCache(
    cache,
    `${cacheKey}::getChunkedExport::${exportName}::${JSON.stringify(
      generateOptions
    )}`,
    code,
    () => {
      if (!hasChunkableExport(code, exportName, cache, cacheKey)) {
        return void 0;
      }
      let exportDependencies = getExportDependencies(code, cache, cacheKey);
      let dependencies = exportDependencies.get(exportName);
      invariant(dependencies, "Expected export to have dependencies");
      let topLevelStatementsArray = Array.from(dependencies.topLevelStatements);
      let exportedVariableDeclaratorsArray = Array.from(
        dependencies.exportedVariableDeclarators
      );
      let ast = codeToAst(code, cache, cacheKey);
      ast.program.body = ast.program.body.filter(
        (node) => topLevelStatementsArray.some(
          (statement) => t.isNodesEquivalent(node, statement)
        )
      ).map((node) => {
        if (!t.isImportDeclaration(node)) {
          return node;
        }
        if (dependencies.importedIdentifierNames.size === 0) {
          return null;
        }
        node.specifiers = node.specifiers.filter(
          (specifier) => dependencies.importedIdentifierNames.has(specifier.local.name)
        );
        invariant(
          node.specifiers.length > 0,
          "Expected import statement to have used specifiers"
        );
        return node;
      }).map((node) => {
        if (!t.isExportDeclaration(node)) {
          return node;
        }
        if (t.isExportAllDeclaration(node)) {
          return null;
        }
        if (t.isExportDefaultDeclaration(node)) {
          return exportName === "default" ? node : null;
        }
        let { declaration } = node;
        if (t.isVariableDeclaration(declaration)) {
          declaration.declarations = declaration.declarations.filter(
            (node2) => exportedVariableDeclaratorsArray.some(
              (declarator) => t.isNodesEquivalent(node2, declarator)
            )
          );
          if (declaration.declarations.length === 0) {
            return null;
          }
          return node;
        }
        if (t.isFunctionDeclaration(node.declaration) || t.isClassDeclaration(node.declaration)) {
          return node.declaration.id?.name === exportName ? node : null;
        }
        if (t.isExportNamedDeclaration(node)) {
          if (node.specifiers.length === 0) {
            return null;
          }
          node.specifiers = node.specifiers.filter(
            (specifier) => getExportedName(specifier.exported) === exportName
          );
          if (node.specifiers.length === 0) {
            return null;
          }
          return node;
        }
        throw new Error(`Unknown export node type: ${node.type}`);
      }).filter((node) => node !== null);
      return generate(ast, generateOptions);
    }
  );
}
function omitChunkedExports(code, exportNames, generateOptions = {}, cache, cacheKey) {
  return getOrSetFromCache(
    cache,
    `${cacheKey}::omitChunkedExports::${exportNames.join(
      ","
    )}::${JSON.stringify(generateOptions)}`,
    code,
    () => {
      const isChunkable = (exportName) => hasChunkableExport(code, exportName, cache, cacheKey);
      const isOmitted = (exportName) => exportNames.includes(exportName) && isChunkable(exportName);
      const isRetained = (exportName) => !isOmitted(exportName);
      let exportDependencies = getExportDependencies(code, cache, cacheKey);
      let allExportNames = Array.from(exportDependencies.keys());
      let omittedExportNames = allExportNames.filter(isOmitted);
      let retainedExportNames = allExportNames.filter(isRetained);
      let omittedStatements = /* @__PURE__ */ new Set();
      let omittedExportedVariableDeclarators = /* @__PURE__ */ new Set();
      for (let omittedExportName of omittedExportNames) {
        let dependencies = exportDependencies.get(omittedExportName);
        invariant(
          dependencies,
          `Expected dependencies for ${omittedExportName}`
        );
        for (let statement of dependencies.topLevelNonModuleStatements) {
          omittedStatements.add(statement);
        }
        for (let declarator of dependencies.exportedVariableDeclarators) {
          omittedExportedVariableDeclarators.add(declarator);
        }
      }
      let ast = codeToAst(code, cache, cacheKey);
      let omittedStatementsArray = Array.from(omittedStatements);
      let omittedExportedVariableDeclaratorsArray = Array.from(
        omittedExportedVariableDeclarators
      );
      ast.program.body = ast.program.body.filter(
        (node) => omittedStatementsArray.every(
          (statement) => !t.isNodesEquivalent(node, statement)
        )
      ).map((node) => {
        if (!t.isImportDeclaration(node)) {
          return node;
        }
        if (node.specifiers.length === 0) {
          return node;
        }
        node.specifiers = node.specifiers.filter((specifier) => {
          let importedName = specifier.local.name;
          for (let retainedExportName of retainedExportNames) {
            let dependencies = exportDependencies.get(retainedExportName);
            if (dependencies?.importedIdentifierNames?.has(importedName)) {
              return true;
            }
          }
          for (let omittedExportName of omittedExportNames) {
            let dependencies = exportDependencies.get(omittedExportName);
            if (dependencies?.importedIdentifierNames?.has(importedName)) {
              return false;
            }
          }
          return true;
        });
        if (node.specifiers.length === 0) {
          return null;
        }
        return node;
      }).map((node) => {
        if (!t.isExportDeclaration(node)) {
          return node;
        }
        if (t.isExportAllDeclaration(node)) {
          return node;
        }
        if (t.isExportDefaultDeclaration(node)) {
          return isOmitted("default") ? null : node;
        }
        if (t.isVariableDeclaration(node.declaration)) {
          node.declaration.declarations = node.declaration.declarations.filter(
            (node2) => omittedExportedVariableDeclaratorsArray.every(
              (declarator) => !t.isNodesEquivalent(node2, declarator)
            )
          );
          if (node.declaration.declarations.length === 0) {
            return null;
          }
          return node;
        }
        if (t.isFunctionDeclaration(node.declaration) || t.isClassDeclaration(node.declaration)) {
          invariant(
            node.declaration.id,
            "Expected exported function or class declaration to have a name when not the default export"
          );
          return isOmitted(node.declaration.id.name) ? null : node;
        }
        if (t.isExportNamedDeclaration(node)) {
          if (node.specifiers.length === 0) {
            return node;
          }
          node.specifiers = node.specifiers.filter((specifier) => {
            const exportedName = getExportedName(specifier.exported);
            return !isOmitted(exportedName);
          });
          if (node.specifiers.length === 0) {
            return null;
          }
          return node;
        }
        throw new Error(`Unknown node type: ${node.type}`);
      }).filter((node) => node !== null);
      if (ast.program.body.length === 0) {
        return void 0;
      }
      return generate(ast, generateOptions);
    }
  );
}
function detectRouteChunks(code, cache, cacheKey) {
  const hasRouteChunkByExportName = Object.fromEntries(
    routeChunkExportNames.map((exportName) => [
      exportName,
      hasChunkableExport(code, exportName, cache, cacheKey)
    ])
  );
  const chunkedExports = Object.entries(hasRouteChunkByExportName).filter(([, isChunked]) => isChunked).map(([exportName]) => exportName);
  const hasRouteChunks = chunkedExports.length > 0;
  return {
    hasRouteChunks,
    hasRouteChunkByExportName,
    chunkedExports
  };
}
var routeChunkExportNames = [
  "clientAction",
  "clientLoader",
  "clientMiddleware",
  "HydrateFallback"
];
var mainChunkName = "main";
var routeChunkNames = ["main", ...routeChunkExportNames];
function getRouteChunkCode(code, chunkName, cache, cacheKey) {
  if (chunkName === mainChunkName) {
    return omitChunkedExports(code, routeChunkExportNames, {}, cache, cacheKey);
  }
  return getChunkedExport(code, chunkName, {}, cache, cacheKey);
}
var routeChunkQueryStringPrefix = "?route-chunk=";
var routeChunkQueryStrings = {
  main: `${routeChunkQueryStringPrefix}main`,
  clientAction: `${routeChunkQueryStringPrefix}clientAction`,
  clientLoader: `${routeChunkQueryStringPrefix}clientLoader`,
  clientMiddleware: `${routeChunkQueryStringPrefix}clientMiddleware`,
  HydrateFallback: `${routeChunkQueryStringPrefix}HydrateFallback`
};
function getRouteChunkModuleId(filePath, chunkName) {
  return `${filePath}${routeChunkQueryStrings[chunkName]}`;
}
function isRouteChunkModuleId(id) {
  return Object.values(routeChunkQueryStrings).some(
    (queryString) => id.endsWith(queryString)
  );
}
function isRouteChunkName(name) {
  return name === mainChunkName || routeChunkExportNames.includes(name);
}
function getRouteChunkNameFromModuleId(id) {
  if (!isRouteChunkModuleId(id)) {
    return null;
  }
  let chunkName = id.split(routeChunkQueryStringPrefix)[1].split("&")[0];
  if (!isRouteChunkName(chunkName)) {
    return null;
  }
  return chunkName;
}

// vite/optimize-deps-entries.ts
var import_tinyglobby = require("tinyglobby");
function getOptimizeDepsEntries({
  entryClientFilePath,
  reactRouterConfig
}) {
  if (!reactRouterConfig.future.unstable_optimizeDeps) {
    return [];
  }
  const vite2 = getVite();
  const viteMajorVersion = parseInt(vite2.version.split(".")[0], 10);
  return [
    vite2.normalizePath(entryClientFilePath),
    ...Object.values(reactRouterConfig.routes).map(
      (route) => resolveRelativeRouteFilePath(route, reactRouterConfig)
    )
  ].map(
    (entry) => (
      // In Vite 7, the `optimizeDeps.entries` option only accepts glob patterns.
      // In prior versions, absolute file paths were treated differently.
      viteMajorVersion >= 7 ? (0, import_tinyglobby.escapePath)(entry) : entry
    )
  );
}

// vite/with-props.ts
var namedComponentExports = ["HydrateFallback", "ErrorBoundary"];
function isNamedComponentExport(name) {
  return namedComponentExports.includes(name);
}
var decorateComponentExportsWithProps = (ast) => {
  const hocs = [];
  function getHocUid(path10, hocName) {
    const uid = path10.scope.generateUidIdentifier(hocName);
    hocs.push([hocName, uid]);
    return uid;
  }
  traverse(ast, {
    ExportDeclaration(path10) {
      if (path10.isExportDefaultDeclaration()) {
        const declaration = path10.get("declaration");
        const expr = declaration.isExpression() ? declaration.node : declaration.isFunctionDeclaration() ? toFunctionExpression(declaration.node) : void 0;
        if (expr) {
          const uid = getHocUid(path10, "UNSAFE_withComponentProps");
          declaration.replaceWith(t.callExpression(uid, [expr]));
        }
        return;
      }
      if (path10.isExportNamedDeclaration()) {
        const decl = path10.get("declaration");
        if (decl.isVariableDeclaration()) {
          decl.get("declarations").forEach((varDeclarator) => {
            const id = varDeclarator.get("id");
            const init = varDeclarator.get("init");
            const expr = init.node;
            if (!expr) return;
            if (!id.isIdentifier()) return;
            const { name } = id.node;
            if (!isNamedComponentExport(name)) return;
            const uid = getHocUid(path10, `UNSAFE_with${name}Props`);
            init.replaceWith(t.callExpression(uid, [expr]));
          });
          return;
        }
        if (decl.isFunctionDeclaration()) {
          const { id } = decl.node;
          if (!id) return;
          const { name } = id;
          if (!isNamedComponentExport(name)) return;
          const uid = getHocUid(path10, `UNSAFE_with${name}Props`);
          decl.replaceWith(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                t.identifier(name),
                t.callExpression(uid, [toFunctionExpression(decl.node)])
              )
            ])
          );
        }
      }
    }
  });
  if (hocs.length > 0) {
    ast.program.body.unshift(
      t.importDeclaration(
        hocs.map(
          ([name, identifier]) => t.importSpecifier(identifier, t.identifier(name))
        ),
        t.stringLiteral("react-router")
      )
    );
  }
};
function toFunctionExpression(decl) {
  return t.functionExpression(
    decl.id,
    decl.params,
    decl.body,
    decl.generator,
    decl.async
  );
}

// vite/load-dotenv.ts
async function loadDotenv({
  rootDirectory,
  viteUserConfig,
  mode
}) {
  const vite2 = await import("vite");
  Object.assign(
    process.env,
    vite2.loadEnv(
      mode,
      viteUserConfig.envDir ?? rootDirectory,
      // We override the default prefix of "VITE_" with a blank string since
      // we're targeting the server, so we want to load all environment
      // variables, not just those explicitly marked for the client
      ""
    )
  );
}

// vite/plugins/validate-plugin-order.ts
function validatePluginOrder() {
  return {
    name: "react-router:validate-plugin-order",
    configResolved(viteConfig) {
      let pluginIndex = (pluginName) => {
        pluginName = Array.isArray(pluginName) ? pluginName : [pluginName];
        return viteConfig.plugins.findIndex(
          (plugin) => pluginName.includes(plugin.name)
        );
      };
      let reactRouterRscPluginIndex = pluginIndex("react-router/rsc");
      let viteRscPluginIndex = pluginIndex("rsc");
      if (reactRouterRscPluginIndex >= 0 && viteRscPluginIndex >= 0 && reactRouterRscPluginIndex > viteRscPluginIndex) {
        throw new Error(
          `The "@vitejs/plugin-rsc" plugin should be placed after the React Router RSC plugin in your Vite config`
        );
      }
      let reactRouterPluginIndex = pluginIndex([
        "react-router",
        "react-router/rsc"
      ]);
      let mdxPluginIndex = pluginIndex("@mdx-js/rollup");
      if (mdxPluginIndex >= 0 && mdxPluginIndex > reactRouterPluginIndex) {
        throw new Error(
          `The "@mdx-js/rollup" plugin should be placed before the React Router plugin in your Vite config`
        );
      }
    }
  };
}

// vite/plugins/warn-on-client-source-maps.ts
var import_picocolors3 = __toESM(require("picocolors"));
function warnOnClientSourceMaps() {
  let viteConfig;
  let viteCommand;
  let logged = false;
  return {
    name: "react-router:warn-on-client-source-maps",
    config(_, configEnv) {
      viteCommand = configEnv.command;
    },
    configResolved(config) {
      viteConfig = config;
    },
    buildStart() {
      invariant(viteConfig);
      if (!logged && viteCommand === "build" && viteConfig.mode === "production" && !viteConfig.build.ssr && (viteConfig.build.sourcemap || viteConfig.environments?.client?.build.sourcemap)) {
        viteConfig.logger.warn(
          import_picocolors3.default.yellow(
            "\n" + import_picocolors3.default.bold("  \u26A0\uFE0F  Source maps are enabled in production\n") + [
              "This makes your server code publicly",
              "visible in the browser. This is highly",
              "discouraged! If you insist, ensure that",
              "you are using environment variables for",
              "secrets and not hard-coding them in",
              "your source code."
            ].map((line) => "     " + line).join("\n") + "\n"
          )
        );
        logged = true;
      }
    }
  };
}

// vite/plugins/prerender.ts
var import_promises2 = require("fs/promises");
var import_node_path = __toESM(require("path"));
function normalizePrerenderRequest(input) {
  if (typeof input === "string" || input instanceof Request) {
    return { request: input, metadata: void 0 };
  }
  return { request: input.request, metadata: input.metadata };
}
function normalizePostProcessResult(result) {
  if (Array.isArray(result)) {
    return { files: result, requests: [] };
  }
  return { files: result.files, requests: result.requests ?? [] };
}
function prerender(options) {
  const {
    config,
    requests,
    postProcess = defaultPostProcess,
    handleError = defaultHandleError,
    logFile,
    finalize
  } = options;
  let viteConfig;
  return {
    name: "prerender",
    sharedDuringBuild: true,
    config: {
      order: "post",
      handler({ builder: { buildApp } = {} }) {
        return {
          builder: {
            async buildApp(builder) {
              await buildApp?.(builder);
              const rawRequests = typeof requests === "function" ? await requests() : requests;
              const prerenderRequests = rawRequests.map(
                normalizePrerenderRequest
              );
              if (prerenderRequests.length === 0) {
                return;
              }
              const prerenderConfig = typeof config === "function" ? await config() : config;
              const {
                buildDirectory = viteConfig.environments.client.build.outDir,
                concurrency = 1,
                retryCount = 0,
                retryDelay = 500,
                maxRedirects = 0,
                timeout = 1e4
              } = prerenderConfig ?? {};
              let ogIsBuildRequest = process.env.IS_RR_BUILD_REQUEST;
              process.env.IS_RR_BUILD_REQUEST = "yes";
              try {
                const previewServer = await startPreviewServer(viteConfig);
                try {
                  const baseUrl = getResolvedUrl(previewServer);
                  async function prerenderRequest(input, metadata) {
                    let attemptCount = 0;
                    let redirectCount = 0;
                    const request = new Request(input);
                    const url2 = new URL(request.url);
                    if (url2.origin !== baseUrl.origin) {
                      url2.hostname = baseUrl.hostname;
                      url2.protocol = baseUrl.protocol;
                      url2.port = baseUrl.port;
                    }
                    async function attempt(url3) {
                      try {
                        const signal = AbortSignal.timeout(timeout);
                        const prerenderReq = new Request(url3, request);
                        const response = await fetch(prerenderReq, {
                          redirect: "manual",
                          signal
                        });
                        if (response.status >= 300 && response.status < 400 && response.headers.has("location") && ++redirectCount <= maxRedirects) {
                          const location = response.headers.get("location");
                          const responseURL = new URL(response.url);
                          const locationUrl = new URL(location, response.url);
                          if (responseURL.origin !== locationUrl.origin) {
                            return await postProcess(
                              request,
                              response,
                              metadata
                            );
                          }
                          const redirectUrl = new URL(location, url3);
                          return await attempt(redirectUrl);
                        }
                        if (response.status >= 500 && ++attemptCount <= retryCount) {
                          await new Promise(
                            (resolve6) => setTimeout(resolve6, retryDelay)
                          );
                          return attempt(url3);
                        }
                        return await postProcess(request, response, metadata);
                      } catch (error) {
                        if (++attemptCount <= retryCount) {
                          await new Promise(
                            (resolve6) => setTimeout(resolve6, retryDelay)
                          );
                          return attempt(url3);
                        }
                        handleError(
                          request,
                          error instanceof Error ? error : new Error(error?.toString() ?? "Unknown error"),
                          metadata
                        );
                        return [];
                      }
                    }
                    return attempt(url2);
                  }
                  async function prerender2(input, metadata) {
                    const result = await prerenderRequest(input, metadata);
                    const { files, requests: requests2 } = normalizePostProcessResult(result);
                    for (const file of files) {
                      await writePrerenderFile(file, metadata);
                    }
                    for (const followUp of requests2) {
                      const normalized = normalizePrerenderRequest(followUp);
                      await prerender2(normalized.request, normalized.metadata);
                    }
                  }
                  async function writePrerenderFile(file, metadata) {
                    const normalizedPath = file.path.startsWith("/") ? file.path.slice(1) : file.path;
                    const outputPath = import_node_path.default.join(
                      buildDirectory,
                      ...normalizedPath.split("/")
                    );
                    await (0, import_promises2.mkdir)(import_node_path.default.dirname(outputPath), { recursive: true });
                    await (0, import_promises2.writeFile)(outputPath, file.contents);
                    const relativePath = import_node_path.default.relative(
                      viteConfig.root,
                      outputPath
                    );
                    if (logFile) {
                      logFile(relativePath, metadata);
                    }
                    return relativePath;
                  }
                  const pMap = await import("p-map");
                  await pMap.default(
                    prerenderRequests,
                    async ({ request, metadata }) => {
                      await prerender2(request, metadata);
                    },
                    { concurrency }
                  );
                  if (finalize) {
                    await finalize(buildDirectory);
                  }
                } finally {
                  await previewServer.close();
                }
              } finally {
                process.env.IS_RR_BUILD_REQUEST = ogIsBuildRequest;
              }
            }
          }
        };
      }
    },
    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
    }
  };
}
async function defaultPostProcess(request, response) {
  const prerenderPath = new URL(request.url).pathname;
  if (!response.ok) {
    throw new Error(
      `Prerender: Request failed for ${prerenderPath}: ${response.status} ${response.statusText}`
    );
  }
  return [
    {
      path: `${prerenderPath}/index.html`,
      contents: await response.text()
    }
  ];
}
function defaultHandleError(request, error) {
  const prerenderPath = new URL(request.url).pathname;
  if (request.signal?.aborted) {
    throw new Error(
      `Prerender: Request timed out for ${prerenderPath}: ${error.message}`
    );
  }
  throw new Error(
    `Prerender: Request failed for ${prerenderPath}: ${error.message}`
  );
}
async function startPreviewServer(viteConfig) {
  const vite2 = await import("vite");
  try {
    return await vite2.preview({
      configFile: viteConfig.configFile,
      logLevel: "silent",
      preview: {
        port: 0,
        open: false
      }
    });
  } catch (error) {
    throw new Error("Prerender: Failed to start Vite preview server", {
      cause: error
    });
  }
}
function getResolvedUrl(previewServer) {
  const baseUrl = previewServer.resolvedUrls?.local[0];
  if (!baseUrl) {
    throw new Error(
      "Prerender: No resolved URL is available from the Vite preview server"
    );
  }
  return new URL(baseUrl);
}

// vite/plugin.ts
function extractPluginContext(viteConfig) {
  return viteConfig["__reactRouterPluginContext"];
}
var SERVER_ONLY_ROUTE_EXPORTS = ["loader", "action", "middleware", "headers"];
var CLIENT_NON_COMPONENT_EXPORTS = [
  "clientAction",
  "clientLoader",
  "clientMiddleware",
  "handle",
  "meta",
  "links",
  "shouldRevalidate"
];
var CLIENT_ROUTE_EXPORTS = [
  ...CLIENT_NON_COMPONENT_EXPORTS,
  "default",
  "ErrorBoundary",
  "HydrateFallback",
  "Layout"
];
var BUILD_CLIENT_ROUTE_QUERY_STRING = "?__react-router-build-client-route";
var SSR_BUNDLE_PREFIX = "ssrBundle_";
function isSsrBundleEnvironmentName(name) {
  return name.startsWith(SSR_BUNDLE_PREFIX);
}
function getServerEnvironmentEntries(ctx, record) {
  return Object.entries(record).filter(
    ([name]) => ctx.buildManifest?.serverBundles ? isSsrBundleEnvironmentName(name) : name === "ssr"
  );
}
function getServerEnvironmentValues(ctx, record) {
  return getServerEnvironmentEntries(ctx, record).map(([, value]) => value);
}
var isRouteEntryModuleId = (id) => {
  return id.endsWith(BUILD_CLIENT_ROUTE_QUERY_STRING);
};
var isRouteVirtualModule = (id) => {
  return isRouteEntryModuleId(id) || isRouteChunkModuleId(id);
};
var isServerBuildVirtualModuleId = (id) => {
  return id.split("?")[0] === virtual.serverBuild.id;
};
var getServerBuildFile = (viteManifest) => {
  let serverBuildIds = Object.keys(viteManifest).filter(
    isServerBuildVirtualModuleId
  );
  invariant(
    serverBuildIds.length <= 1,
    "Multiple server build files found in manifest"
  );
  invariant(
    serverBuildIds.length === 1,
    "Server build file not found in manifest"
  );
  return viteManifest[serverBuildIds[0]].file;
};
var virtualHmrRuntime = create("hmr-runtime");
var virtualInjectHmrRuntime = create("inject-hmr-runtime");
var normalizeRelativeFilePath = (file, reactRouterConfig) => {
  let vite2 = getVite();
  let fullPath = path7.resolve(reactRouterConfig.appDirectory, file);
  let relativePath = path7.relative(reactRouterConfig.appDirectory, fullPath);
  return vite2.normalizePath(relativePath).split("?")[0];
};
var virtual = {
  serverBuild: create("server-build"),
  serverManifest: create("server-manifest"),
  browserManifest: create("browser-manifest")
};
var invalidateVirtualModules = (viteDevServer) => {
  Object.values(virtual).forEach((vmod) => {
    let mod = viteDevServer.moduleGraph.getModuleById(vmod.resolvedId);
    if (mod) {
      viteDevServer.moduleGraph.invalidateModule(mod);
    }
  });
};
var getHash = (source, maxLength) => {
  let hash = (0, import_node_crypto.createHash)("sha256").update(source).digest("hex");
  return typeof maxLength === "number" ? hash.slice(0, maxLength) : hash;
};
var resolveChunk = (ctx, viteManifest, absoluteFilePath) => {
  let vite2 = getVite();
  let rootRelativeFilePath = vite2.normalizePath(
    path7.relative(ctx.rootDirectory, absoluteFilePath)
  );
  let entryChunk = viteManifest[rootRelativeFilePath];
  if (!entryChunk) {
    return void 0;
  }
  return entryChunk;
};
var getPublicModulePathForEntry = (ctx, viteManifest, entryFilePath) => {
  let entryChunk = resolveChunk(ctx, viteManifest, entryFilePath);
  return entryChunk ? `${ctx.publicPath}${entryChunk.file}` : void 0;
};
var getCssCodeSplitDisabledFile = (ctx, viteConfig, viteManifest) => {
  if (viteConfig.build.cssCodeSplit) {
    return null;
  }
  let cssFile = viteManifest["style.css"]?.file;
  invariant(
    cssFile,
    "Expected `style.css` to be present in Vite manifest when `build.cssCodeSplit` is disabled"
  );
  return `${ctx.publicPath}${cssFile}`;
};
var getClientEntryChunk = (ctx, viteManifest) => {
  let filePath = ctx.entryClientFilePath;
  let chunk = resolveChunk(ctx, viteManifest, filePath);
  invariant(chunk, `Chunk not found: ${filePath}`);
  return chunk;
};
var getReactRouterManifestBuildAssets = (ctx, viteConfig, viteManifest, allDynamicCssFiles, entryFilePath, route) => {
  let entryChunk = resolveChunk(ctx, viteManifest, entryFilePath);
  invariant(entryChunk, `Chunk not found: ${entryFilePath}`);
  let isRootRoute = Boolean(route && route.parentId === void 0);
  let routeModuleChunks = routeChunkNames.map(
    (routeChunkName) => resolveChunk(
      ctx,
      viteManifest,
      getRouteChunkModuleId(entryFilePath.split("?")[0], routeChunkName)
    )
  ).filter(isNonNullable);
  let chunks = resolveDependantChunks(
    viteManifest,
    [
      // If this is the root route, we also need to include assets from the
      // client entry file as this is a common way for consumers to import
      // global reset styles, etc.
      isRootRoute ? getClientEntryChunk(ctx, viteManifest) : null,
      entryChunk,
      routeModuleChunks
    ].flat(1).filter(isNonNullable)
  );
  return {
    module: `${ctx.publicPath}${entryChunk.file}`,
    imports: dedupe(chunks.flatMap((e) => e.imports ?? [])).map((imported) => {
      return `${ctx.publicPath}${viteManifest[imported].file}`;
    }) ?? [],
    css: dedupe(
      [
        // If CSS code splitting is disabled, Vite includes a singular 'style.css' asset
        // in the manifest that isn't tied to any route file. If we want to render these
        // styles correctly, we need to include them in the root route.
        isRootRoute ? getCssCodeSplitDisabledFile(ctx, viteConfig, viteManifest) : null,
        chunks.flatMap((e) => e.css ?? []).map((href) => {
          let publicHref = `${ctx.publicPath}${href}`;
          return allDynamicCssFiles.has(href) ? `${publicHref}#` : publicHref;
        })
      ].flat(1).filter(isNonNullable)
    )
  };
};
function resolveDependantChunks(viteManifest, entryChunks) {
  let chunks = /* @__PURE__ */ new Set();
  function walk(chunk) {
    if (chunks.has(chunk)) {
      return;
    }
    chunks.add(chunk);
    if (chunk.imports) {
      for (let importKey of chunk.imports) {
        walk(viteManifest[importKey]);
      }
    }
  }
  for (let entryChunk of entryChunks) {
    walk(entryChunk);
  }
  return Array.from(chunks);
}
function getAllDynamicCssFiles(ctx, viteManifest) {
  let allDynamicCssFiles = /* @__PURE__ */ new Set();
  for (let route of Object.values(ctx.reactRouterConfig.routes)) {
    let routeFile = path7.join(ctx.reactRouterConfig.appDirectory, route.file);
    let entryChunk = resolveChunk(
      ctx,
      viteManifest,
      `${routeFile}${BUILD_CLIENT_ROUTE_QUERY_STRING}`
    );
    if (entryChunk) {
      let walk2 = function(chunk, isDynamicImportContext) {
        if (visitedChunks.has(chunk)) {
          return;
        }
        visitedChunks.add(chunk);
        if (isDynamicImportContext && chunk.css) {
          for (let cssFile of chunk.css) {
            allDynamicCssFiles.add(cssFile);
          }
        }
        if (chunk.dynamicImports) {
          for (let dynamicImportKey of chunk.dynamicImports) {
            walk2(viteManifest[dynamicImportKey], true);
          }
        }
        if (chunk.imports) {
          for (let importKey of chunk.imports) {
            walk2(viteManifest[importKey], isDynamicImportContext);
          }
        }
      };
      var walk = walk2;
      let visitedChunks = /* @__PURE__ */ new Set();
      walk2(entryChunk, false);
    }
  }
  return allDynamicCssFiles;
}
function dedupe(array2) {
  return [...new Set(array2)];
}
var writeFileSafe = async (file, contents) => {
  await (0, import_promises3.mkdir)(path7.dirname(file), { recursive: true });
  await (0, import_promises3.writeFile)(file, contents);
};
var getExportNames = (code) => {
  let [, exportSpecifiers] = (0, import_es_module_lexer.parse)(code);
  return exportSpecifiers.map(({ n: name }) => name);
};
var getRouteManifestModuleExports = async (viteChildCompiler, ctx) => {
  let entries = await Promise.all(
    Object.entries(ctx.reactRouterConfig.routes).map(async ([key, route]) => {
      let sourceExports = await getRouteModuleExports(
        viteChildCompiler,
        ctx,
        route.file
      );
      return [key, sourceExports];
    })
  );
  return Object.fromEntries(entries);
};
var compileRouteFile = async (viteChildCompiler, ctx, routeFile, readRouteFile) => {
  if (!viteChildCompiler) {
    throw new Error("Vite child compiler not found");
  }
  let ssr = true;
  let { pluginContainer, moduleGraph } = viteChildCompiler;
  let routePath = path7.resolve(ctx.reactRouterConfig.appDirectory, routeFile);
  let url2 = resolveFileUrl(ctx, routePath);
  let resolveId = async () => {
    let result = await pluginContainer.resolveId(url2, void 0, { ssr });
    if (!result) throw new Error(`Could not resolve module ID for ${url2}`);
    return result.id;
  };
  let [id, code] = await Promise.all([
    resolveId(),
    readRouteFile?.() ?? (0, import_promises3.readFile)(routePath, "utf-8"),
    // pluginContainer.transform(...) fails if we don't do this first:
    moduleGraph.ensureEntryFromUrl(url2, ssr)
  ]);
  let transformed = await pluginContainer.transform(code, id, { ssr });
  return transformed.code;
};
var getRouteModuleExports = async (viteChildCompiler, ctx, routeFile, readRouteFile) => {
  if (!viteChildCompiler) {
    throw new Error("Vite child compiler not found");
  }
  let code = await compileRouteFile(
    viteChildCompiler,
    ctx,
    routeFile,
    readRouteFile
  );
  return getExportNames(code);
};
var resolveEnvironmentBuildContext = ({
  viteCommand,
  viteUserConfig
}) => {
  if (!("__reactRouterEnvironmentBuildContext" in viteUserConfig) || !viteUserConfig.__reactRouterEnvironmentBuildContext) {
    return null;
  }
  let buildContext = viteUserConfig.__reactRouterEnvironmentBuildContext;
  let resolvedBuildContext = {
    name: buildContext.name,
    options: buildContext.resolveOptions({ viteUserConfig })
  };
  return resolvedBuildContext;
};
var getServerBuildDirectory = (reactRouterConfig, { serverBundleId } = {}) => path7.join(
  reactRouterConfig.buildDirectory,
  "server",
  ...serverBundleId ? [serverBundleId] : []
);
var getClientBuildDirectory = (reactRouterConfig) => path7.join(reactRouterConfig.buildDirectory, "client");
var getServerBundleRouteIds = (vitePluginContext, ctx) => {
  if (!ctx.buildManifest) {
    return void 0;
  }
  let environmentName = ctx.reactRouterConfig.future.v8_viteEnvironmentApi ? vitePluginContext.environment.name : ctx.environmentBuildContext?.name;
  if (!environmentName || !isSsrBundleEnvironmentName(environmentName)) {
    return void 0;
  }
  let serverBundleId = environmentName.replace(SSR_BUNDLE_PREFIX, "");
  let routesByServerBundleId = getRoutesByServerBundleId(ctx.buildManifest);
  let serverBundleRoutes = routesByServerBundleId[serverBundleId];
  invariant(
    serverBundleRoutes,
    `Routes not found for server bundle "${serverBundleId}"`
  );
  return Object.keys(serverBundleRoutes);
};
var defaultEntriesDir = path7.resolve(
  path7.dirname(require.resolve("@react-router/dev/package.json")),
  "dist",
  "config",
  "defaults"
);
var defaultEntries = (0, import_node_fs2.readdirSync)(defaultEntriesDir).map(
  (filename2) => path7.join(defaultEntriesDir, filename2)
);
invariant(defaultEntries.length > 0, "No default entries found");
var reactRouterDevLoadContext = () => void 0;
var reactRouterVitePlugin = () => {
  let rootDirectory;
  let viteCommand;
  let viteUserConfig;
  let viteConfigEnv;
  let viteConfig;
  let cssModulesManifest = {};
  let viteChildCompiler = null;
  let cache = /* @__PURE__ */ new Map();
  let reactRouterConfigLoader;
  let typegenWatcherPromise2;
  let logger;
  let firstLoad = true;
  let ctx;
  let updatePluginContext = async () => {
    let reactRouterConfig;
    let reactRouterConfigResult = await reactRouterConfigLoader.getConfig();
    if (reactRouterConfigResult.ok) {
      reactRouterConfig = reactRouterConfigResult.value;
    } else {
      logger.error(reactRouterConfigResult.error);
      if (firstLoad) {
        process.exit(1);
      }
      return;
    }
    let injectedPluginContext = !reactRouterConfig.future.v8_viteEnvironmentApi && viteCommand === "build" ? extractPluginContext(viteUserConfig) : void 0;
    let { entryClientFilePath, entryServerFilePath } = await resolveEntryFiles({
      rootDirectory,
      reactRouterConfig
    });
    let publicPath = viteUserConfig.base ?? "/";
    if (reactRouterConfig.basename !== "/" && viteCommand === "serve" && !viteUserConfig.server?.middlewareMode && !reactRouterConfig.basename.startsWith(publicPath)) {
      logger.error(
        import_picocolors4.default.red(
          "When using the React Router `basename` and the Vite `base` config, the `basename` config must begin with `base` for the default Vite dev server."
        )
      );
      process.exit(1);
    }
    let viteManifestEnabled = viteUserConfig.build?.manifest === true;
    let buildManifest = viteCommand === "build" ? injectedPluginContext?.buildManifest ?? await getBuildManifest({ reactRouterConfig, rootDirectory }) : null;
    let environmentBuildContext = viteCommand === "build" ? resolveEnvironmentBuildContext({ viteCommand, viteUserConfig }) : null;
    firstLoad = false;
    ctx = {
      environmentBuildContext,
      reactRouterManifest: null,
      prerenderPaths: null,
      reactRouterConfig,
      rootDirectory,
      entryClientFilePath,
      entryServerFilePath,
      publicPath,
      viteManifestEnabled,
      buildManifest
    };
  };
  let getServerEntry = async ({ routeIds }) => {
    invariant(viteConfig, "viteconfig required to generate the server entry");
    let routes = routeIds ? (
      // For server bundle builds, the server build should only import the
      // routes for this bundle rather than importing all routes
      (0, import_pick3.default)(ctx.reactRouterConfig.routes, routeIds)
    ) : (
      // Otherwise, all routes are imported as usual
      ctx.reactRouterConfig.routes
    );
    let prerenderPaths = await getPrerenderPaths(
      ctx.reactRouterConfig.prerender,
      ctx.reactRouterConfig.ssr,
      routes
    );
    if (!ctx.prerenderPaths) {
      ctx.prerenderPaths = /* @__PURE__ */ new Set();
    }
    for (let path10 of prerenderPaths) {
      ctx.prerenderPaths.add(path10);
    }
    let isSpaMode = isSpaModeEnabled(ctx.reactRouterConfig);
    return `
    import * as entryServer from ${JSON.stringify(
      resolveFileUrl(ctx, ctx.entryServerFilePath)
    )};
    ${Object.keys(routes).map((key, index) => {
      let route = routes[key];
      if (isSpaMode && key !== "root") {
        return `const route${index} = { default: () => null };`;
      } else {
        return `import * as route${index} from ${JSON.stringify(
          resolveFileUrl(
            ctx,
            resolveRelativeRouteFilePath(route, ctx.reactRouterConfig)
          )
        )};`;
      }
    }).join("\n")}
      export { default as assets } from ${JSON.stringify(
      virtual.serverManifest.id
    )};
      export const assetsBuildDirectory = ${JSON.stringify(
      path7.relative(
        ctx.rootDirectory,
        getClientBuildDirectory(ctx.reactRouterConfig)
      )
    )};
      export const basename = ${JSON.stringify(ctx.reactRouterConfig.basename)};
      export const future = ${JSON.stringify(ctx.reactRouterConfig.future)};
      export const ssr = ${ctx.reactRouterConfig.ssr};
      export const isSpaMode = ${isSpaMode};
      export const prerender = ${JSON.stringify(prerenderPaths)};
      export const routeDiscovery = ${JSON.stringify(
      ctx.reactRouterConfig.routeDiscovery
    )};
      export const publicPath = ${JSON.stringify(ctx.publicPath)};
      export const entry = { module: entryServer };
      export const routes = {
        ${Object.keys(routes).map((key, index) => {
      let route = routes[key];
      return `${JSON.stringify(key)}: {
          id: ${JSON.stringify(route.id)},
          parentId: ${JSON.stringify(route.parentId)},
          path: ${JSON.stringify(route.path)},
          index: ${JSON.stringify(route.index)},
          caseSensitive: ${JSON.stringify(route.caseSensitive)},
          module: route${index}
        }`;
    }).join(",\n  ")}
      };
      ${ctx.reactRouterConfig.future.v8_viteEnvironmentApi && viteCommand === "serve" ? `
              export const unstable_getCriticalCss = ({ pathname }) => {
                return {
                  rel: "stylesheet",
                  href: "${ctx.publicPath}@react-router/critical.css?pathname=" + pathname,
                };
              }
            ` : ""}
      export const allowedActionOrigins = ${JSON.stringify(ctx.reactRouterConfig.allowedActionOrigins)};
    `;
  };
  let loadViteManifest = async (directory) => {
    let manifestContents = await (0, import_promises3.readFile)(
      path7.resolve(directory, ".vite", "manifest.json"),
      "utf-8"
    );
    return JSON.parse(manifestContents);
  };
  let getViteManifestAssetPaths = (viteManifest) => {
    let cssUrlPaths = Object.values(viteManifest).filter((chunk) => chunk.file.endsWith(".css")).map((chunk) => chunk.file);
    let chunkAssetPaths = Object.values(viteManifest).flatMap(
      (chunk) => chunk.assets ?? []
    );
    return /* @__PURE__ */ new Set([...cssUrlPaths, ...chunkAssetPaths]);
  };
  let generateSriManifest = async (ctx2) => {
    let clientBuildDirectory = getClientBuildDirectory(ctx2.reactRouterConfig);
    let entries = (0, import_node_fs2.readdirSync)(clientBuildDirectory, {
      withFileTypes: true,
      recursive: true
    });
    let sriManifest = {};
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".js")) {
        const entryNormalizedPath = "parentPath" in entry && typeof entry.parentPath === "string" ? entry.parentPath : entry.path;
        let contents;
        try {
          contents = await (0, import_promises3.readFile)(
            path7.join(entryNormalizedPath, entry.name),
            "utf-8"
          );
        } catch (e) {
          logger.error(`Failed to read file for SRI generation: ${entry.name}`);
          throw e;
        }
        let hash = (0, import_node_crypto.createHash)("sha384").update(contents).digest().toString("base64");
        let filepath = getVite().normalizePath(
          path7.relative(
            clientBuildDirectory,
            path7.join(entryNormalizedPath, entry.name)
          )
        );
        sriManifest[`${ctx2.publicPath}${filepath}`] = `sha384-${hash}`;
      }
    }
    return sriManifest;
  };
  let generateReactRouterManifestsForBuild = async ({
    viteConfig: viteConfig2,
    routeIds
  }) => {
    invariant(viteConfig2);
    let viteManifest = await loadViteManifest(
      getClientBuildDirectory(ctx.reactRouterConfig)
    );
    let allDynamicCssFiles = getAllDynamicCssFiles(ctx, viteManifest);
    let entry = getReactRouterManifestBuildAssets(
      ctx,
      viteConfig2,
      viteManifest,
      allDynamicCssFiles,
      ctx.entryClientFilePath,
      null
    );
    let browserRoutes = {};
    let serverRoutes = {};
    let routeManifestExports = await getRouteManifestModuleExports(
      viteChildCompiler,
      ctx
    );
    let enforceSplitRouteModules = ctx.reactRouterConfig.future.v8_splitRouteModules === "enforce";
    for (let route of Object.values(ctx.reactRouterConfig.routes)) {
      let routeFile = path7.join(ctx.reactRouterConfig.appDirectory, route.file);
      let sourceExports = routeManifestExports[route.id];
      let hasClientAction = sourceExports.includes("clientAction");
      let hasClientLoader = sourceExports.includes("clientLoader");
      let hasClientMiddleware = sourceExports.includes("clientMiddleware");
      let hasHydrateFallback = sourceExports.includes("HydrateFallback");
      let { hasRouteChunkByExportName } = await detectRouteChunksIfEnabled(
        cache,
        ctx,
        routeFile,
        { routeFile, viteChildCompiler }
      );
      if (enforceSplitRouteModules) {
        validateRouteChunks({
          ctx,
          id: route.file,
          valid: {
            clientAction: !hasClientAction || hasRouteChunkByExportName.clientAction,
            clientLoader: !hasClientLoader || hasRouteChunkByExportName.clientLoader,
            clientMiddleware: !hasClientMiddleware || hasRouteChunkByExportName.clientMiddleware,
            HydrateFallback: !hasHydrateFallback || hasRouteChunkByExportName.HydrateFallback
          }
        });
      }
      let routeManifestEntry = {
        id: route.id,
        parentId: route.parentId,
        path: route.path,
        index: route.index,
        caseSensitive: route.caseSensitive,
        hasAction: sourceExports.includes("action"),
        hasLoader: sourceExports.includes("loader"),
        hasClientAction,
        hasClientLoader,
        hasClientMiddleware,
        hasDefaultExport: sourceExports.includes("default"),
        hasErrorBoundary: sourceExports.includes("ErrorBoundary"),
        ...getReactRouterManifestBuildAssets(
          ctx,
          viteConfig2,
          viteManifest,
          allDynamicCssFiles,
          `${routeFile}${BUILD_CLIENT_ROUTE_QUERY_STRING}`,
          route
        ),
        clientActionModule: hasRouteChunkByExportName.clientAction ? getPublicModulePathForEntry(
          ctx,
          viteManifest,
          getRouteChunkModuleId(routeFile, "clientAction")
        ) : void 0,
        clientLoaderModule: hasRouteChunkByExportName.clientLoader ? getPublicModulePathForEntry(
          ctx,
          viteManifest,
          getRouteChunkModuleId(routeFile, "clientLoader")
        ) : void 0,
        clientMiddlewareModule: hasRouteChunkByExportName.clientMiddleware ? getPublicModulePathForEntry(
          ctx,
          viteManifest,
          getRouteChunkModuleId(routeFile, "clientMiddleware")
        ) : void 0,
        hydrateFallbackModule: hasRouteChunkByExportName.HydrateFallback ? getPublicModulePathForEntry(
          ctx,
          viteManifest,
          getRouteChunkModuleId(routeFile, "HydrateFallback")
        ) : void 0
      };
      browserRoutes[route.id] = routeManifestEntry;
      if (!routeIds || routeIds.includes(route.id)) {
        serverRoutes[route.id] = routeManifestEntry;
      }
    }
    let fingerprintedValues = { entry, routes: browserRoutes };
    let version = getHash(JSON.stringify(fingerprintedValues), 8);
    let manifestPath = path7.posix.join(
      viteConfig2.build.assetsDir,
      `manifest-${version}.js`
    );
    let url2 = `${ctx.publicPath}${manifestPath}`;
    let nonFingerprintedValues = { url: url2, version };
    let reactRouterBrowserManifest = {
      ...fingerprintedValues,
      ...nonFingerprintedValues,
      sri: void 0
    };
    await writeFileSafe(
      path7.join(getClientBuildDirectory(ctx.reactRouterConfig), manifestPath),
      `window.__reactRouterManifest=${JSON.stringify(
        reactRouterBrowserManifest
      )};`
    );
    let sri = void 0;
    if (ctx.reactRouterConfig.future.unstable_subResourceIntegrity) {
      sri = await generateSriManifest(ctx);
    }
    let reactRouterServerManifest = {
      ...reactRouterBrowserManifest,
      routes: serverRoutes,
      sri
    };
    return {
      reactRouterBrowserManifest,
      reactRouterServerManifest
    };
  };
  let currentReactRouterManifestForDev = null;
  let getReactRouterManifestForDev = async () => {
    let routes = {};
    let routeManifestExports = await getRouteManifestModuleExports(
      viteChildCompiler,
      ctx
    );
    let enforceSplitRouteModules = ctx.reactRouterConfig.future.v8_splitRouteModules === "enforce";
    for (let [key, route] of Object.entries(ctx.reactRouterConfig.routes)) {
      let routeFile = route.file;
      let sourceExports = routeManifestExports[key];
      let hasClientAction = sourceExports.includes("clientAction");
      let hasClientLoader = sourceExports.includes("clientLoader");
      let hasClientMiddleware = sourceExports.includes("clientMiddleware");
      let hasHydrateFallback = sourceExports.includes("HydrateFallback");
      let routeModulePath = combineURLs(
        ctx.publicPath,
        `${resolveFileUrl(
          ctx,
          resolveRelativeRouteFilePath(route, ctx.reactRouterConfig)
        )}`
      );
      if (enforceSplitRouteModules) {
        let { hasRouteChunkByExportName } = await detectRouteChunksIfEnabled(
          cache,
          ctx,
          routeFile,
          { routeFile, viteChildCompiler }
        );
        validateRouteChunks({
          ctx,
          id: route.file,
          valid: {
            clientAction: !hasClientAction || hasRouteChunkByExportName.clientAction,
            clientLoader: !hasClientLoader || hasRouteChunkByExportName.clientLoader,
            clientMiddleware: !hasClientMiddleware || hasRouteChunkByExportName.clientMiddleware,
            HydrateFallback: !hasHydrateFallback || hasRouteChunkByExportName.HydrateFallback
          }
        });
      }
      routes[key] = {
        id: route.id,
        parentId: route.parentId,
        path: route.path,
        index: route.index,
        caseSensitive: route.caseSensitive,
        module: routeModulePath,
        // Split route modules are a build-time optimization
        clientActionModule: void 0,
        clientLoaderModule: void 0,
        clientMiddlewareModule: void 0,
        hydrateFallbackModule: void 0,
        hasAction: sourceExports.includes("action"),
        hasLoader: sourceExports.includes("loader"),
        hasClientAction,
        hasClientLoader,
        hasClientMiddleware,
        hasDefaultExport: sourceExports.includes("default"),
        hasErrorBoundary: sourceExports.includes("ErrorBoundary"),
        imports: []
      };
    }
    let sri = void 0;
    let reactRouterManifestForDev = {
      version: String(Math.random()),
      url: combineURLs(ctx.publicPath, virtual.browserManifest.url),
      hmr: {
        runtime: combineURLs(ctx.publicPath, virtualInjectHmrRuntime.url)
      },
      entry: {
        module: combineURLs(
          ctx.publicPath,
          resolveFileUrl(ctx, ctx.entryClientFilePath)
        ),
        imports: []
      },
      sri,
      routes
    };
    currentReactRouterManifestForDev = reactRouterManifestForDev;
    return reactRouterManifestForDev;
  };
  const loadCssContents = async (viteDevServer, dep) => {
    invariant(
      viteCommand === "serve",
      "loadCssContents is only available in dev mode"
    );
    if (dep.file && isCssModulesFile(dep.file)) {
      return cssModulesManifest[dep.file];
    }
    let transformedCssCode = (await viteDevServer.transformRequest(dep.url))?.code;
    invariant(
      transformedCssCode,
      `Failed to load CSS for ${dep.file ?? dep.url}`
    );
    let cssString = getCssStringFromViteDevModuleCode(transformedCssCode);
    invariant(
      typeof cssString === "string",
      `Failed to extract CSS for ${dep.file ?? dep.url}`
    );
    return cssString;
  };
  return [
    {
      name: "react-router",
      config: async (_viteUserConfig, _viteConfigEnv) => {
        await preloadVite();
        let vite2 = getVite();
        viteUserConfig = _viteUserConfig;
        viteConfigEnv = _viteConfigEnv;
        viteCommand = viteConfigEnv.command;
        let viteClientConditions = [
          ...vite2.defaultClientConditions ?? []
        ];
        logger = vite2.createLogger(viteUserConfig.logLevel, {
          prefix: "[react-router]"
        });
        rootDirectory = viteUserConfig.root ?? process.env.REACT_ROUTER_ROOT ?? process.cwd();
        let mode = viteConfigEnv.mode;
        if (viteCommand === "serve") {
          typegenWatcherPromise2 = watch(rootDirectory, {
            mode,
            rsc: false,
            // ignore `info` logs from typegen since they are redundant when Vite plugin logs are active
            logger: vite2.createLogger("warn", { prefix: "[react-router]" })
          });
        }
        await loadDotenv({
          rootDirectory,
          viteUserConfig,
          mode
        });
        reactRouterConfigLoader = await createConfigLoader({
          rootDirectory,
          mode,
          watch: viteCommand === "serve"
        });
        await updatePluginContext();
        let environments = await getEnvironmentsOptions(ctx, viteCommand, {
          viteUserConfig
        });
        let serverEnvironment = getServerEnvironmentValues(
          ctx,
          environments
        )[0];
        invariant(serverEnvironment);
        let clientEnvironment = environments.client;
        invariant(clientEnvironment);
        return {
          __reactRouterPluginContext: ctx,
          appType: viteCommand === "serve" && viteConfigEnv.mode === "production" && ctx.reactRouterConfig.ssr === false ? "spa" : "custom",
          ssr: {
            external: serverEnvironment.resolve?.external,
            resolve: serverEnvironment.resolve
          },
          optimizeDeps: {
            entries: getOptimizeDepsEntries({
              entryClientFilePath: ctx.entryClientFilePath,
              reactRouterConfig: ctx.reactRouterConfig
            }),
            include: [
              // Pre-bundle React dependencies to avoid React duplicates,
              // even if React dependencies are not direct dependencies.
              // https://react.dev/warnings/invalid-hook-call-warning#duplicate-react
              "react",
              "react/jsx-runtime",
              "react/jsx-dev-runtime",
              "react-dom",
              "react-dom/client",
              // Pre-bundle router dependencies to avoid router duplicates.
              // Mismatching routers cause `Error: You must render this element inside a <Remix> element`.
              "react-router",
              "react-router/dom",
              // Check to avoid "Failed to resolve dependency: react-router-dom, present in 'optimizeDeps.include'"
              ...hasDependency({
                name: "react-router-dom",
                rootDirectory: ctx.rootDirectory
              }) ? ["react-router-dom"] : []
            ]
          },
          ...defineCompilerOptions({
            oxc: {
              jsx: {
                runtime: "automatic",
                development: viteCommand !== "build"
              }
            },
            esbuild: {
              jsx: "automatic",
              jsxDev: viteCommand !== "build"
            }
          }),
          resolve: {
            dedupe: [
              // https://react.dev/warnings/invalid-hook-call-warning#duplicate-react
              "react",
              "react-dom",
              // see description for `optimizeDeps.include`
              "react-router",
              "react-router/dom",
              "react-router-dom"
            ],
            conditions: viteCommand === "build" ? viteClientConditions : ["development", ...viteClientConditions]
          },
          base: viteUserConfig.base,
          // When consumer provides an allowlist for files that can be read by
          // the server, ensure that the default entry files are included.
          // If we don't do this and a default entry file is used, the server
          // will throw an error that the file is not allowed to be read.
          // https://vitejs.dev/config/server-options#server-fs-allow
          server: viteUserConfig.server?.fs?.allow ? { fs: { allow: defaultEntries } } : void 0,
          ...ctx.reactRouterConfig.future.v8_viteEnvironmentApi ? {
            environments,
            build: {
              // This isn't honored by the SSR environment config (which seems
              // to be a Vite bug?) so we set it here too.
              ssrEmitAssets: true
            },
            builder: {
              sharedConfigBuild: true,
              sharedPlugins: true,
              async buildApp(builder) {
                invariant(viteConfig);
                viteConfig.logger.info(
                  "Using Vite Environment API (experimental)"
                );
                let { reactRouterConfig } = ctx;
                await cleanBuildDirectory(viteConfig, ctx);
                await builder.build(builder.environments.client);
                let serverEnvironments = getServerEnvironmentValues(
                  ctx,
                  builder.environments
                );
                await Promise.all(serverEnvironments.map(builder.build));
                await cleanViteManifests(environments, ctx);
                let { buildManifest } = ctx;
                invariant(buildManifest, "Expected build manifest");
                await reactRouterConfig.buildEnd?.({
                  buildManifest,
                  reactRouterConfig,
                  viteConfig
                });
              }
            }
          } : {
            build: ctx.environmentBuildContext?.options.build ?? (viteConfigEnv.isSsrBuild ? serverEnvironment.build : clientEnvironment.build)
          }
        };
      },
      configEnvironment(name, options) {
        if (ctx.reactRouterConfig.future.v8_viteEnvironmentApi && (ctx.buildManifest?.serverBundles ? isSsrBundleEnvironmentName(name) : name === "ssr")) {
          const vite2 = getVite();
          return {
            resolve: {
              external: (
                // This check is required to honor the "noExternal: true" config
                // provided by vite-plugin-cloudflare within this repo. When compiling
                // for Cloudflare, all server dependencies are pre-bundled, but our
                // `ssrExternals` config inadvertently overrides this. This doesn't
                // impact consumers because for them `ssrExternals` is undefined and
                // Cloudflare's "noExternal: true" config remains intact.
                options.resolve?.noExternal === true ? void 0 : ssrExternals
              )
            },
            optimizeDeps: options.optimizeDeps?.noDiscovery === false ? {
              entries: [
                vite2.normalizePath(ctx.entryServerFilePath),
                ...Object.values(ctx.reactRouterConfig.routes).map(
                  (route) => resolveRelativeRouteFilePath(
                    route,
                    ctx.reactRouterConfig
                  )
                )
              ],
              include: [
                "react",
                "react/jsx-dev-runtime",
                "react-dom/server",
                "react-router"
              ]
            } : void 0
          };
        }
      },
      async configResolved(resolvedViteConfig) {
        await import_es_module_lexer.init;
        viteConfig = resolvedViteConfig;
        invariant(viteConfig);
        if (!viteConfig.configFile) {
          throw new Error(
            "The React Router Vite plugin requires the use of a Vite config file"
          );
        }
        let vite2 = getVite();
        let childCompilerConfigFile = await vite2.loadConfigFromFile(
          {
            command: viteConfig.command,
            mode: viteConfig.mode
          },
          viteConfig.configFile
        );
        invariant(
          childCompilerConfigFile,
          "Vite config file was unable to be resolved for React Router child compiler"
        );
        const childCompilerPlugins = await asyncFlatten(
          childCompilerConfigFile.config.plugins ?? []
        );
        viteChildCompiler = await vite2.createServer({
          ...viteUserConfig,
          // Ensure child compiler cannot overwrite the default cache directory
          cacheDir: "node_modules/.vite-child-compiler",
          mode: viteConfig.mode,
          server: {
            watch: viteConfig.command === "build" ? null : void 0,
            preTransformRequests: false,
            hmr: false
          },
          configFile: false,
          envFile: false,
          plugins: [
            childCompilerPlugins.filter(
              (plugin) => typeof plugin === "object" && plugin !== null && "name" in plugin && plugin.name !== "react-router" && plugin.name !== "react-router:route-exports" && plugin.name !== "react-router:hmr-updates" && plugin.name !== "react-router:validate-plugin-order"
            ).map((plugin) => ({
              ...plugin,
              configureServer: void 0,
              configurePreviewServer: void 0
            }))
          ]
        });
        await viteChildCompiler.pluginContainer.buildStart({});
      },
      async transform(code, id) {
        if (isCssModulesFile(id)) {
          cssModulesManifest[id] = code;
        }
      },
      async configureServer(viteDevServer) {
        (0, import_react_router2.unstable_setDevServerHooks)({
          // Give the request handler access to the critical CSS in dev to avoid a
          // flash of unstyled content since Vite injects CSS file contents via JS
          getCriticalCss: async (pathname) => {
            return getStylesForPathname({
              rootDirectory: ctx.rootDirectory,
              entryClientFilePath: ctx.entryClientFilePath,
              reactRouterConfig: ctx.reactRouterConfig,
              viteDevServer,
              loadCssContents,
              pathname
            });
          },
          // If an error is caught within the request handler, let Vite fix the
          // stack trace so it maps back to the actual source code
          processRequestError: (error) => {
            if (error instanceof Error) {
              viteDevServer.ssrFixStacktrace(error);
            }
          }
        });
        reactRouterConfigLoader.onChange(
          async ({
            result,
            configCodeChanged,
            routeConfigCodeChanged,
            configChanged,
            routeConfigChanged
          }) => {
            if (!result.ok) {
              invalidateVirtualModules(viteDevServer);
              logger.error(result.error, {
                clear: true,
                timestamp: true
              });
              return;
            }
            let message = configChanged ? "Config changed." : routeConfigChanged ? "Route config changed." : configCodeChanged ? "Config saved." : routeConfigCodeChanged ? " Route config saved." : "Config saved";
            logger.info(import_picocolors4.default.green(message), {
              clear: true,
              timestamp: true
            });
            await updatePluginContext();
            if (configChanged || routeConfigChanged) {
              invalidateVirtualModules(viteDevServer);
            }
          }
        );
        if (ctx.reactRouterConfig.future.v8_viteEnvironmentApi) {
          viteDevServer.middlewares.use(async (req, res, next) => {
            let [reqPathname, reqSearch] = (req.url ?? "").split("?");
            if (reqPathname.endsWith("/@react-router/critical.css")) {
              let pathname = new URLSearchParams(reqSearch).get("pathname");
              if (!pathname) {
                return next("No pathname provided");
              }
              let css = await getStylesForPathname({
                rootDirectory: ctx.rootDirectory,
                entryClientFilePath: ctx.entryClientFilePath,
                reactRouterConfig: ctx.reactRouterConfig,
                viteDevServer,
                loadCssContents,
                pathname
              });
              res.setHeader("Content-Type", "text/css");
              res.end(css);
            } else {
              next();
            }
          });
        }
        return () => {
          if (!viteDevServer.config.server.middlewareMode) {
            viteDevServer.middlewares.use(async (req, res, next) => {
              try {
                let build;
                if (ctx.reactRouterConfig.future.v8_viteEnvironmentApi) {
                  let vite2 = getVite();
                  let ssrEnvironment = viteDevServer.environments.ssr;
                  if (!vite2.isRunnableDevEnvironment(ssrEnvironment)) {
                    next();
                    return;
                  }
                  build = await ssrEnvironment.runner.import(
                    virtual.serverBuild.id
                  );
                } else {
                  build = await viteDevServer.ssrLoadModule(
                    virtual.serverBuild.id
                  );
                }
                let handler = (0, import_react_router2.createRequestHandler)(build, "development");
                let nodeHandler = async (nodeReq, nodeRes) => {
                  let req2 = await fromNodeRequest(nodeReq, nodeRes);
                  let res2 = await handler(
                    req2,
                    await reactRouterDevLoadContext(req2)
                  );
                  const { sendResponse } = await import("@remix-run/node-fetch-server");
                  await sendResponse(nodeRes, res2);
                };
                await nodeHandler(req, res);
              } catch (error) {
                next(error);
              }
            });
          }
        };
      },
      configurePreviewServer(previewServer) {
        let cachedHandler = null;
        async function getHandler() {
          if (cachedHandler) return cachedHandler;
          let bundledHandlers = [];
          let buildManifest = ctx.buildManifest ?? (ctx.reactRouterConfig.serverBundles ? await getBuildManifest({
            reactRouterConfig: ctx.reactRouterConfig,
            rootDirectory: ctx.rootDirectory
          }) : null);
          if (buildManifest?.serverBundles) {
            let routesByServerBundleId = getRoutesByServerBundleId(buildManifest);
            for (let bundle of Object.values(buildManifest.serverBundles)) {
              let build = await import(url.pathToFileURL(path7.resolve(ctx.rootDirectory, bundle.file)).href);
              bundledHandlers.push({
                handler: (0, import_react_router2.createRequestHandler)(build, "production"),
                routes: createPrerenderRoutes(
                  routesByServerBundleId[bundle.id] ?? {}
                )
              });
            }
          } else {
            let serverEntryPath = path7.resolve(
              getServerBuildDirectory(ctx.reactRouterConfig),
              "index.js"
            );
            let build = await import(url.pathToFileURL(serverEntryPath).href);
            bundledHandlers.push({
              handler: (0, import_react_router2.createRequestHandler)(build, "production"),
              routes: null
            });
          }
          cachedHandler = async (request, loadContext) => {
            let response;
            let handlersToTry = bundledHandlers;
            if (buildManifest?.serverBundles) {
              let pathname = new URL(request.url).pathname;
              handlersToTry = bundledHandlers.map((entry, index) => ({
                entry,
                index,
                matchDepth: (0, import_react_router2.matchRoutes)(
                  entry.routes ?? [],
                  pathname,
                  ctx.reactRouterConfig.basename
                )?.length ?? -1
              })).sort(
                (a, b) => b.matchDepth - a.matchDepth || a.index - b.index
              ).map(({ entry }) => entry);
            }
            for (let { handler } of handlersToTry) {
              response = await handler(request, loadContext);
              if (response.status !== 404) {
                return response;
              }
            }
            if (response) {
              return response;
            }
            let url2 = new URL(request.url);
            throw new Error(
              "No handlers were found for the request: " + url2.pathname + url2.search
            );
          };
          return cachedHandler;
        }
        return () => {
          if (!ctx.reactRouterConfig.ssr) {
            return;
          }
          previewServer.middlewares.use(async (req, res, next) => {
            try {
              let handler = await getHandler();
              let request = await fromNodeRequest(req, res);
              let response = await handler(
                request,
                await reactRouterDevLoadContext(request)
              );
              const { sendResponse } = await import("@remix-run/node-fetch-server");
              await sendResponse(res, response);
            } catch (error) {
              next(error);
            }
          });
        };
      },
      writeBundle: {
        // After the SSR build is finished, we inspect the Vite manifest for
        // the SSR build and move server-only assets to client assets directory
        async handler() {
          let { future } = ctx.reactRouterConfig;
          if (future.v8_viteEnvironmentApi ? this.environment.name === "client" : !viteConfigEnv.isSsrBuild) {
            return;
          }
          invariant(viteConfig);
          let clientBuildDirectory = getClientBuildDirectory(
            ctx.reactRouterConfig
          );
          let serverBuildDirectory = future.v8_viteEnvironmentApi ? this.environment.config?.build?.outDir : ctx.environmentBuildContext?.options.build?.outDir ?? getServerBuildDirectory(ctx.reactRouterConfig);
          let ssrViteManifest = await loadViteManifest(serverBuildDirectory);
          let ssrAssetPaths = getViteManifestAssetPaths(ssrViteManifest);
          let userSsrEmitAssets = (ctx.reactRouterConfig.future.v8_viteEnvironmentApi ? viteUserConfig.environments?.ssr?.build?.ssrEmitAssets ?? viteUserConfig.environments?.ssr?.build?.emitAssets : null) ?? viteUserConfig.build?.ssrEmitAssets ?? false;
          let movedAssetPaths = [];
          let removedAssetPaths = [];
          let copiedAssetPaths = [];
          for (let ssrAssetPath of ssrAssetPaths) {
            let src = path7.join(serverBuildDirectory, ssrAssetPath);
            let dest = path7.join(clientBuildDirectory, ssrAssetPath);
            if (!userSsrEmitAssets) {
              if (!(0, import_node_fs2.existsSync)(dest)) {
                await (0, import_promises3.mkdir)(path7.dirname(dest), { recursive: true });
                await (0, import_promises3.rename)(src, dest);
                movedAssetPaths.push(dest);
              } else {
                await (0, import_promises3.rm)(src, { force: true, recursive: true });
                removedAssetPaths.push(dest);
              }
            } else if (!(0, import_node_fs2.existsSync)(dest)) {
              await (0, import_promises3.cp)(src, dest, { recursive: true });
              copiedAssetPaths.push(dest);
            }
          }
          if (!userSsrEmitAssets) {
            let ssrCssPaths = Object.values(ssrViteManifest).flatMap(
              (chunk) => chunk.css ?? []
            );
            await Promise.all(
              ssrCssPaths.map(async (cssPath) => {
                let src = path7.join(serverBuildDirectory, cssPath);
                await (0, import_promises3.rm)(src, { force: true, recursive: true });
                removedAssetPaths.push(src);
              })
            );
          }
          let cleanedAssetPaths = [...removedAssetPaths, ...movedAssetPaths];
          let handledAssetPaths = [...cleanedAssetPaths, ...copiedAssetPaths];
          let cleanedAssetDirs = new Set(cleanedAssetPaths.map(path7.dirname));
          await Promise.all(
            Array.from(cleanedAssetDirs).map(async (dir) => {
              try {
                const files = await (0, import_promises3.readdir)(dir, { recursive: true });
                if (files.length === 0) {
                  await (0, import_promises3.rm)(dir, { force: true, recursive: true });
                }
              } catch {
              }
            })
          );
          if (handledAssetPaths.length) {
            viteConfig.logger.info("");
          }
          function logHandledAssets(paths, message) {
            invariant(viteConfig);
            if (paths.length) {
              viteConfig.logger.info(
                [
                  `${import_picocolors4.default.green("\u2713")} ${message}`,
                  ...paths.map(
                    (assetPath) => import_picocolors4.default.dim(path7.relative(ctx.rootDirectory, assetPath))
                  )
                ].join("\n")
              );
            }
          }
          logHandledAssets(
            removedAssetPaths,
            `${removedAssetPaths.length} asset${removedAssetPaths.length > 1 ? "s" : ""} cleaned from React Router server build.`
          );
          logHandledAssets(
            movedAssetPaths,
            `${movedAssetPaths.length} asset${movedAssetPaths.length > 1 ? "s" : ""} moved from React Router server build to client assets.`
          );
          logHandledAssets(
            copiedAssetPaths,
            `${copiedAssetPaths.length} asset${copiedAssetPaths.length > 1 ? "s" : ""} copied from React Router server build to client assets.`
          );
          if (handledAssetPaths.length) {
            viteConfig.logger.info("");
          }
          if (future.unstable_previewServerPrerendering) {
            return;
          }
          process.env.IS_RR_BUILD_REQUEST = "yes";
          if (isPrerenderingEnabled(ctx.reactRouterConfig)) {
            await handlePrerender(
              viteConfig,
              ctx.reactRouterConfig,
              serverBuildDirectory,
              getServerBuildFile(ssrViteManifest),
              clientBuildDirectory
            );
          }
          if (!ctx.reactRouterConfig.ssr) {
            await handleSpaMode(
              viteConfig,
              ctx.reactRouterConfig,
              serverBuildDirectory,
              getServerBuildFile(ssrViteManifest),
              clientBuildDirectory
            );
          }
          if (!ctx.reactRouterConfig.ssr) {
            viteConfig.logger.info(
              [
                "Removing the server build in",
                import_picocolors4.default.green(serverBuildDirectory),
                "due to ssr:false"
              ].join(" ")
            );
            (0, import_node_fs2.rmSync)(serverBuildDirectory, { force: true, recursive: true });
          }
        }
      },
      async buildEnd() {
        await viteChildCompiler?.close();
        await reactRouterConfigLoader.close();
        let typegenWatcher = await typegenWatcherPromise2;
        await typegenWatcher?.close();
      }
    },
    {
      name: "react-router:route-chunks-index",
      // This plugin provides the route module "index" since route modules can
      // be chunked and may be made up of multiple smaller modules. This plugin
      // primarily ensures code is never duplicated across a route module and
      // its chunks. If we didn't have this plugin, any app that explicitly
      // imports a route module would result in duplicate code since the app
      // would contain code for both the unprocessed route module and its
      // individual chunks. This is because, since they have different module
      // IDs, they are treated as completely separate modules even though they
      // all reference the same underlying file. This plugin addresses this by
      // ensuring that any explicit imports of a route module resolve to a
      // module that simply re-exports from its underlying chunks, if present.
      async transform(code, id, options) {
        if (viteCommand !== "build") return;
        if (options?.ssr) {
          return;
        }
        if (!isRoute(ctx.reactRouterConfig, id)) {
          return;
        }
        if (isRouteVirtualModule(id)) {
          return;
        }
        let { hasRouteChunks, chunkedExports } = await detectRouteChunksIfEnabled(cache, ctx, id, code);
        if (!hasRouteChunks) {
          return;
        }
        let sourceExports = await getRouteModuleExports(
          viteChildCompiler,
          ctx,
          id
        );
        let isMainChunkExport = (name) => !chunkedExports.includes(name);
        let mainChunkReexports = sourceExports.filter(isMainChunkExport).join(", ");
        let chunkBasePath = `./${path7.basename(id)}`;
        return [
          `export { ${mainChunkReexports} } from "${getRouteChunkModuleId(
            chunkBasePath,
            "main"
          )}";`,
          ...chunkedExports.map(
            (exportName) => `export { ${exportName} } from "${getRouteChunkModuleId(
              chunkBasePath,
              exportName
            )}";`
          )
        ].filter(Boolean).join("\n");
      }
    },
    {
      name: "react-router:build-client-route",
      async transform(code, id, options) {
        if (!id.endsWith(BUILD_CLIENT_ROUTE_QUERY_STRING)) return;
        let routeModuleId = id.replace(BUILD_CLIENT_ROUTE_QUERY_STRING, "");
        let routeFileName = path7.basename(routeModuleId);
        let sourceExports = await getRouteModuleExports(
          viteChildCompiler,
          ctx,
          routeModuleId
        );
        let { chunkedExports = [] } = options?.ssr ? {} : await detectRouteChunksIfEnabled(cache, ctx, id, code);
        let reexports = sourceExports.filter((exportName) => {
          let isRouteEntryExport = options?.ssr && SERVER_ONLY_ROUTE_EXPORTS.includes(exportName) || CLIENT_ROUTE_EXPORTS.includes(exportName);
          let isChunkedExport = chunkedExports.includes(
            exportName
          );
          return isRouteEntryExport && !isChunkedExport;
        }).join(", ");
        return `export { ${reexports} } from "./${routeFileName}";`;
      }
    },
    {
      name: "react-router:split-route-modules",
      async transform(code, id, options) {
        if (options?.ssr) return;
        if (!isRouteChunkModuleId(id)) return;
        invariant(
          viteCommand === "build",
          "Route modules are only split in build mode"
        );
        let chunkName = getRouteChunkNameFromModuleId(id);
        if (!chunkName) {
          throw new Error(`Invalid route chunk name "${chunkName}" in "${id}"`);
        }
        let chunk = await getRouteChunkIfEnabled(
          cache,
          ctx,
          id,
          chunkName,
          code
        );
        let preventEmptyChunkSnippet = ({ reason }) => `Math.random()<0&&console.log(${JSON.stringify(reason)});`;
        if (chunk === null) {
          return preventEmptyChunkSnippet({
            reason: "Split round modules disabled"
          });
        }
        let enforceSplitRouteModules = ctx.reactRouterConfig.future.v8_splitRouteModules === "enforce";
        if (enforceSplitRouteModules && chunkName === "main" && chunk) {
          let exportNames = getExportNames(chunk.code);
          validateRouteChunks({
            ctx,
            id,
            valid: {
              clientAction: !exportNames.includes("clientAction"),
              clientLoader: !exportNames.includes("clientLoader"),
              clientMiddleware: !exportNames.includes("clientMiddleware"),
              HydrateFallback: !exportNames.includes("HydrateFallback")
            }
          });
        }
        return chunk ?? preventEmptyChunkSnippet({ reason: `No ${chunkName} chunk` });
      }
    },
    {
      name: "react-router:virtual-modules",
      enforce: "pre",
      resolveId(id) {
        const vmod = Object.values(virtual).find((vmod2) => vmod2.id === id);
        if (vmod) return vmod.resolvedId;
      },
      async load(id) {
        switch (id) {
          case virtual.serverBuild.resolvedId: {
            let routeIds = getServerBundleRouteIds(this, ctx);
            return await getServerEntry({ routeIds });
          }
          case virtual.serverManifest.resolvedId: {
            let routeIds = getServerBundleRouteIds(this, ctx);
            invariant(viteConfig);
            let reactRouterManifest = viteCommand === "build" ? (await generateReactRouterManifestsForBuild({
              viteConfig,
              routeIds
            })).reactRouterServerManifest : await getReactRouterManifestForDev();
            ctx.reactRouterManifest = reactRouterManifest;
            if (!ctx.reactRouterConfig.ssr) {
              invariant(viteConfig);
              validateSsrFalsePrerenderExports(
                viteConfig,
                ctx,
                reactRouterManifest,
                viteChildCompiler
              );
            }
            return `export default ${(0, import_jsesc.default)(reactRouterManifest, {
              es6: true
            })};`;
          }
          case virtual.browserManifest.resolvedId: {
            if (viteCommand === "build") {
              throw new Error("This module only exists in development");
            }
            let reactRouterManifest = await getReactRouterManifestForDev();
            let reactRouterManifestString = (0, import_jsesc.default)(reactRouterManifest, {
              es6: true
            });
            return `window.__reactRouterManifest=${reactRouterManifestString};`;
          }
        }
      }
    },
    {
      name: "react-router:dot-server",
      enforce: "pre",
      async resolveId(id, importer, options) {
        let isOptimizeDeps = viteCommand === "serve" && options?.scan === true;
        if (isOptimizeDeps || options?.ssr) return;
        let isResolving = options?.custom?.["react-router:dot-server"] ?? false;
        if (isResolving) return;
        options.custom = { ...options.custom, "react-router:dot-server": true };
        let resolved = await this.resolve(id, importer, options);
        if (!resolved) return;
        let serverFileRE = /\.server(\.[cm]?[jt]sx?)?$/;
        let serverDirRE = /\/\.server\//;
        let isDotServer = serverFileRE.test(resolved.id) || serverDirRE.test(resolved.id);
        if (!isDotServer) return;
        if (!importer) return;
        if (viteCommand !== "build" && importer.endsWith(".html")) {
          return;
        }
        let vite2 = getVite();
        let importerShort = vite2.normalizePath(
          path7.relative(ctx.rootDirectory, importer)
        );
        if (isRoute(ctx.reactRouterConfig, importer)) {
          let serverOnlyExports = SERVER_ONLY_ROUTE_EXPORTS.map(
            (xport) => `\`${xport}\``
          ).join(", ");
          throw Error(
            [
              import_picocolors4.default.red(`Server-only module referenced by client`),
              "",
              `    '${id}' imported by route '${importerShort}'`,
              "",
              `  React Router automatically removes server-code from these exports:`,
              `    ${serverOnlyExports}`,
              "",
              `  But other route exports in '${importerShort}' depend on '${id}'.`,
              "",
              "  See https://reactrouter.com/explanation/code-splitting#removal-of-server-code",
              ""
            ].join("\n")
          );
        }
        throw Error(
          [
            import_picocolors4.default.red(`Server-only module referenced by client`),
            "",
            `    '${id}' imported by '${importerShort}'`,
            "",
            "  See https://reactrouter.com/explanation/code-splitting#removal-of-server-code",
            ""
          ].join("\n")
        );
      }
    },
    {
      name: "react-router:dot-client",
      async transform(code, id, options) {
        if (!options?.ssr) return;
        let clientFileRE = /\.client(\.[cm]?[jt]sx?)?$/;
        let clientDirRE = /\/\.client\//;
        if (clientFileRE.test(id) || clientDirRE.test(id)) {
          let exports2 = getExportNames(code);
          return {
            code: exports2.map(
              (name) => name === "default" ? "export default undefined;" : `export const ${name} = undefined;`
            ).join("\n"),
            map: null
          };
        }
      }
    },
    {
      name: "react-router:route-exports",
      async transform(code, id, options) {
        if (isRouteChunkModuleId(id)) {
          id = id.split("?")[0];
        }
        let route = getRoute(ctx.reactRouterConfig, id);
        if (!route) return;
        if (!options?.ssr && isSpaModeEnabled(ctx.reactRouterConfig)) {
          let exportNames = getExportNames(code);
          let serverOnlyExports = exportNames.filter((exp) => {
            if (route.id === "root" && exp === "loader") {
              return false;
            }
            return SERVER_ONLY_ROUTE_EXPORTS.includes(exp);
          });
          if (serverOnlyExports.length > 0) {
            let str = serverOnlyExports.map((e) => `\`${e}\``).join(", ");
            let message = `SPA Mode: ${serverOnlyExports.length} invalid route export(s) in \`${route.file}\`: ${str}. See https://reactrouter.com/how-to/spa for more information.`;
            throw Error(message);
          }
          if (route.id !== "root") {
            let hasHydrateFallback = exportNames.some(
              (exp) => exp === "HydrateFallback"
            );
            if (hasHydrateFallback) {
              let message = `SPA Mode: Invalid \`HydrateFallback\` export found in \`${route.file}\`. \`HydrateFallback\` is only permitted on the root route in SPA Mode. See https://reactrouter.com/how-to/spa for more information.`;
              throw Error(message);
            }
          }
        }
        let [filepath] = id.split("?");
        let ast = (0, import_parser.parse)(code, { sourceType: "module" });
        if (!options?.ssr) {
          removeExports(ast, SERVER_ONLY_ROUTE_EXPORTS);
        }
        decorateComponentExportsWithProps(ast);
        return generate(ast, {
          sourceMaps: true,
          filename: id,
          sourceFileName: filepath
        });
      }
    },
    {
      name: "react-router:inject-hmr-runtime",
      enforce: "pre",
      resolveId(id) {
        if (id === virtualInjectHmrRuntime.id) {
          return virtualInjectHmrRuntime.resolvedId;
        }
      },
      async load(id) {
        if (id !== virtualInjectHmrRuntime.resolvedId) return;
        return [
          `import RefreshRuntime from "${virtualHmrRuntime.id}"`,
          "RefreshRuntime.injectIntoGlobalHook(window)",
          "window.$RefreshReg$ = () => {}",
          "window.$RefreshSig$ = () => (type) => type",
          "window.__vite_plugin_react_preamble_installed__ = true"
        ].join("\n");
      }
    },
    {
      name: "react-router:hmr-runtime",
      enforce: "pre",
      resolveId(id) {
        if (id === virtualHmrRuntime.id) return virtualHmrRuntime.resolvedId;
      },
      async load(id) {
        if (id !== virtualHmrRuntime.resolvedId) return;
        let reactRefreshDir = path7.dirname(
          require.resolve("react-refresh/package.json")
        );
        let reactRefreshRuntimePath = path7.join(
          reactRefreshDir,
          "cjs/react-refresh-runtime.development.js"
        );
        return [
          "const exports = {}",
          await (0, import_promises3.readFile)(reactRefreshRuntimePath, "utf8"),
          await (0, import_promises3.readFile)(require.resolve("./static/refresh-utils.mjs"), "utf8"),
          "export default exports"
        ].join("\n");
      }
    },
    {
      name: "react-router:react-refresh-babel",
      async transform(code, id, options) {
        if (viteCommand !== "serve") return;
        if (id.includes("/node_modules/")) return;
        let [filepath] = id.split("?");
        let extensionsRE = /\.(jsx?|tsx?|mdx?)$/;
        if (!extensionsRE.test(filepath)) return;
        let devRuntime = "react/jsx-dev-runtime";
        let ssr = options?.ssr === true;
        let isJSX = filepath.endsWith("x");
        let useFastRefresh = !ssr && (isJSX || code.includes(devRuntime));
        if (!useFastRefresh) return;
        if (isRouteVirtualModule(id)) {
          return { code: addRefreshWrapper(ctx.reactRouterConfig, code, id) };
        }
        let result = await babel.transformAsync(code, {
          babelrc: false,
          configFile: false,
          filename: id,
          sourceFileName: filepath,
          parserOpts: {
            sourceType: "module",
            allowAwaitOutsideFunction: true
          },
          plugins: [[require("react-refresh/babel"), { skipEnvCheck: true }]],
          sourceMaps: true
        });
        if (result === null) return;
        code = result.code;
        let refreshContentRE = /\$Refresh(?:Reg|Sig)\$\(/;
        if (refreshContentRE.test(code)) {
          code = addRefreshWrapper(ctx.reactRouterConfig, code, id);
        }
        return { code, map: result.map };
      }
    },
    {
      name: "react-router:hmr-updates",
      async handleHotUpdate({ server, file, modules, read }) {
        let route = getRoute(ctx.reactRouterConfig, file);
        let hmrEventData = { route: null };
        if (route) {
          let oldRouteMetadata = currentReactRouterManifestForDev?.routes[route.id];
          let newRouteMetadata = await getRouteMetadata(
            cache,
            ctx,
            viteChildCompiler,
            route,
            read
          );
          hmrEventData.route = newRouteMetadata;
          if (!oldRouteMetadata || [
            "hasLoader",
            "hasClientLoader",
            "clientLoaderModule",
            "hasAction",
            "hasClientAction",
            "clientActionModule",
            "hasClientMiddleware",
            "clientMiddlewareModule",
            "hasErrorBoundary",
            "hydrateFallbackModule"
          ].some((key) => oldRouteMetadata[key] !== newRouteMetadata[key])) {
            invalidateVirtualModules(server);
          }
        }
        server.hot.send({
          type: "custom",
          event: "react-router:hmr",
          data: hmrEventData
        });
        return modules;
      }
    },
    {
      name: "react-router-server-change-trigger-client-hmr",
      // This hook is only available in Vite v6+ so this is a no-op in v5.
      // Previously, the server and client modules were shared in a single module
      // graph. This meant that changes to server code automatically resulted in
      // client HMR updates. In Vite v6+, these module graphs are separate from
      // each other, so we need to manually trigger client HMR updates if server
      // code has changed.
      hotUpdate({ server, modules }) {
        if (this.environment.name !== "ssr" && modules.length <= 0) {
          return;
        }
        let clientModules = modules.flatMap(
          (mod) => getParentClientNodes(server.environments.client.moduleGraph, mod)
        );
        for (let clientModule of clientModules) {
          server.environments.client.reloadModule(clientModule);
        }
      }
    },
    prerender({
      config() {
        process.env.IS_RR_BUILD_REQUEST = "yes";
        return {
          // Required as viteConfig.environments.client.build.outDir is only available in Vite v6+
          buildDirectory: getClientBuildDirectory(ctx.reactRouterConfig),
          concurrency: getPrerenderConcurrencyConfig(ctx.reactRouterConfig)
        };
      },
      async requests() {
        invariant(viteConfig);
        let { future } = ctx.reactRouterConfig;
        if (!future.unstable_previewServerPrerendering) {
          return [];
        }
        let requests = [];
        if (isPrerenderingEnabled(ctx.reactRouterConfig)) {
          invariant(ctx.prerenderPaths !== null, "Prerender paths missing");
          invariant(
            ctx.reactRouterManifest !== null,
            "Prerender manifest missing"
          );
          let { reactRouterConfig, reactRouterManifest, prerenderPaths } = ctx;
          assertPrerenderPathsMatchRoutes(
            reactRouterConfig,
            Array.from(prerenderPaths)
          );
          let buildRoutes = createPrerenderRoutes(reactRouterManifest.routes);
          for (let prerenderPath of prerenderPaths) {
            let matches = (0, import_react_router2.matchRoutes)(
              buildRoutes,
              `/${prerenderPath}/`.replace(/^\/\/+/, "/")
            );
            if (!matches) {
              continue;
            }
            let leafRoute = matches[matches.length - 1].route;
            let manifestRoute = reactRouterManifest.routes[leafRoute.id];
            let isResourceRoute = manifestRoute && !manifestRoute.hasDefaultExport && !manifestRoute.hasErrorBoundary;
            if (isResourceRoute) {
              if (manifestRoute?.hasLoader) {
                requests.push(
                  // Prerender a .data file for turbo-stream consumption
                  createDataRequest(
                    prerenderPath,
                    reactRouterConfig,
                    [leafRoute.id],
                    true
                  ),
                  // Prerender a raw file for external consumption
                  createResourceRouteRequest(prerenderPath, reactRouterConfig)
                );
              } else {
                viteConfig.logger.warn(
                  `\u26A0\uFE0F Skipping prerendering for resource route without a loader: ${leafRoute.id}`
                );
              }
            } else {
              let hasLoaders = matches.some(
                (m) => reactRouterManifest.routes[m.route.id]?.hasLoader
              );
              if (hasLoaders) {
                requests.push(
                  createDataRequest(prerenderPath, reactRouterConfig, null)
                );
              } else {
                requests.push(
                  createRouteRequest(prerenderPath, reactRouterConfig)
                );
              }
            }
          }
        }
        if (!ctx.reactRouterConfig.ssr) {
          requests.push(createSpaModeRequest(ctx.reactRouterConfig));
        }
        return requests;
      },
      async postProcess(request, response, metadata) {
        invariant(metadata);
        if (metadata.type === "data") {
          let pathname2 = new URL(request.url).pathname;
          if (response.status !== 200 && response.status !== 202) {
            throw new Error(
              `Prerender (data): Received a ${response.status} status code from \`entry.server.tsx\` while prerendering the \`${metadata.path}\` path.
${pathname2}`,
              { cause: response }
            );
          }
          let data = await response.text();
          return {
            files: [
              {
                path: pathname2,
                contents: data
              }
            ],
            // After saving the .data file, request the HTML page.
            // The data is passed along to be embedded in the response header.
            requests: !metadata.isResourceRoute ? [createRouteRequest(metadata.path, ctx.reactRouterConfig, data)] : []
          };
        }
        if (metadata.type === "resource") {
          let pathname2 = new URL(request.url).pathname;
          let contents = new Uint8Array(await response.arrayBuffer());
          if (response.status !== 200) {
            throw new Error(
              `Prerender (resource): Received a ${response.status} status code from \`entry.server.tsx\` while prerendering the \`${pathname2}\` path.
${new TextDecoder().decode(contents)}`
            );
          }
          return [
            {
              path: pathname2,
              contents
            }
          ];
        }
        let html = await response.text();
        if (metadata.type === "spa") {
          if (response.status !== 200) {
            throw new Error(
              `SPA Mode: Received a ${response.status} status code from \`entry.server.tsx\` while prerendering your SPA Fallback HTML file.
` + html
            );
          }
          if (!html.includes("window.__reactRouterContext =") || !html.includes("window.__reactRouterRouteModules =")) {
            throw new Error(
              "SPA Mode: Did you forget to include `<Scripts/>` in your root route? Your pre-rendered HTML cannot hydrate without `<Scripts />`."
            );
          }
          return [
            {
              path: "/__spa-fallback.html",
              contents: html
            }
          ];
        }
        let pathname = new URL(request.url).pathname;
        if (redirectStatusCodes.has(response.status)) {
          let location = response.headers.get("Location");
          let delay = response.status === 302 ? 2 : 0;
          let escapedLocation = escapeHtml(location ?? "");
          let escapedPathname = escapeHtml(pathname);
          html = `<!doctype html>
<head>
<title>Redirecting to: ${escapedLocation}</title>
<meta http-equiv="refresh" content="${delay};url=${escapedLocation}">
<meta name="robots" content="noindex">
</head>
<body>
	<a href="${escapedLocation}">
    Redirecting from <code>${escapedPathname}</code> to <code>${escapedLocation}</code>
  </a>
</body>
</html>`;
        } else if (response.status !== 200) {
          throw new Error(
            `Prerender (html): Received a ${response.status} status code from \`entry.server.tsx\` while prerendering the \`${pathname}\` path.
${html}`
          );
        }
        return [
          {
            path: `${pathname}/index.html`,
            contents: html
          }
        ];
      },
      logFile(outputPath, metadata) {
        invariant(viteConfig);
        invariant(metadata);
        if (metadata.type === "spa") {
          return;
        }
        viteConfig.logger.info(
          `Prerender (${metadata.type}): ${metadata.path} -> ${import_picocolors4.default.bold(outputPath)}`
        );
      },
      async finalize(buildDirectory) {
        invariant(viteConfig);
        let { ssr, future } = ctx.reactRouterConfig;
        if (!ssr) {
          let spaFallback = path7.join(buildDirectory, "__spa-fallback.html");
          let index = path7.join(buildDirectory, "index.html");
          let finalSpaPath;
          if ((0, import_node_fs2.existsSync)(spaFallback) && !(0, import_node_fs2.existsSync)(index)) {
            await (0, import_promises3.rename)(spaFallback, index);
            finalSpaPath = index;
          } else if ((0, import_node_fs2.existsSync)(spaFallback)) {
            finalSpaPath = spaFallback;
          }
          if (finalSpaPath) {
            let prettyPath = path7.relative(viteConfig.root, finalSpaPath);
            if (ctx.prerenderPaths && ctx.prerenderPaths.size > 0) {
              viteConfig.logger.info(
                `Prerender (html): SPA Fallback -> ${import_picocolors4.default.bold(prettyPath)}`
              );
            } else {
              viteConfig.logger.info(
                `SPA Mode: Generated ${import_picocolors4.default.bold(prettyPath)}`
              );
            }
          }
          let serverBuildDirectory = getServerBuildDirectory(
            ctx.reactRouterConfig
          );
          viteConfig.logger.info(
            [
              "Removing the server build in",
              import_picocolors4.default.green(serverBuildDirectory),
              "due to ssr:false"
            ].join(" ")
          );
          (0, import_node_fs2.rmSync)(serverBuildDirectory, { force: true, recursive: true });
        }
      }
    }),
    validatePluginOrder(),
    warnOnClientSourceMaps()
  ];
};
function getParentClientNodes(clientModuleGraph, module2, seenNodes = /* @__PURE__ */ new Set()) {
  if (!module2.id) {
    return [];
  }
  if (seenNodes.has(module2.url)) {
    return [];
  }
  seenNodes.add(module2.url);
  let clientModule = clientModuleGraph.getModuleById(module2.id);
  if (clientModule) {
    return [clientModule];
  }
  return [...module2.importers].flatMap(
    (importer) => getParentClientNodes(clientModuleGraph, importer, seenNodes)
  );
}
function addRefreshWrapper(reactRouterConfig, code, id) {
  let route = getRoute(reactRouterConfig, id);
  let acceptExports = route ? CLIENT_NON_COMPONENT_EXPORTS : [];
  return REACT_REFRESH_HEADER.replaceAll("__SOURCE__", JSON.stringify(id)) + code + REACT_REFRESH_FOOTER.replaceAll("__SOURCE__", JSON.stringify(id)).replaceAll("__ACCEPT_EXPORTS__", JSON.stringify(acceptExports)).replaceAll("__ROUTE_ID__", JSON.stringify(route?.id));
}
var REACT_REFRESH_HEADER = `
import RefreshRuntime from "${virtualHmrRuntime.id}";

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
}`.replaceAll("\n", "");
var REACT_REFRESH_FOOTER = `
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
function getRoute(pluginConfig, file) {
  let vite2 = getVite();
  let routePath = vite2.normalizePath(
    path7.relative(pluginConfig.appDirectory, file)
  );
  let route = Object.values(pluginConfig.routes).find(
    (r) => vite2.normalizePath(r.file) === routePath
  );
  return route;
}
function isRoute(pluginConfig, file) {
  return Boolean(getRoute(pluginConfig, file));
}
async function getRouteMetadata(cache, ctx, viteChildCompiler, route, readRouteFile) {
  let routeFile = route.file;
  let sourceExports = await getRouteModuleExports(
    viteChildCompiler,
    ctx,
    route.file,
    readRouteFile
  );
  let { hasRouteChunkByExportName } = await detectRouteChunksIfEnabled(
    cache,
    ctx,
    routeFile,
    { routeFile, readRouteFile, viteChildCompiler }
  );
  let moduleUrl = combineURLs(
    ctx.publicPath,
    `${resolveFileUrl(
      ctx,
      resolveRelativeRouteFilePath(route, ctx.reactRouterConfig)
    )}`
  );
  let info = {
    id: route.id,
    parentId: route.parentId,
    path: route.path,
    index: route.index,
    caseSensitive: route.caseSensitive,
    url: combineURLs(
      ctx.publicPath,
      "/" + path7.relative(
        ctx.rootDirectory,
        resolveRelativeRouteFilePath(route, ctx.reactRouterConfig)
      )
    ),
    module: `${moduleUrl}?import`,
    // Ensure the Vite dev server responds with a JS module
    clientActionModule: hasRouteChunkByExportName.clientAction ? `${getRouteChunkModuleId(moduleUrl, "clientAction")}` : void 0,
    clientLoaderModule: hasRouteChunkByExportName.clientLoader ? `${getRouteChunkModuleId(moduleUrl, "clientLoader")}` : void 0,
    clientMiddlewareModule: hasRouteChunkByExportName.clientMiddleware ? `${getRouteChunkModuleId(moduleUrl, "clientMiddleware")}` : void 0,
    hydrateFallbackModule: hasRouteChunkByExportName.HydrateFallback ? `${getRouteChunkModuleId(moduleUrl, "HydrateFallback")}` : void 0,
    hasAction: sourceExports.includes("action"),
    hasClientAction: sourceExports.includes("clientAction"),
    hasLoader: sourceExports.includes("loader"),
    hasClientLoader: sourceExports.includes("clientLoader"),
    hasClientMiddleware: sourceExports.includes("clientMiddleware"),
    hasDefaultExport: sourceExports.includes("default"),
    hasErrorBoundary: sourceExports.includes("ErrorBoundary"),
    imports: []
  };
  return info;
}
function isPrerenderingEnabled(reactRouterConfig) {
  return reactRouterConfig.prerender != null && reactRouterConfig.prerender !== false;
}
function isSpaModeEnabled(reactRouterConfig) {
  return reactRouterConfig.ssr === false && !isPrerenderingEnabled(reactRouterConfig);
}
async function getPrerenderBuildAndHandler(viteConfig, serverBuildDirectory, serverBuildFile) {
  let serverBuildPath = path7.join(serverBuildDirectory, serverBuildFile);
  let build = await import(url.pathToFileURL(serverBuildPath).toString());
  let { createRequestHandler: createHandler } = await import("react-router");
  return {
    build,
    handler: createHandler(build, viteConfig.mode)
  };
}
async function handleSpaMode(viteConfig, reactRouterConfig, serverBuildDirectory, serverBuildFile, clientBuildDirectory) {
  let { build, handler } = await getPrerenderBuildAndHandler(
    viteConfig,
    serverBuildDirectory,
    serverBuildFile
  );
  let request = new Request(`http://localhost${reactRouterConfig.basename}`, {
    headers: {
      // Enable SPA mode in the server runtime and only render down to the root
      "X-React-Router-SPA-Mode": "yes"
    }
  });
  let response = await handler(request);
  let html = await response.text();
  let isPrerenderSpaFallback = build.prerender.includes("/");
  let filename2 = isPrerenderSpaFallback ? "__spa-fallback.html" : "index.html";
  if (response.status !== 200) {
    if (isPrerenderSpaFallback) {
      throw new Error(
        `Prerender: Received a ${response.status} status code from \`entry.server.tsx\` while prerendering your \`${filename2}\` file.
` + html
      );
    } else {
      throw new Error(
        `SPA Mode: Received a ${response.status} status code from \`entry.server.tsx\` while prerendering your \`${filename2}\` file.
` + html
      );
    }
  }
  if (!html.includes("window.__reactRouterContext =") || !html.includes("window.__reactRouterRouteModules =")) {
    throw new Error(
      "SPA Mode: Did you forget to include `<Scripts/>` in your root route? Your pre-rendered HTML cannot hydrate without `<Scripts />`."
    );
  }
  await (0, import_promises3.writeFile)(path7.join(clientBuildDirectory, filename2), html);
  let prettyDir = path7.relative(viteConfig.root, clientBuildDirectory);
  let prettyPath = path7.join(prettyDir, filename2);
  if (build.prerender.length > 0) {
    viteConfig.logger.info(
      `Prerender (html): SPA Fallback -> ${import_picocolors4.default.bold(prettyPath)}`
    );
  } else {
    viteConfig.logger.info(`SPA Mode: Generated ${import_picocolors4.default.bold(prettyPath)}`);
  }
}
async function handlePrerender(viteConfig, reactRouterConfig, serverBuildDirectory, serverBuildPath, clientBuildDirectory) {
  let { build, handler } = await getPrerenderBuildAndHandler(
    viteConfig,
    serverBuildDirectory,
    serverBuildPath
  );
  let routes = createPrerenderRoutes(reactRouterConfig.routes);
  for (let path10 of build.prerender) {
    let matches = (0, import_react_router2.matchRoutes)(routes, `/${path10}/`.replace(/^\/\/+/, "/"));
    if (!matches) {
      throw new Error(
        `Unable to prerender path because it does not match any routes: ${path10}`
      );
    }
  }
  let buildRoutes = createPrerenderRoutes(build.routes);
  let prerenderSinglePath = async (path10) => {
    let matches = (0, import_react_router2.matchRoutes)(buildRoutes, `/${path10}/`.replace(/^\/\/+/, "/"));
    if (!matches) {
      return;
    }
    let leafRoute = matches ? matches[matches.length - 1].route : null;
    let manifestRoute = leafRoute ? build.routes[leafRoute.id]?.module : null;
    let isResourceRoute = manifestRoute && !manifestRoute.default && !manifestRoute.ErrorBoundary;
    if (isResourceRoute) {
      invariant(leafRoute);
      invariant(manifestRoute);
      if (manifestRoute.loader) {
        await prerenderData(
          handler,
          path10,
          [leafRoute.id],
          clientBuildDirectory,
          reactRouterConfig,
          viteConfig
        );
        await prerenderResourceRoute(
          handler,
          path10,
          clientBuildDirectory,
          reactRouterConfig,
          viteConfig
        );
      } else {
        viteConfig.logger.warn(
          `\u26A0\uFE0F Skipping prerendering for resource route without a loader: ${leafRoute?.id}`
        );
      }
    } else {
      let hasLoaders = matches.some(
        (m) => build.assets.routes[m.route.id]?.hasLoader
      );
      let data;
      if (!isResourceRoute && hasLoaders) {
        data = await prerenderData(
          handler,
          path10,
          null,
          clientBuildDirectory,
          reactRouterConfig,
          viteConfig
        );
      }
      await prerenderRoute(
        handler,
        path10,
        clientBuildDirectory,
        reactRouterConfig,
        viteConfig,
        data ? {
          headers: {
            "X-React-Router-Prerender-Data": encodeURI(data)
          }
        } : void 0
      );
    }
  };
  let concurrency = 1;
  let { prerender: prerender2 } = reactRouterConfig;
  if (typeof prerender2 === "object" && "unstable_concurrency" in prerender2) {
    concurrency = prerender2.unstable_concurrency ?? 1;
  }
  const pMap = await import("p-map");
  await pMap.default(build.prerender, prerenderSinglePath, { concurrency });
}
function getStaticPrerenderPaths(routes) {
  let paths = ["/"];
  let paramRoutes = [];
  function recurse(subtree, prefix = "") {
    for (let route of subtree) {
      let newPath = [prefix, route.path].join("/").replace(/\/\/+/g, "/");
      if (route.path) {
        let segments = route.path.split("/");
        if (segments.some((s) => s.startsWith(":") || s === "*")) {
          paramRoutes.push(route.path);
        } else {
          paths.push(newPath);
        }
      }
      if (route.children) {
        recurse(route.children, newPath);
      }
    }
  }
  recurse(routes);
  return {
    paths: paths.map((p) => p.replace(/\/\/+/g, "/").replace(/(.+)\/$/, "$1")),
    paramRoutes
  };
}
async function prerenderData(handler, prerenderPath, onlyRoutes, clientBuildDirectory, reactRouterConfig, viteConfig, requestInit) {
  let dataRequestPath;
  if (reactRouterConfig.future.unstable_trailingSlashAwareDataRequests) {
    if (prerenderPath.endsWith("/")) {
      dataRequestPath = `${prerenderPath}_.data`;
    } else {
      dataRequestPath = `${prerenderPath}.data`;
    }
  } else {
    if (prerenderPath === "/") {
      dataRequestPath = "/_root.data";
    } else {
      dataRequestPath = `${prerenderPath.replace(/\/$/, "")}.data`;
    }
  }
  let normalizedPath = `${reactRouterConfig.basename}${dataRequestPath}`.replace(/\/\/+/g, "/");
  let url2 = new URL(`http://localhost${normalizedPath}`);
  if (onlyRoutes?.length) {
    url2.searchParams.set("_routes", onlyRoutes.join(","));
  }
  let request = new Request(url2, requestInit);
  let response = await handler(request);
  let data = await response.text();
  if (response.status !== 200 && response.status !== 202) {
    throw new Error(
      `Prerender (data): Received a ${response.status} status code from \`entry.server.tsx\` while prerendering the \`${prerenderPath}\` path.
${normalizedPath}`
    );
  }
  let outfile = path7.join(clientBuildDirectory, ...normalizedPath.split("/"));
  await (0, import_promises3.mkdir)(path7.dirname(outfile), { recursive: true });
  await (0, import_promises3.writeFile)(outfile, data);
  viteConfig.logger.info(
    `Prerender (data): ${prerenderPath} -> ${import_picocolors4.default.bold(
      path7.relative(viteConfig.root, outfile)
    )}`
  );
  return data;
}
var redirectStatusCodes = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
async function prerenderRoute(handler, prerenderPath, clientBuildDirectory, reactRouterConfig, viteConfig, requestInit) {
  let normalizedPath = `${reactRouterConfig.basename}${prerenderPath}/`.replace(
    /\/\/+/g,
    "/"
  );
  let request = new Request(`http://localhost${normalizedPath}`, requestInit);
  let response = await handler(request);
  let html = await response.text();
  if (redirectStatusCodes.has(response.status)) {
    let location = response.headers.get("Location");
    let delay = response.status === 302 ? 2 : 0;
    let escapedLocation = escapeHtml(location ?? "");
    let escapedNormalizedPath = escapeHtml(normalizedPath);
    html = `<!doctype html>
<head>
<title>Redirecting to: ${escapedLocation}</title>
<meta http-equiv="refresh" content="${delay};url=${escapedLocation}">
<meta name="robots" content="noindex">
</head>
<body>
	<a href="${escapedLocation}">
    Redirecting from <code>${escapedNormalizedPath}</code> to <code>${escapedLocation}</code>
  </a>
</body>
</html>`;
  } else if (response.status !== 200) {
    throw new Error(
      `Prerender (html): Received a ${response.status} status code from \`entry.server.tsx\` while prerendering the \`${normalizedPath}\` path.
${html}`
    );
  }
  let outfile = path7.join(
    clientBuildDirectory,
    ...normalizedPath.split("/"),
    "index.html"
  );
  await (0, import_promises3.mkdir)(path7.dirname(outfile), { recursive: true });
  await (0, import_promises3.writeFile)(outfile, html);
  viteConfig.logger.info(
    `Prerender (html): ${prerenderPath} -> ${import_picocolors4.default.bold(
      path7.relative(viteConfig.root, outfile)
    )}`
  );
}
async function prerenderResourceRoute(handler, prerenderPath, clientBuildDirectory, reactRouterConfig, viteConfig, requestInit) {
  let normalizedPath = `${reactRouterConfig.basename}${prerenderPath}/`.replace(/\/\/+/g, "/").replace(/\/$/g, "");
  let request = new Request(`http://localhost${normalizedPath}`, requestInit);
  let response = await handler(request);
  let content = Buffer.from(await response.arrayBuffer());
  if (response.status !== 200) {
    throw new Error(
      `Prerender (resource): Received a ${response.status} status code from \`entry.server.tsx\` while prerendering the \`${normalizedPath}\` path.
${content.toString("utf8")}`
    );
  }
  let outfile = path7.join(clientBuildDirectory, ...normalizedPath.split("/"));
  await (0, import_promises3.mkdir)(path7.dirname(outfile), { recursive: true });
  await (0, import_promises3.writeFile)(outfile, content);
  viteConfig.logger.info(
    `Prerender (resource): ${prerenderPath} -> ${import_picocolors4.default.bold(
      path7.relative(viteConfig.root, outfile)
    )}`
  );
}
async function getPrerenderPaths(prerender2, ssr, routes, logWarning = false) {
  if (prerender2 == null || prerender2 === false) {
    return [];
  }
  let pathsConfig;
  if (typeof prerender2 === "object" && "paths" in prerender2) {
    pathsConfig = prerender2.paths;
  } else {
    pathsConfig = prerender2;
  }
  if (pathsConfig === false) {
    return [];
  }
  let prerenderRoutes = createPrerenderRoutes(routes);
  if (pathsConfig === true) {
    let { paths, paramRoutes } = getStaticPrerenderPaths(prerenderRoutes);
    if (logWarning && !ssr && paramRoutes.length > 0) {
      console.warn(
        import_picocolors4.default.yellow(
          [
            "\u26A0\uFE0F Paths with dynamic/splat params cannot be prerendered when using `prerender: true`. You may want to use the `prerender()` API to prerender the following paths:",
            ...paramRoutes.map((p) => "  - " + p)
          ].join("\n")
        )
      );
    }
    return paths;
  }
  if (typeof pathsConfig === "function") {
    let paths = await pathsConfig({
      getStaticPaths: () => getStaticPrerenderPaths(prerenderRoutes).paths
    });
    return paths;
  }
  return pathsConfig;
}
function groupRoutesByParentId2(manifest) {
  let routes = {};
  Object.values(manifest).forEach((route) => {
    if (route) {
      let parentId = route.parentId || "";
      if (!routes[parentId]) {
        routes[parentId] = [];
      }
      routes[parentId].push(route);
    }
  });
  return routes;
}
function createPrerenderRoutes(manifest, parentId = "", routesByParentId = groupRoutesByParentId2(manifest)) {
  return (routesByParentId[parentId] || []).map((route) => {
    let commonRoute = {
      id: route.id,
      path: route.path
    };
    if (route.index) {
      return {
        index: true,
        ...commonRoute
      };
    }
    return {
      children: createPrerenderRoutes(manifest, route.id, routesByParentId),
      ...commonRoute
    };
  });
}
async function validateSsrFalsePrerenderExports(viteConfig, ctx, manifest, viteChildCompiler) {
  let prerenderPaths = await getPrerenderPaths(
    ctx.reactRouterConfig.prerender,
    ctx.reactRouterConfig.ssr,
    manifest.routes,
    true
  );
  if (prerenderPaths.length === 0) {
    return;
  }
  let prerenderRoutes = createPrerenderRoutes(manifest.routes);
  let prerenderedRoutes = /* @__PURE__ */ new Set();
  for (let path10 of prerenderPaths) {
    let matches = (0, import_react_router2.matchRoutes)(
      prerenderRoutes,
      `/${path10}/`.replace(/^\/\/+/, "/")
    );
    invariant(
      matches,
      `Unable to prerender path because it does not match any routes: ${path10}`
    );
    matches.forEach((m) => prerenderedRoutes.add(m.route.id));
  }
  let errors = [];
  let routeExports = await getRouteManifestModuleExports(
    viteChildCompiler,
    ctx
  );
  for (let [routeId, route] of Object.entries(manifest.routes)) {
    let invalidApis = [];
    invariant(route, "Expected a route object in validateSsrFalseExports");
    let exports2 = routeExports[route.id];
    if (exports2.includes("headers")) invalidApis.push("headers");
    if (exports2.includes("action")) invalidApis.push("action");
    if (invalidApis.length > 0) {
      errors.push(
        `Prerender: ${invalidApis.length} invalid route export(s) in \`${route.id}\` when pre-rendering with \`ssr:false\`: ${invalidApis.map((a) => `\`${a}\``).join(", ")}.  See https://reactrouter.com/how-to/pre-rendering#invalid-exports for more information.`
      );
    }
    if (!prerenderedRoutes.has(routeId)) {
      if (exports2.includes("loader")) {
        errors.push(
          `Prerender: 1 invalid route export in \`${route.id}\` when pre-rendering with \`ssr:false\`: \`loader\`. See https://reactrouter.com/how-to/pre-rendering#invalid-exports for more information.`
        );
      }
      let parentRoute = route.parentId ? manifest.routes[route.parentId] : null;
      while (parentRoute && parentRoute.id !== "root") {
        if (parentRoute.hasLoader && !parentRoute.hasClientLoader) {
          errors.push(
            `Prerender: 1 invalid route export in \`${parentRoute.id}\` when pre-rendering with \`ssr:false\`: \`loader\`. See https://reactrouter.com/how-to/pre-rendering#invalid-exports for more information.`
          );
        }
        parentRoute = parentRoute.parentId && parentRoute.parentId !== "root" ? manifest.routes[parentRoute.parentId] : null;
      }
    }
  }
  if (errors.length > 0) {
    viteConfig.logger.error(import_picocolors4.default.red(errors.join("\n")));
    throw new Error(
      "Invalid route exports found when prerendering with `ssr:false`"
    );
  }
}
function getAddressableRoutes(routes) {
  let nonAddressableIds = /* @__PURE__ */ new Set();
  for (let id in routes) {
    let route = routes[id];
    if (route.index) {
      invariant(
        route.parentId,
        `Expected index route "${route.id}" to have "parentId" set`
      );
      nonAddressableIds.add(route.parentId);
    }
    if (typeof route.path !== "string" && !route.index) {
      nonAddressableIds.add(id);
    }
  }
  return Object.values(routes).filter(
    (route) => !nonAddressableIds.has(route.id)
  );
}
function getRouteBranch(routes, routeId) {
  let branch = [];
  let currentRouteId = routeId;
  while (currentRouteId) {
    let route = routes[currentRouteId];
    invariant(route, `Missing route for ${currentRouteId}`);
    branch.push(route);
    currentRouteId = route.parentId;
  }
  return branch.reverse();
}
function getServerBundleIds(ctx) {
  return ctx.buildManifest?.serverBundles ? Object.keys(ctx.buildManifest.serverBundles) : void 0;
}
function getRoutesByServerBundleId(buildManifest) {
  if (!buildManifest.routeIdToServerBundleId) {
    return {};
  }
  let routesByServerBundleId = {};
  for (let [routeId, serverBundleId] of Object.entries(
    buildManifest.routeIdToServerBundleId
  )) {
    routesByServerBundleId[serverBundleId] ??= {};
    let branch = getRouteBranch(buildManifest.routes, routeId);
    for (let route of branch) {
      routesByServerBundleId[serverBundleId][route.id] = route;
    }
  }
  return routesByServerBundleId;
}
var resolveRouteFileCode = async (ctx, input) => {
  if (typeof input === "string") return input;
  invariant(input.viteChildCompiler);
  return await compileRouteFile(
    input.viteChildCompiler,
    ctx,
    input.routeFile,
    input.readRouteFile
  );
};
function isRootRouteModuleId(ctx, id) {
  return normalizeRelativeFilePath(id, ctx.reactRouterConfig) === ctx.reactRouterConfig.routes.root.file;
}
async function detectRouteChunksIfEnabled(cache, ctx, id, input) {
  function noRouteChunks() {
    return {
      chunkedExports: [],
      hasRouteChunks: false,
      hasRouteChunkByExportName: {
        clientAction: false,
        clientLoader: false,
        clientMiddleware: false,
        HydrateFallback: false
      }
    };
  }
  if (!ctx.reactRouterConfig.future.v8_splitRouteModules) {
    return noRouteChunks();
  }
  if (isRootRouteModuleId(ctx, id)) {
    return noRouteChunks();
  }
  let code = await resolveRouteFileCode(ctx, input);
  if (!routeChunkExportNames.some((exportName) => code.includes(exportName))) {
    return noRouteChunks();
  }
  let cacheKey = normalizeRelativeFilePath(id, ctx.reactRouterConfig) + (typeof input === "string" ? "" : "?read");
  return detectRouteChunks(code, cache, cacheKey);
}
async function getRouteChunkIfEnabled(cache, ctx, id, chunkName, input) {
  if (!ctx.reactRouterConfig.future.v8_splitRouteModules) {
    return null;
  }
  let code = await resolveRouteFileCode(ctx, input);
  let cacheKey = normalizeRelativeFilePath(id, ctx.reactRouterConfig) + (typeof input === "string" ? "" : "?read");
  return getRouteChunkCode(code, chunkName, cache, cacheKey);
}
function validateRouteChunks({
  ctx,
  id,
  valid
}) {
  if (isRootRouteModuleId(ctx, id)) {
    return;
  }
  let invalidChunks = Object.entries(valid).filter(([_, isValid]) => !isValid).map(([chunkName]) => chunkName);
  if (invalidChunks.length === 0) {
    return;
  }
  let plural = invalidChunks.length > 1;
  throw new Error(
    [
      `Error splitting route module: ${normalizeRelativeFilePath(
        id,
        ctx.reactRouterConfig
      )}`,
      invalidChunks.map((name) => `- ${name}`).join("\n"),
      `${plural ? "These exports" : "This export"} could not be split into ${plural ? "their own chunks" : "its own chunk"} because ${plural ? "they share" : "it shares"} code with other exports. You should extract any shared code into its own module and then import it within the route module.`
    ].join("\n\n")
  );
}
async function cleanBuildDirectory(viteConfig, ctx) {
  let buildDirectory = ctx.reactRouterConfig.buildDirectory;
  let isWithinRoot = () => {
    let relativePath = path7.relative(ctx.rootDirectory, buildDirectory);
    return !relativePath.startsWith("..") && !path7.isAbsolute(relativePath);
  };
  if (viteConfig.build.emptyOutDir ?? isWithinRoot()) {
    await (0, import_promises3.rm)(buildDirectory, { force: true, recursive: true });
  }
}
async function cleanViteManifests(environmentsOptions, ctx) {
  let viteManifestPaths = Object.entries(environmentsOptions).map(
    ([environmentName, options]) => {
      let outDir = options.build?.outDir;
      invariant(outDir, `Expected build.outDir for ${environmentName}`);
      return path7.join(outDir, ".vite/manifest.json");
    }
  );
  await Promise.all(
    viteManifestPaths.map(async (viteManifestPath) => {
      let manifestExists = (0, import_node_fs2.existsSync)(viteManifestPath);
      if (!manifestExists) return;
      if (!ctx.viteManifestEnabled) {
        await (0, import_promises3.rm)(viteManifestPath, { force: true, recursive: true });
      }
      let viteDir = path7.dirname(viteManifestPath);
      let viteDirFiles = await (0, import_promises3.readdir)(viteDir, { recursive: true });
      if (viteDirFiles.length === 0) {
        await (0, import_promises3.rm)(viteDir, { force: true, recursive: true });
      }
    })
  );
}
async function getBuildManifest({
  reactRouterConfig,
  rootDirectory
}) {
  let { routes, serverBundles, appDirectory } = reactRouterConfig;
  if (!serverBundles) {
    return { routes };
  }
  let { normalizePath } = await import("vite");
  let serverBuildDirectory = getServerBuildDirectory(reactRouterConfig);
  let resolvedAppDirectory = path7.resolve(rootDirectory, appDirectory);
  let rootRelativeRoutes = Object.fromEntries(
    Object.entries(routes).map(([id, route]) => {
      let filePath = path7.join(resolvedAppDirectory, route.file);
      let rootRelativeFilePath = normalizePath(
        path7.relative(rootDirectory, filePath)
      );
      return [id, { ...route, file: rootRelativeFilePath }];
    })
  );
  let buildManifest = {
    serverBundles: {},
    routeIdToServerBundleId: {},
    routes: rootRelativeRoutes
  };
  await Promise.all(
    getAddressableRoutes(routes).map(async (route) => {
      let branch = getRouteBranch(routes, route.id);
      let serverBundleId = await serverBundles({
        branch: branch.map(
          (route2) => configRouteToBranchRoute({
            ...route2,
            // Ensure absolute paths are passed to the serverBundles function
            file: path7.join(resolvedAppDirectory, route2.file)
          })
        )
      });
      if (typeof serverBundleId !== "string") {
        throw new Error(`The "serverBundles" function must return a string`);
      }
      if (reactRouterConfig.future.v8_viteEnvironmentApi) {
        if (!/^[a-zA-Z0-9_]+$/.test(serverBundleId)) {
          throw new Error(
            `The "serverBundles" function must only return strings containing alphanumeric characters and underscores.`
          );
        }
      } else {
        if (!/^[a-zA-Z0-9-_]+$/.test(serverBundleId)) {
          throw new Error(
            `The "serverBundles" function must only return strings containing alphanumeric characters, hyphens and underscores.`
          );
        }
      }
      buildManifest.routeIdToServerBundleId[route.id] = serverBundleId;
      buildManifest.serverBundles[serverBundleId] ??= {
        id: serverBundleId,
        file: normalizePath(
          path7.join(
            path7.relative(
              rootDirectory,
              path7.join(serverBuildDirectory, serverBundleId)
            ),
            reactRouterConfig.serverBuildFile
          )
        )
      };
    })
  );
  return buildManifest;
}
function mergeEnvironmentOptions(base, ...overrides) {
  let vite2 = getVite();
  return overrides.reduce(
    (merged, override) => vite2.mergeConfig(merged, override, false),
    base
  );
}
async function getEnvironmentOptionsResolvers(ctx, viteCommand) {
  let { serverBuildFile, serverModuleFormat } = ctx.reactRouterConfig;
  let packageRoot = path7.dirname(
    require.resolve("@react-router/dev/package.json")
  );
  let { moduleSyncEnabled } = await import(`file:///${path7.join(packageRoot, "module-sync-enabled/index.mjs")}`);
  let vite2 = getVite();
  function getBaseOptions({
    viteUserConfig
  }) {
    const rollupOptions = {
      preserveEntrySignatures: "exports-only",
      // Silence Rollup "use client" warnings
      // Adapted from https://github.com/vitejs/vite-plugin-react/pull/144
      onwarn(warning, defaultHandler) {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE" && warning.message.includes("use client")) {
          return;
        }
        let userHandler = viteUserConfig.build?.rollupOptions?.onwarn;
        if (userHandler) {
          userHandler(warning, defaultHandler);
        } else {
          defaultHandler(warning);
        }
      }
    };
    return {
      build: {
        cssMinify: viteUserConfig.build?.cssMinify ?? true,
        manifest: true,
        // The manifest is enabled for all builds to detect SSR-only assets
        rollupOptions
      }
    };
  }
  function getBaseServerOptions({
    viteUserConfig
  }) {
    let maybeModuleSyncConditions = [
      ...moduleSyncEnabled ? ["module-sync"] : []
    ];
    let maybeDevelopmentConditions = viteCommand === "build" ? [] : ["development"];
    let maybeDefaultServerConditions = vite2.defaultServerConditions || [];
    let defaultExternalConditions = ["node"];
    let baseConditions = [
      ...maybeDevelopmentConditions,
      ...maybeModuleSyncConditions
    ];
    return mergeEnvironmentOptions(getBaseOptions({ viteUserConfig }), {
      resolve: {
        external: (
          // If `v8_viteEnvironmentApi` is `true`, `resolve.external` is set in the `configEnvironment` hook
          ctx.reactRouterConfig.future.v8_viteEnvironmentApi ? void 0 : ssrExternals
        ),
        conditions: [...baseConditions, ...maybeDefaultServerConditions],
        externalConditions: [...baseConditions, ...defaultExternalConditions]
      },
      build: {
        // We move SSR-only assets to client assets. Note that the
        // SSR build can also emit code-split JS files (e.g., by
        // dynamic import) under the same assets directory
        // regardless of "ssrEmitAssets" option, so we also need to
        // keep these JS files to be kept as-is.
        ssrEmitAssets: true,
        copyPublicDir: false,
        // The client only uses assets in the public directory
        rollupOptions: {
          input: (ctx.reactRouterConfig.future.v8_viteEnvironmentApi ? viteUserConfig.environments?.ssr?.build?.rollupOptions?.input : viteUserConfig.build?.rollupOptions?.input) ?? virtual.serverBuild.id,
          output: {
            entryFileNames: serverBuildFile,
            format: serverModuleFormat
          }
        }
      }
    });
  }
  let environmentOptionsResolvers = {
    client: ({ viteUserConfig }) => mergeEnvironmentOptions(getBaseOptions({ viteUserConfig }), {
      build: {
        rollupOptions: {
          input: [
            ctx.entryClientFilePath,
            ...Object.values(ctx.reactRouterConfig.routes).flatMap(
              (route) => {
                let routeFilePath = path7.resolve(
                  ctx.reactRouterConfig.appDirectory,
                  route.file
                );
                let isRootRoute = route.file === ctx.reactRouterConfig.routes.root.file;
                let code = (0, import_node_fs2.readFileSync)(routeFilePath, "utf-8");
                return [
                  `${routeFilePath}${BUILD_CLIENT_ROUTE_QUERY_STRING}`,
                  ...ctx.reactRouterConfig.future.v8_splitRouteModules && !isRootRoute ? routeChunkExportNames.map(
                    (exportName) => code.includes(exportName) ? getRouteChunkModuleId(routeFilePath, exportName) : null
                  ) : []
                ].filter(isNonNullable);
              }
            )
          ],
          output: (ctx.reactRouterConfig.future.v8_viteEnvironmentApi ? viteUserConfig?.environments?.client?.build?.rollupOptions?.output : viteUserConfig?.build?.rollupOptions?.output) ?? {
            entryFileNames: ({ moduleIds }) => {
              let routeChunkModuleId = moduleIds.find(isRouteChunkModuleId);
              let routeChunkName = routeChunkModuleId ? getRouteChunkNameFromModuleId(routeChunkModuleId)?.replace(
                "unstable_",
                ""
              ) : null;
              let routeChunkSuffix = routeChunkName ? `-${(0, import_kebabCase.default)(routeChunkName)}` : "";
              let assetsDir = (ctx.reactRouterConfig.future.v8_viteEnvironmentApi ? viteUserConfig?.environments?.client?.build?.assetsDir : null) ?? viteUserConfig?.build?.assetsDir ?? "assets";
              return path7.posix.join(
                assetsDir,
                `[name]${routeChunkSuffix}-[hash].js`
              );
            }
          }
        },
        outDir: getClientBuildDirectory(ctx.reactRouterConfig)
      }
    })
  };
  let serverBundleIds = getServerBundleIds(ctx);
  if (serverBundleIds) {
    for (let serverBundleId of serverBundleIds) {
      const environmentName = `${SSR_BUNDLE_PREFIX}${serverBundleId}`;
      environmentOptionsResolvers[environmentName] = ({ viteUserConfig }) => mergeEnvironmentOptions(
        getBaseServerOptions({ viteUserConfig }),
        {
          build: {
            outDir: getServerBuildDirectory(ctx.reactRouterConfig, {
              serverBundleId
            })
          }
        },
        // Ensure server bundle environments extend the user's SSR
        // environment config if it exists
        viteUserConfig.environments?.ssr ?? {}
      );
    }
  } else {
    environmentOptionsResolvers.ssr = ({ viteUserConfig }) => mergeEnvironmentOptions(getBaseServerOptions({ viteUserConfig }), {
      build: {
        outDir: getServerBuildDirectory(ctx.reactRouterConfig)
      }
    });
  }
  return environmentOptionsResolvers;
}
function resolveEnvironmentsOptions(environmentResolvers, resolverOptions) {
  let environmentOptions = {};
  for (let [environmentName, resolver] of Object.entries(
    environmentResolvers
  )) {
    environmentOptions[environmentName] = resolver(resolverOptions);
  }
  return environmentOptions;
}
async function getEnvironmentsOptions(ctx, viteCommand, resolverOptions) {
  let environmentOptionsResolvers = await getEnvironmentOptionsResolvers(
    ctx,
    viteCommand
  );
  return resolveEnvironmentsOptions(
    environmentOptionsResolvers,
    resolverOptions
  );
}
function isNonNullable(x) {
  return x != null;
}
async function asyncFlatten(arr) {
  do {
    arr = (await Promise.all(arr)).flat(Infinity);
  } while (arr.some((v2) => v2?.then));
  return arr;
}
function assertPrerenderPathsMatchRoutes(config, prerenderPaths) {
  let routes = createPrerenderRoutes(config.routes);
  for (let path10 of prerenderPaths) {
    let matches = (0, import_react_router2.matchRoutes)(routes, `/${path10}/`.replace(/^\/\/+/, "/"));
    if (!matches) {
      throw new Error(
        `Unable to prerender path because it does not match any routes: ${path10}`
      );
    }
  }
}
function getPrerenderConcurrencyConfig(reactRouterConfig) {
  let concurrency = 1;
  let { prerender: prerender2 } = reactRouterConfig;
  if (typeof prerender2 === "object" && "unstable_concurrency" in prerender2) {
    concurrency = prerender2.unstable_concurrency ?? 1;
  }
  return concurrency;
}
function createDataRequest(prerenderPath, reactRouterConfig, onlyRoutes, isResourceRoute) {
  let normalizedPath = `${reactRouterConfig.basename}${prerenderPath === "/" ? "/_root.data" : `${prerenderPath.replace(/\/$/, "")}.data`}`.replace(/\/\/+/g, "/");
  let url2 = new URL(`http://localhost${normalizedPath}`);
  if (onlyRoutes?.length) {
    url2.searchParams.set("_routes", onlyRoutes.join(","));
  }
  return {
    request: new Request(url2),
    metadata: { type: "data", path: prerenderPath, isResourceRoute }
  };
}
function createRouteRequest(prerenderPath, reactRouterConfig, data) {
  let normalizedPath = `${reactRouterConfig.basename}${prerenderPath}/`.replace(
    /\/\/+/g,
    "/"
  );
  let headers = new Headers();
  if (data) {
    let encodedData = encodeURI(data);
    if (encodedData.length < 8 * 1024) {
      headers.set("X-React-Router-Prerender-Data", encodedData);
    }
  }
  return {
    request: new Request(`http://localhost${normalizedPath}`, { headers }),
    metadata: { type: "html", path: prerenderPath }
  };
}
function createResourceRouteRequest(prerenderPath, reactRouterConfig, requestInit) {
  let normalizedPath = `${reactRouterConfig.basename}${prerenderPath}/`.replace(/\/\/+/g, "/").replace(/\/$/g, "");
  return {
    request: new Request(`http://localhost${normalizedPath}`, requestInit),
    metadata: { type: "resource", path: prerenderPath }
  };
}
function createSpaModeRequest(reactRouterConfig) {
  return {
    request: new Request(`http://localhost${reactRouterConfig.basename}`, {
      headers: {
        // Enable SPA mode in the server runtime and only render down to the root
        "X-React-Router-SPA-Mode": "yes"
      }
    }),
    metadata: { type: "spa", path: "/" }
  };
}
var ESCAPE_REGEX = /[&><\u2028\u2029]/g;
var ESCAPE_LOOKUP = {
  "&": "\\u0026",
  ">": "\\u003e",
  "<": "\\u003c",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escapeHtml(html) {
  return html.replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]);
}

// vite/rsc/plugin.ts
var import_es_module_lexer3 = require("es-module-lexer");
var Path5 = __toESM(require("pathe"));
var babel2 = __toESM(require("@babel/core"));
var import_picocolors5 = __toESM(require("picocolors"));
var import_fs = require("fs");
var import_promises4 = require("fs/promises");
var import_pathe6 = __toESM(require("pathe"));

// vite/rsc/virtual-route-config.ts
var import_pathe5 = __toESM(require("pathe"));
function createVirtualRouteConfig({
  appDirectory,
  routeConfig
}) {
  let routeIdByFile = /* @__PURE__ */ new Map();
  let code = "export default [";
  const closeRouteSymbol = Symbol("CLOSE_ROUTE");
  let stack = [
    ...routeConfig
  ];
  while (stack.length > 0) {
    const route = stack.pop();
    if (!route) break;
    if (route === closeRouteSymbol) {
      code += "]},";
      continue;
    }
    code += "{";
    const routeFile = import_pathe5.default.resolve(appDirectory, route.file);
    const routeId = route.id || createRouteId2(route.file, appDirectory);
    routeIdByFile.set(routeFile, routeId);
    code += `lazy: () => import(${JSON.stringify(
      `${routeFile}?route-module`
    )}),`;
    code += `id: ${JSON.stringify(routeId)},`;
    if (typeof route.path === "string") {
      code += `path: ${JSON.stringify(route.path)},`;
    }
    if (route.index) {
      code += `index: true,`;
    }
    if (route.caseSensitive) {
      code += `caseSensitive: true,`;
    }
    if (route.children) {
      code += ["children:["];
      stack.push(closeRouteSymbol);
      stack.push(...[...route.children].reverse());
    } else {
      code += "},";
    }
  }
  code += "];\n";
  return { code, routeIdByFile };
}
function createRouteId2(file, appDirectory) {
  return import_pathe5.default.relative(appDirectory, file).replace(/\\+/, "/").slice(0, -import_pathe5.default.extname(file).length);
}

// vite/rsc/virtual-route-modules.ts
var import_es_module_lexer2 = require("es-module-lexer");
var SERVER_COMPONENT_EXPORTS = [
  "ServerComponent",
  "ServerLayout",
  "ServerHydrateFallback",
  "ServerErrorBoundary"
];
var SERVER_COMPONENT_EXPORTS_SET = new Set(SERVER_COMPONENT_EXPORTS);
function isServerComponentExport(name) {
  return SERVER_COMPONENT_EXPORTS_SET.has(name);
}
var SERVER_ROUTE_EXPORTS = [
  ...SERVER_COMPONENT_EXPORTS,
  "loader",
  "action",
  "middleware",
  "headers"
];
var SERVER_ROUTE_EXPORTS_SET = new Set(SERVER_ROUTE_EXPORTS);
function isServerRouteExport(name) {
  return SERVER_ROUTE_EXPORTS_SET.has(name);
}
var CLIENT_NON_COMPONENT_EXPORTS2 = [
  "clientAction",
  "clientLoader",
  "clientMiddleware",
  "handle",
  "meta",
  "links",
  "shouldRevalidate"
];
var CLIENT_ROUTE_EXPORTS2 = [
  ...CLIENT_NON_COMPONENT_EXPORTS2,
  "default",
  "ErrorBoundary",
  "HydrateFallback",
  "Layout"
];
var CLIENT_ROUTE_EXPORTS_SET = new Set(CLIENT_ROUTE_EXPORTS2);
function isClientRouteExport(name) {
  return CLIENT_ROUTE_EXPORTS_SET.has(name);
}
var mutuallyExclusiveRouteExports = /* @__PURE__ */ new Map([
  ["ErrorBoundary", "ServerErrorBoundary"],
  ["HydrateFallback", "ServerHydrateFallback"],
  ["Layout", "ServerLayout"],
  ["default", "ServerComponent"]
]);
var ROUTE_EXPORTS = [
  ...SERVER_ROUTE_EXPORTS,
  ...CLIENT_ROUTE_EXPORTS2
];
var ROUTE_EXPORTS_SET = new Set(ROUTE_EXPORTS);
function isRouteExport(name) {
  return ROUTE_EXPORTS_SET.has(name);
}
function isCustomRouteExport(name) {
  return !isRouteExport(name);
}
function hasReactServerCondition(viteEnvironment) {
  return viteEnvironment.config.resolve.conditions.includes("react-server");
}
function transformVirtualRouteModules({
  id,
  code,
  viteCommand,
  routeIdByFile,
  rootRouteFile,
  viteEnvironment
}) {
  if (isVirtualRouteModuleId(id) || routeIdByFile.has(id)) {
    return createVirtualRouteModuleCode({
      id,
      code,
      rootRouteFile,
      viteCommand,
      viteEnvironment
    });
  }
  if (isVirtualServerRouteModuleId(id)) {
    return createVirtualServerRouteModuleCode({
      id,
      code,
      viteEnvironment
    });
  }
  if (isVirtualClientRouteModuleId(id)) {
    return createVirtualClientRouteModuleCode({
      id,
      code,
      rootRouteFile,
      viteCommand
    });
  }
}
async function createVirtualRouteModuleCode({
  id,
  code: routeSource,
  rootRouteFile,
  viteCommand,
  viteEnvironment
}) {
  const isReactServer = hasReactServerCondition(viteEnvironment);
  const { staticExports, hasClientExports } = parseRouteExports(routeSource);
  for (const exportName of staticExports) {
    if (mutuallyExclusiveRouteExports.has(exportName)) {
      const conflictingExport = mutuallyExclusiveRouteExports.get(exportName);
      if (staticExports.includes(conflictingExport)) {
        throw new Error(
          `Route module cannot export both "${exportName}" and "${conflictingExport}". Please choose one or the other.`
        );
      }
    }
  }
  const clientModuleId = getVirtualClientModuleId(id);
  const serverModuleId = getVirtualServerModuleId(id);
  let code = "";
  if (isReactServer && staticExports.some(isServerComponentExport)) {
    code += `import React from "react";
`;
  }
  for (const staticExport of staticExports) {
    if (isReactServer && isServerComponentExport(staticExport)) {
      code += `import { ${staticExport} as ${staticExport}WithoutCss } from "${serverModuleId}";
`;
      code += `export ${staticExport === "ServerComponent" ? "default " : " "}function ${staticExport.replace(/^Server/, "")}(props) {
`;
      code += `  return React.createElement(React.Fragment, null,
`;
      code += `    import.meta.viteRsc.loadCss(),
`;
      code += `    React.createElement(${staticExport}WithoutCss, props),
`;
      code += `  );
`;
      code += `}
`;
    } else if (isReactServer && isServerRouteExport(staticExport)) {
      code += `export { ${staticExport} } from "${serverModuleId}";
`;
    } else if (isClientRouteExport(staticExport)) {
      code += `export { ${staticExport} } from "${clientModuleId}";
`;
    } else if (isCustomRouteExport(staticExport)) {
      code += `export { ${staticExport} } from "${isReactServer ? serverModuleId : clientModuleId}";
`;
    }
  }
  if (isRootRouteFile({ id, rootRouteFile }) && !staticExports.includes("ErrorBoundary") && !staticExports.includes("ServerErrorBoundary")) {
    code += `export { ErrorBoundary } from "${clientModuleId}";
`;
  }
  if (viteCommand === "serve" && !hasClientExports) {
    code += `export { __ensureClientRouteModuleForHMR } from "${clientModuleId}";
`;
  }
  return code;
}
function createVirtualServerRouteModuleCode({
  id,
  code: routeSource,
  viteEnvironment
}) {
  if (!hasReactServerCondition(viteEnvironment)) {
    throw new Error(
      [
        "Virtual server route module was loaded outside of the RSC environment.",
        `Environment Name: ${viteEnvironment.name}`,
        `Module ID: ${id}`
      ].join("\n")
    );
  }
  const { staticExports } = parseRouteExports(routeSource);
  const clientModuleId = getVirtualClientModuleId(id);
  const serverRouteModuleAst = import_parser.parse(routeSource, {
    sourceType: "module"
  });
  removeExports(serverRouteModuleAst, CLIENT_ROUTE_EXPORTS2);
  const generatorResult = generate(serverRouteModuleAst);
  for (const staticExport of staticExports) {
    if (isClientRouteExport(staticExport)) {
      generatorResult.code += "\n";
      generatorResult.code += `export { ${staticExport} } from "${clientModuleId}";
`;
    }
  }
  return generatorResult;
}
function createVirtualClientRouteModuleCode({
  id,
  code: routeSource,
  rootRouteFile,
  viteCommand
}) {
  const { staticExports, hasClientExports } = parseRouteExports(routeSource);
  const clientRouteModuleAst = import_parser.parse(routeSource, {
    sourceType: "module"
  });
  removeExports(clientRouteModuleAst, SERVER_ROUTE_EXPORTS);
  const generatorResult = generate(clientRouteModuleAst);
  generatorResult.code = '"use client";' + generatorResult.code;
  if (isRootRouteFile({ id, rootRouteFile }) && !staticExports.includes("ErrorBoundary") && !staticExports.includes("ServerErrorBoundary")) {
    const hasRootLayout = staticExports.includes("Layout");
    generatorResult.code += `
import { createElement as __rr_createElement } from "react";
`;
    generatorResult.code += `import { UNSAFE_RSCDefaultRootErrorBoundary } from "react-router";
`;
    generatorResult.code += `export function ErrorBoundary() {
`;
    generatorResult.code += `  return __rr_createElement(UNSAFE_RSCDefaultRootErrorBoundary, { hasRootLayout: ${hasRootLayout} });
`;
    generatorResult.code += `}
`;
  }
  if (viteCommand === "serve" && !hasClientExports) {
    generatorResult.code += `
export const __ensureClientRouteModuleForHMR = true;`;
  }
  return generatorResult;
}
function parseRouteExports(code) {
  const [, exportSpecifiers] = (0, import_es_module_lexer2.parse)(code);
  const staticExports = exportSpecifiers.map(({ n: name }) => name);
  return {
    staticExports,
    hasClientExports: staticExports.some(isClientRouteExport)
  };
}
function getVirtualClientModuleId(id) {
  return `${id.split("?")[0]}?client-route-module`;
}
function getVirtualServerModuleId(id) {
  return `${id.split("?")[0]}?server-route-module`;
}
function isVirtualRouteModuleId(id) {
  return /(\?|&)route-module(&|$)/.test(id);
}
function isVirtualClientRouteModuleId(id) {
  return /(\?|&)client-route-module(&|$)/.test(id);
}
function isVirtualServerRouteModuleId(id) {
  return /(\?|&)server-route-module(&|$)/.test(id);
}
function isRootRouteFile({
  id,
  rootRouteFile
}) {
  const filePath = id.split("?")[0];
  return filePath === rootRouteFile;
}

// vite/rsc/plugin.ts
var redirectStatusCodes2 = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
var configLoaderPromise;
var typegenWatcherPromise;
function reactRouterRSCVitePlugin() {
  let runningWithinTheReactRouterMonoRepo = Boolean(
    arguments && arguments.length === 1 && typeof arguments[0] === "object" && arguments[0] && "__runningWithinTheReactRouterMonoRepo" in arguments[0] && arguments[0].__runningWithinTheReactRouterMonoRepo === true
  );
  let configLoader;
  let viteCommand;
  let resolvedViteConfig;
  let routeIdByFile;
  let logger;
  let entries;
  let config;
  let rootRouteFile;
  function updateConfig(newConfig) {
    config = newConfig;
    rootRouteFile = Path5.resolve(
      newConfig.appDirectory,
      newConfig.routes.root.file
    );
  }
  return [
    {
      name: "react-router/rsc",
      async config(viteUserConfig, { command, mode }) {
        await import_es_module_lexer3.init;
        await preloadVite();
        viteCommand = command;
        const rootDirectory = getRootDirectory(viteUserConfig);
        const watch2 = command === "serve" && process.env.IS_RR_BUILD_REQUEST !== "yes";
        await loadDotenv({
          rootDirectory,
          viteUserConfig,
          mode
        });
        configLoaderPromise ??= createConfigLoader({
          rootDirectory,
          mode,
          watch: watch2,
          validateConfig: (userConfig) => {
            let errors = [];
            if (userConfig.buildEnd) errors.push("buildEnd");
            if (userConfig.presets?.length) errors.push("presets");
            if (userConfig.serverBundles) errors.push("serverBundles");
            if (userConfig.future?.v8_middleware === false)
              errors.push("future.v8_middleware: false");
            if (userConfig.future?.v8_splitRouteModules)
              errors.push("future.v8_splitRouteModules");
            if (userConfig.future?.v8_viteEnvironmentApi === false)
              errors.push("future.v8_viteEnvironmentApi: false");
            if (userConfig.future?.unstable_subResourceIntegrity)
              errors.push("future.unstable_subResourceIntegrity");
            if (errors.length) {
              return `RSC Framework Mode does not currently support the following React Router config:
${errors.map((x) => ` - ${x}`).join("\n")}
`;
            }
          }
        });
        configLoader = await configLoaderPromise;
        const configResult = await configLoader.getConfig();
        if (!configResult.ok) throw new Error(configResult.error);
        updateConfig(configResult.value);
        if (viteUserConfig.base && config.basename !== "/" && viteCommand === "serve" && !viteUserConfig.server?.middlewareMode && !config.basename.startsWith(viteUserConfig.base)) {
          throw new Error(
            "When using the React Router `basename` and the Vite `base` config, the `basename` config must begin with `base` for the default Vite dev server."
          );
        }
        const vite2 = await import("vite");
        logger = vite2.createLogger(viteUserConfig.logLevel, {
          prefix: "[react-router]"
        });
        entries = await resolveRSCEntryFiles({
          reactRouterConfig: config
        });
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
              ...hasDependency({ name: "react-router-dom", rootDirectory }) ? ["react-router-dom"] : [],
              ...hasDependency({
                name: "react-server-dom-webpack",
                rootDirectory
              }) ? ["react-server-dom-webpack"] : []
            ]
          },
          optimizeDeps: {
            entries: getOptimizeDepsEntries({
              entryClientFilePath: entries.client,
              reactRouterConfig: config
            }),
            ...defineOptimizeDepsCompilerOptions({
              rolldown: {
                transform: {
                  jsx: "react-jsx"
                }
              },
              esbuild: {
                jsx: "automatic"
              }
            }),
            include: [
              // Pre-bundle React dependencies to avoid React duplicates,
              // even if React dependencies are not direct dependencies.
              // https://react.dev/warnings/invalid-hook-call-warning#duplicate-react
              "react",
              "react/jsx-runtime",
              "react/jsx-dev-runtime",
              "react-dom",
              ...hasDependency({
                name: "react-server-dom-webpack",
                rootDirectory
              }) ? ["react-server-dom-webpack"] : [],
              ...runningWithinTheReactRouterMonoRepo ? [] : [
                "react-router",
                "react-router/dom",
                "react-router/internal/react-server-client"
              ],
              "react-router > cookie",
              "react-router > set-cookie-parser"
            ]
          },
          ...defineCompilerOptions({
            oxc: {
              jsx: {
                runtime: "automatic",
                development: viteCommand !== "build"
              }
            },
            esbuild: {
              jsx: "automatic",
              jsxDev: viteCommand !== "build"
            }
          }),
          environments: {
            client: {
              build: {
                rollupOptions: {
                  input: {
                    index: entries.client
                  },
                  output: {
                    manualChunks(id) {
                      const normalized = viteNormalizePath(id);
                      if (normalized.includes("node_modules/react/") || normalized.includes("node_modules/react-dom/") || normalized.includes(
                        "node_modules/react-server-dom-webpack/"
                      ) || normalized.includes("node_modules/@vitejs/plugin-rsc/")) {
                        return "react";
                      }
                      if (normalized.includes("node_modules/react-router/")) {
                        return "router";
                      }
                    }
                  }
                },
                outDir: (0, import_pathe6.join)(config.buildDirectory, "client")
              }
            },
            rsc: {
              build: {
                rollupOptions: {
                  input: {
                    index: entries.rsc
                  },
                  output: {
                    entryFileNames: config.serverBuildFile,
                    format: config.serverModuleFormat
                  }
                },
                outDir: (0, import_pathe6.join)(config.buildDirectory, "server")
              },
              resolve: {
                noExternal: [
                  "@react-router/dev/config/default-rsc-entries/entry.ssr"
                ]
              }
            },
            ssr: {
              build: {
                rollupOptions: {
                  input: {
                    index: entries.ssr
                  },
                  output: {
                    // Note: We don't set `entryFileNames` here because it's
                    // considered private to the RSC environment build, and
                    // @vitejs/plugin-rsc currently breaks if it's set to
                    // something other than `index.js`.
                    format: config.serverModuleFormat
                  }
                },
                outDir: (0, import_pathe6.join)(config.buildDirectory, "server/__ssr_build")
              },
              resolve: {
                noExternal: [
                  "@react-router/dev/config/default-rsc-entries/entry.rsc"
                ]
              }
            }
          },
          build: {
            rollupOptions: {
              // Copied from https://github.com/vitejs/vite-plugin-react/blob/c602225271d4acf462ba00f8d6d8a2e42492c5cd/packages/common/warning.ts
              onwarn(warning, defaultHandler) {
                if (warning.code === "MODULE_LEVEL_DIRECTIVE" && (warning.message.includes("use client") || warning.message.includes("use server"))) {
                  return;
                }
                if (warning.code === "SOURCEMAP_ERROR" && warning.message.includes("resolve original location") && warning.pos === 0) {
                  return;
                }
                if (viteUserConfig.build?.rollupOptions?.onwarn) {
                  viteUserConfig.build.rollupOptions.onwarn(
                    warning,
                    defaultHandler
                  );
                } else {
                  defaultHandler(warning);
                }
              }
            }
          }
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
            routeConfigChanged
          }) => {
            if (!result.ok) {
              invalidateVirtualModules2(viteDevServer);
              logger.error(result.error, {
                clear: true,
                timestamp: true
              });
              return;
            }
            let message = configChanged ? "Config changed." : routeConfigChanged ? "Route config changed." : configCodeChanged ? "Config saved." : routeConfigCodeChanged ? " Route config saved." : "Config saved";
            logger.info(import_picocolors5.default.green(message), {
              clear: true,
              timestamp: true
            });
            updateConfig(result.value);
            if (configChanged || routeConfigChanged) {
              invalidateVirtualModules2(viteDevServer);
            }
          }
        );
      },
      configurePreviewServer(previewServer) {
        const clientBuildDirectory = getClientBuildDirectory2(config);
        if ((config.prerender || config.ssr === false) && process.env.IS_RR_BUILD_REQUEST !== "yes") {
          previewServer.middlewares.use(async (req, res, next) => {
            try {
              const htmlFileBase = ((req.url || "/") + (req.url?.endsWith("/") ? "" : "/") + "index.html").slice(1);
              const htmlFilePath = import_pathe6.default.join(
                clientBuildDirectory,
                htmlFileBase
              );
              if ((0, import_fs.existsSync)(htmlFilePath)) {
                res.setHeader("Content-Type", "text/html");
                res.end(await (0, import_promises4.readFile)(htmlFilePath, "utf-8"));
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
                  const url2 = new URL(req.url || "/", `http://localhost`);
                  const htmlFilePath = import_pathe6.default.join(
                    clientBuildDirectory,
                    url2.pathname.endsWith(".rsc") ? "__spa-fallback.rsc" : "__spa-fallback.html"
                  );
                  if ((0, import_fs.existsSync)(htmlFilePath)) {
                    res.setHeader("Content-Type", "text/html");
                    res.end(await (0, import_promises4.readFile)(htmlFilePath, "utf-8"));
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
      }
    },
    /* @__PURE__ */ (() => {
      let logged = false;
      function logExperimentalNotice() {
        if (logged) return;
        logged = true;
        logger.info(
          import_picocolors5.default.yellow(
            `${viteCommand === "serve" ? "  " : ""}\u{1F9EA} Using React Router's RSC Framework Mode (experimental)`
          )
        );
      }
      return {
        name: "react-router/rsc/log-experimental-notice",
        sharedDuringBuild: true,
        buildStart: logExperimentalNotice,
        configureServer: logExperimentalNotice
      };
    })(),
    process.env.IS_RR_BUILD_REQUEST !== "yes" ? {
      name: "react-router/rsc/typegen",
      async config(viteUserConfig, { command, mode }) {
        if (command === "serve") {
          const vite2 = await import("vite");
          typegenWatcherPromise ??= watch(
            getRootDirectory(viteUserConfig),
            {
              mode,
              rsc: true,
              // ignore `info` logs from typegen since they are
              // redundant when Vite plugin logs are active
              logger: vite2.createLogger("warn", {
                prefix: "[react-router]"
              })
            }
          );
        }
      },
      async buildEnd() {
        (await typegenWatcherPromise)?.close();
      }
    } : null,
    {
      name: "react-router/rsc/virtual-route-config",
      resolveId(id) {
        if (id === virtual2.routeConfig.id) {
          return virtual2.routeConfig.resolvedId;
        }
      },
      load(id) {
        if (id === virtual2.routeConfig.resolvedId) {
          const result = createVirtualRouteConfig({
            appDirectory: config.appDirectory,
            routeConfig: config.unstable_routeConfig
          });
          routeIdByFile = result.routeIdByFile;
          return result.code;
        }
      }
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
          viteEnvironment: this.environment
        });
      }
    },
    {
      name: "react-router/rsc/virtual-basename",
      resolveId(id) {
        if (id === virtual2.basename.id) {
          return virtual2.basename.resolvedId;
        }
      },
      load(id) {
        if (id === virtual2.basename.resolvedId) {
          return `export default ${JSON.stringify(config.basename)};`;
        }
      }
    },
    {
      name: "react-router/rsc/virtual-route-discovery",
      resolveId(id) {
        if (id === virtual2.routeDiscovery.id) {
          return virtual2.routeDiscovery.resolvedId;
        }
      },
      load(id) {
        if (id === virtual2.routeDiscovery.resolvedId) {
          return `export default ${JSON.stringify(
            config.ssr === false ? {
              mode: "initial"
            } : config.routeDiscovery ?? { mode: "lazy" }
          )};`;
        }
      }
    },
    {
      name: "react-router/rsc/hmr/inject-runtime",
      enforce: "pre",
      resolveId(id) {
        if (id === virtual2.injectHmrRuntime.id) {
          return virtual2.injectHmrRuntime.resolvedId;
        }
      },
      async load(id) {
        if (id !== virtual2.injectHmrRuntime.resolvedId) return;
        return viteCommand === "serve" ? [
          `import RefreshRuntime from "${virtual2.hmrRuntime.id}"`,
          "RefreshRuntime.injectIntoGlobalHook(window)",
          "window.$RefreshReg$ = () => {}",
          "window.$RefreshSig$ = () => (type) => type",
          "window.__vite_plugin_react_preamble_installed__ = true"
        ].join("\n") : "";
      }
    },
    {
      name: "react-router/rsc/hmr/runtime",
      enforce: "pre",
      resolveId(id) {
        if (id === virtual2.hmrRuntime.id) return virtual2.hmrRuntime.resolvedId;
      },
      async load(id) {
        if (id !== virtual2.hmrRuntime.resolvedId) return;
        const reactRefreshDir = import_pathe6.default.dirname(
          require.resolve("react-refresh/package.json")
        );
        const reactRefreshRuntimePath = (0, import_pathe6.join)(
          reactRefreshDir,
          "cjs/react-refresh-runtime.development.js"
        );
        return [
          "const exports = {}",
          await (0, import_promises4.readFile)(reactRefreshRuntimePath, "utf8"),
          await (0, import_promises4.readFile)(
            require.resolve("./static/rsc-refresh-utils.mjs"),
            "utf8"
          ),
          "export default exports"
        ].join("\n");
      }
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
          return { code: addRefreshWrapper2({ routeId, code, id }) };
        }
        const result = await babel2.transformAsync(code, {
          babelrc: false,
          configFile: false,
          filename: id,
          sourceFileName: filepath,
          parserOpts: {
            sourceType: "module",
            allowAwaitOutsideFunction: true
          },
          plugins: [[require("react-refresh/babel"), { skipEnvCheck: true }]],
          sourceMaps: true
        });
        if (result === null) return;
        code = result.code;
        const refreshContentRE = /\$Refresh(?:Reg|Sig)\$\(/;
        if (refreshContentRE.test(code)) {
          code = addRefreshWrapper2({ code, id });
        }
        return { code, map: result.map };
      }
    },
    {
      name: "react-router/rsc/hmr/updates",
      async hotUpdate({ server, file, modules }) {
        if (this.environment.name !== "rsc") return;
        const clientModules = server.environments.client.moduleGraph.getModulesByFile(file);
        const vite2 = await import("vite");
        const isServerOnlyChange = !clientModules || clientModules.size === 0 || // Handle CSS injected from server-first routes (with ?direct query
        // string) since the client graph has a reference to the CSS
        vite2.isCSSRequest(file) && Array.from(clientModules).some(
          (mod) => mod.id?.includes("?direct")
        );
        for (const mod of getModulesWithImporters(modules)) {
          if (!mod.file) continue;
          const normalizedPath = import_pathe6.default.normalize(mod.file);
          const routeId = routeIdByFile?.get(normalizedPath);
          if (routeId !== void 0) {
            const routeSource = await (0, import_promises4.readFile)(normalizedPath, "utf8");
            const virtualRouteModuleCode = (await server.environments.rsc.pluginContainer.transform(
              routeSource,
              `${normalizedPath}?route-module`
            )).code;
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
                hasLoader
              }
            });
          }
        }
        return modules;
      }
    },
    {
      name: "react-router/rsc/virtual-react-router-serve-config",
      resolveId(id) {
        if (id === virtual2.reactRouterServeConfig.id) {
          return virtual2.reactRouterServeConfig.resolvedId;
        }
      },
      load(id) {
        if (id === virtual2.reactRouterServeConfig.resolvedId) {
          const rscOutDir = resolvedViteConfig.environments.rsc?.build?.outDir;
          invariant(rscOutDir, "RSC build directory config not found");
          const clientOutDir = resolvedViteConfig.environments.client?.build?.outDir;
          invariant(clientOutDir, "Client build directory config not found");
          const assetsBuildDirectory = Path5.relative(rscOutDir, clientOutDir);
          const publicPath = resolvedViteConfig.base;
          return `export default ${JSON.stringify({
            assetsBuildDirectory,
            publicPath
          })};`;
        }
      }
    },
    validatePluginOrder(),
    warnOnClientSourceMaps(),
    prerender({
      config() {
        return {
          buildDirectory: getClientBuildDirectory2(config),
          concurrency: getPrerenderConcurrencyConfig2(config)
        };
      },
      logFile: (path10) => logger.info(`Prerendered ${import_picocolors5.default.bold(path10)}`),
      async requests() {
        const prerenderPaths = new Set(
          await getPrerenderPaths(
            config.prerender,
            config.ssr,
            config.routes,
            true
          )
        );
        let basename3 = !config.basename || config.basename === "/" ? "/" : config.basename.endsWith("/") ? config.basename : config.basename + "/";
        if (config.ssr === false) {
          prerenderPaths.add("/__spa-fallback.html");
        }
        return Array.from(prerenderPaths).map(
          (prerenderPath) => `http://localhost${basename3}${prerenderPath.slice(1)}`
        );
      },
      async postProcess(request, response, metadata) {
        let url2 = new URL(request.url);
        let isRedirect = redirectStatusCodes2.has(response.status);
        if (!isRedirect && response.status !== 200 && response.status !== 202 && !(url2.pathname === "/__spa-fallback.html" && response.status === 404)) {
          throw new Error(
            `Prerender (data): Received a ${response.status} status code from \`entry.server.tsx\` while prerendering the \`${url2.pathname}\` path.
${url2.pathname}`,
            { cause: response }
          );
        }
        if (metadata?.manifest) {
          return [
            {
              path: url2.pathname,
              contents: await response.text()
            }
          ];
        }
        let isHtml = response.headers.get("content-type")?.includes("text/html");
        let htmlResponse = isHtml ? isRedirect ? response : response.clone() : null;
        let location = response.headers.get("Location");
        let delay = response.status === 302 ? 2 : 0;
        let redirectBody = isRedirect ? `<!doctype html>
<head>
<title>Redirecting to: ${location}</title>
<meta http-equiv="refresh" content="${delay};url=${location}">
<meta name="robots" content="noindex">
</head>
<body>
	<a href="${location}">
  Redirecting from <code>${url2.pathname}</code> to <code>${location}</code>
</a>
</body>
</html>` : "";
        let files = [
          {
            path: isHtml || redirectBody ? url2.pathname === "/__spa-fallback.html" ? "__spa-fallback.html" : (url2.pathname.endsWith("/") ? url2.pathname : url2.pathname + "/") + "index.html" : url2.pathname,
            contents: redirectBody || (isHtml ? await response.text() : new Uint8Array(await response.arrayBuffer()))
          }
        ];
        if (htmlResponse) {
          let body = await htmlResponse.text();
          let matches = Array.from(
            body.matchAll(
              /<script>\(self\.__FLIGHT_DATA\|\|=\[\]\)\.push\(("(?:[^"\\]|\\.)*")\)<\/script>/gim
            )
          );
          if (matches.length) {
            let rscData = "";
            for (const match of matches) {
              rscData += JSON.parse(match[1]);
            }
            files.push({
              path: url2.pathname === "/" ? "_.rsc" : (url2.pathname === "/__spa-fallback.html" ? "__spa-fallback" : url2.pathname) + ".rsc",
              contents: rscData
            });
          }
        } else if (!url2.pathname.endsWith(".rsc")) {
          let dataUrl = new URL(url2);
          dataUrl.pathname += ".rsc";
          return {
            files,
            requests: [dataUrl.href]
          };
        }
        return files;
      }
    })
  ];
}
var virtual2 = {
  routeConfig: create("unstable_rsc/routes"),
  routeDiscovery: create("unstable_rsc/route-discovery"),
  injectHmrRuntime: create("unstable_rsc/inject-hmr-runtime"),
  hmrRuntime: create("unstable_rsc/runtime"),
  basename: create("unstable_rsc/basename"),
  reactRouterServeConfig: create("unstable_rsc/react-router-serve-config")
};
function invalidateVirtualModules2(viteDevServer) {
  for (const vmod of Object.values(virtual2)) {
    for (const env of Object.values(viteDevServer.environments)) {
      const mod = env.moduleGraph.getModuleById(vmod.resolvedId);
      if (mod) {
        env.moduleGraph.invalidateModule(mod);
      }
    }
  }
}
function getRootDirectory(viteUserConfig) {
  return viteUserConfig.root ?? process.env.REACT_ROUTER_ROOT ?? process.cwd();
}
function getModulesWithImporters(modules) {
  const visited = /* @__PURE__ */ new Set();
  const result = /* @__PURE__ */ new Set();
  function walk(module2) {
    if (visited.has(module2)) return;
    visited.add(module2);
    result.add(module2);
    for (const importer of module2.importers) {
      walk(importer);
    }
  }
  for (const module2 of modules) {
    walk(module2);
  }
  return result;
}
function addRefreshWrapper2({
  routeId,
  code,
  id
}) {
  const acceptExports = routeId !== void 0 ? CLIENT_NON_COMPONENT_EXPORTS2 : [];
  return REACT_REFRESH_HEADER2.replaceAll("__SOURCE__", JSON.stringify(id)) + code + REACT_REFRESH_FOOTER2.replaceAll("__SOURCE__", JSON.stringify(id)).replaceAll("__ACCEPT_EXPORTS__", JSON.stringify(acceptExports)).replaceAll("__ROUTE_ID__", JSON.stringify(routeId));
}
var REACT_REFRESH_HEADER2 = `
import RefreshRuntime from "${virtual2.hmrRuntime.id}";

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
}`.replaceAll("\n", "");
var REACT_REFRESH_FOOTER2 = `
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
var getClientBuildDirectory2 = (reactRouterConfig) => import_pathe6.default.join(reactRouterConfig.buildDirectory, "client");
function getPrerenderConcurrencyConfig2(reactRouterConfig) {
  let concurrency = 1;
  let { prerender: prerender2 } = reactRouterConfig;
  if (typeof prerender2 === "object" && "unstable_concurrency" in prerender2) {
    concurrency = prerender2.unstable_concurrency ?? 1;
  }
  return concurrency;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  reactRouter,
  unstable_reactRouterRSC
});
