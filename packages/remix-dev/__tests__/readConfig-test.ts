import path from "path";

import type { RemixConfig } from "../config";
import { readConfig } from "../config";

const remixRoot = path.resolve(__dirname, "../../../fixtures/gists-app");

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
        serverBuildDirectory: expect.any(String),
        assetsBuildDirectory: expect.any(String)
      },
      `
      Object {
        "appDirectory": Any<String>,
        "assetsBuildDirectory": Any<String>,
        "cacheDirectory": Any<String>,
        "devServerPort": 8002,
        "entryClientFile": "entry.client.js",
        "entryServerFile": "entry.server.js",
        "mdx": undefined,
        "publicPath": "/build/",
        "rootDirectory": Any<String>,
        "routes": Object {
          "pages/one": Object {
            "caseSensitive": false,
            "file": "pages/one.mdx",
            "id": "pages/one",
            "parentId": "root",
            "path": "/page/one",
          },
          "pages/two": Object {
            "caseSensitive": false,
            "file": "pages/two.mdx",
            "id": "pages/two",
            "parentId": "root",
            "path": "/page/two",
          },
          "root": Object {
            "file": "root.js",
            "id": "root",
            "path": "/",
          },
          "routes/404": Object {
            "caseSensitive": false,
            "file": "routes/404.js",
            "id": "routes/404",
            "parentId": "root",
            "path": "*",
          },
          "routes/empty": Object {
            "caseSensitive": false,
            "file": "routes/empty.js",
            "id": "routes/empty",
            "parentId": "root",
            "path": "empty",
          },
          "routes/gists": Object {
            "caseSensitive": false,
            "file": "routes/gists.js",
            "id": "routes/gists",
            "parentId": "root",
            "path": "gists",
          },
          "routes/gists.mine": Object {
            "caseSensitive": false,
            "file": "routes/gists.mine.js",
            "id": "routes/gists.mine",
            "parentId": "root",
            "path": "gists/mine",
          },
          "routes/gists/$username": Object {
            "caseSensitive": false,
            "file": "routes/gists/$username.js",
            "id": "routes/gists/$username",
            "parentId": "routes/gists",
            "path": ":username",
          },
          "routes/gists/index": Object {
            "caseSensitive": false,
            "file": "routes/gists/index.js",
            "id": "routes/gists/index",
            "parentId": "routes/gists",
            "path": "/",
          },
          "routes/index": Object {
            "caseSensitive": false,
            "file": "routes/index.js",
            "id": "routes/index",
            "parentId": "root",
            "path": "/",
          },
          "routes/links": Object {
            "caseSensitive": false,
            "file": "routes/links.tsx",
            "id": "routes/links",
            "parentId": "root",
            "path": "links",
          },
          "routes/loader-errors": Object {
            "caseSensitive": false,
            "file": "routes/loader-errors.js",
            "id": "routes/loader-errors",
            "parentId": "root",
            "path": "loader-errors",
          },
          "routes/loader-errors/nested": Object {
            "caseSensitive": false,
            "file": "routes/loader-errors/nested.js",
            "id": "routes/loader-errors/nested",
            "parentId": "routes/loader-errors",
            "path": "nested",
          },
          "routes/methods": Object {
            "caseSensitive": false,
            "file": "routes/methods.tsx",
            "id": "routes/methods",
            "parentId": "root",
            "path": "methods",
          },
          "routes/page/four": Object {
            "caseSensitive": false,
            "file": "routes/page/four.mdx",
            "id": "routes/page/four",
            "parentId": "root",
            "path": "page/four",
          },
          "routes/page/three": Object {
            "caseSensitive": false,
            "file": "routes/page/three.md",
            "id": "routes/page/three",
            "parentId": "root",
            "path": "page/three",
          },
          "routes/prefs": Object {
            "caseSensitive": false,
            "file": "routes/prefs.tsx",
            "id": "routes/prefs",
            "parentId": "root",
            "path": "prefs",
          },
          "routes/render-errors": Object {
            "caseSensitive": false,
            "file": "routes/render-errors.js",
            "id": "routes/render-errors",
            "parentId": "root",
            "path": "render-errors",
          },
          "routes/render-errors/nested": Object {
            "caseSensitive": false,
            "file": "routes/render-errors/nested.js",
            "id": "routes/render-errors/nested",
            "parentId": "routes/render-errors",
            "path": "nested",
          },
        },
        "serverBuildDirectory": Any<String>,
        "serverMode": "production",
      }
    `
    );
  });
});
