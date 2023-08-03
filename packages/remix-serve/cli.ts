import "./env";
import path from "path";
import os from "os";
import { broadcastDevReady, installGlobals } from "@remix-run/node";
import sourceMapSupport from "source-map-support";

import { createApp } from "./index";

sourceMapSupport.install();
installGlobals();

let port = process.env.PORT ? Number(process.env.PORT) : 3000;
if (Number.isNaN(port)) port = 3000;

let buildPathArg = process.argv[2];

if (!buildPathArg) {
  console.error(`
  Usage: remix-serve <build-dir>`);
  process.exit(1);
}

let buildPath = path.resolve(process.cwd(), buildPathArg);
let build = require(buildPath);

let onListen = () => {
  let address =
    process.env.HOST ||
    Object.values(os.networkInterfaces())
      .flat()
      .find((ip) => String(ip?.family).includes("4") && !ip?.internal)?.address;

  if (!address) {
    console.log(`Remix App Server started at http://localhost:${port}`);
  } else {
    console.log(
      `Remix App Server started at http://localhost:${port} (http://${address}:${port})`
    );
  }
  if (
    build.future?.v2_dev !== false &&
    process.env.NODE_ENV === "development"
  ) {
    broadcastDevReady(build);
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
