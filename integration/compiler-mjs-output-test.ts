import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

import { createFixtureProject, js } from "./helpers/create-fixture";

let projectDir: string;

test.beforeAll(async () => {
  projectDir = await createFixtureProject({
    files: {
      // Ensure the config is valid ESM
      "remix.config.js": js`
        export default {
          serverModuleFormat: "esm",
          serverBuildPath: "build/index.mjs",
          future: { v2_routeConvention: true },
        };
      `,
      "package.json": js`
        {
          "name": "remix-template-remix",
          "private": true,
          "sideEffects": false,
          "type": "module",
          "scripts": {
            "build": "node ../../../build/node_modules/@remix-run/dev/dist/cli.js build",
            "dev": "node ../../../build/node_modules/@remix-run/dev/dist/cli.js dev",
            "start": "node ../../../build/node_modules/@remix-run/serve/dist/cli.js build"
          },
          "dependencies": {
            "@remix-run/node": "0.0.0-local-version",
            "@remix-run/react": "0.0.0-local-version",
            "@remix-run/serve": "0.0.0-local-version",
            "isbot": "0.0.0-local-version",
            "react": "0.0.0-local-version",
            "react-dom": "0.0.0-local-version"
          },
          "devDependencies": {
            "@remix-run/dev": "0.0.0-local-version",
            "@types/react": "0.0.0-local-version",
            "@types/react-dom": "0.0.0-local-version",
            "typescript": "0.0.0-local-version"
          },
          "engines": {
            "node": ">=14.0.0"
          }
        }      
      `,
      "app/routes/_index.jsx": js`
        import { json } from "@remix-run/node";
        import { useLoaderData, Link } from "@remix-run/react";

        export function loader() {
          return json("pizza");
        }

        export default function Index() {
          let data = useLoaderData();
          return (
            <div>
              {data}
              <Link to="/burgers">Other Route</Link>
            </div>
          )
        }
      `,
    },
  });
});

test("can write .mjs server output module", () => {
  let buildPath = path.resolve(projectDir, "build", "index.mjs");
  expect(fs.existsSync(buildPath), "doesn't exist").toBe(true);
  let contents = fs.readFileSync(buildPath, "utf8");
  expect(contents, "no export statement").toContain("export {");
});
