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
        "devServerBroadcastDelay": 0,
        "devServerPort": 8002,
        "entryClientFile": "entry.client.jsx",
        "entryServerFile": "entry.server.jsx",
        "mdx": [Function],
        "publicPath": "/build/",
        "rootDirectory": Any<String>,
        "routes": Object {
          "pages/four": Object {
            "caseSensitive": false,
            "file": "pages/four.jsx",
            "id": "pages/four",
            "parentId": "root",
            "path": "/page/four",
          },
          "pages/three": Object {
            "caseSensitive": false,
            "file": "pages/three.jsx",
            "id": "pages/three",
            "parentId": "root",
            "path": "/page/three",
          },
          "root": Object {
            "file": "root.jsx",
            "id": "root",
            "path": "",
          },
          "routes/action-catches": Object {
            "caseSensitive": false,
            "file": "routes/action-catches.jsx",
            "id": "routes/action-catches",
            "parentId": "root",
            "path": "action-catches",
          },
          "routes/action-catches-from-loader": Object {
            "caseSensitive": false,
            "file": "routes/action-catches-from-loader.jsx",
            "id": "routes/action-catches-from-loader",
            "parentId": "root",
            "path": "action-catches-from-loader",
          },
          "routes/action-catches-from-loader-self-boundary": Object {
            "caseSensitive": false,
            "file": "routes/action-catches-from-loader-self-boundary.jsx",
            "id": "routes/action-catches-from-loader-self-boundary",
            "parentId": "root",
            "path": "action-catches-from-loader-self-boundary",
          },
          "routes/action-catches-self-boundary": Object {
            "caseSensitive": false,
            "file": "routes/action-catches-self-boundary.jsx",
            "id": "routes/action-catches-self-boundary",
            "parentId": "root",
            "path": "action-catches-self-boundary",
          },
          "routes/action-errors": Object {
            "caseSensitive": false,
            "file": "routes/action-errors.jsx",
            "id": "routes/action-errors",
            "parentId": "root",
            "path": "action-errors",
          },
          "routes/action-errors-self-boundary": Object {
            "caseSensitive": false,
            "file": "routes/action-errors-self-boundary.jsx",
            "id": "routes/action-errors-self-boundary",
            "parentId": "root",
            "path": "action-errors-self-boundary",
          },
          "routes/actions": Object {
            "caseSensitive": false,
            "file": "routes/actions.tsx",
            "id": "routes/actions",
            "parentId": "root",
            "path": "actions",
          },
          "routes/blog": Object {
            "caseSensitive": false,
            "file": "routes/blog.tsx",
            "id": "routes/blog",
            "parentId": "root",
            "path": "blog",
          },
          "routes/blog/hello-world": Object {
            "caseSensitive": false,
            "file": "routes/blog/hello-world.mdx",
            "id": "routes/blog/hello-world",
            "parentId": "routes/blog",
            "path": "hello-world",
          },
          "routes/blog/index": Object {
            "caseSensitive": false,
            "file": "routes/blog/index.tsx",
            "id": "routes/blog/index",
            "parentId": "routes/blog",
            "path": "/",
          },
          "routes/blog/second": Object {
            "caseSensitive": false,
            "file": "routes/blog/second.md",
            "id": "routes/blog/second",
            "parentId": "routes/blog",
            "path": "second",
          },
          "routes/blog/third": Object {
            "caseSensitive": false,
            "file": "routes/blog/third.md",
            "id": "routes/blog/third",
            "parentId": "routes/blog",
            "path": "third",
          },
          "routes/catchall-nested": Object {
            "caseSensitive": false,
            "file": "routes/catchall-nested.jsx",
            "id": "routes/catchall-nested",
            "parentId": "root",
            "path": "catchall-nested",
          },
          "routes/catchall-nested-no-layout/$": Object {
            "caseSensitive": false,
            "file": "routes/catchall-nested-no-layout/$.jsx",
            "id": "routes/catchall-nested-no-layout/$",
            "parentId": "root",
            "path": "catchall-nested-no-layout/*",
          },
          "routes/catchall-nested/$": Object {
            "caseSensitive": false,
            "file": "routes/catchall-nested/$.jsx",
            "id": "routes/catchall-nested/$",
            "parentId": "routes/catchall-nested",
            "path": "*",
          },
          "routes/catchall.flat.$": Object {
            "caseSensitive": false,
            "file": "routes/catchall.flat.$.jsx",
            "id": "routes/catchall.flat.$",
            "parentId": "root",
            "path": "catchall/flat/*",
          },
          "routes/empty": Object {
            "caseSensitive": false,
            "file": "routes/empty.jsx",
            "id": "routes/empty",
            "parentId": "root",
            "path": "empty",
          },
          "routes/fetchers": Object {
            "caseSensitive": false,
            "file": "routes/fetchers.tsx",
            "id": "routes/fetchers",
            "parentId": "root",
            "path": "fetchers",
          },
          "routes/gists": Object {
            "caseSensitive": false,
            "file": "routes/gists.jsx",
            "id": "routes/gists",
            "parentId": "root",
            "path": "gists",
          },
          "routes/gists.mine": Object {
            "caseSensitive": false,
            "file": "routes/gists.mine.jsx",
            "id": "routes/gists.mine",
            "parentId": "root",
            "path": "gists/mine",
          },
          "routes/gists/$username": Object {
            "caseSensitive": false,
            "file": "routes/gists/$username.jsx",
            "id": "routes/gists/$username",
            "parentId": "routes/gists",
            "path": ":username",
          },
          "routes/gists/index": Object {
            "caseSensitive": false,
            "file": "routes/gists/index.jsx",
            "id": "routes/gists/index",
            "parentId": "routes/gists",
            "path": "/",
          },
          "routes/index": Object {
            "caseSensitive": false,
            "file": "routes/index.jsx",
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
            "file": "routes/loader-errors.jsx",
            "id": "routes/loader-errors",
            "parentId": "root",
            "path": "loader-errors",
          },
          "routes/loader-errors/nested": Object {
            "caseSensitive": false,
            "file": "routes/loader-errors/nested.jsx",
            "id": "routes/loader-errors/nested",
            "parentId": "routes/loader-errors",
            "path": "nested",
          },
          "routes/loader-errors/nested-catch": Object {
            "caseSensitive": false,
            "file": "routes/loader-errors/nested-catch.jsx",
            "id": "routes/loader-errors/nested-catch",
            "parentId": "routes/loader-errors",
            "path": "nested-catch",
          },
          "routes/methods": Object {
            "caseSensitive": false,
            "file": "routes/methods.tsx",
            "id": "routes/methods",
            "parentId": "root",
            "path": "methods",
          },
          "routes/multiple-set-cookies": Object {
            "caseSensitive": false,
            "file": "routes/multiple-set-cookies.tsx",
            "id": "routes/multiple-set-cookies",
            "parentId": "root",
            "path": "multiple-set-cookies",
          },
          "routes/nested-forms": Object {
            "caseSensitive": false,
            "file": "routes/nested-forms.tsx",
            "id": "routes/nested-forms",
            "parentId": "root",
            "path": "nested-forms",
          },
          "routes/nested-forms/nested": Object {
            "caseSensitive": false,
            "file": "routes/nested-forms/nested.tsx",
            "id": "routes/nested-forms/nested",
            "parentId": "routes/nested-forms",
            "path": "nested",
          },
          "routes/nested-forms/nested/index": Object {
            "caseSensitive": false,
            "file": "routes/nested-forms/nested/index.tsx",
            "id": "routes/nested-forms/nested/index",
            "parentId": "routes/nested-forms/nested",
            "path": "/",
          },
          "routes/one": Object {
            "caseSensitive": false,
            "file": "routes/one.mdx",
            "id": "routes/one",
            "parentId": "root",
            "path": "one",
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
            "file": "routes/render-errors.jsx",
            "id": "routes/render-errors",
            "parentId": "root",
            "path": "render-errors",
          },
          "routes/render-errors/nested": Object {
            "caseSensitive": false,
            "file": "routes/render-errors/nested.jsx",
            "id": "routes/render-errors/nested",
            "parentId": "routes/render-errors",
            "path": "nested",
          },
          "routes/two": Object {
            "caseSensitive": false,
            "file": "routes/two.md",
            "id": "routes/two",
            "parentId": "root",
            "path": "two",
          },
        },
        "serverBuildDirectory": Any<String>,
        "serverMode": "production",
      }
    `
    );
  });
});
