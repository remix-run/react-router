import fs from "node:fs/promises";
import * as path from "node:path";
import URL from "node:url";
import { expect } from "@playwright/test";
import { normalizePath } from "vite";
import dedent from "dedent";

import { viteBuild, test, createProject } from "./helpers/vite.js";

const js = String.raw;

const files = {
  "vite.config.ts": dedent(js`
    import { vitePlugin as remix } from "@remix-run/dev";
    import fs from "node:fs/promises";
    import serializeJs from "serialize-javascript";

    let isDeepFrozen = (obj: any) =>
      Object.isFrozen(obj) &&
      Object.keys(obj).every(
        prop => typeof obj[prop] !== 'object' || isDeepFrozen(obj[prop])
      );

    export default {
      build: {
        assetsDir: "custom-assets-dir",
      },
      plugins: [remix({
        presets: [
          // Ensure user config is passed to remixConfig hook
          {
            name: "test-preset",
            remixConfig: async ({ remixUserConfig: { presets, ...restUserConfig } }) => {
              if (!Array.isArray(presets)) {
                throw new Error("Remix user config doesn't have presets array.");
              }

              let expected = JSON.stringify({ appDirectory: "app"});
              let actual = JSON.stringify(restUserConfig);

              if (actual !== expected) {
                throw new Error([
                  "Remix user config wasn't passed to remixConfig hook.",
                  "Expected: " + expected,
                  "Actual: " + actual,
                ].join(" "));
              }

              return {};
            },
          },
          
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

          // Ensure remixConfig is called with a frozen Remix user config
          {
            name: "test-preset",
            remixConfig: async ({ remixUserConfig }) => {
              await fs.writeFile("PRESET_REMIX_CONFIG_META.json", JSON.stringify({
                remixUserConfigFrozen: isDeepFrozen(remixUserConfig),
              }), "utf-8");
            }
          },

          // Ensure remixConfigResolved is called with a frozen Remix config
          {
            name: "test-preset",
            remixConfigResolved: async ({ remixConfig }) => {
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
                let { viteConfig, buildManifest, remixConfig } = buildEndArgs;

                await fs.writeFile(
                  "BUILD_END_META.js",
                  [
                    "export const keys = " + JSON.stringify(Object.keys(buildEndArgs)) + ";",
                    "export const buildManifest = " + serializeJs(buildManifest, { space: 2, unsafe: true }) + ";",
                    "export const remixConfig = " + serializeJs(remixConfig, { space: 2, unsafe: true }) + ";",
                    "export const assetsDir = " + JSON.stringify(viteConfig.build.assetsDir) + ";",
                  ].join("\\n"),
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
  `),
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

  let buildEndArgsMeta: any = await import(
    URL.pathToFileURL(path.join(cwd, "BUILD_END_META.js")).href
  );

  let { remixConfig } = buildEndArgsMeta;

  // Smoke test Vite config
  expect(buildEndArgsMeta.assetsDir).toBe("custom-assets-dir");

  // Before rewriting to relative paths, assert that paths are absolute within cwd
  expect(pathStartsWithCwd(remixConfig.buildDirectory)).toBe(true);

  // Rewrite path args to be relative and normalized for snapshot test
  remixConfig.buildDirectory = relativeToCwd(remixConfig.buildDirectory);

  // Ensure preset configs are merged in correct order, resulting in the correct build directory
  expect(remixConfig.buildDirectory).toBe("build");

  // Ensure preset config takes lower precedence than user config
  expect(remixConfig.serverModuleFormat).toBe("esm");

  // Ensure `remixConfig` is called with a frozen Remix user config
  expect(
    JSON.parse(
      await fs.readFile(
        path.join(cwd, "PRESET_REMIX_CONFIG_META.json"),
        "utf-8"
      )
    )
  ).toEqual({
    remixUserConfigFrozen: true,
  });

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

  // Snapshot the buildEnd args keys
  expect(buildEndArgsMeta.keys).toEqual([
    "buildManifest",
    "remixConfig",
    "viteConfig",
  ]);

  // Smoke test the resolved config
  expect(Object.keys(remixConfig)).toEqual([
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
  expect(buildEndArgsMeta.buildManifest).toEqual({
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
