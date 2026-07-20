#!/usr/bin/env node
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import url from "node:url";
import type { ServerBuild } from "react-router";
import { createRequestHandler } from "@react-router/express";
import { createRequestListener } from "@remix-run/node-fetch-server";
import compression from "compression";
import express from "express";
import type { RequestHandler as ExpressRequestHandler } from "express";
import morgan from "morgan";
import sourceMapSupport from "source-map-support";

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

type RSCServerBuildModule = {
  default: {
    fetch: (request: Request) => Response | Promise<Response>;
  };
  unstable_reactRouterServeConfig?: {
    publicPath: string;
    assetsBuildDirectory: string;
  };
};

type NormalizedBuild = {
  fetch?: (request: Request) => Response | Promise<Response>;
  publicPath: string;
  assetsBuildDirectory: string;
};

function isRSCServerBuild(build: unknown): build is RSCServerBuildModule {
  return Boolean(
    typeof build === "object" &&
    build &&
    "default" in build &&
    typeof build.default === "object" &&
    build.default &&
    "fetch" in build.default &&
    typeof build.default.fetch === "function",
  );
}

function parseNumber(raw?: string) {
  if (raw === undefined) return undefined;
  let maybe = Number(raw);
  if (Number.isNaN(maybe)) return undefined;
  return maybe;
}

async function getAvailablePort(
  preferredPort: number,
  host?: string,
): Promise<number> {
  let preferredAvailablePort = await checkPort(preferredPort, host);
  let availablePort = preferredAvailablePort ?? (await checkPort(0, host));

  if (availablePort === undefined) {
    throw new Error("No available port found");
  }

  return availablePort;
}

function checkPort(port: number, host?: string): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    let server = net.createServer();
    let listenOptions = host ? { port, host } : { port };

    server.unref();

    server.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE" || error.code === "EACCES") {
        resolve(undefined);
      } else {
        reject(error);
      }
    });

    server.listen(listenOptions, () => {
      let address = server.address();
      let availablePort =
        typeof address === "object" && address ? address.port : port;

      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve(availablePort);
        }
      });
    });
  });
}

function getExpressPath(publicPath: string) {
  // Vite allows `base` to be an absolute URL, but Express route paths must be
  // pathnames. Strip any origin before mounting static asset middleware.
  let pathname: string;

  try {
    pathname = new URL(publicPath).pathname;
  } catch {
    pathname = publicPath;
  }

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

async function run() {
  let port =
    parseNumber(process.env.PORT) ??
    (await getAvailablePort(3000, process.env.HOST));

  let buildPathArg = process.argv[2];

  if (!buildPathArg) {
    console.error(`
  Usage: react-router-serve <server-build-path> - e.g. react-router-serve build/server/index.js`);
    process.exit(1);
  }

  let buildPath = path.resolve(buildPathArg);

  let buildModule = await import(url.pathToFileURL(buildPath).href);
  let build: NormalizedBuild;
  let isRSCBuild = false;

  if ((isRSCBuild = isRSCServerBuild(buildModule))) {
    const config = {
      publicPath: "/",
      assetsBuildDirectory: path.join("..", "client"),
      ...(buildModule.unstable_reactRouterServeConfig || {}),
    };
    build = {
      fetch: buildModule.default.fetch,
      publicPath: config.publicPath,
      assetsBuildDirectory: path.resolve(
        path.dirname(buildPath),
        config.assetsBuildDirectory,
      ),
    } satisfies NormalizedBuild;
  } else {
    build = buildModule as ServerBuild;
  }

  let onListen = (error: unknown) => {
    if (error) {
      throw error;
    }
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

  if (!isRSCBuild) {
    // `compression` may resolve to Express 4 types from transitive deps while
    // `react-router-serve` uses Express 5, but the runtime middleware signature
    // is compatible.
    app.use(compression() as unknown as ExpressRequestHandler);
  }

  let expressPublicPath = getExpressPath(build.publicPath);

  app.use(
    path.posix.join(expressPublicPath, "assets"),
    express.static(path.join(build.assetsBuildDirectory, "assets"), {
      immutable: true,
      maxAge: "1y",
    }),
  );
  app.use(expressPublicPath, express.static(build.assetsBuildDirectory));
  app.use(express.static("public", { maxAge: "1h" }));
  app.use(morgan("tiny"));

  if (build.fetch) {
    app.all("/{*splat}", createRequestListener(build.fetch));
  } else {
    app.all(
      "/{*splat}",
      createRequestHandler({
        build: buildModule,
        mode: process.env.NODE_ENV,
      }) as unknown as ExpressRequestHandler,
    );
  }

  let server = process.env.HOST
    ? app.listen(port, process.env.HOST, onListen)
    : app.listen(port, onListen);

  ["SIGTERM", "SIGINT"].forEach((signal) => {
    process.once(signal, () => server?.close(console.error));
  });
}
