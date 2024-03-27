import path from "node:path";

import type { RemixConfig } from "../config";
import { readConfig } from "../config";

const remixRoot = path.join(__dirname, "fixtures", "stack");

describe("readConfig", () => {
  let config: RemixConfig;
  beforeEach(async () => {
    config = await readConfig(remixRoot);
  });

  it("generates a config", async () => {
    expect(config).toMatchInlineSnapshot(
      {
        rootDirectory: expect.any(String),
        appDirectory: expect.any(String),
        cacheDirectory: expect.any(String),
        serverBuildPath: expect.any(String),
        assetsBuildDirectory: expect.any(String),
        relativeAssetsBuildDirectory: expect.any(String),
        entryClientFilePath: expect.any(String),
        entryServerFilePath: expect.any(String),
        tsconfigPath: expect.any(String),
      },
      `
      {
        "appDirectory": Any<String>,
        "assetsBuildDirectory": Any<String>,
        "browserNodeBuiltinsPolyfill": undefined,
        "cacheDirectory": Any<String>,
        "dev": {},
        "entryClientFile": "entry.client.tsx",
        "entryClientFilePath": Any<String>,
        "entryServerFile": "entry.server.tsx",
        "entryServerFilePath": Any<String>,
        "future": {
          "unstable_singleFetch": false,
          "v3_fetcherPersist": false,
          "v3_relativeSplatPath": false,
          "v3_throwAbortReason": false,
        },
        "mdx": undefined,
        "postcss": true,
        "publicPath": "/build/",
        "relativeAssetsBuildDirectory": Any<String>,
        "rootDirectory": Any<String>,
        "routes": {
          "root": {
            "file": "root.tsx",
            "id": "root",
            "path": "",
          },
        },
        "serverBuildPath": Any<String>,
        "serverBuildTargetEntryModule": "export * from "@remix-run/dev/server-build";",
        "serverConditions": undefined,
        "serverDependenciesToBundle": [],
        "serverEntryPoint": undefined,
        "serverMainFields": [
          "module",
          "main",
        ],
        "serverMinify": false,
        "serverMode": "production",
        "serverModuleFormat": "esm",
        "serverNodeBuiltinsPolyfill": undefined,
        "serverPlatform": "node",
        "tailwind": true,
        "tsconfigPath": Any<String>,
        "watchPaths": [],
      }
    `
    );
  });
});
