import { test, expect } from "@playwright/test";
import { PassThrough } from "stream";

import { createFixtureProject, js, json } from "./helpers/create-fixture";

let buildOutput: string;

test.beforeAll(async () => {
  let buildStdio = new PassThrough();

  await createFixtureProject({
    buildStdio,
    config: {
      future: { v2_routeConvention: true },
    },
    files: {
      "package.json": json({
        name: "remix-integration-9v4bpv66vd",
        private: true,
        sideEffects: false,
        scripts: {
          build: "remix build",
          dev: "remix dev",
          start: "remix-serve build",
        },
        dependencies: {
          "@remix-run/node": "0.0.0-local-version",
          "@remix-run/react": "0.0.0-local-version",
          "@remix-run/serve": "0.0.0-local-version",
          isbot: "0.0.0-local-version",
          react: "0.0.0-local-version",
          "react-dom": "0.0.0-local-version",
          "esm-only-no-exports": "0.0.0-local-version",
          "esm-only-exports": "0.0.0-local-version",
          "esm-only-sub-exports": "0.0.0-local-version",
          "esm-cjs-exports": "0.0.0-local-version",
        },
        devDependencies: {
          "@remix-run/dev": "0.0.0-local-version",
        },
      }),
      "app/routes/_index.jsx": js`
        import { json } from "@remix-run/node";
        import { Link, useLoaderData } from "@remix-run/react";
        import a from "esm-only-no-exports";
        import b from "esm-only-exports";
        import c from "esm-only-sub-exports";
        import d from "esm-cjs-exports";
        import e from "cjs-dynamic-import";

        export async function loader() {
          let { default: f } = await import("esm-only-exports-b");
          return json({
            a: a(),
            b: b(),
            c: c(),
            d: d(),
            e: e(),
            f: f(),
          });
        }

        export default function Index() {
          let data = useLoaderData();
          return null;
        }
      `,
      "node_modules/esm-only-no-exports/package.json": json({
        name: "esm-only-no-exports",
        version: "1.0.0",
        type: "module",
        main: "index.js",
      }),
      "node_modules/esm-only-no-exports/index.js": js`
        export default () => "esm-only-no-exports";
      `,
      "node_modules/esm-only-exports/package.json": json({
        name: "esm-only-exports",
        version: "1.0.0",
        type: "module",
        main: "index.js",
        exports: {
          ".": "./index.js",
          "./package.json": "./package.json",
        },
      }),
      "node_modules/esm-only-exports/index.js": js`
        export default () => "esm-only-no-exports";
      `,
      "node_modules/esm-only-exports-b/package.json": json({
        name: "esm-only-exports-b",
        version: "1.0.0",
        type: "module",
        main: "index.js",
        exports: {
          ".": "./index.js",
          "./package.json": "./package.json",
        },
      }),
      "node_modules/esm-only-exports-b/index.js": js`
        export default () => "esm-only-no-exports-b";
      `,
      "node_modules/esm-only-exports-c/package.json": json({
        name: "esm-only-exports-c",
        version: "1.0.0",
        type: "module",
        main: "index.js",
        exports: {
          ".": "./index.js",
          "./package.json": "./package.json",
        },
      }),
      "node_modules/esm-only-exports-c/index.js": js`
        export default () => "esm-only-no-exports-c";
      `,
      "node_modules/cjs-dynamic-import/package.json": json({
        name: "cjs-dynamic-import",
        version: "1.0.0",
        main: "index.js",
      }),
      "node_modules/cjs-dynamic-import/index.js": js`
        module.exports = async () => "esm-only-no-exports-d" + (await import("esm-only-exports-c")).default();
      `,
      "node_modules/esm-only-sub-exports/package.json": json({
        name: "esm-only-sub-exports",
        version: "1.0.0",
        type: "module",
        main: "index.js",
        exports: {
          ".": "./index.js",
          "./sub": "./sub.js",
          "./package.json": "./package.json",
        },
      }),
      "node_modules/esm-only-sub-exports/index.js": js`
        export default () => "esm-only-no-exports";
      `,
      "node_modules/esm-only-sub-exports/sub.js": js`
        export default () => "esm-only-no-exports/sub";
      `,
      "node_modules/esm-cjs-exports/package.json": json({
        name: "esm-cjs-exports",
        version: "1.0.0",
        type: "module",
        main: "index.js",
        exports: {
          ".": {
            require: "./index.cjs",
            default: "./index.js",
          },
          "./sub": {
            require: "./sub.cjs",
            default: "./sub.js",
          },
          "./package.json": "./package.json",
        },
      }),
      "node_modules/esm-cjs-exports/index.js": js`
        export default () => "esm-only-no-exports";
      `,
      "node_modules/esm-cjs-exports/index.cjs": js`
        module.exports = () => "esm-only-no-exports";
      `,
      "node_modules/esm-cjs-exports/sub.js": js`
        export default () => "esm-only-no-exports/sub";
      `,
      "node_modules/esm-cjs-exports/sub.cjs": js`
        module.exports = () => "esm-only-no-exports/sub";
      `,
    },
  });

  let chunks: Buffer[] = [];
  buildOutput = await new Promise<string>((resolve, reject) => {
    buildStdio.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    buildStdio.on("error", (err) => reject(err));
    buildStdio.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
});

test("logs warnings for ESM only packages", async () => {
  expect(buildOutput).toContain("esm-only package: esm-only-no-exports");
  expect(buildOutput).toContain("esm-only package: esm-only-exports");
  expect(buildOutput).not.toContain("esm-only package: esm-only-exports-b");
  expect(buildOutput).not.toContain("esm-only package: esm-only-exports-c");
  expect(buildOutput).not.toContain("esm-only package: cjs-dynamic-import");
  expect(buildOutput).toContain("esm-only package: esm-only-sub-exports");
  expect(buildOutput).not.toContain("esm-only package: esm-cjs-exports");
});
