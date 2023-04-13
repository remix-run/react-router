import getPort, { makeRange } from "get-port";
import type { Server } from "http";
import os from "os";

import { loadEnv } from "../devServer_unstable/env";
import { liveReload } from "./liveReload";
import type { RemixConfig } from "../config";

function purgeAppRequireCache(buildPath: string) {
  for (let key in require.cache) {
    if (key.startsWith(buildPath)) {
      delete require.cache[key];
    }
  }
}

function tryImport(packageName: string) {
  try {
    return require(packageName);
  } catch {
    throw new Error(
      `Could not locate ${packageName}. Verify that you have it installed to use the dev command.`
    );
  }
}

export async function serve(config: RemixConfig, portPreference?: number) {
  if (config.serverEntryPoint) {
    throw new Error("remix dev is not supported for custom servers.");
  }

  let { createApp } = tryImport(
    "@remix-run/serve"
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  ) as typeof import("@remix-run/serve");
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  let express = tryImport("express") as typeof import("express");

  await loadEnv(config.rootDirectory);

  let port = await getPort({
    port: portPreference
      ? Number(portPreference)
      : process.env.PORT
      ? Number(process.env.PORT)
      : makeRange(3000, 3100),
  });

  let app = express();
  app.disable("x-powered-by");
  app.use((_, __, next) => {
    purgeAppRequireCache(config.serverBuildPath);
    next();
  });
  app.use(
    createApp(
      config.serverBuildPath,
      "development",
      config.publicPath,
      config.assetsBuildDirectory
    )
  );

  let dispose = await liveReload(config);
  let server: Server | undefined;
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
  };
  try {
    server = process.env.HOST
      ? app.listen(port, process.env.HOST, onListen)
      : app.listen(port, onListen);
  } catch {
    dispose();
    server?.close();
  }
}
