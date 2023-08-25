import "@remix-run/node/install";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";
import {
  type ServerBuild,
  broadcastDevReady,
  installGlobals,
} from "@remix-run/node";
import { type RequestHandler, createRequestHandler } from "@remix-run/express";
import chokidar from "chokidar";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import sourceMapSupport from "source-map-support";

process.env.NODE_ENV = process.env.NODE_ENV ?? "production";

sourceMapSupport.install();
installGlobals();

run();

async function run() {
  let port = process.env.PORT ? Number(process.env.PORT) : 3000;
  if (Number.isNaN(port)) port = 3000;

  let buildPathArg = process.argv[2];

  if (!buildPathArg) {
    console.error(`
  Usage: remix-serve <build-dir>`);
    process.exit(1);
  }

  let buildPath = path.resolve(buildPathArg);

  async function reimportServer() {
    let stat = fs.statSync(buildPath);

    // use a timestamp query parameter to bust the import cache
    return import(url.pathToFileURL(buildPath).href + "?t=" + stat.mtimeMs);
  }

  function createDevRequestHandler(initialBuild: ServerBuild): RequestHandler {
    let build = initialBuild;
    async function handleServerUpdate() {
      // 1. re-import the server build
      build = await reimportServer();
      // 2. tell Remix that this app server is now up-to-date and ready
      broadcastDevReady(build);
    }

    chokidar
      .watch(buildPath, { ignoreInitial: true })
      .on("add", handleServerUpdate)
      .on("change", handleServerUpdate);

    // wrap request handler to make sure its recreated with the latest build for every request
    return async (req, res, next) => {
      try {
        return createRequestHandler({
          build,
          mode: "development",
        })(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }

  let build: ServerBuild = await reimportServer();

  let onListen = () => {
    let address =
      process.env.HOST ||
      Object.values(os.networkInterfaces())
        .flat()
        .find((ip) => String(ip?.family).includes("4") && !ip?.internal)
        ?.address;

    if (!address) {
      console.log(`[remix-serve] http://localhost:${port}`);
    } else {
      console.log(
        `[remix-serve] http://localhost:${port} (http://${address}:${port})`
      );
    }
    if (process.env.NODE_ENV === "development") {
      void broadcastDevReady(build);
    }
  };

  let app = express();
  app.disable("x-powered-by");
  app.use(compression());
  app.use(
    build.publicPath,
    express.static(build.assetsBuildDirectory, {
      immutable: true,
      maxAge: "1y",
    })
  );
  app.use(express.static("public", { maxAge: "1h" }));
  app.use(morgan("tiny"));

  app.all(
    "*",
    process.env.NODE_ENV === "development"
      ? createDevRequestHandler(build)
      : createRequestHandler({
          build,
          mode: process.env.NODE_ENV,
        })
  );

  let server = process.env.HOST
    ? app.listen(port, process.env.HOST, onListen)
    : app.listen(port, onListen);

  ["SIGTERM", "SIGINT"].forEach((signal) => {
    process.once(signal, () => server?.close(console.error));
  });
}
