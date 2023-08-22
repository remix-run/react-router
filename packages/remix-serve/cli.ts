import "@remix-run/node/install";
import path from "node:path";
import os from "node:os";
import url from "node:url";
import {
  type ServerBuild,
  broadcastDevReady,
  installGlobals,
} from "@remix-run/node";
import { createRequestHandler } from "@remix-run/express";
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

  let buildPath = url.pathToFileURL(
    path.resolve(process.cwd(), buildPathArg)
  ).href;

  let build: ServerBuild = await import(buildPath);

  let onListen = () => {
    let address =
      process.env.HOST ||
      Object.values(os.networkInterfaces())
        .flat()
        .find((ip) => String(ip?.family).includes("4") && !ip?.internal)
        ?.address;

    if (!address) {
      console.log(`Remix App Server started at http://localhost:${port}`);
    } else {
      console.log(
        `Remix App Server started at http://localhost:${port} (http://${address}:${port})`
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

  let requestHandler: ReturnType<typeof createRequestHandler> | undefined;
  app.all("*", async (req, res, next) => {
    try {
      if (!requestHandler) {
        let build = await import(buildPath);
        requestHandler = createRequestHandler({
          build,
          mode: process.env.NODE_ENV,
        });
      }

      return await requestHandler(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  let server = process.env.HOST
    ? app.listen(port, process.env.HOST, onListen)
    : app.listen(port, onListen);

  ["SIGTERM", "SIGINT"].forEach((signal) => {
    process.once(signal, () => server?.close(console.error));
  });
}
