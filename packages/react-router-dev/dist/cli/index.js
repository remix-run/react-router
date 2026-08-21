#!/usr/bin/env node
/**
 * @react-router/dev v8.2.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { _ as getVite, l as hasNodeDependency, n as watch, t as run$1, u as loadConfig, v as preloadVite } from "../typegen-CNpfI4aI.js";
import { createRequire } from "node:module";
import { parseArgs } from "node:util";
import semver from "semver";
import colors from "picocolors";
import fs, { existsSync } from "node:fs";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import * as path$1 from "node:path";
import path from "node:path";
import exitHook from "exit-hook";
import { readPackageJSON } from "pkg-types";
import "react-router";
import developmentConditionEnabled from "#development-condition-enabled";
import { spawn } from "node:child_process";
import * as babel from "@babel/core";
import babelPluginSyntaxJSX from "@babel/plugin-syntax-jsx";
import babelPresetTypeScript from "@babel/preset-typescript";
import prettier from "prettier";
import process$1 from "node:process";
import packageJson from "@react-router/dev/package.json" with { type: "json" };
//#region config/format.ts
function formatRoutes(routeManifest, format) {
	switch (format) {
		case "json": return formatRoutesAsJson(routeManifest);
		case "jsx": return formatRoutesAsJsx(routeManifest);
	}
}
function formatRoutesAsJson(routeManifest) {
	function handleRoutesRecursive(parentId) {
		let routes = Object.values(routeManifest).filter((route) => route.parentId === parentId);
		let children = [];
		for (let route of routes) children.push({
			id: route.id,
			index: route.index,
			path: route.path,
			caseSensitive: route.caseSensitive,
			file: route.file,
			children: handleRoutesRecursive(route.id)
		});
		if (children.length > 0) return children;
	}
	return JSON.stringify(handleRoutesRecursive() || null, null, 2);
}
function formatRoutesAsJsx(routeManifest) {
	let output = "<Routes>";
	function handleRoutesRecursive(parentId, level = 1) {
		let routes = Object.values(routeManifest).filter((route) => route.parentId === parentId);
		let indent = Array(level * 2).fill(" ").join("");
		for (let route of routes) {
			output += "\n" + indent;
			output += `<Route${route.path ? ` path=${JSON.stringify(route.path)}` : ""}${route.index ? " index" : ""}${route.file ? ` file=${JSON.stringify(route.file)}` : ""}>`;
			if (handleRoutesRecursive(route.id, level + 1)) {
				output += "\n" + indent;
				output += "</Route>";
			} else output = output.slice(0, -1) + " />";
		}
		return routes.length > 0;
	}
	handleRoutesRecursive();
	output += "\n</Routes>";
	return output;
}
//#endregion
//#region cli/useJavascript.ts
async function transpile(tsx, options = {}) {
	let mjs = babel.transformSync(tsx, {
		compact: false,
		cwd: options.cwd,
		filename: options.filename,
		plugins: [babelPluginSyntaxJSX],
		presets: [[babelPresetTypeScript, { jsx: "preserve" }]],
		retainLines: true
	});
	if (!mjs || !mjs.code) throw new Error("Could not parse TypeScript");
	/**
	* Babel's `compact` and `retainLines` options are both bad at formatting code.
	* Use Prettier for nicer formatting.
	*/
	return await prettier.format(mjs.code, { parser: "babel" });
}
//#endregion
//#region vite/profiler.ts
const getSession = () => global.__reactRouter_profile_session;
const start = async (callback) => {
	let inspector = await import("node:inspector").then((r) => r.default);
	let session = global.__reactRouter_profile_session = new inspector.Session();
	session.connect();
	session.post("Profiler.enable", () => {
		session.post("Profiler.start", callback);
	});
};
let profileCount = 0;
const stop = (log) => {
	let session = getSession();
	if (!session) return;
	return new Promise((res, rej) => {
		session.post("Profiler.stop", (err, { profile }) => {
			if (err) return rej(err);
			let outPath = path.resolve(`./react-router-${profileCount++}.cpuprofile`);
			fs.writeFileSync(outPath, JSON.stringify(profile));
			log(colors.yellow(`CPU profile written to ${colors.white(colors.dim(outPath))}`));
			global.__reactRouter_profile_session = void 0;
			res();
		});
	});
};
//#endregion
//#region vite/has-rsc-plugin.ts
async function hasReactRouterRscPlugin({ root, viteBuildOptions: { config, logLevel, mode } }) {
	await preloadVite();
	return (await getVite().resolveConfig({
		configFile: config,
		logLevel,
		mode: mode ?? "production",
		root
	}, "build", "production", "production")).plugins.some((plugin) => plugin?.name === "react-router/rsc");
}
//#endregion
//#region restart-with-conditions.ts
/**
* Restarts the current Node process, appending new flags to the
* existing NODE_OPTIONS. SIGINT/SIGTERM are always forwarded to the child.
*/
function restartWithMergedOptions(nodeOptions) {
	if (process$1.env.REACT_ROUTER_DEV_RESTARTED === "true") throw new Error("restartWithMergedOptions() was called, but the process has already been restarted. This is likely a bug in @react-router/dev.");
	const mergedOptions = [process$1.env.NODE_OPTIONS, nodeOptions].filter(Boolean).join(" ").trim();
	console.log(`[restart] Relaunching with NODE_OPTIONS: ${mergedOptions}`);
	const [cmd, ...args] = process$1.argv;
	const child = spawn(cmd, args, {
		env: {
			...process$1.env,
			NODE_OPTIONS: mergedOptions,
			REACT_ROUTER_DEV_RESTARTED: "true"
		},
		stdio: "inherit"
	});
	let signalHandlers = ["SIGINT", "SIGTERM"].map((sig) => {
		let handler = () => {
			child.kill(sig);
		};
		process$1.on(sig, handler);
		return [sig, handler];
	});
	child.on("exit", (code, signal) => {
		for (let [sig, handler] of signalHandlers) process$1.off(sig, handler);
		if (signal) process$1.kill(process$1.pid, signal);
		else process$1.exit(code ?? 0);
	});
	child.on("error", (err) => {
		console.error("[restart] Failed to spawn child process:", err);
		process$1.exit(1);
	});
}
//#endregion
//#region cli/commands.ts
const nodeRequire = createRequire(import.meta.url);
async function routes(rootDirectory, flags = {}) {
	rootDirectory = resolveRootDirectory(rootDirectory, flags);
	let configResult = await loadConfig({
		rootDirectory,
		mode: flags.mode ?? "production"
	});
	if (!configResult.ok) {
		console.error(colors.red(configResult.error));
		process.exit(1);
	}
	let format = flags.json ? "json" : "jsx";
	console.log(formatRoutes(configResult.value.routes, format));
}
async function build(root, options = {}) {
	root = resolveRootDirectory(root, options);
	let { build } = await import("../build-r3D94V53.js");
	if (options.profile) await start();
	try {
		await build(root, options);
	} finally {
		await stop(console.info);
	}
}
async function dev(root, options = {}) {
	if (developmentConditionEnabled) {
		let { dev } = await import("../dev-BfZiothP.js");
		if (options.profile) await start();
		exitHook(() => stop(console.info));
		root = resolveRootDirectory(root, options);
		await dev(root, options);
	} else restartWithMergedOptions("--conditions=development");
	await new Promise(() => {});
}
let clientEntries = [
	"entry.client.tsx",
	"entry.client.js",
	"entry.client.jsx"
];
let serverEntries = [
	"entry.server.tsx",
	"entry.server.js",
	"entry.server.jsx"
];
let entries = ["entry.client", "entry.server"];
let rscEntries = [
	"entry.client",
	"entry.rsc",
	"entry.ssr"
];
let conjunctionListFormat = new Intl.ListFormat("en", {
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
		console.error(colors.red(configResult.error));
		return;
	}
	let appDirectory = configResult.value.appDirectory;
	if (!entriesToUse.includes(entry)) {
		let entriesArray = Array.from(entriesToUse);
		let list = conjunctionListFormat.format(entriesArray);
		console.error(colors.red(`Invalid entry file. Valid entry files are ${list}`));
		return;
	}
	let defaultsDirectory = path$1.resolve(path$1.dirname(nodeRequire.resolve("@react-router/dev/package.json")), "dist", "config", configDir);
	let outputFile;
	if (isRsc) {
		let defaultEntry = path$1.resolve(defaultsDirectory, `${entry}.tsx`);
		outputFile = path$1.resolve(appDirectory, `${entry}.tsx`);
		if (existsSync(outputFile)) {
			let relative = path$1.relative(rootDirectory, outputFile);
			console.error(colors.red(`Entry file ${relative} already exists.`));
			return;
		}
		await copyFile(defaultEntry, outputFile);
	} else {
		let pkgJson = await readPackageJSON(rootDirectory);
		let defaultEntryClient = path$1.resolve(defaultsDirectory, "entry.client.tsx");
		let defaultEntryServer = path$1.resolve(defaultsDirectory, hasNodeDependency(pkgJson.dependencies) && !configResult.value.future.unstable_enableNodeReadableStream ? `entry.server.node.tsx` : `entry.server.web.tsx`);
		let isServerEntry = entry === "entry.server";
		let contents = isServerEntry ? await createServerEntry(rootDirectory, appDirectory, defaultEntryServer) : await createClientEntry(rootDirectory, appDirectory, defaultEntryClient);
		let useTypeScript = flags.typescript ?? true;
		let outputEntry = `${entry}.${useTypeScript ? "tsx" : "jsx"}`;
		outputFile = path$1.resolve(appDirectory, outputEntry);
		if (!useTypeScript) {
			let javascript = await transpile(contents, {
				cwd: rootDirectory,
				filename: isServerEntry ? defaultEntryServer : defaultEntryClient
			});
			await writeFile(outputFile, javascript, "utf-8");
		} else await writeFile(outputFile, contents, "utf-8");
	}
	console.log(colors.blue(`Entry file ${entry} created at ${path$1.relative(rootDirectory, outputFile)}.`));
}
function resolveRootDirectory(root, flags) {
	if (root) return path$1.resolve(root);
	return process.env.REACT_ROUTER_ROOT || (flags?.config ? path$1.dirname(path$1.resolve(flags.config)) : process.cwd());
}
async function checkForEntry(rootDirectory, appDirectory, entries) {
	for (let entry of entries) {
		let entryPath = path$1.resolve(appDirectory, entry);
		if (existsSync(entryPath)) {
			let relative = path$1.relative(rootDirectory, entryPath);
			console.error(colors.red(`Entry file ${relative} already exists.`));
			return process.exit(1);
		}
	}
}
async function createServerEntry(rootDirectory, appDirectory, inputFile) {
	await checkForEntry(rootDirectory, appDirectory, serverEntries);
	return await readFile(inputFile, "utf-8");
}
async function createClientEntry(rootDirectory, appDirectory, inputFile) {
	await checkForEntry(rootDirectory, appDirectory, clientEntries);
	return await readFile(inputFile, "utf-8");
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
		const logger = getVite().createLogger("info", { prefix: "[react-router]" });
		await watch(root, {
			mode: flags.mode ?? "development",
			rsc,
			logger
		});
		await new Promise(() => {});
		return;
	}
	await run$1(root, {
		mode: flags.mode ?? "production",
		rsc
	});
}
//#endregion
//#region cli/run.ts
const helpText = `
${colors.blueBright("react-router")}

  ${colors.underline("Usage")}:
    $ react-router build [${colors.yellowBright("projectDir")}]
    $ react-router dev [${colors.yellowBright("projectDir")}]
    $ react-router routes [${colors.yellowBright("projectDir")}]

  ${colors.underline("Options")}:
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

  ${colors.underline("Build your project")}:

    $ react-router build

  ${colors.underline("Run your project locally in development")}:

    $ react-router dev

  ${colors.underline("Show all routes in your app")}:

    $ react-router routes
    $ react-router routes my-app
    $ react-router routes --json
    $ react-router routes --config vite.react-router.config.ts

  ${colors.underline("Reveal the used entry point")}:

    $ react-router reveal entry.client
    $ react-router reveal entry.server
    $ react-router reveal entry.client --no-typescript
    $ react-router reveal entry.server --no-typescript
    $ react-router reveal entry.server --config vite.react-router.config.ts

  ${colors.underline("Generate types for route modules")}:

   $ react-router typegen
   $ react-router typegen --watch
`;
function getBooleanArg(value) {
	return typeof value === "boolean" ? value : void 0;
}
function getBooleanStringArg(value) {
	return typeof value === "boolean" || typeof value === "string" ? value : void 0;
}
function getNumberArg(value) {
	return typeof value === "string" ? Number(value) : void 0;
}
function getStringArg(value) {
	return typeof value === "string" ? value : void 0;
}
/**
* Programmatic interface for running the react-router CLI with the given command line
* arguments.
*/
async function run(argv = process.argv.slice(2), { isMain = false } = {}) {
	let versions = process.versions;
	let MINIMUM_NODE_VERSION = "22.22.0";
	if (versions && versions.node && semver.lt(versions.node, MINIMUM_NODE_VERSION)) console.warn(`️⚠️ Oops, Node v${versions.node} detected. react-router requires a Node version greater than ${MINIMUM_NODE_VERSION}.`);
	let isBooleanFlag = (arg) => {
		let nextArg = argv[argv.indexOf(arg) + 1];
		return !nextArg || nextArg.startsWith("-");
	};
	let { values, positionals } = parseArgs({
		args: argv,
		allowPositionals: true,
		options: {
			assetsInlineLimit: { type: "string" },
			clearScreen: { type: "boolean" },
			config: {
				type: "string",
				short: "c"
			},
			cors: { type: "boolean" },
			emptyOutDir: { type: "boolean" },
			force: { type: "boolean" },
			help: {
				type: "boolean",
				short: "h"
			},
			host: { type: isBooleanFlag("--host") ? "boolean" : "string" },
			json: { type: "boolean" },
			logLevel: {
				type: "string",
				short: "l"
			},
			minify: { type: "string" },
			mode: {
				type: "string",
				short: "m"
			},
			"no-typescript": { type: "boolean" },
			open: { type: isBooleanFlag("--open") ? "boolean" : "string" },
			port: {
				type: "string",
				short: "p"
			},
			profile: { type: "boolean" },
			sourcemapClient: { type: isBooleanFlag("--sourcemapClient") ? "boolean" : "string" },
			sourcemapServer: { type: isBooleanFlag("--sourcemapServer") ? "boolean" : "string" },
			strictPort: { type: "boolean" },
			token: { type: "string" },
			typescript: { type: "boolean" },
			version: {
				type: "boolean",
				short: "v"
			},
			watch: { type: "boolean" }
		}
	});
	let input = positionals;
	let flags = {
		assetsInlineLimit: getNumberArg(values.assetsInlineLimit),
		clearScreen: getBooleanArg(values.clearScreen),
		config: getStringArg(values.config),
		cors: getBooleanArg(values.cors),
		emptyOutDir: getBooleanArg(values.emptyOutDir),
		force: getBooleanArg(values.force),
		help: getBooleanArg(values.help),
		host: getBooleanStringArg(values.host),
		json: getBooleanArg(values.json),
		logLevel: getStringArg(values.logLevel),
		minify: getStringArg(values.minify),
		mode: getStringArg(values.mode),
		open: getBooleanStringArg(values.open),
		port: getNumberArg(values.port),
		profile: getBooleanArg(values.profile),
		sourcemapClient: getBooleanStringArg(values.sourcemapClient),
		sourcemapServer: getBooleanStringArg(values.sourcemapServer),
		strictPort: getBooleanArg(values.strictPort),
		token: getStringArg(values.token),
		typescript: getBooleanArg(values.typescript),
		version: getBooleanArg(values.version),
		watch: getBooleanArg(values.watch)
	};
	if (flags.help) {
		console.log(helpText);
		return;
	}
	if (flags.version) {
		console.log(packageJson.version);
		return;
	}
	flags.interactive = flags.interactive ?? isMain;
	if (values["no-typescript"]) flags.typescript = false;
	switch (input[0]) {
		case "routes":
			await routes(input[1], flags);
			break;
		case "build":
			await build(input[1], flags);
			break;
		case "reveal":
			await generateEntry(input[1], input[2], flags);
			break;
		case "dev":
			await dev(input[1], flags);
			break;
		case "typegen":
			await typegen(input[1], flags);
			break;
		default: await dev(input[0], flags);
	}
}
//#endregion
//#region cli/index.ts
run(void 0, { isMain: true }).then(() => {
	process.exit(0);
}, (error) => {
	if (error) console.error(error);
	process.exit(1);
});
//#endregion
export { start as n, stop as r, getSession as t };
