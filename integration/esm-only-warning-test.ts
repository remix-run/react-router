import { PassThrough } from "stream";

import { createFixtureProject, js } from "./helpers/create-fixture";

let buildOutput: string;

beforeAll(async () => {
  let buildStdio = new PassThrough();

  await createFixtureProject({
    buildStdio,
    files: {
      "app/routes/index.jsx": js`
        import { json, useLoaderData, Link } from "remix";
        import a from "esm-only-no-exports";
        import b from "esm-only-exports";
        import c from "esm-only-sub-exports";
        import d from "esm-cjs-exports";

        export function loader() {
          return json({
            a: a(),
            b: b(),
            c: c(),
            d: d(),
          });
        }

        export default function Index() {
          let data = useLoaderData();
          return null;
        }
      `,
      "node_modules/esm-only-no-exports/package.json": `{
  "name": "esm-only",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js"
}`,
      "node_modules/esm-only-no-exports/index.js": js`
        export default () => "esm-only-no-exports";
      `,
      "node_modules/esm-only-exports/package.json": `{
  "name": "esm-only",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "exports": {
    ".": "./index.js",
    "./package.json": "./package.json"
  }
}`,
      "node_modules/esm-only-exports/index.js": js`
        export default () => "esm-only-no-exports";
      `,
      "node_modules/esm-only-sub-exports/package.json": `{
  "name": "esm-only",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "exports": {
    ".": "./index.js",
    "./sub": "./sub.js",
    "./package.json": "./package.json"
  }
}`,
      "node_modules/esm-only-sub-exports/index.js": js`
        export default () => "esm-only-no-exports";
      `,
      "node_modules/esm-only-sub-exports/sub.js": js`
        export default () => "esm-only-no-exports/sub";
      `,
      "node_modules/esm-cjs-exports/package.json": `{
  "name": "esm-only",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "exports": {
    ".": {
      "require": "./index.cjs",
      "default": "./index.js"
    },
    "./sub": {
      "require": "./sub.cjs",
      "default": "./sub.js"
    },
    "./package.json": "./package.json"
  }
}`,
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

  let chunks = [];
  buildOutput = await new Promise<string>((resolve, reject) => {
    buildStdio.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    buildStdio.on("error", (err) => reject(err));
    buildStdio.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
});

it("logs warnings for ESM only packages", async () => {
  expect(buildOutput).toContain(
    "esm-only-no-exports is possibly an ESM only package"
  );
  expect(buildOutput).toContain(
    "esm-only-exports is possibly an ESM only package"
  );
  expect(buildOutput).toContain(
    "esm-only-sub-exports is possibly an ESM only package"
  );
  expect(buildOutput).not.toContain(
    "esm-cjs-exports is possibly an ESM only package"
  );
});
