#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";
import type { ServerBuild } from "react-router";
import { createRequestHandler } from "@react-router/express";
import { createRequestListener } from "@mjackson/node-fetch-server";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import sourceMapSupport from "source-map-support";
import getPort from "get-port";

process.env.NODE_ENV = process.env.NODE_ENV ?? "production";

sourceMapSupport.install({
  retrieveSourceMap: function (source) {
    let match = source.startsWith("file://");
    if (match) {
      let filePath = url.fileURLToPath(source);
      let sourceMapPath = `${filePath}.map`;
      if (fs.existsSync(sourceMapPath)) {
        return {
          url: source,
          map: fs.readFileSync(sourceMapPath, "utf8"),
        };
      }
    }
    return null;
  },
});

run();

type RSCServerBuild = {
  fetch: (request: Request) => Response;
  publicPath: string;
  assetsBuildDirectory: string;
};

function isRSCServerBuild(
  build: ServerBuild | RSCServerBuild,
): build is RSCServerBuild {
  return "fetch" in build && typeof build.fetch === "function";
}

function parseNumber(raw?: string) {
  if (raw === undefined) return undefined;
  let maybe = Number(raw);
  if (Number.isNaN(maybe)) return undefined;
  return maybe;
}

async function run() {
  let port = parseNumber(process.env.PORT) ?? (await getPort({ port: 3000 }));

  let buildPathArg = process.argv[2];

  if (!buildPathArg) {
    console.error(`
  Usage: react-router-serve <server-build-path> - e.g. react-router-serve build/server/index.js`);
    process.exit(1);
  }

  let buildPath = path.resolve(buildPathArg);

  let buildModule = await import(url.pathToFileURL(buildPath).href);
  let build: ServerBuild | RSCServerBuild;

  if (buildModule.default && typeof buildModule.default === "function") {
    const config = {
      publicPath: "/",
      assetsBuildDirectory: "../client",
      ...(buildModule.unstable_reactRouterServeConfig || {}),
    };
    build = {
      fetch: buildModule.default,
      publicPath: config.publicPath,
      assetsBuildDirectory: path.resolve(
        path.dirname(buildPath),
        config.assetsBuildDirectory,
      ),
    } satisfies RSCServerBuild;
  } else {
    build = buildModule as ServerBuild;
  }

  let onListen = () => {
    let address =
      process.env.HOST ||
      Object.values(os.networkInterfaces())
        .flat()
        .find((ip) => String(ip?.family).includes("4") && !ip?.internal)
        ?.address;

    if (!address) {
      console.log(`[react-router-serve] http://localhost:${port}`);
    } else {
      console.log(
        `[react-router-serve] http://localhost:${port} (http://${address}:${port})`,
      );
    }
  };

  let app = express();
  app.disable("x-powered-by");
  app.use(
    path.posix.join(build.publicPath, "assets"),
    compression(),
    express.static(path.join(build.assetsBuildDirectory, "assets"), {
      immutable: true,
      maxAge: "1y",
    }),
  );
  app.use(
    build.publicPath,
    compression(),
    express.static(build.assetsBuildDirectory),
  );
  app.use(compression(), express.static("public", { maxAge: "1h" }));
  app.use(morgan("tiny"));

  if (isRSCServerBuild(build)) {
    app.all("*", createRequestListener(build.fetch));
  } else {
    app.all(
      "*",
      compression(),
      createRequestHandler({
        build,
        mode: process.env.NODE_ENV,
      }),
    );
  }

  let server = process.env.HOST
    ? app.listen(port, process.env.HOST, onListen)
    : app.listen(port, onListen);

  ["SIGTERM", "SIGINT"].forEach((signal) => {
    process.once(signal, () => server?.close(console.error));
  });
}
