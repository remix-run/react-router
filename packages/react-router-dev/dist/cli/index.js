#!/usr/bin/env node
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
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
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

// invariant.ts
function invariant(value, message) {
  if (value === false || value === null || typeof value === "undefined") {
    console.error(
      "The following error is a bug in React Router; please open an issue! https://github.com/remix-run/react-router/issues/new/choose"
    );
    throw new Error(message);
  }
}
var init_invariant = __esm({
  "invariant.ts"() {
    "use strict";
  }
});

// config/is-react-router-repo.ts
function isReactRouterRepo() {
  let serverRuntimePath = import_pathe.default.dirname(
    require.resolve("@react-router/node/package.json")
  );
  let serverRuntimeParentDir = import_pathe.default.basename(
    import_pathe.default.resolve(serverRuntimePath, "..")
  );
  return serverRuntimeParentDir === "packages";
}
var import_pathe;
var init_is_react_router_repo = __esm({
  "config/is-react-router-repo.ts"() {
    "use strict";
    import_pathe = __toESM(require("pathe"));
  }
});

// vite/vite.ts
async function preloadVite() {
  vite = await import(viteImportSpecifier);
}
function getVite() {
  invariant(vite, "getVite() called before preloadVite()");
  return vite;
}
var import_pathe2, vite, viteImportSpecifier;
var init_vite = __esm({
  "vite/vite.ts"() {
    "use strict";
    import_pathe2 = __toESM(require("pathe"));
    init_invariant();
    init_is_react_router_repo();
    viteImportSpecifier = isReactRouterRepo() ? (
      // Support testing against different versions of Vite by ensuring that Vite
      // is resolved from the current working directory when running within this
      // repo. If we don't do this, Vite will always be imported relative to this
      // file, which means that it will always resolve to Vite 6.
      `file:///${import_pathe2.default.normalize(
        require.resolve("vite/package.json", { paths: [process.cwd()] })
      ).replace("package.json", "dist/node/index.js")}`
    ) : "vite";
  }
});

// vite/ssr-externals.ts
var ssrExternals;
var init_ssr_externals = __esm({
  "vite/ssr-externals.ts"() {
    "use strict";
    init_is_react_router_repo();
    ssrExternals = isReactRouterRepo() ? [
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
  }
});

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
var init_vite_node = __esm({
  "vite/vite-node.ts"() {
    "use strict";
    init_vite();
    init_ssr_externals();
  }
});

// config/routes.ts
function setAppDirectory(directory) {
  globalThis.__reactRouterAppDirectory = directory;
}
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
function configRoutesToRouteManifest(appDirectory, routes2) {
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
  for (let route of routes2) {
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
var Path, v, import_pick, routeConfigEntrySchema, resolvedRouteConfigSchema;
var init_routes = __esm({
  "config/routes.ts"() {
    "use strict";
    Path = __toESM(require("pathe"));
    v = __toESM(require("valibot"));
    import_pick = __toESM(require("lodash/pick"));
    init_invariant();
    routeConfigEntrySchema = v.pipe(
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
    resolvedRouteConfigSchema = v.array(routeConfigEntrySchema);
  }
});

// cli/detectPackageManager.ts
var init_detectPackageManager = __esm({
  "cli/detectPackageManager.ts"() {
    "use strict";
  }
});

// config/config.ts
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
  let routes2;
  let routeConfig = [];
  if (skipRoutes) {
    routes2 = {};
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
      routes2 = configRoutesToRouteManifest(appDirectory, routeConfig);
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
    routes: routes2,
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
async function loadConfig({
  rootDirectory,
  mode,
  skipRoutes
}) {
  let configLoader = await createConfigLoader({
    rootDirectory,
    mode,
    skipRoutes,
    watch: false
  });
  let config = await configLoader.getConfig();
  await configLoader.close();
  return config;
}
function omitRoutes(config) {
  return {
    ...config,
    routes: {}
  };
}
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
  let dirname5 = import_pathe3.default.dirname(path10);
  let ignoredByPath = !dirname5.startsWith(appDirectory) && // Ensure we're only watching files outside of the app directory
  // that are at the root level, not nested in subdirectories
  path10 !== root && // Watch the root directory itself
  dirname5 !== root;
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
var import_node_fs, import_node_child_process, import_pathe3, import_chokidar, import_picocolors, import_pick2, import_omit, import_cloneDeep, import_isEqual, excludedConfigPresetKeys, mergeReactRouterConfig, deepFreeze, entryExts;
var init_config = __esm({
  "config/config.ts"() {
    "use strict";
    import_node_fs = __toESM(require("fs"));
    import_node_child_process = require("child_process");
    init_vite_node();
    import_pathe3 = __toESM(require("pathe"));
    import_chokidar = __toESM(require("chokidar"));
    import_picocolors = __toESM(require("picocolors"));
    import_pick2 = __toESM(require("lodash/pick"));
    import_omit = __toESM(require("lodash/omit"));
    import_cloneDeep = __toESM(require("lodash/cloneDeep"));
    import_isEqual = __toESM(require("lodash/isEqual"));
    init_routes();
    init_detectPackageManager();
    excludedConfigPresetKeys = ["presets"];
    mergeReactRouterConfig = (...configs) => {
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
    deepFreeze = (o) => {
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
    entryExts = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".mts"];
  }
});

// vite/profiler.ts
var import_node_fs2, import_node_path, import_picocolors2, getSession, start, profileCount, stop;
var init_profiler = __esm({
  "vite/profiler.ts"() {
    "use strict";
    import_node_fs2 = __toESM(require("fs"));
    import_node_path = __toESM(require("path"));
    import_picocolors2 = __toESM(require("picocolors"));
    getSession = () => global.__reactRouter_profile_session;
    start = async (callback) => {
      let inspector = await import("inspector").then((r) => r.default);
      let session = global.__reactRouter_profile_session = new inspector.Session();
      session.connect();
      session.post("Profiler.enable", () => {
        session.post("Profiler.start", callback);
      });
    };
    profileCount = 0;
    stop = (log) => {
      let session = getSession();
      if (!session) return;
      return new Promise((res, rej) => {
        session.post("Profiler.stop", (err2, { profile }) => {
          if (err2) return rej(err2);
          let outPath = import_node_path.default.resolve(`./react-router-${profileCount++}.cpuprofile`);
          import_node_fs2.default.writeFileSync(outPath, JSON.stringify(profile));
          log(
            import_picocolors2.default.yellow(
              `CPU profile written to ${import_picocolors2.default.white(import_picocolors2.default.dim(outPath))}`
            )
          );
          global.__reactRouter_profile_session = void 0;
          res();
        });
      });
    };
  }
});

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
var init_context = __esm({
  "typegen/context.ts"() {
    "use strict";
    init_config();
  }
});

// vite/babel.ts
var babel_exports = {};
__export(babel_exports, {
  generate: () => generate,
  parse: () => import_parser.parse,
  t: () => t,
  traverse: () => traverse
});
var import_parser, t, traverse, generate;
var init_babel = __esm({
  "vite/babel.ts"() {
    "use strict";
    import_parser = require("@babel/parser");
    t = __toESM(require("@babel/types"));
    traverse = require("@babel/traverse").default;
    generate = require("@babel/generator").default;
  }
});

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
var init_params = __esm({
  "typegen/params.ts"() {
    "use strict";
  }
});

// typegen/route.ts
function lineage(routes2, route) {
  const result = [];
  while (route) {
    result.push(route);
    if (!route.parentId) break;
    route = routes2[route.parentId];
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
var init_route = __esm({
  "typegen/route.ts"() {
    "use strict";
  }
});

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
var import_dedent, Path3, Pathe, t2;
var init_generate = __esm({
  "typegen/generate.ts"() {
    "use strict";
    import_dedent = __toESM(require("dedent"));
    Path3 = __toESM(require("pathe"));
    Pathe = __toESM(require("pathe/utils"));
    init_babel();
    init_params();
    init_route();
    ({ t: t2 } = babel_exports);
  }
});

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
async function run(rootDirectory, { mode, rsc }) {
  const ctx = await createContext2({ rootDirectory, mode, rsc, watch: false });
  await import_promises.default.rm(typesDirectory(ctx), { recursive: true, force: true });
  await write(
    generateFuture(ctx),
    generateServerBuild(ctx),
    ...generateRoutes(ctx)
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
  logger?.info((0, import_picocolors3.green)("generated types"), { timestamp: true, clear: true });
  ctx.configLoader.onChange(
    async ({ result, configChanged, routeConfigChanged }) => {
      if (!result.ok) {
        logger?.error((0, import_picocolors3.red)(result.error), { timestamp: true, clear: true });
        return;
      }
      ctx.config = result.value;
      if (configChanged) {
        await write(generateFuture(ctx));
        logger?.info((0, import_picocolors3.green)("regenerated types"), {
          timestamp: true,
          clear: true
        });
      }
      if (routeConfigChanged) {
        await clearRouteModuleAnnotations(ctx);
        await write(...generateRoutes(ctx));
        logger?.info((0, import_picocolors3.green)("regenerated types"), {
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
var import_promises, Path4, import_picocolors3;
var init_typegen = __esm({
  "typegen/index.ts"() {
    "use strict";
    import_promises = __toESM(require("fs/promises"));
    Path4 = __toESM(require("pathe"));
    import_picocolors3 = require("picocolors");
    init_context();
    init_generate();
  }
});

// vite/has-rsc-plugin.ts
async function hasReactRouterRscPlugin({
  root,
  viteBuildOptions: { config, logLevel, mode }
}) {
  await preloadVite();
  const vite2 = getVite();
  const viteConfig = await vite2.resolveConfig(
    {
      configFile: config,
      logLevel,
      mode: mode ?? "production",
      root
    },
    "build",
    // command
    "production",
    // default mode
    "production"
    // default NODE_ENV
  );
  return viteConfig.plugins.some(
    (plugin) => plugin?.name === "react-router/rsc"
  );
}
var init_has_rsc_plugin = __esm({
  "vite/has-rsc-plugin.ts"() {
    "use strict";
    init_vite();
  }
});

// vite/node-adapter.ts
var init_node_adapter = __esm({
  "vite/node-adapter.ts"() {
    "use strict";
    init_invariant();
  }
});

// vite/resolve-file-url.ts
var path4;
var init_resolve_file_url = __esm({
  "vite/resolve-file-url.ts"() {
    "use strict";
    path4 = __toESM(require("path"));
    init_vite();
  }
});

// vite/styles.ts
var path5, import_react_router, cssFileRegExp, cssModulesRegExp;
var init_styles = __esm({
  "vite/styles.ts"() {
    "use strict";
    path5 = __toESM(require("path"));
    import_react_router = require("react-router");
    init_resolve_file_url();
    init_babel();
    cssFileRegExp = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
    cssModulesRegExp = new RegExp(`\\.module${cssFileRegExp.source}`);
  }
});

// vite/virtual-module.ts
function create(name) {
  let id = `virtual:react-router/${name}`;
  return {
    id,
    resolvedId: `\0${id}`,
    url: `/@id/__x00__${id}`
  };
}
var init_virtual_module = __esm({
  "vite/virtual-module.ts"() {
    "use strict";
  }
});

// vite/resolve-relative-route-file-path.ts
var import_pathe4;
var init_resolve_relative_route_file_path = __esm({
  "vite/resolve-relative-route-file-path.ts"() {
    "use strict";
    import_pathe4 = __toESM(require("pathe"));
    init_vite();
  }
});

// vite/combine-urls.ts
var init_combine_urls = __esm({
  "vite/combine-urls.ts"() {
    "use strict";
  }
});

// vite/remove-exports.ts
var import_babel_dead_code_elimination;
var init_remove_exports = __esm({
  "vite/remove-exports.ts"() {
    "use strict";
    import_babel_dead_code_elimination = require("babel-dead-code-elimination");
    init_babel();
  }
});

// vite/has-dependency.ts
var init_has_dependency = __esm({
  "vite/has-dependency.ts"() {
    "use strict";
  }
});

// vite/cache.ts
var init_cache = __esm({
  "vite/cache.ts"() {
    "use strict";
  }
});

// vite/route-chunks.ts
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
var routeChunkExportNames, mainChunkName, routeChunkNames, routeChunkQueryStringPrefix, routeChunkQueryStrings;
var init_route_chunks = __esm({
  "vite/route-chunks.ts"() {
    "use strict";
    init_invariant();
    init_cache();
    init_babel();
    routeChunkExportNames = [
      "clientAction",
      "clientLoader",
      "clientMiddleware",
      "HydrateFallback"
    ];
    mainChunkName = "main";
    routeChunkNames = ["main", ...routeChunkExportNames];
    routeChunkQueryStringPrefix = "?route-chunk=";
    routeChunkQueryStrings = {
      main: `${routeChunkQueryStringPrefix}main`,
      clientAction: `${routeChunkQueryStringPrefix}clientAction`,
      clientLoader: `${routeChunkQueryStringPrefix}clientLoader`,
      clientMiddleware: `${routeChunkQueryStringPrefix}clientMiddleware`,
      HydrateFallback: `${routeChunkQueryStringPrefix}HydrateFallback`
    };
  }
});

// vite/optimize-deps-entries.ts
var import_tinyglobby;
var init_optimize_deps_entries = __esm({
  "vite/optimize-deps-entries.ts"() {
    "use strict";
    import_tinyglobby = require("tinyglobby");
    init_resolve_relative_route_file_path();
    init_vite();
  }
});

// vite/with-props.ts
var init_with_props = __esm({
  "vite/with-props.ts"() {
    "use strict";
    init_babel();
  }
});

// vite/load-dotenv.ts
var init_load_dotenv = __esm({
  "vite/load-dotenv.ts"() {
    "use strict";
  }
});

// vite/plugins/validate-plugin-order.ts
var init_validate_plugin_order = __esm({
  "vite/plugins/validate-plugin-order.ts"() {
    "use strict";
  }
});

// vite/plugins/warn-on-client-source-maps.ts
var import_picocolors4;
var init_warn_on_client_source_maps = __esm({
  "vite/plugins/warn-on-client-source-maps.ts"() {
    "use strict";
    import_picocolors4 = __toESM(require("picocolors"));
    init_invariant();
  }
});

// vite/plugins/prerender.ts
var import_promises2, import_node_path2;
var init_prerender = __esm({
  "vite/plugins/prerender.ts"() {
    "use strict";
    import_promises2 = require("fs/promises");
    import_node_path2 = __toESM(require("path"));
  }
});

// vite/plugin.ts
async function resolveViteConfig({
  configFile,
  mode,
  root,
  plugins
}) {
  let vite2 = getVite();
  let viteConfig = await vite2.resolveConfig(
    { mode, configFile, root, plugins },
    "build",
    // command
    "production",
    // default mode
    "production"
    // default NODE_ENV
  );
  if (typeof viteConfig.build.manifest === "string") {
    throw new Error("Custom Vite manifest paths are not supported");
  }
  return viteConfig;
}
function extractPluginContext(viteConfig) {
  return viteConfig["__reactRouterPluginContext"];
}
function isSsrBundleEnvironmentName(name) {
  return name.startsWith(SSR_BUNDLE_PREFIX);
}
function getServerEnvironmentEntries(ctx, record) {
  return Object.entries(record).filter(
    ([name]) => ctx.buildManifest?.serverBundles ? isSsrBundleEnvironmentName(name) : name === "ssr"
  );
}
function getServerEnvironmentKeys(ctx, record) {
  return getServerEnvironmentEntries(ctx, record).map(([key]) => key);
}
function getServerBundleIds(ctx) {
  return ctx.buildManifest?.serverBundles ? Object.keys(ctx.buildManifest.serverBundles) : void 0;
}
async function cleanBuildDirectory(viteConfig, ctx) {
  let buildDirectory = ctx.reactRouterConfig.buildDirectory;
  let isWithinRoot = () => {
    let relativePath = path8.relative(ctx.rootDirectory, buildDirectory);
    return !relativePath.startsWith("..") && !path8.isAbsolute(relativePath);
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
      return path8.join(outDir, ".vite/manifest.json");
    }
  );
  await Promise.all(
    viteManifestPaths.map(async (viteManifestPath) => {
      let manifestExists = (0, import_node_fs3.existsSync)(viteManifestPath);
      if (!manifestExists) return;
      if (!ctx.viteManifestEnabled) {
        await (0, import_promises3.rm)(viteManifestPath, { force: true, recursive: true });
      }
      let viteDir = path8.dirname(viteManifestPath);
      let viteDirFiles = await (0, import_promises3.readdir)(viteDir, { recursive: true });
      if (viteDirFiles.length === 0) {
        await (0, import_promises3.rm)(viteDir, { force: true, recursive: true });
      }
    })
  );
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
  let packageRoot = path8.dirname(
    require.resolve("@react-router/dev/package.json")
  );
  let { moduleSyncEnabled } = await import(`file:///${path8.join(packageRoot, "module-sync-enabled/index.mjs")}`);
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
                let routeFilePath = path8.resolve(
                  ctx.reactRouterConfig.appDirectory,
                  route.file
                );
                let isRootRoute = route.file === ctx.reactRouterConfig.routes.root.file;
                let code = (0, import_node_fs3.readFileSync)(routeFilePath, "utf-8");
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
              return path8.posix.join(
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
function isNonNullable(x) {
  return x != null;
}
var import_node_crypto, import_node_fs3, import_promises3, path8, url, babel2, import_react_router2, import_es_module_lexer, import_pick3, import_jsesc, import_picocolors5, import_kebabCase, CLIENT_NON_COMPONENT_EXPORTS, CLIENT_ROUTE_EXPORTS, BUILD_CLIENT_ROUTE_QUERY_STRING, SSR_BUNDLE_PREFIX, virtualHmrRuntime, virtualInjectHmrRuntime, virtual, getServerBuildDirectory, getClientBuildDirectory, defaultEntriesDir, defaultEntries, REACT_REFRESH_HEADER;
var init_plugin = __esm({
  "vite/plugin.ts"() {
    "use strict";
    import_node_crypto = require("crypto");
    import_node_fs3 = require("fs");
    import_promises3 = require("fs/promises");
    path8 = __toESM(require("path"));
    url = __toESM(require("url"));
    babel2 = __toESM(require("@babel/core"));
    import_react_router2 = require("react-router");
    import_es_module_lexer = require("es-module-lexer");
    import_pick3 = __toESM(require("lodash/pick"));
    import_jsesc = __toESM(require("jsesc"));
    import_picocolors5 = __toESM(require("picocolors"));
    import_kebabCase = __toESM(require("lodash/kebabCase"));
    init_typegen();
    init_invariant();
    init_babel();
    init_node_adapter();
    init_styles();
    init_virtual_module();
    init_resolve_file_url();
    init_resolve_relative_route_file_path();
    init_combine_urls();
    init_remove_exports();
    init_ssr_externals();
    init_has_dependency();
    init_route_chunks();
    init_vite();
    init_config();
    init_optimize_deps_entries();
    init_with_props();
    init_load_dotenv();
    init_validate_plugin_order();
    init_warn_on_client_source_maps();
    init_prerender();
    CLIENT_NON_COMPONENT_EXPORTS = [
      "clientAction",
      "clientLoader",
      "clientMiddleware",
      "handle",
      "meta",
      "links",
      "shouldRevalidate"
    ];
    CLIENT_ROUTE_EXPORTS = [
      ...CLIENT_NON_COMPONENT_EXPORTS,
      "default",
      "ErrorBoundary",
      "HydrateFallback",
      "Layout"
    ];
    BUILD_CLIENT_ROUTE_QUERY_STRING = "?__react-router-build-client-route";
    SSR_BUNDLE_PREFIX = "ssrBundle_";
    virtualHmrRuntime = create("hmr-runtime");
    virtualInjectHmrRuntime = create("inject-hmr-runtime");
    virtual = {
      serverBuild: create("server-build"),
      serverManifest: create("server-manifest"),
      browserManifest: create("browser-manifest")
    };
    getServerBuildDirectory = (reactRouterConfig, { serverBundleId } = {}) => path8.join(
      reactRouterConfig.buildDirectory,
      "server",
      ...serverBundleId ? [serverBundleId] : []
    );
    getClientBuildDirectory = (reactRouterConfig) => path8.join(reactRouterConfig.buildDirectory, "client");
    defaultEntriesDir = path8.resolve(
      path8.dirname(require.resolve("@react-router/dev/package.json")),
      "dist",
      "config",
      "defaults"
    );
    defaultEntries = (0, import_node_fs3.readdirSync)(defaultEntriesDir).map(
      (filename2) => path8.join(defaultEntriesDir, filename2)
    );
    invariant(defaultEntries.length > 0, "No default entries found");
    REACT_REFRESH_HEADER = `
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
  }
});

// vite/build.ts
var build_exports = {};
__export(build_exports, {
  build: () => build
});
async function build(root, viteBuildOptions) {
  await preloadVite();
  let vite2 = getVite();
  let configResult = await loadConfig({
    rootDirectory: root,
    mode: viteBuildOptions.mode ?? "production",
    // In this scope we only need future flags, so we can skip evaluating
    // routes.ts until we're within the Vite build context
    skipRoutes: true
  });
  if (!configResult.ok) {
    throw new Error(configResult.error);
  }
  let config = configResult.value;
  let viteMajor = parseInt(vite2.version.split(".")[0], 10);
  if (config.future.v8_viteEnvironmentApi && viteMajor === 5) {
    throw new Error(
      "The future.v8_viteEnvironmentApi option is not supported in Vite 5"
    );
  }
  const useViteEnvironmentApi = config.future.v8_viteEnvironmentApi || await hasReactRouterRscPlugin({ root, viteBuildOptions });
  return await (useViteEnvironmentApi ? viteAppBuild(root, viteBuildOptions) : viteBuild(root, viteBuildOptions));
}
async function viteAppBuild(root, {
  assetsInlineLimit,
  clearScreen,
  config: configFile,
  emptyOutDir,
  force,
  logLevel,
  minify,
  mode,
  sourcemapClient,
  sourcemapServer
}) {
  let vite2 = getVite();
  let builder = await vite2.createBuilder({
    root,
    mode,
    configFile,
    build: {
      assetsInlineLimit,
      emptyOutDir,
      minify
    },
    optimizeDeps: { force },
    clearScreen,
    logLevel,
    plugins: [
      {
        name: "react-router:cli-config",
        configEnvironment(name) {
          if (sourcemapClient && name === "client") {
            return {
              build: {
                sourcemap: sourcemapClient
              }
            };
          }
          if (sourcemapServer && name !== "client") {
            return {
              build: {
                sourcemap: sourcemapServer
              }
            };
          }
        },
        configResolved(config) {
          let hasReactRouterPlugin = config.plugins.find(
            (plugin) => plugin.name === "react-router" || plugin.name === "react-router/rsc"
          );
          if (!hasReactRouterPlugin) {
            throw new Error(
              "React Router Vite plugin not found in Vite config"
            );
          }
        }
      }
    ]
  });
  await builder.buildApp();
}
async function viteBuild(root, {
  assetsInlineLimit,
  clearScreen,
  config: configFile,
  emptyOutDir,
  force,
  logLevel,
  minify,
  mode,
  sourcemapClient,
  sourcemapServer
}) {
  let viteUserConfig = {};
  let viteConfig = await resolveViteConfig({
    configFile,
    mode,
    root,
    plugins: [
      {
        name: "react-router:extract-vite-user-config",
        config(config) {
          viteUserConfig = config;
        }
      }
    ]
  });
  let ctx = extractPluginContext(viteConfig);
  if (!ctx) {
    console.error(
      import_picocolors6.default.red("React Router Vite plugin not found in Vite config")
    );
    process.exit(1);
  }
  async function buildEnvironment(environmentName) {
    let vite2 = getVite();
    let ssr = environmentName !== "client";
    let resolveOptions = environmentOptionsResolvers[environmentName];
    invariant(resolveOptions);
    let environmentBuildContext = {
      name: environmentName,
      resolveOptions
    };
    await vite2.build({
      root,
      mode,
      configFile,
      build: {
        assetsInlineLimit,
        emptyOutDir,
        minify,
        ssr,
        sourcemap: ssr ? sourcemapServer : sourcemapClient
      },
      optimizeDeps: { force },
      clearScreen,
      logLevel,
      ...{
        __reactRouterPluginContext: ctx,
        __reactRouterEnvironmentBuildContext: environmentBuildContext
      }
    });
  }
  let { reactRouterConfig, buildManifest } = ctx;
  invariant(buildManifest, "Expected build manifest to be present");
  let environmentOptionsResolvers = await getEnvironmentOptionsResolvers(
    ctx,
    "build"
  );
  let environmentsOptions = resolveEnvironmentsOptions(
    environmentOptionsResolvers,
    { viteUserConfig }
  );
  await cleanBuildDirectory(viteConfig, ctx);
  await buildEnvironment("client");
  let serverEnvironmentNames = getServerEnvironmentKeys(
    ctx,
    environmentOptionsResolvers
  );
  await Promise.all(serverEnvironmentNames.map(buildEnvironment));
  await cleanViteManifests(environmentsOptions, ctx);
  await reactRouterConfig.buildEnd?.({
    buildManifest,
    reactRouterConfig,
    viteConfig
  });
}
var import_picocolors6;
var init_build = __esm({
  "vite/build.ts"() {
    "use strict";
    import_picocolors6 = __toESM(require("picocolors"));
    init_config();
    init_plugin();
    init_invariant();
    init_vite();
    init_has_rsc_plugin();
  }
});

// vite/dev.ts
var dev_exports = {};
__export(dev_exports, {
  dev: () => dev
});
async function dev(root, {
  clearScreen,
  config: configFile,
  cors,
  force,
  host,
  logLevel,
  mode,
  open,
  port,
  strictPort
}) {
  await preloadVite();
  let vite2 = getVite();
  let server = await vite2.createServer({
    root,
    mode,
    configFile,
    server: { open, cors, host, port, strictPort },
    optimizeDeps: { force },
    clearScreen,
    logLevel
  });
  if (!server.config.plugins.find(
    (plugin) => plugin.name === "react-router" || plugin.name === "react-router/rsc"
  )) {
    console.error(
      import_picocolors7.default.red("React Router Vite plugin not found in Vite config")
    );
    process.exit(1);
  }
  await server.listen();
  server.printUrls();
  let customShortcuts = [
    {
      key: "p",
      description: "start/stop the profiler",
      async action(server2) {
        if (getSession()) {
          await stop(server2.config.logger.info);
        } else {
          await start(() => {
            server2.config.logger.info("Profiler started");
          });
        }
      }
    }
  ];
  server.bindCLIShortcuts({ print: true, customShortcuts });
}
var import_picocolors7;
var init_dev = __esm({
  "vite/dev.ts"() {
    "use strict";
    import_picocolors7 = __toESM(require("picocolors"));
    init_vite();
    init_profiler();
  }
});

// cli/run.ts
var import_arg = __toESM(require("arg"));
var import_semver = __toESM(require("semver"));
var import_picocolors9 = __toESM(require("picocolors"));

// cli/commands.ts
var import_node_fs4 = require("fs");
var import_promises4 = require("fs/promises");
var path9 = __toESM(require("path"));
var import_exit_hook = __toESM(require("exit-hook"));
var import_picocolors8 = __toESM(require("picocolors"));
var import_react_router3 = require("react-router");
init_config();

// config/format.ts
function formatRoutes(routeManifest, format) {
  switch (format) {
    case "json":
      return formatRoutesAsJson(routeManifest);
    case "jsx":
      return formatRoutesAsJsx(routeManifest);
  }
}
function formatRoutesAsJson(routeManifest) {
  function handleRoutesRecursive(parentId) {
    let routes2 = Object.values(routeManifest).filter(
      (route) => route.parentId === parentId
    );
    let children = [];
    for (let route of routes2) {
      children.push({
        id: route.id,
        index: route.index,
        path: route.path,
        caseSensitive: route.caseSensitive,
        file: route.file,
        children: handleRoutesRecursive(route.id)
      });
    }
    if (children.length > 0) {
      return children;
    }
    return void 0;
  }
  return JSON.stringify(handleRoutesRecursive() || null, null, 2);
}
function formatRoutesAsJsx(routeManifest) {
  let output = "<Routes>";
  function handleRoutesRecursive(parentId, level = 1) {
    let routes2 = Object.values(routeManifest).filter(
      (route) => route.parentId === parentId
    );
    let indent = Array(level * 2).fill(" ").join("");
    for (let route of routes2) {
      output += "\n" + indent;
      output += `<Route${route.path ? ` path=${JSON.stringify(route.path)}` : ""}${route.index ? " index" : ""}${route.file ? ` file=${JSON.stringify(route.file)}` : ""}>`;
      if (handleRoutesRecursive(route.id, level + 1)) {
        output += "\n" + indent;
        output += "</Route>";
      } else {
        output = output.slice(0, -1) + " />";
      }
    }
    return routes2.length > 0;
  }
  handleRoutesRecursive();
  output += "\n</Routes>";
  return output;
}

// cli/useJavascript.ts
var babel = __toESM(require("@babel/core"));
var import_plugin_syntax_jsx = __toESM(require("@babel/plugin-syntax-jsx"));
var import_preset_typescript = __toESM(require("@babel/preset-typescript"));
var import_prettier = __toESM(require("prettier"));
async function transpile(tsx, options = {}) {
  let mjs = babel.transformSync(tsx, {
    compact: false,
    cwd: options.cwd,
    filename: options.filename,
    plugins: [import_plugin_syntax_jsx.default],
    presets: [[import_preset_typescript.default, { jsx: "preserve" }]],
    retainLines: true
  });
  if (!mjs || !mjs.code) throw new Error("Could not parse TypeScript");
  return await import_prettier.default.format(mjs.code, { parser: "babel" });
}

// cli/commands.ts
init_profiler();
init_typegen();
init_vite();
init_has_rsc_plugin();
async function routes(rootDirectory, flags = {}) {
  rootDirectory = resolveRootDirectory(rootDirectory, flags);
  let configResult = await loadConfig({
    rootDirectory,
    mode: flags.mode ?? "production"
  });
  if (!configResult.ok) {
    console.error(import_picocolors8.default.red(configResult.error));
    process.exit(1);
  }
  let format = flags.json ? "json" : "jsx";
  console.log(formatRoutes(configResult.value.routes, format));
}
async function build2(root, options = {}) {
  root = resolveRootDirectory(root, options);
  let { build: build3 } = await Promise.resolve().then(() => (init_build(), build_exports));
  if (options.profile) {
    await start();
  }
  try {
    await build3(root, options);
  } finally {
    await stop(console.info);
  }
}
async function dev2(root, options = {}) {
  let { dev: dev3 } = await Promise.resolve().then(() => (init_dev(), dev_exports));
  if (options.profile) {
    await start();
  }
  (0, import_exit_hook.default)(() => stop(console.info));
  root = resolveRootDirectory(root, options);
  await dev3(root, options);
  await new Promise(() => {
  });
}
var clientEntries = ["entry.client.tsx", "entry.client.js", "entry.client.jsx"];
var serverEntries = ["entry.server.tsx", "entry.server.js", "entry.server.jsx"];
var entries = ["entry.client", "entry.server"];
var rscEntries = ["entry.client", "entry.rsc", "entry.ssr"];
var conjunctionListFormat = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction"
});
async function generateEntry(entry, rootDirectory, flags = {}) {
  rootDirectory = resolveRootDirectory(rootDirectory, flags);
  let configDir = "defaults";
  let entriesToUse = entries;
  let isRsc = false;
  if (await hasReactRouterRscPlugin({
    root: rootDirectory,
    viteBuildOptions: {
      config: flags.config,
      mode: flags.mode
    }
  })) {
    if (!entry) {
      await generateEntry("entry.client", rootDirectory, flags);
      await generateEntry("entry.rsc", rootDirectory, flags);
      await generateEntry("entry.ssr", rootDirectory, flags);
      return;
    }
    configDir = "default-rsc-entries";
    entriesToUse = rscEntries;
    isRsc = true;
  }
  if (!entry) {
    await generateEntry("entry.client", rootDirectory, flags);
    await generateEntry("entry.server", rootDirectory, flags);
    return;
  }
  let configResult = await loadConfig({
    rootDirectory,
    mode: flags.mode ?? "production"
  });
  if (!configResult.ok) {
    console.error(import_picocolors8.default.red(configResult.error));
    return;
  }
  let appDirectory = configResult.value.appDirectory;
  if (!entriesToUse.includes(entry)) {
    let entriesArray = Array.from(entriesToUse);
    let list = conjunctionListFormat.format(entriesArray);
    console.error(
      import_picocolors8.default.red(`Invalid entry file. Valid entry files are ${list}`)
    );
    return;
  }
  let defaultsDirectory = path9.resolve(
    path9.dirname(require.resolve("@react-router/dev/package.json")),
    "dist",
    "config",
    configDir
  );
  let outputFile;
  if (isRsc) {
    let defaultEntry = path9.resolve(defaultsDirectory, `${entry}.tsx`);
    outputFile = path9.resolve(appDirectory, `${entry}.tsx`);
    if ((0, import_node_fs4.existsSync)(outputFile)) {
      let relative7 = path9.relative(rootDirectory, outputFile);
      console.error(import_picocolors8.default.red(`Entry file ${relative7} already exists.`));
      return;
    }
    await (0, import_promises4.copyFile)(defaultEntry, outputFile);
  } else {
    let { readPackageJSON } = await import("pkg-types");
    let pkgJson = await readPackageJSON(rootDirectory);
    let deps = pkgJson.dependencies ?? {};
    if (!deps["@react-router/node"]) {
      console.error(import_picocolors8.default.red(`No default server entry detected.`));
      return;
    }
    let defaultEntryClient = path9.resolve(
      defaultsDirectory,
      "entry.client.tsx"
    );
    let defaultEntryServer = path9.resolve(
      defaultsDirectory,
      `entry.server.node.tsx`
    );
    let isServerEntry = entry === "entry.server";
    let contents = isServerEntry ? await createServerEntry(rootDirectory, appDirectory, defaultEntryServer) : await createClientEntry(
      rootDirectory,
      appDirectory,
      defaultEntryClient
    );
    let useTypeScript = flags.typescript ?? true;
    let outputExtension = useTypeScript ? "tsx" : "jsx";
    let outputEntry = `${entry}.${outputExtension}`;
    outputFile = path9.resolve(appDirectory, outputEntry);
    if (!useTypeScript) {
      let javascript = await transpile(contents, {
        cwd: rootDirectory,
        filename: isServerEntry ? defaultEntryServer : defaultEntryClient
      });
      await (0, import_promises4.writeFile)(outputFile, javascript, "utf-8");
    } else {
      await (0, import_promises4.writeFile)(outputFile, contents, "utf-8");
    }
  }
  console.log(
    import_picocolors8.default.blue(
      `Entry file ${entry} created at ${path9.relative(
        rootDirectory,
        outputFile
      )}.`
    )
  );
}
function resolveRootDirectory(root, flags) {
  if (root) {
    return path9.resolve(root);
  }
  return process.env.REACT_ROUTER_ROOT || (flags?.config ? path9.dirname(path9.resolve(flags.config)) : process.cwd());
}
async function checkForEntry(rootDirectory, appDirectory, entries2) {
  for (let entry of entries2) {
    let entryPath = path9.resolve(appDirectory, entry);
    let exists = (0, import_node_fs4.existsSync)(entryPath);
    if (exists) {
      let relative7 = path9.relative(rootDirectory, entryPath);
      console.error(import_picocolors8.default.red(`Entry file ${relative7} already exists.`));
      return process.exit(1);
    }
  }
}
async function createServerEntry(rootDirectory, appDirectory, inputFile) {
  await checkForEntry(rootDirectory, appDirectory, serverEntries);
  let contents = await (0, import_promises4.readFile)(inputFile, "utf-8");
  return contents;
}
async function createClientEntry(rootDirectory, appDirectory, inputFile) {
  await checkForEntry(rootDirectory, appDirectory, clientEntries);
  let contents = await (0, import_promises4.readFile)(inputFile, "utf-8");
  return contents;
}
async function typegen(root, flags) {
  root = resolveRootDirectory(root, flags);
  const rsc = await hasReactRouterRscPlugin({
    root,
    viteBuildOptions: {
      config: flags.config,
      mode: flags.mode
    }
  });
  if (flags.watch) {
    await preloadVite();
    const vite2 = getVite();
    const logger = vite2.createLogger("info", { prefix: "[react-router]" });
    await watch(root, {
      mode: flags.mode ?? "development",
      rsc,
      logger
    });
    await new Promise(() => {
    });
    return;
  }
  await run(root, {
    mode: flags.mode ?? "production",
    rsc
  });
}

// cli/run.ts
var helpText = `
${import_picocolors9.default.blueBright("react-router")}

  ${import_picocolors9.default.underline("Usage")}:
    $ react-router build [${import_picocolors9.default.yellowBright("projectDir")}]
    $ react-router dev [${import_picocolors9.default.yellowBright("projectDir")}]
    $ react-router routes [${import_picocolors9.default.yellowBright("projectDir")}]

  ${import_picocolors9.default.underline("Options")}:
    --help, -h          Print this help message and exit
    --version, -v       Print the CLI version and exit
    --no-color          Disable ANSI colors in console output
  \`build\` Options:
    --assetsInlineLimit Static asset base64 inline threshold in bytes (default: 4096) (number)
    --clearScreen       Allow/disable clear screen when logging (boolean)
    --config, -c        Use specified config file (string)
    --emptyOutDir       Force empty outDir when it's outside of root (boolean)
    --logLevel, -l      Info | warn | error | silent (string)
    --minify            Enable/disable minification, or specify minifier to use (default: "esbuild") (boolean | "terser" | "esbuild")
    --mode, -m          Set env mode (string)
    --profile           Start built-in Node.js inspector
    --sourcemapClient   Output source maps for client build (default: false) (boolean | "inline" | "hidden")
    --sourcemapServer   Output source maps for server build (default: false) (boolean | "inline" | "hidden")
  \`dev\` Options:
    --clearScreen       Allow/disable clear screen when logging (boolean)
    --config, -c        Use specified config file (string)
    --cors              Enable CORS (boolean)
    --force             Force the optimizer to ignore the cache and re-bundle (boolean)
    --host              Specify hostname (string)
    --logLevel, -l      Info | warn | error | silent (string)
    --mode, -m          Set env mode (string)
    --open              Open browser on startup (boolean | string)
    --port              Specify port (number)
    --profile           Start built-in Node.js inspector
    --strictPort        Exit if specified port is already in use (boolean)
  \`routes\` Options:
    --config, -c        Use specified Vite config file (string)
    --json              Print the routes as JSON
  \`reveal\` Options:
    --config, -c        Use specified Vite config file (string)
    --no-typescript     Generate plain JavaScript files
  \`typegen\` Options:
    --watch             Automatically regenerate types whenever route config (\`routes.ts\`) or route modules change

  ${import_picocolors9.default.underline("Build your project")}:

    $ react-router build

  ${import_picocolors9.default.underline("Run your project locally in development")}:

    $ react-router dev

  ${import_picocolors9.default.underline("Show all routes in your app")}:

    $ react-router routes
    $ react-router routes my-app
    $ react-router routes --json
    $ react-router routes --config vite.react-router.config.ts

  ${import_picocolors9.default.underline("Reveal the used entry point")}:

    $ react-router reveal entry.client
    $ react-router reveal entry.server
    $ react-router reveal entry.client --no-typescript
    $ react-router reveal entry.server --no-typescript
    $ react-router reveal entry.server --config vite.react-router.config.ts

  ${import_picocolors9.default.underline("Generate types for route modules")}:

   $ react-router typegen
   $ react-router typegen --watch
`;
async function run2(argv = process.argv.slice(2)) {
  let versions = process.versions;
  let MINIMUM_NODE_VERSION = 20;
  if (versions && versions.node && import_semver.default.major(versions.node) < MINIMUM_NODE_VERSION) {
    console.warn(
      `\uFE0F\u26A0\uFE0F Oops, Node v${versions.node} detected. react-router requires a Node version greater than ${MINIMUM_NODE_VERSION}.`
    );
  }
  let isBooleanFlag = (arg2) => {
    let index = argv.indexOf(arg2);
    let nextArg = argv[index + 1];
    return !nextArg || nextArg.startsWith("-");
  };
  let args = (0, import_arg.default)(
    {
      "--force": Boolean,
      "--help": Boolean,
      "-h": "--help",
      "--json": Boolean,
      "--token": String,
      "--typescript": Boolean,
      "--no-typescript": Boolean,
      "--version": Boolean,
      "-v": "--version",
      "--port": Number,
      "-p": "--port",
      "--config": String,
      "-c": "--config",
      "--assetsInlineLimit": Number,
      "--clearScreen": Boolean,
      "--cors": Boolean,
      "--emptyOutDir": Boolean,
      "--host": isBooleanFlag("--host") ? Boolean : String,
      "--logLevel": String,
      "-l": "--logLevel",
      "--minify": String,
      "--mode": String,
      "-m": "--mode",
      "--open": isBooleanFlag("--open") ? Boolean : String,
      "--strictPort": Boolean,
      "--profile": Boolean,
      "--sourcemapClient": isBooleanFlag("--sourcemapClient") ? Boolean : String,
      "--sourcemapServer": isBooleanFlag("--sourcemapServer") ? Boolean : String,
      "--watch": Boolean
    },
    {
      argv
    }
  );
  let input = args._;
  let flags = Object.entries(args).reduce((acc, [key, value]) => {
    key = key.replace(/^--/, "");
    acc[key] = value;
    return acc;
  }, {});
  if (flags.help) {
    console.log(helpText);
    return;
  }
  if (flags.version) {
    let version = require("../../package.json").version;
    console.log(version);
    return;
  }
  flags.interactive = flags.interactive ?? require.main === module;
  if (args["--no-typescript"]) {
    flags.typescript = false;
  }
  let command = input[0];
  switch (command) {
    case "routes":
      await routes(input[1], flags);
      break;
    case "build":
      await build2(input[1], flags);
      break;
    case "reveal": {
      await generateEntry(input[1], input[2], flags);
      break;
    }
    case "dev":
      await dev2(input[1], flags);
      break;
    case "typegen":
      await typegen(input[1], flags);
      break;
    default:
      await dev2(input[0], flags);
  }
}

// cli/index.ts
run2().then(
  () => {
    process.exit(0);
  },
  (error) => {
    if (error) console.error(error);
    process.exit(1);
  }
);
