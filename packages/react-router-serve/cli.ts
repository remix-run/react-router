#!/usr/bin/env node
import fs from "node:fs";
import type net from "node:net";
import os from "node:os";
import path from "node:path";
import url from "node:url";
import type { ServerBuild } from "react-router";
import { createRequestHandler } from "@react-router/express";
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

  let build: ServerBuild = await import(url.pathToFileURL(buildPath).href);

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
        `[react-router-serve] http://localhost:${port} (http://${address}:${port})`
      );
    }
  };

  let onFdListen = (server: net.Server, fd: number) => {
    const address = server.address();
    if (typeof address === "string") {
      console.log(`[react-router-serve] http://${address} (from fd ${fd})`);
    } else if (!address) {
      console.log(
        `[react-router-serve] listening on unknown address (from fd ${fd})`
      );
    } else if (address.family === "IPv4") {
      console.log(
        `[react-router-serve] http://${address.address}:${address.port} (from fd ${fd})`
      );
    } else {
      console.log(
        `[react-router-serve] http://[${address.address}]:${address.port} (from fd ${fd})`
      );
    }
  };

  let app = express();
  app.disable("x-powered-by");
  app.use(compression());
  app.use(
    path.posix.join(build.publicPath, "assets"),
    express.static(path.join(build.assetsBuildDirectory, "assets"), {
      immutable: true,
      maxAge: "1y",
    })
  );
  app.use(build.publicPath, express.static(build.assetsBuildDirectory));
  app.use(express.static("public", { maxAge: "1h" }));
  app.use(morgan("tiny"));

  app.all(
    "*",
    createRequestHandler({
      build,
      mode: process.env.NODE_ENV,
    })
  );

  let listenFds = getListenFds();
  let servers = [];
  if (!listenFds) {
    servers = [
      process.env.HOST
        ? app.listen(port, process.env.HOST, onListen)
        : app.listen(port, onListen),
    ];
  } else {
    servers = listenFds.map((fd) => {
      let server: net.Server | undefined;
      server = app.listen({ fd }, () => onFdListen(server!, fd));
      return server;
    });
  }

  ["SIGTERM", "SIGINT"].forEach((signal) => {
    process.once(signal, () =>
      servers.forEach((server) => server.close(console.error))
    );
  });
}

function getListenFds() {
  if (parseNumber(process.env.LISTEN_PID) === process.pid) {
    const listenFdsCount = parseNumber(process.env.LISTEN_FDS);
    if (!listenFdsCount || listenFdsCount < 1) {
      console.error(
        "Expected LISTEN_FDS to be a number bigger than zero, got: %s",
        process.env.LISTEN_FDS
      );
      process.exit(1);
    }
    // i + 3 to skip fds for stdin/out/err
    return Array.from({ length: listenFdsCount }, (v, i) => i + 3);
  }
}
