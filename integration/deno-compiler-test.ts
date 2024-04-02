import { test, expect } from "@playwright/test";
import fse from "fs-extra";
import path from "node:path";
import shell from "shelljs";
import glob from "glob";

import { createFixtureProject, js, json } from "./helpers/create-fixture.js";

let projectDir: string;

const findBrowserBundle = (projectDir: string): string =>
  path.resolve(projectDir, "public", "build");

const findServerBundle = (projectDir: string): string =>
  path.resolve(projectDir, "build", "index.js");

const importPattern = (importSpecifier: string) =>
  new RegExp(
    String.raw`import\s*{.*}\s*from\s*"` + importSpecifier + String.raw`"`
  );

const findCodeFiles = async (directory: string) =>
  glob.sync("**/*.@(js|jsx|ts|tsx)", {
    cwd: directory,
    absolute: true,
  });
const searchFiles = async (pattern: string | RegExp, files: string[]) => {
  let result = shell.grep("-l", pattern, files);
  return result.stdout
    .trim()
    .split("\n")
    .filter((line) => line.length > 0);
};

test.beforeAll(async () => {
  projectDir = await createFixtureProject({
    compiler: "remix",
    template: "deno-template",
    files: {
      "package.json": json({
        name: "remix-template-deno",
        private: true,
        sideEffects: false,
        dependencies: {
          "@remix-run/deno": "0.0.0-local-version",
          "@remix-run/react": "0.0.0-local-version",
          isbot: "0.0.0-local-version",
          react: "0.0.0-local-version",
          "react-dom": "0.0.0-local-version",

          component: "0.0.0-local-version",
          "deno-pkg": "0.0.0-local-version",
        },
        devDependencies: {
          "@remix-run/dev": "0.0.0-local-version",
        },
      }),

      "app/routes/_index.tsx": js`
        import fake from "deno-pkg";
        import { urlComponent } from "https://deno.land/x/component.ts";
        import { urlUtil } from "https://deno.land/x/util.ts";
        import { urlServerOnly } from "https://deno.land/x/server-only.ts";

        import { npmComponent } from "npm-component";
        import { npmUtil } from "npm-util";
        import { npmServerOnly } from "npm-server-only";

        import { useLoaderData } from "@remix-run/react";

        export const loader = () => {
          return json({
            a: urlUtil(),
            b: urlServerOnly(),
            c: npmUtil(),
            d: npmServerOnly(),
          });
        }

        export default function Index() {
          const data = useLoaderData();
          return (
            <ul>
              <li>{fake}</li>

              <li>{urlComponent}</li>
              <li>{urlUtil()}</li>
              <li>{data.a}</li>
              <li>{data.b}</li>

              <li>{npmComponent}</li>
              <li>{npmUtil()}</li>
              <li>{data.c}</li>
              <li>{data.d}</li>
            </ul>
          )
        }
      `,
      "node_modules/npm-component/package.json": json({
        name: "npm-component",
        version: "1.0.0",
        sideEffects: false,
      }),
      "node_modules/npm-component/index.js": js`
        module.exports = { npmComponent: () => "NPM_COMPONENT" };
      `,
      "node_modules/npm-util/package.json": json({
        name: "npm-util",
        version: "1.0.0",
        sideEffects: false,
      }),
      "node_modules/npm-util/index.js": js`
        module.exports = { npmUtil: () => "NPM_UTIL" };
      `,
      "node_modules/npm-server-only/package.json": json({
        name: "npm-server-only",
        version: "1.0.0",
        sideEffects: false,
      }),
      "node_modules/npm-server-only/index.js": js`
        module.exports = { npmServerOnly: () => "NPM_SERVER_ONLY" };
      `,
      "node_modules/deno-pkg/package.json": json({
        name: "deno-pkg",
        version: "1.0.0",
        type: "module",
        main: "./default.js",
        exports: {
          deno: "./deno.js",
          worker: "./worker.js",
          default: "./default.js",
        },
        sideEffects: false,
      }),
      "node_modules/deno-pkg/deno.js": js`
        export default "DENO_EXPORTS";
      `,
      "node_modules/deno-pkg/worker.js": js`
        export default "WORKER_EXPORTS";
      `,
      "node_modules/deno-pkg/default.js": js`
        export default "DEFAULT_EXPORTS";
      `,
    },
  });
});

test("compiler does not bundle url imports for server", async () => {
  let serverBundle = await fse.readFile(findServerBundle(projectDir), "utf8");
  expect(serverBundle).toMatch(importPattern("https://deno.land/x/util.ts"));
  expect(serverBundle).toMatch(
    importPattern("https://deno.land/x/server-only.ts")
  );

  // server-side rendering
  expect(serverBundle).toMatch(
    importPattern("https://deno.land/x/component.ts")
  );
});

test("compiler does not bundle url imports for browser", async () => {
  let browserBundle = findBrowserBundle(projectDir);
  let browserCodeFiles = await findCodeFiles(browserBundle);

  let utilFiles = await searchFiles(
    importPattern("https://deno.land/x/util.ts"),
    browserCodeFiles
  );
  expect(utilFiles.length).toBeGreaterThanOrEqual(1);

  let componentFiles = await searchFiles(
    importPattern("https://deno.land/x/component.ts"),
    browserCodeFiles
  );
  expect(componentFiles.length).toBeGreaterThanOrEqual(1);

  /*
  Url imports _could_ have side effects, but the vast majority do not.
  Currently Remix marks all URL imports as side-effect free.
  */
  let serverOnlyUtilFiles = await searchFiles(
    importPattern("https://deno.land/x/server-only.ts"),
    browserCodeFiles
  );
  expect(serverOnlyUtilFiles.length).toBe(0);
});

test("compiler bundles npm imports for server", async () => {
  let serverBundle = await fse.readFile(findServerBundle(projectDir), "utf8");

  expect(serverBundle).not.toMatch(importPattern("npm-component"));
  expect(serverBundle).toContain("NPM_COMPONENT");

  expect(serverBundle).not.toMatch(importPattern("npm-util"));
  expect(serverBundle).toContain("NPM_UTIL");

  expect(serverBundle).not.toMatch(importPattern("npm-server-only"));
  expect(serverBundle).toContain("NPM_SERVER_ONLY");
});

test("compiler bundles npm imports for browser", async () => {
  let browserBundle = findBrowserBundle(projectDir);
  let browserCodeFiles = await findCodeFiles(browserBundle);

  let utilImports = await searchFiles(
    importPattern("npm-util"),
    browserCodeFiles
  );
  expect(utilImports.length).toBe(0);
  let utilFiles = await searchFiles("NPM_UTIL", browserCodeFiles);
  expect(utilFiles.length).toBeGreaterThanOrEqual(1);

  let componentImports = await searchFiles(
    importPattern("npm-component"),
    browserCodeFiles
  );
  expect(componentImports.length).toBe(0);
  let componentFiles = await searchFiles("NPM_COMPONENT", browserCodeFiles);
  expect(componentFiles.length).toBeGreaterThanOrEqual(1);

  let serverOnlyImports = await searchFiles(
    importPattern("npm-server-only"),
    browserCodeFiles
  );
  expect(serverOnlyImports.length).toBe(0);
  let serverOnlyFiles = await searchFiles("NPM_SERVER_ONLY", browserCodeFiles);
  expect(serverOnlyFiles.length).toBe(0);
});

test("compiler bundles deno export of 3rd party package", async () => {
  let serverBundle = await fse.readFile(findServerBundle(projectDir), "utf8");

  expect(serverBundle).toMatch("DENO_EXPORTS");
  expect(serverBundle).not.toMatch("DEFAULT_EXPORTS");
});
