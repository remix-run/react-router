import path from "path";

import type { RemixConfig } from "../config";
import { readConfig } from "../config";

const remixRoot = path.resolve(__dirname, "./fixtures/stack");

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
      },
      `
      Object {
        "appDirectory": Any<String>,
        "assetsBuildDirectory": Any<String>,
        "cacheDirectory": Any<String>,
        "devServerBroadcastDelay": 0,
        "devServerPort": 8002,
        "entryClientFile": "entry.client.tsx",
        "entryServerFile": "entry.server.tsx",
        "mdx": undefined,
        "publicPath": "/build/",
        "rootDirectory": Any<String>,
        "routes": Object {
          "root": Object {
            "file": "root.tsx",
            "id": "root",
            "path": "",
          },
        },
        "serverBuildPath": Any<String>,
        "serverBuildTarget": undefined,
        "serverBuildTargetEntryModule": "export * from \\"@remix-run/dev/server-build\\";",
        "serverDependenciesToBundle": Array [],
        "serverEntryPoint": undefined,
        "serverMode": "production",
        "serverModuleFormat": "cjs",
        "serverPlatform": "node",
      }
    `
    );
  });
});
