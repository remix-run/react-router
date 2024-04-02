import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import shell from "shelljs";
import glob from "glob";

import { createFixtureProject, js, json } from "./helpers/create-fixture.js";

const searchFiles = async (pattern: string | RegExp, files: string[]) => {
  let result = shell.grep("-l", pattern, files);
  return result.stdout
    .trim()
    .split("\n")
    .filter((line) => line.length > 0);
};

const findCodeFiles = async (directory: string) =>
  glob.sync("**/*.@(js|jsx|ts|tsx)", {
    cwd: directory,
    absolute: true,
  });

test.describe("cloudflare compiler", () => {
  let projectDir: string;

  let findBrowserBundle = (projectDir: string): string =>
    path.resolve(projectDir, "public", "build");

  test.beforeAll(async () => {
    projectDir = await createFixtureProject({
      compiler: "remix",
      template: "cf-template",
      files: {
        "package.json": json({
          name: "remix-template-cloudflare-workers",
          private: true,
          sideEffects: false,
          type: "module",
          dependencies: {
            "@cloudflare/kv-asset-handler": "0.0.0-local-version",
            "@remix-run/cloudflare": "0.0.0-local-version",
            "@remix-run/react": "0.0.0-local-version",
            isbot: "0.0.0-local-version",
            react: "0.0.0-local-version",
            "react-dom": "0.0.0-local-version",

            "worker-pkg": "0.0.0-local-version",
            "browser-pkg": "0.0.0-local-version",
            "esm-only-pkg": "0.0.0-local-version",
            "cjs-only-pkg": "0.0.0-local-version",
          },
          devDependencies: {
            "@cloudflare/workers-types": "0.0.0-local-version",
            "@remix-run/dev": "0.0.0-local-version",
          },
        }),

        "app/routes/_index.tsx": js`
          import fake from "worker-pkg";
          import { content as browserPackage } from "browser-pkg";
          import { content as esmOnlyPackage } from "esm-only-pkg";
          import { content as cjsOnlyPackage } from "cjs-only-pkg";
          import hooks, {AsyncLocalStorage} from "node:async_hooks";

          export async function loader() {
            console.log(hooks, AsyncLocalStorage);

            return null;
          }

          export default function Index() {
            return (
              <ul>
                <li>{fake}</li>
                <li>{browserPackage}</li>
                <li>{esmOnlyPackage}</li>
                <li>{cjsOnlyPackage}</li>
              </ul>
            )
          }
        `,
        "node_modules/worker-pkg/package.json": json({
          name: "worker-pkg",
          version: "1.0.0",
          type: "module",
          main: "./default.js",
          exports: {
            worker: "./worker.js",
            default: "./default.js",
          },
        }),
        "node_modules/worker-pkg/worker.js": js`
          export default "__WORKER_EXPORTS_SHOULD_BE_IN_BUNDLE__";
        `,
        "node_modules/worker-pkg/default.js": js`
          export default "__DEFAULT_EXPORTS_SHOULD_NOT_BE_IN_BUNDLE__";
        `,
        "node_modules/browser-pkg/package.json": json({
          name: "browser-pkg",
          version: "1.0.0",
          main: "./node-cjs.js",
          module: "./node-esm.mjs",
          browser: {
            "./node-cjs.js": "./browser-cjs.js",
            "./node-esm.mjs": "./browser-esm.mjs",
          },
        }),
        "node_modules/browser-pkg/browser-esm.mjs": js`
          export const content = "browser-pkg/browser-esm.mjs";
        `,
        "node_modules/browser-pkg/browser-cjs.js": js`
          module.exports = { content: "browser-pkg/browser-cjs.js" };
        `,
        "node_modules/browser-pkg/node-esm.mjs": js`
          export const content = "browser-pkg/node-esm.mjs";
        `,
        "node_modules/browser-pkg/node-cjs.js": js`
          module.exports = { content: "browser-pkg/node-cjs.js" };
        `,
        "node_modules/esm-only-pkg/package.json": json({
          name: "esm-only-pkg",
          version: "1.0.0",
          type: "module",
          main: "./node-esm.js",
          browser: "./browser-esm.js",
        }),
        "node_modules/esm-only-pkg/browser-esm.js": js`
          export const content = "esm-only-pkg/browser-esm.js";
        `,
        "node_modules/esm-only-pkg/node-esm.js": js`
          export const content = "esm-only-pkg/node-esm.js";
        `,
        "node_modules/cjs-only-pkg/package.json": json({
          name: "cjs-only-pkg",
          version: "1.0.0",
          main: "./node-cjs.js",
          browser: "./browser-cjs.js",
        }),
        "node_modules/cjs-only-pkg/browser-cjs.js": js`
          module.exports = { content: "cjs-only-pkg/browser-cjs.js" };
        `,
        "node_modules/cjs-only-pkg/node-cjs.js": js`
          module.exports = { content: "cjs-only-pkg/node-cjs.js" };
        `,
      },
    });
  });

  test("bundles browser entry of 3rd party package correctly", async () => {
    let serverBundle = await fs.readFile(
      path.resolve(projectDir, "build/index.js"),
      "utf8"
    );

    expect(serverBundle).not.toMatch("browser-pkg/browser-esm.mjs");
    expect(serverBundle).not.toMatch("browser-pkg/browser-cjs.js");
    expect(serverBundle).toMatch("browser-pkg/node-esm.mjs");
    expect(serverBundle).not.toMatch("browser-pkg/node-cjs.js");

    expect(serverBundle).toMatch("esm-only-pkg/browser-esm.js");
    expect(serverBundle).not.toMatch("esm-only-pkg/node-esm.js");

    expect(serverBundle).toMatch("cjs-only-pkg/browser-cjs.js");
    expect(serverBundle).not.toMatch("cjs-only-pkg/node-cjs.js");
  });

  test("bundles worker export of 3rd party package", async () => {
    let serverBundle = await fs.readFile(
      path.resolve(projectDir, "build/index.js"),
      "utf8"
    );

    expect(serverBundle).toMatch("__WORKER_EXPORTS_SHOULD_BE_IN_BUNDLE__");
    expect(serverBundle).not.toMatch(
      "__DEFAULT_EXPORTS_SHOULD_NOT_BE_IN_BUNDLE__"
    );
  });

  test("node externals are not bundled in the browser bundle", async () => {
    let browserBundle = findBrowserBundle(projectDir);
    let browserCodeFiles = await findCodeFiles(browserBundle);

    let asyncHooks = await searchFiles(
      /async_hooks|AsyncLocalStorage/,
      browserCodeFiles
    );

    expect(asyncHooks).toHaveLength(0);
  });
});
