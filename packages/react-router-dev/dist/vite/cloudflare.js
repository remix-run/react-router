/**
 * @react-router/dev v7.14.1
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

// vite/cloudflare.ts
var cloudflare_exports = {};
__export(cloudflare_exports, {
  cloudflareDevProxy: () => cloudflareDevProxyVitePlugin
});
module.exports = __toCommonJS(cloudflare_exports);

// vite/cloudflare-dev-proxy.ts
var import_react_router = require("react-router");

// invariant.ts
function invariant(value, message) {
  if (value === false || value === null || typeof value === "undefined") {
    console.error(
      "The following error is a bug in React Router; please open an issue! https://github.com/remix-run/react-router/issues/new/choose"
    );
    throw new Error(message);
  }
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

// vite/vite.ts
var import_pathe2 = __toESM(require("pathe"));

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

// config/config.ts
var import_node_fs = __toESM(require("fs"));
var import_node_child_process = require("child_process");

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
          ([path3, message]) => `Path: routes.${path3}
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

// config/config.ts
var excludedConfigPresetKeys = ["presets"];
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
    basename,
    buildDirectory: userBuildDirectory,
    buildEnd,
    prerender,
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
  if (prerender) {
    let isValidPrerenderPathsConfig = (p) => typeof p === "boolean" || typeof p === "function" || Array.isArray(p);
    let isValidPrerenderConfig = isValidPrerenderPathsConfig(prerender) || typeof prerender === "object" && "paths" in prerender && isValidPrerenderPathsConfig(prerender.paths);
    if (!isValidPrerenderConfig) {
      return err(
        "The `prerender`/`prerender.paths` config must be a boolean, an array of string paths, or a function returning a boolean or array of string paths."
      );
    }
    let isValidConcurrencyConfig = typeof prerender != "object" || !("unstable_concurrency" in prerender) || typeof prerender.unstable_concurrency === "number" && Number.isInteger(prerender.unstable_concurrency) && prerender.unstable_concurrency > 0;
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
  watch,
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
      if (!watch) {
        throw new Error(
          "onChange is not supported when watch mode is disabled"
        );
      }
      changeHandlers.push(handler);
      if (!fsWatcher) {
        fsWatcher = import_chokidar.default.watch([root, appDirectory], {
          ignoreInitial: true,
          ignored: (path3) => isIgnoredByWatcher(path3, { root, appDirectory })
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
var entryExts = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".mts"];
function isEntryFile(entryBasename, filename) {
  return entryExts.some((ext) => filename === `${entryBasename}${ext}`);
}
function findEntry(dir, basename, options) {
  let currentDir = import_pathe3.default.resolve(dir);
  let { root } = import_pathe3.default.parse(currentDir);
  while (true) {
    for (let ext of options?.extensions ?? entryExts) {
      let file = import_pathe3.default.resolve(currentDir, basename + ext);
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
function isIgnoredByWatcher(path3, { root, appDirectory }) {
  let dirname = import_pathe3.default.dirname(path3);
  let ignoredByPath = !dirname.startsWith(appDirectory) && // Ensure we're only watching files outside of the app directory
  // that are at the root level, not nested in subdirectories
  path3 !== root && // Watch the root directory itself
  dirname !== root;
  if (ignoredByPath) {
    return true;
  }
  try {
    let stat = import_node_fs.default.statSync(path3, { throwIfNoEntry: false });
    if (stat && !stat.isFile() && !stat.isDirectory()) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

// vite/cloudflare-dev-proxy.ts
var serverBuildId = "virtual:react-router/server-build";
function importWrangler() {
  try {
    return import("wrangler");
  } catch (_) {
    throw Error("Could not import `wrangler`. Do you have it installed?");
  }
}
var PLUGIN_NAME = "react-router-cloudflare-vite-dev-proxy";
var cloudflareDevProxyVitePlugin = (options = {}) => {
  let { getLoadContext, ...restOptions } = options;
  const workerdConditions = ["workerd", "worker"];
  let future;
  return {
    name: PLUGIN_NAME,
    config: async (config, configEnv) => {
      await preloadVite();
      const externalConditions = ["node"];
      let configResult = await loadConfig({
        rootDirectory: config.root ?? process.cwd(),
        mode: configEnv.mode
      });
      if (!configResult.ok) {
        throw new Error(configResult.error);
      }
      future = configResult.value.future;
      return {
        ssr: {
          resolve: {
            externalConditions: [...workerdConditions, ...externalConditions]
          }
        }
      };
    },
    configEnvironment: async (name, options2) => {
      if (!future.v8_viteEnvironmentApi) {
        return;
      }
      if (name !== "client") {
        options2.resolve = options2.resolve ?? {};
        options2.resolve.externalConditions = [
          ...workerdConditions,
          ...options2.resolve?.externalConditions ?? []
        ];
      }
    },
    configResolved: (viteConfig) => {
      let pluginIndex = (name) => viteConfig.plugins.findIndex((plugin) => plugin.name === name);
      let reactRouterPluginIndex = pluginIndex("react-router");
      if (reactRouterPluginIndex >= 0 && reactRouterPluginIndex < pluginIndex(PLUGIN_NAME)) {
        throw new Error(
          `The "${PLUGIN_NAME}" plugin should be placed before the React Router plugin in your Vite config file`
        );
      }
    },
    configureServer: async (viteDevServer) => {
      const { sendResponse } = await import("@remix-run/node-fetch-server");
      let context;
      let getContext = async () => {
        let { getPlatformProxy } = await importWrangler();
        let { dispose, ...cloudflare } = await getPlatformProxy(
          restOptions
        );
        return { cloudflare };
      };
      return () => {
        if (!viteDevServer.config.server.middlewareMode) {
          viteDevServer.middlewares.use(async (nodeReq, nodeRes, next) => {
            try {
              let build = await viteDevServer.ssrLoadModule(
                serverBuildId
              );
              let handler = (0, import_react_router.createRequestHandler)(build, "development");
              let req = await fromNodeRequest(nodeReq, nodeRes);
              context ??= await getContext();
              let loadContext = getLoadContext ? await getLoadContext({ request: req, context }) : context;
              let res = await handler(req, loadContext);
              await sendResponse(nodeRes, res);
            } catch (error) {
              next(error);
            }
          });
        }
      };
    }
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cloudflareDevProxy
});
