/**
 * @react-router/dev v8.3.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { c as setAppDirectory, l as validateRouteConfig, t as configRoutesToRouteManifest, u as invariant } from "./routes-BwOSW5AT.js";
import { createRequire } from "node:module";
import colors from "picocolors";
import fs from "node:fs";
import fs$1 from "node:fs/promises";
import { readPackageJSON, sortPackage, updatePackage } from "pkg-types";
import { execSync } from "node:child_process";
import * as Path from "pathe";
import path from "pathe";
import chokidar from "chokidar";
import pick from "lodash/pick.js";
import omit from "lodash/omit.js";
import cloneDeep from "lodash/cloneDeep.js";
import isEqual from "lodash/isEqual.js";
import ts from "dedent";
import * as Pathe from "pathe/utils";
import { parse as parse$1 } from "@babel/parser";
import * as t$1 from "@babel/types";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region config/is-react-router-repo.ts
const nodeRequire$2 = createRequire(import.meta.url);
function isReactRouterRepo() {
	let serverRuntimePath = path.dirname(nodeRequire$2.resolve("@react-router/node/package.json"));
	return path.basename(path.resolve(serverRuntimePath, "..")) === "packages";
}
//#endregion
//#region vite/vite.ts
const nodeRequire$1 = createRequire(import.meta.url);
let vite;
const viteImportSpecifier = isReactRouterRepo() ? `file:///${path.normalize(nodeRequire$1.resolve("vite/package.json", { paths: [process.cwd()] })).replace("package.json", "dist/node/index.js")}` : "vite";
async function preloadVite() {
	vite = await import(viteImportSpecifier);
}
function getVite() {
	invariant(vite, "getVite() called before preloadVite()");
	return vite;
}
function defineCompilerOptions(options) {
	let vite = getVite();
	return parseInt(vite.version.split(".")[0], 10) >= 8 ? { oxc: options.oxc } : { esbuild: options.esbuild };
}
function defineOptimizeDepsCompilerOptions(options) {
	let vite = getVite();
	return parseInt(vite.version.split(".")[0], 10) >= 8 ? { rolldownOptions: options.rolldown } : { esbuildOptions: options.esbuild };
}
/**
* Read the user-supplied build options from either `rollupOptions` (Vite <=7)
* or `rolldownOptions` (Vite >=8).
*/
function getUserBuildRollupOptions(environment) {
	if (environment?.build) {
		if ("rollupOptions" in environment.build) return environment.build.rollupOptions;
		if ("rolldownOptions" in environment.build) return environment.build.rolldownOptions;
	}
}
//#endregion
//#region vite/ssr-externals.ts
const ssrExternals = isReactRouterRepo() ? [
	"react-router",
	"@react-router/architect",
	"@react-router/cloudflare",
	"@react-router/dev",
	"@react-router/express",
	"@react-router/node",
	"@react-router/serve"
] : void 0;
//#endregion
//#region vite/vite-runner.ts
async function createContext$1({ root, mode, customLogger }) {
	await preloadVite();
	const vite = getVite();
	const devServer = await vite.createServer({
		root,
		mode,
		customLogger,
		server: {
			preTransformRequests: false,
			hmr: false,
			watch: null
		},
		ssr: { external: ssrExternals },
		optimizeDeps: { noDiscovery: true },
		css: { postcss: {} },
		configFile: false,
		envDir: false,
		plugins: [],
		environments: { __config_loader: {
			consumer: "server",
			dev: { createEnvironment: (name, config, context) => vite.createRunnableDevEnvironment(name, config) }
		} }
	});
	const environment = devServer.environments.__config_loader;
	if (!vite.isRunnableDevEnvironment(environment)) {
		await devServer.close();
		throw new Error("React Router config loading requires Vite's __config_loader environment to be runnable.");
	}
	return {
		devServer,
		environment,
		runner: environment.runner
	};
}
//#endregion
//#region cli/detectPackageManager.ts
/**
* Determine which package manager the user prefers.
*
* npm, pnpm, Yarn, Bun, and nub set the user agent environment variable
* that can be used to determine which package manager ran
* the command.
*/
const detectPackageManager = () => {
	let { npm_config_user_agent } = process.env;
	if (!npm_config_user_agent) return void 0;
	try {
		let pkgManager = npm_config_user_agent.split("/")[0];
		if (pkgManager === "npm") return "npm";
		if (pkgManager === "pnpm") return "pnpm";
		if (pkgManager === "yarn") return "yarn";
		if (pkgManager === "bun") return "bun";
		if (pkgManager === "nub") return "nub";
		return;
	} catch {
		return;
	}
};
//#endregion
//#region config/config.ts
const nodeRequire = createRequire(import.meta.url);
const excludedConfigPresetKeys = ["presets"];
const branchRouteProperties = [
	"id",
	"path",
	"file",
	"index"
];
const configRouteToBranchRoute = (configRoute) => pick(configRoute, branchRouteProperties);
let mergeReactRouterConfig = (...configs) => {
	let reducer = (configA, configB) => {
		let mergeRequired = (key) => configA[key] !== void 0 && configB[key] !== void 0;
		return {
			...configA,
			...configB,
			...mergeRequired("buildEnd") ? { buildEnd: async (...args) => {
				await Promise.all([configA.buildEnd?.(...args), configB.buildEnd?.(...args)]);
			} } : {},
			...mergeRequired("future") ? { future: {
				...configA.future,
				...configB.future
			} } : {},
			...mergeRequired("presets") ? { presets: [...configA.presets ?? [], ...configB.presets ?? []] } : {}
		};
	};
	return configs.reduce(reducer, {});
};
let deepFreeze = (o) => {
	Object.freeze(o);
	let oIsFunction = typeof o === "function";
	let hasOwnProp = Object.prototype.hasOwnProperty;
	Object.getOwnPropertyNames(o).forEach(function(prop) {
		if (hasOwnProp.call(o, prop) && (oIsFunction ? prop !== "caller" && prop !== "callee" && prop !== "arguments" : true) && o[prop] !== null && (typeof o[prop] === "object" || typeof o[prop] === "function") && !Object.isFrozen(o[prop])) deepFreeze(o[prop]);
	});
	return o;
};
function ok(value) {
	return {
		ok: true,
		value
	};
}
function err(error) {
	return {
		ok: false,
		error
	};
}
async function resolveConfig({ root, viteRunnerContext, reactRouterConfigFile, skipRoutes, validateConfig }) {
	let reactRouterUserConfig = {};
	if (reactRouterConfigFile) try {
		if (!fs.existsSync(reactRouterConfigFile)) return err(`${reactRouterConfigFile} no longer exists`);
		let configModule = await viteRunnerContext.runner.import(reactRouterConfigFile);
		if (configModule.default === void 0) return err(`${reactRouterConfigFile} must provide a default export`);
		if (typeof configModule.default !== "object") return err(`${reactRouterConfigFile} must export a config`);
		reactRouterUserConfig = configModule.default;
		if (validateConfig) {
			const error = validateConfig(reactRouterUserConfig);
			if (error) return err(error);
		}
	} catch (error) {
		return err(`Error loading ${reactRouterConfigFile}: ${error}`);
	}
	reactRouterUserConfig = deepFreeze(cloneDeep(reactRouterUserConfig));
	let presets = (await Promise.all((reactRouterUserConfig.presets ?? []).map(async (preset) => {
		if (!preset.name) throw new Error("React Router presets must have a `name` property defined.");
		if (!preset.reactRouterConfig) return null;
		return omit(await preset.reactRouterConfig({ reactRouterUserConfig }), excludedConfigPresetKeys);
	}))).filter(function isNotNull(value) {
		return value !== null;
	});
	let defaults = {
		basename: "/",
		buildDirectory: "build",
		serverBuildFile: "index.js",
		serverModuleFormat: "esm",
		ssr: true
	};
	let userAndPresetConfigs = mergeReactRouterConfig(...presets, reactRouterUserConfig);
	let { appDirectory: userAppDirectory, basename, buildDirectory: userBuildDirectory, buildEnd, prerender, routeDiscovery: userRouteDiscovery, serverBuildFile, serverBundles, serverModuleFormat, ssr } = {
		...defaults,
		...userAndPresetConfigs
	};
	if (!ssr && serverBundles) serverBundles = void 0;
	if (prerender) {
		let isValidPrerenderPathsConfig = (p) => typeof p === "boolean" || typeof p === "function" || Array.isArray(p);
		if (!(isValidPrerenderPathsConfig(prerender) || typeof prerender === "object" && "paths" in prerender && isValidPrerenderPathsConfig(prerender.paths))) return err("The `prerender`/`prerender.paths` config must be a boolean, an array of string paths, or a function returning a boolean or array of string paths.");
		if (typeof prerender === "object" && "unstable_concurrency" in prerender) return err("The `prerender.unstable_concurrency` config field has been stabilized as `prerender.concurrency`");
		if (!(typeof prerender != "object" || !("concurrency" in prerender) || typeof prerender.concurrency === "number" && Number.isInteger(prerender.concurrency) && prerender.concurrency > 0)) return err("The `prerender.concurrency` config must be a positive integer if specified.");
	}
	let routeDiscovery;
	if (userRouteDiscovery == null) if (ssr) routeDiscovery = {
		mode: "lazy",
		manifestPath: "/__manifest"
	};
	else routeDiscovery = { mode: "initial" };
	else if (userRouteDiscovery.mode === "initial") routeDiscovery = userRouteDiscovery;
	else if (userRouteDiscovery.mode === "lazy") {
		if (!ssr) return err("The `routeDiscovery.mode` config cannot be set to \"lazy\" when setting `ssr:false`");
		let { manifestPath } = userRouteDiscovery;
		if (manifestPath != null && !manifestPath.startsWith("/")) return err("The `routeDiscovery.manifestPath` config must be a root-relative pathname beginning with a slash (i.e., \"/__manifest\")");
		routeDiscovery = userRouteDiscovery;
	}
	let appDirectory = path.resolve(root, userAppDirectory || "app");
	let buildDirectory = path.resolve(root, userBuildDirectory);
	let rootRouteFile = findEntry(appDirectory, "root", { absolute: true });
	if (!rootRouteFile) return err(`Could not find a root route module in the app directory as "${path.relative(root, path.join(appDirectory, "root.tsx"))}"`);
	let routes;
	let routeConfig = [];
	if (skipRoutes) routes = {};
	else {
		let routeConfigFile = findEntry(appDirectory, "routes");
		try {
			if (!routeConfigFile) return err(`Route config file not found at "${path.relative(root, path.join(appDirectory, "routes.ts"))}".`);
			setAppDirectory(appDirectory);
			let routeConfigExport = (await viteRunnerContext.runner.import(path.join(appDirectory, routeConfigFile))).default;
			let result = validateRouteConfig({
				routeConfigFile,
				routeConfig: await routeConfigExport
			});
			if (!result.valid) return err(result.message);
			routeConfig = [{
				id: "root",
				path: "",
				file: path.relative(appDirectory, rootRouteFile),
				children: result.routeConfig
			}];
			routes = configRoutesToRouteManifest(appDirectory, routeConfig);
		} catch (error) {
			return err([
				colors.red(`Route config in "${routeConfigFile}" is invalid.`),
				"",
				error.loc?.file && error.loc?.column && error.frame ? [path.relative(appDirectory, error.loc.file) + ":" + error.loc.line + ":" + error.loc.column, error.frame.trim?.()] : error.stack
			].flat().join("\n"));
		}
	}
	let futureConfig = userAndPresetConfigs.future;
	if (futureConfig) {
		if ("unstable_splitRouteModules" in futureConfig || "v8_splitRouteModules" in futureConfig) return err("The `future.v8_splitRouteModules` flag has been moved to a top-level `config.splitRouteModules` field (default `true`)");
		if ("unstable_viteEnvironmentApi" in futureConfig || "v8_viteEnvironmentApi" in futureConfig) return err("The `future.v8_viteEnvironmentApi` flag has been removed because Vite Environment API usage is now always enabled");
		if ("unstable_passThroughRequests" in futureConfig || "v8_passThroughRequests" in futureConfig) return err("The `future.v8_passThroughRequests` flag has been removed because pass-through requests are now the default behavior");
		if ("unstable_middleware" in futureConfig || "v8_middleware" in futureConfig) return err("The `future.v8_middleware` flag has been removed because middleware is now always enabled");
		if ("unstable_trailingSlashAwareDataRequests" in futureConfig || "v8_trailingSlashAwareDataRequests" in futureConfig) return err("The `future.v8_trailingSlashAwareDataRequests` flag has been removed because trailing slash-aware data requests are now the default behavior");
		if ("unstable_subResourceIntegrity" in futureConfig) return err("The `future.unstable_subResourceIntegrity` flag has been stabilized and moved to a top-level `config.subResourceIntegrity` field");
	}
	let future = {
		unstable_enableNodeReadableStream: userAndPresetConfigs.future?.unstable_enableNodeReadableStream ?? false,
		unstable_optimizeDeps: userAndPresetConfigs.future?.unstable_optimizeDeps ?? false
	};
	let allowedActionOrigins = userAndPresetConfigs.allowedActionOrigins ?? false;
	let splitRouteModules = userAndPresetConfigs.splitRouteModules ?? true;
	let subResourceIntegrity = userAndPresetConfigs.subResourceIntegrity ?? false;
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
		splitRouteModules,
		subResourceIntegrity,
		allowedActionOrigins,
		unstable_routeConfig: routeConfig
	});
	for (let preset of reactRouterUserConfig.presets ?? []) await preset.reactRouterConfigResolved?.({ reactRouterConfig });
	return ok(reactRouterConfig);
}
async function createConfigLoader({ rootDirectory: root, watch, mode, skipRoutes, validateConfig }) {
	root = path.normalize(root ?? process.env.REACT_ROUTER_ROOT ?? process.cwd());
	let vite = await import("vite");
	let viteRunnerContext = await createContext$1({
		root,
		mode,
		customLogger: vite.createLogger("warn", { prefix: "[react-router]" })
	});
	let reactRouterConfigFile;
	let updateReactRouterConfigFile = () => {
		reactRouterConfigFile = findEntry(root, "react-router.config", { absolute: true });
	};
	updateReactRouterConfigFile();
	let getConfig = () => resolveConfig({
		root,
		viteRunnerContext,
		reactRouterConfigFile,
		skipRoutes,
		validateConfig
	});
	let appDirectory;
	let initialConfigResult = await resolveConfig({
		root,
		viteRunnerContext,
		reactRouterConfigFile,
		skipRoutes,
		validateConfig
	});
	if (!initialConfigResult.ok) throw new Error(initialConfigResult.error);
	appDirectory = path.normalize(initialConfigResult.value.appDirectory);
	let currentConfig = initialConfigResult.value;
	let fsWatcher;
	let changeHandlers = [];
	return {
		getConfig,
		onChange: (handler) => {
			if (!watch) throw new Error("onChange is not supported when watch mode is disabled");
			changeHandlers.push(handler);
			if (!fsWatcher) {
				fsWatcher = chokidar.watch([root, appDirectory], {
					ignoreInitial: true,
					ignored: (path) => isIgnoredByWatcher(path, {
						root,
						appDirectory
					})
				});
				fsWatcher.on("error", (error) => {
					let message = error instanceof Error ? error.message : String(error);
					console.warn(colors.yellow(`File watcher error: ${message}`));
				});
				fsWatcher.on("all", async (...args) => {
					let [event, rawFilepath] = args;
					let filepath = path.normalize(rawFilepath);
					let fileAddedOrRemoved = event === "add" || event === "unlink";
					let appFileAddedOrRemoved = fileAddedOrRemoved && filepath.startsWith(path.normalize(appDirectory));
					let rootRelativeFilepath = path.relative(root, filepath);
					let configFileAddedOrRemoved = fileAddedOrRemoved && isEntryFile("react-router.config", rootRelativeFilepath);
					if (configFileAddedOrRemoved) updateReactRouterConfigFile();
					if (!(configFileAddedOrRemoved || Boolean(viteRunnerContext.environment.moduleGraph.getModuleById(filepath))) && !appFileAddedOrRemoved) return;
					viteRunnerContext.environment.moduleGraph.invalidateAll();
					viteRunnerContext.runner.clearCache();
					let result = await getConfig();
					let prevAppDirectory = appDirectory;
					appDirectory = path.normalize((result.value ?? currentConfig).appDirectory);
					if (appDirectory !== prevAppDirectory) {
						fsWatcher.unwatch(prevAppDirectory);
						fsWatcher.add(appDirectory);
					}
					let configCodeChanged = configFileAddedOrRemoved || reactRouterConfigFile !== void 0 && isEntryFileDependency(viteRunnerContext.environment.moduleGraph, reactRouterConfigFile, filepath);
					let routeConfigFile = !skipRoutes ? findEntry(appDirectory, "routes", { absolute: true }) : void 0;
					let routeConfigCodeChanged = routeConfigFile !== void 0 && isEntryFileDependency(viteRunnerContext.environment.moduleGraph, routeConfigFile, filepath);
					let configChanged = result.ok && !isEqual(omitRoutes(currentConfig), omitRoutes(result.value));
					let routeConfigChanged = result.ok && !isEqual(currentConfig?.routes, result.value.routes);
					for (let handler of changeHandlers) handler({
						result,
						configCodeChanged,
						routeConfigCodeChanged,
						configChanged,
						routeConfigChanged,
						path: filepath,
						event
					});
					if (result.ok) currentConfig = result.value;
				});
			}
			return () => {
				changeHandlers = changeHandlers.filter((changeHandler) => changeHandler !== handler);
			};
		},
		close: async () => {
			changeHandlers = [];
			await viteRunnerContext.devServer.close();
			await fsWatcher?.close();
		}
	};
}
async function loadConfig({ rootDirectory, mode, skipRoutes }) {
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
async function resolveEntryFiles({ rootDirectory, reactRouterConfig }) {
	let { appDirectory } = reactRouterConfig;
	let defaultsDirectory = path.resolve(path.dirname(nodeRequire.resolve("@react-router/dev/package.json")), "dist", "config", "defaults");
	let userEntryClientFile = findEntry(appDirectory, "entry.client");
	let userEntryServerFile = findEntry(appDirectory, "entry.server");
	let entryServerFile;
	let entryClientFile = userEntryClientFile || "entry.client.tsx";
	if (userEntryServerFile) entryServerFile = userEntryServerFile;
	else {
		let packageJsonPath = findEntry(rootDirectory, "package", {
			extensions: [".json"],
			absolute: true,
			walkParents: true
		});
		if (!packageJsonPath) throw new Error(`Could not find package.json in ${rootDirectory} or any of its parent directories. Please add a package.json, or provide a custom entry.server.tsx/jsx file in your app directory.`);
		let packageJsonDirectory = path.dirname(packageJsonPath);
		let deps = (await readPackageJSON(packageJsonDirectory)).dependencies ?? {};
		if (!deps["isbot"]) {
			console.log("adding `isbot@5` to your package.json, you should commit this change");
			await updatePackage(packageJsonPath, (pkg) => {
				pkg.dependencies ??= {};
				pkg.dependencies.isbot = "^5";
				sortPackage(pkg);
			});
			execSync(`${detectPackageManager() ?? "npm"} install`, {
				cwd: packageJsonDirectory,
				stdio: "inherit"
			});
		}
		entryServerFile = hasNodeDependency(deps) && !reactRouterConfig.future.unstable_enableNodeReadableStream ? `entry.server.node.tsx` : `entry.server.web.tsx`;
	}
	return {
		entryClientFilePath: userEntryClientFile ? path.resolve(reactRouterConfig.appDirectory, userEntryClientFile) : path.resolve(defaultsDirectory, entryClientFile),
		entryServerFilePath: userEntryServerFile ? path.resolve(reactRouterConfig.appDirectory, userEntryServerFile) : path.resolve(defaultsDirectory, entryServerFile)
	};
}
async function resolveRSCEntryFiles({ reactRouterConfig }) {
	let { appDirectory } = reactRouterConfig;
	let defaultsDirectory = path.resolve(path.dirname(nodeRequire.resolve("@react-router/dev/package.json")), "dist", "config", "default-rsc-entries");
	let userEntryClientFile = findEntry(appDirectory, "entry.client", { absolute: true });
	let userEntryRSCFile = findEntry(appDirectory, "entry.rsc", { absolute: true });
	let userEntrySSRFile = findEntry(appDirectory, "entry.ssr", { absolute: true });
	return {
		client: userEntryClientFile ?? path.join(defaultsDirectory, "entry.client.tsx"),
		rsc: userEntryRSCFile ?? path.join(defaultsDirectory, "entry.rsc.tsx"),
		ssr: userEntrySSRFile ?? path.join(defaultsDirectory, "entry.ssr.tsx")
	};
}
function omitRoutes(config) {
	return {
		...config,
		routes: {}
	};
}
const entryExts = [
	".js",
	".jsx",
	".ts",
	".tsx",
	".mjs",
	".mts"
];
function hasNodeDependency(deps) {
	return !deps || Boolean(deps["@react-router/node"] || deps["@react-router/express"] || deps["@react-router/serve"]);
}
function isEntryFile(entryBasename, filename) {
	return entryExts.some((ext) => filename === `${entryBasename}${ext}`);
}
function findEntry(dir, basename, options) {
	let currentDir = path.resolve(dir);
	let { root } = path.parse(currentDir);
	while (true) {
		for (let ext of options?.extensions ?? entryExts) {
			let file = path.resolve(currentDir, basename + ext);
			if (fs.existsSync(file)) return options?.absolute ?? false ? file : path.relative(dir, file);
		}
		if (!options?.walkParents) return;
		let parentDir = path.dirname(currentDir);
		if (currentDir === root || parentDir === currentDir) return;
		currentDir = parentDir;
	}
}
function isEntryFileDependency(moduleGraph, entryFilepath, filepath, visited = /* @__PURE__ */ new Set()) {
	entryFilepath = path.normalize(entryFilepath);
	filepath = path.normalize(filepath);
	if (visited.has(filepath)) return false;
	visited.add(filepath);
	if (filepath === entryFilepath) return true;
	let mod = moduleGraph.getModuleById(filepath);
	if (!mod) return false;
	for (let importer of mod.importers) {
		if (!importer.id) continue;
		if (importer.id === entryFilepath || isEntryFileDependency(moduleGraph, entryFilepath, importer.id, visited)) return true;
	}
	return false;
}
function isIgnoredByWatcher(path$1, { root, appDirectory }) {
	let dirname = path.dirname(path$1);
	if (!dirname.startsWith(appDirectory) && path$1 !== root && dirname !== root) return true;
	try {
		let stat = fs.statSync(path$1, { throwIfNoEntry: false });
		if (stat && !stat.isFile() && !stat.isDirectory()) return true;
	} catch {
		return true;
	}
	return false;
}
//#endregion
//#region typegen/context.ts
async function createContext({ rootDirectory, watch, mode, rsc }) {
	const configLoader = await createConfigLoader({
		rootDirectory,
		mode,
		watch
	});
	const configResult = await configLoader.getConfig();
	if (!configResult.ok) throw new Error(configResult.error);
	return {
		configLoader,
		rootDirectory,
		config: configResult.value,
		rsc
	};
}
//#endregion
//#region vite/babel.ts
var babel_exports = /* @__PURE__ */ __exportAll({
	generate: () => generate,
	parse: () => parse$1,
	t: () => t$1,
	traverse: () => traverse,
	unwrapDefault: () => unwrapDefault
});
function unwrapDefault(value) {
	return value.default ?? value;
}
const traverse = unwrapDefault(_traverse);
const generate = unwrapDefault(_generate);
//#endregion
//#region typegen/params.ts
function parse(fullpath) {
	const result = {};
	let segments = fullpath.split("/");
	segments.forEach((segment) => {
		const match = segment.match(/^:([\w-]+)(\?)?/);
		if (!match) return;
		const param = match[1];
		const isRequired = match[2] === void 0;
		result[param] ||= isRequired;
	});
	if (segments.at(-1) === "*") result["*"] = true;
	return result;
}
//#endregion
//#region typegen/route.ts
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
function fullpath(lineage) {
	const route = lineage.at(-1);
	if (lineage.length === 1 && route?.id === "root") return "/";
	if (route && route.index !== true && route.path === void 0) return void 0;
	return "/" + lineage.map((route) => route.path?.replace(/^\//, "")?.replace(/\/$/, "")).filter((path) => path !== void 0 && path !== "").join("/");
}
//#endregion
//#region typegen/generate.ts
function typesDirectory(ctx) {
	return Path.join(ctx.rootDirectory, ".react-router/types");
}
function generateServerBuild(ctx) {
	return {
		filename: Path.join(typesDirectory(ctx), "+server-build.d.ts"),
		content: ts`
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
  `
	};
}
const { t } = babel_exports;
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
		const lineage$1 = lineage(ctx.config.routes, route);
		lineages.set(route.id, lineage$1);
		const fullpath$1 = fullpath(lineage$1);
		if (!fullpath$1) continue;
		const pages = expand(fullpath$1);
		pages.forEach((page) => allPages.add(page));
		lineage$1.forEach(({ id }) => {
			let routePages = routeToPages.get(id);
			if (!routePages) {
				routePages = /* @__PURE__ */ new Set();
				routeToPages.set(id, routePages);
			}
			pages.forEach((page) => routePages.add(page));
		});
	}
	return [{
		filename: Path.join(typesDirectory(ctx), "+routes.ts"),
		content: ts`
        // Generated by React Router

        import "react-router"

        declare module "react-router" {
          interface Register {
            pages: Pages
            routeFiles: RouteFiles
            routeModules: RouteModules
          }
        }
      ` + "\n\n" + generate(pagesType(allPages)).code + "\n\n" + generate(routeFilesType({
			fileToRoutes,
			routeToPages
		})).code + "\n\n" + generate(routeModulesType(ctx)).code
	}, ...Array.from(fileToRoutes.entries()).filter(([file]) => isInAppDirectory(ctx, file)).map(([file, routeIds]) => getRouteAnnotations({
		ctx,
		file,
		routeIds,
		lineages
	}))];
}
function pagesType(pages) {
	return t.tsTypeAliasDeclaration(t.identifier("Pages"), null, t.tsTypeLiteral(Array.from(pages).map((page) => {
		return t.tsPropertySignature(t.stringLiteral(page), t.tsTypeAnnotation(t.tsTypeLiteral([t.tsPropertySignature(t.identifier("params"), t.tsTypeAnnotation(paramsType(page)))])));
	})));
}
function routeFilesType({ fileToRoutes, routeToPages }) {
	return t.tsTypeAliasDeclaration(t.identifier("RouteFiles"), null, t.tsTypeLiteral(Array.from(fileToRoutes).map(([file, routeIds]) => t.tsPropertySignature(t.stringLiteral(file), t.tsTypeAnnotation(t.tsUnionType(Array.from(routeIds).map((routeId) => {
		const pages = routeToPages.get(routeId) ?? /* @__PURE__ */ new Set();
		return t.tsTypeLiteral([t.tsPropertySignature(t.identifier("id"), t.tsTypeAnnotation(t.tsLiteralType(t.stringLiteral(routeId)))), t.tsPropertySignature(t.identifier("page"), t.tsTypeAnnotation(pages.size > 0 ? t.tsUnionType(Array.from(pages).map((page) => t.tsLiteralType(t.stringLiteral(page)))) : t.tsNeverKeyword()))]);
	})))))));
}
function routeModulesType(ctx) {
	return t.tsTypeAliasDeclaration(t.identifier("RouteModules"), null, t.tsTypeLiteral(Object.values(ctx.config.routes).map((route) => t.tsPropertySignature(t.stringLiteral(route.id), t.tsTypeAnnotation(isInAppDirectory(ctx, route.file) ? t.tsTypeQuery(t.tsImportType(t.stringLiteral(`./${Path.relative(ctx.rootDirectory, ctx.config.appDirectory)}/${route.file}`))) : t.tsUnknownKeyword())))));
}
function isInAppDirectory(ctx, routeFile) {
	return Path.resolve(ctx.config.appDirectory, routeFile).startsWith(ctx.config.appDirectory);
}
function getRouteAnnotations({ ctx, file, routeIds, lineages }) {
	const filename = Path.join(typesDirectory(ctx), Path.relative(ctx.rootDirectory, ctx.config.appDirectory), Path.dirname(file), "+types", Pathe.filename(file) + ".ts");
	const matchesType = t.tsTypeAliasDeclaration(t.identifier("Matches"), null, t.tsUnionType(Array.from(routeIds).map((routeId) => {
		const lineage = lineages.get(routeId);
		return t.tsTupleType(lineage.map((route) => t.tsTypeLiteral([t.tsPropertySignature(t.identifier("id"), t.tsTypeAnnotation(t.tsLiteralType(t.stringLiteral(route.id)))), t.tsPropertySignature(t.identifier("module"), t.tsTypeAnnotation(t.tsTypeQuery(t.tsImportType(t.stringLiteral(relativeImportSource(rootDirsPath(ctx, filename), Path.resolve(ctx.config.appDirectory, route.file)))))))])));
	})));
	return {
		filename,
		content: ts`
      // Generated by React Router

      import type { GetInfo, GetAnnotations } from "react-router/internal";

      type Module = typeof import("${relativeImportSource(rootDirsPath(ctx, filename), Path.resolve(ctx.config.appDirectory, file))}")

      type Info = GetInfo<{
        file: "${file}",
        module: Module
      }>
    ` + "\n\n" + generate(matchesType).code + "\n\n" + ts`
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
    `
	};
}
function relativeImportSource(from, to) {
	let path = Path.relative(Path.dirname(from), to);
	let extension = Path.extname(path);
	path = Path.join(Path.dirname(path), Path.basename(path, extension));
	if (!path.startsWith("../")) path = "./" + path;
	if (!extension || /\.(js|ts)x?$/.test(extension)) extension = ".js";
	return path + extension;
}
function rootDirsPath(ctx, typesPath) {
	const rel = Path.relative(typesDirectory(ctx), typesPath);
	return Path.join(ctx.rootDirectory, rel);
}
function paramsType(path) {
	const params = parse(path);
	return t.tsTypeLiteral(Object.entries(params).map(([param, isRequired]) => {
		const property = t.tsPropertySignature(t.stringLiteral(param), t.tsTypeAnnotation(t.tsStringKeyword()));
		property.optional = !isRequired;
		return property;
	}));
}
function expand(fullpath) {
	function recurse(segments, index) {
		if (index === segments.length) return [""];
		const segment = segments[index];
		const isOptional = segment.endsWith("?");
		const isDynamic = segment.startsWith(":");
		const required = segment.replace(/\?$/, "");
		const keep = !isOptional || isDynamic;
		const kept = isDynamic ? segment : required;
		const withoutSegment = recurse(segments, index + 1);
		const withSegment = withoutSegment.map((rest) => [kept, rest].join("/"));
		if (keep) return withSegment;
		return [...withoutSegment, ...withSegment];
	}
	const segments = fullpath.split("/");
	const expanded = /* @__PURE__ */ new Set();
	for (let result of recurse(segments, 0)) {
		if (result !== "/") result = result.replace(/\/$/, "");
		expanded.add(result);
	}
	return expanded;
}
//#endregion
//#region typegen/index.ts
const { green, red } = colors;
async function clearRouteModuleAnnotations(ctx) {
	await fs$1.rm(Path.join(typesDirectory(ctx), Path.basename(ctx.config.appDirectory)), {
		recursive: true,
		force: true
	});
}
async function write(...files) {
	return Promise.all(files.map(async ({ filename, content }) => {
		await fs$1.mkdir(Path.dirname(filename), { recursive: true });
		await fs$1.writeFile(filename, content);
	}));
}
async function run(rootDirectory, { mode, rsc }) {
	const ctx = await createContext({
		rootDirectory,
		mode,
		rsc,
		watch: false
	});
	await fs$1.rm(typesDirectory(ctx), {
		recursive: true,
		force: true
	});
	await write(generateServerBuild(ctx), ...generateRoutes(ctx));
}
async function watch(rootDirectory, { mode, logger, rsc }) {
	const ctx = await createContext({
		rootDirectory,
		mode,
		rsc,
		watch: true
	});
	await fs$1.rm(typesDirectory(ctx), {
		recursive: true,
		force: true
	});
	await write(generateServerBuild(ctx), ...generateRoutes(ctx));
	logger?.info(green("generated types"), {
		timestamp: true,
		clear: true
	});
	ctx.configLoader.onChange(async ({ result, routeConfigChanged }) => {
		if (!result.ok) {
			logger?.error(red(result.error), {
				timestamp: true,
				clear: true
			});
			return;
		}
		ctx.config = result.value;
		if (routeConfigChanged) {
			await clearRouteModuleAnnotations(ctx);
			await write(...generateRoutes(ctx));
			logger?.info(green("regenerated types"), {
				timestamp: true,
				clear: true
			});
		}
	});
	return { close: async () => await ctx.configLoader.close() };
}
//#endregion
export { getVite as _, t$1 as a, createConfigLoader as c, resolveEntryFiles as d, resolveRSCEntryFiles as f, getUserBuildRollupOptions as g, defineOptimizeDepsCompilerOptions as h, parse$1 as i, hasNodeDependency as l, defineCompilerOptions as m, watch as n, traverse as o, ssrExternals as p, generate as r, configRouteToBranchRoute as s, run as t, loadConfig as u, preloadVite as v };
