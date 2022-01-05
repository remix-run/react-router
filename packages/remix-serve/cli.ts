import "./env";
import path from "path";
import os from "os";

import { createApp } from "./index";

let port = process.env.PORT || 3000;
let buildPathArg = process.argv[2];

if (!buildPathArg) {
  console.error(`
  Usage: remix-serve <build-dir>`);
  process.exit(1);
}

let buildPath = path.resolve(process.cwd(), buildPathArg);

createApp(buildPath).listen(port, () => {
  let address = Object.values(os.networkInterfaces())
    .flat()
    .find(ip => ip?.family == "IPv4" && !ip.internal)?.address;

  if (!address) {
    throw new Error("Could not find an IPv4 address.");
  }

  console.log(`Remix App Server started at http://${address}:${port}`);
});
