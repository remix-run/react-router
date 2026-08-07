#!/usr/bin/env node
/**
 * @react-router/serve v8.3.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import url from "node:url";
import { createRequestHandler } from "@react-router/express";
import { createRequestListener } from "@remix-run/node-fetch-server";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import sourceMapSupport from "source-map-support";
//#region cli.ts
process.env.NODE_ENV = process.env.NODE_ENV ?? "production";
sourceMapSupport.install({ retrieveSourceMap: function(source) {
	if (source.startsWith("file://")) {
		let sourceMapPath = `${url.fileURLToPath(source)}.map`;
		if (fs.existsSync(sourceMapPath)) return {
			url: source,
			map: fs.readFileSync(sourceMapPath, "utf8")
		};
	}
	return null;
} });
run();
function isRSCServerBuild(build) {
	return Boolean(typeof build === "object" && build && "default" in build && typeof build.default === "object" && build.default && "fetch" in build.default && typeof build.default.fetch === "function");
}
function parseNumber(raw) {
	if (raw === void 0) return void 0;
	let maybe = Number(raw);
	if (Number.isNaN(maybe)) return void 0;
	return maybe;
}
async function getAvailablePort(preferredPort, host) {
	let availablePort = await checkPort(preferredPort, host) ?? await checkPort(0, host);
	if (availablePort === void 0) throw new Error("No available port found");
	return availablePort;
}
function checkPort(port, host) {
	return new Promise((resolve, reject) => {
		let server = net.createServer();
		let listenOptions = host ? {
			port,
			host
		} : { port };
		server.unref();
		server.once("error", (error) => {
			if (error.code === "EADDRINUSE" || error.code === "EACCES") resolve(void 0);
			else reject(error);
		});
		server.listen(listenOptions, () => {
			let address = server.address();
			let availablePort = typeof address === "object" && address ? address.port : port;
			server.close((error) => {
				if (error) reject(error);
				else resolve(availablePort);
			});
		});
	});
}
function getExpressPath(publicPath) {
	let pathname;
	try {
		pathname = new URL(publicPath).pathname;
	} catch {
		pathname = publicPath;
	}
	return pathname.startsWith("/") ? pathname : `/${pathname}`;
}
async function run() {
	let port = parseNumber(process.env.PORT) ?? await getAvailablePort(3e3, process.env.HOST);
	let buildPathArg = process.argv[2];
	if (!buildPathArg) {
		console.error(`
  Usage: react-router-serve <server-build-path> - e.g. react-router-serve build/server/index.js`);
		process.exit(1);
	}
	let buildPath = path.resolve(buildPathArg);
	let buildModule = await import(url.pathToFileURL(buildPath).href);
	let build;
	let isRSCBuild = false;
	if (isRSCBuild = isRSCServerBuild(buildModule)) {
		const config = {
			publicPath: "/",
			assetsBuildDirectory: path.join("..", "client"),
			...buildModule.unstable_reactRouterServeConfig || {}
		};
		build = {
			fetch: buildModule.default.fetch,
			publicPath: config.publicPath,
			assetsBuildDirectory: path.resolve(path.dirname(buildPath), config.assetsBuildDirectory)
		};
	} else build = buildModule;
	let onListen = (error) => {
		if (error) throw error;
		let address = process.env.HOST || Object.values(os.networkInterfaces()).flat().find((ip) => String(ip?.family).includes("4") && !ip?.internal)?.address;
		if (!address) console.log(`[react-router-serve] http://localhost:${port}`);
		else console.log(`[react-router-serve] http://localhost:${port} (http://${address}:${port})`);
	};
	let app = express();
	app.disable("x-powered-by");
	if (!isRSCBuild) app.use(compression());
	let expressPublicPath = getExpressPath(build.publicPath);
	app.use(path.posix.join(expressPublicPath, "assets"), express.static(path.join(build.assetsBuildDirectory, "assets"), {
		immutable: true,
		maxAge: "1y"
	}));
	app.use(expressPublicPath, express.static(build.assetsBuildDirectory));
	app.use(express.static("public", { maxAge: "1h" }));
	app.use(morgan("tiny"));
	if (build.fetch) app.all("/{*splat}", createRequestListener(build.fetch));
	else app.all("/{*splat}", createRequestHandler({
		build: buildModule,
		mode: process.env.NODE_ENV
	}));
	let server = process.env.HOST ? app.listen(port, process.env.HOST, onListen) : app.listen(port, onListen);
	["SIGTERM", "SIGINT"].forEach((signal) => {
		process.once(signal, () => server?.close(console.error));
	});
}
//#endregion
export {};
