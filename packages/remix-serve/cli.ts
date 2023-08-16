import "./env";
import path from "node:path";
import os from "node:os";
import url from "node:url";
import { broadcastDevReady, installGlobals } from "@remix-run/node";
import sourceMapSupport from "source-map-support";

import { createApp } from "./index";

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

  let build = await import(buildPath);

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

  let app = createApp(
    buildPath,
    process.env.NODE_ENV,
    build.publicPath,
    build.assetsBuildDirectory
  );
  let server = process.env.HOST
    ? app.listen(port, process.env.HOST, onListen)
    : app.listen(port, onListen);

  ["SIGTERM", "SIGINT"].forEach((signal) => {
    process.once(signal, () => server?.close(console.error));
  });
}
