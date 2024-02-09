import fs from "node:fs/promises";
import * as path from "node:path";
import URL from "node:url";
import { expect } from "@playwright/test";
import { normalizePath } from "vite";
import dedent from "dedent";

import { viteBuild, test, createProject } from "./helpers/vite.js";

const files = {
  "vite.config.ts": dedent`
    import { vitePlugin as remix } from "@remix-run/dev";
    import fs from "node:fs/promises";
    import serializeJs from "serialize-javascript";

    export default {
      plugins: [remix({
        presets: [
          // Ensure preset config takes lower precedence than user config
          {
            name: "test-preset",
            remixConfig: async () => ({
              appDirectory: "INCORRECT_APP_DIR", // This is overridden by the user config further down this file
            }),
          },
          {
            name: "test-preset",
            remixConfigResolved: async ({ remixConfig }) => {
              if (remixConfig.appDirectory.includes("INCORRECT_APP_DIR")) {
                throw new Error("Remix preset config wasn't overridden with user config");
              }
            }
          },

          // Ensure config presets are merged in the correct order
          {
            name: "test-preset",
            remixConfig: async () => ({
              buildDirectory: "INCORRECT_BUILD_DIR",
            }),
          },
          {
            name: "test-preset",
            remixConfig: async () => ({
              buildDirectory: "build",
            }),
          },

          // Ensure remixConfigResolved is called with a frozen Remix config
          {
            name: "test-preset",
            remixConfigResolved: async ({ remixConfig }) => {
              let isDeepFrozen = (obj: any) =>
                Object.isFrozen(obj) &&
                Object.keys(obj).every(
                  prop => typeof obj[prop] !== 'object' || isDeepFrozen(obj[prop])
                );

              await fs.writeFile("PRESET_REMIX_CONFIG_RESOLVED_META.json", JSON.stringify({
                remixConfigFrozen: isDeepFrozen(remixConfig),
              }), "utf-8");
            }
          },

          // Ensure presets can set serverBundles option (this is critical for Vercel support)
          {
            name: "test-preset",
            remixConfig: async () => ({
              serverBundles() {
                return "preset-server-bundle-id";
              },
            }),
          },

          // Ensure presets can set buildEnd option (this is critical for Vercel support)
          {
            name: "test-preset",
            remixConfig: async () => ({
              async buildEnd(buildEndArgs) {
                await fs.writeFile(
                  "BUILD_END_ARGS.js",
                  "export default " + serializeJs(buildEndArgs, { space: 2, unsafe: true }),
                  "utf-8"
                );
              },
            }),
          },
        ],
        // Ensure user config takes precedence over preset config
        appDirectory: "app",
      })],
    }
  `,
};

test("Vite / presets", async () => {
  let cwd = await createProject(files);
  let { status, stderr } = viteBuild({ cwd });
  expect(stderr.toString()).toBeFalsy();
  expect(status).toBe(0);

  function pathStartsWithCwd(pathname: string) {
    return normalizePath(pathname).startsWith(normalizePath(cwd));
  }

  function relativeToCwd(pathname: string) {
    return normalizePath(path.relative(cwd, pathname));
  }

  let buildEndArgs: any = (
    await import(URL.pathToFileURL(path.join(cwd, "BUILD_END_ARGS.js")).href)
  ).default;
  let { remixConfig } = buildEndArgs;

  // Before rewriting to relative paths, assert that paths are absolute within cwd
  expect(pathStartsWithCwd(remixConfig.buildDirectory)).toBe(true);

  // Rewrite path args to be relative and normalized for snapshot test
  remixConfig.buildDirectory = relativeToCwd(remixConfig.buildDirectory);

  // Ensure preset configs are merged in correct order, resulting in the correct build directory
  expect(remixConfig.buildDirectory).toBe("build");

  // Ensure preset config takes lower precedence than user config
  expect(remixConfig.serverModuleFormat).toBe("esm");

  // Ensure `remixConfigResolved` is called with a frozen Remix config
  expect(
    JSON.parse(
      await fs.readFile(
        path.join(cwd, "PRESET_REMIX_CONFIG_RESOLVED_META.json"),
        "utf-8"
      )
    )
  ).toEqual({
    remixConfigFrozen: true,
  });
  expect(Object.keys(buildEndArgs)).toEqual(["buildManifest", "remixConfig"]);

  // Smoke test the resolved config
  expect(Object.keys(buildEndArgs.remixConfig)).toEqual([
    "appDirectory",
    "basename",
    "buildDirectory",
    "buildEnd",
    "future",
    "manifest",
    "publicPath",
    "routes",
    "serverBuildFile",
    "serverBundles",
    "serverModuleFormat",
    "ssr",
  ]);

  // Ensure we get a valid build manifest
  expect(buildEndArgs.buildManifest).toEqual({
    routeIdToServerBundleId: {
      "routes/_index": "preset-server-bundle-id",
    },
    routes: {
      root: {
        file: "app/root.tsx",
        id: "root",
        path: "",
      },
      "routes/_index": {
        file: "app/routes/_index.tsx",
        id: "routes/_index",
        index: true,
        parentId: "root",
      },
    },
    serverBundles: {
      "preset-server-bundle-id": {
        file: "build/server/preset-server-bundle-id/index.js",
        id: "preset-server-bundle-id",
      },
    },
  });
});
