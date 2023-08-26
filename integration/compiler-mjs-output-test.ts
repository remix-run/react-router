import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

import { createFixtureProject, js, json } from "./helpers/create-fixture.js";

let projectDir: string;

test.beforeAll(async () => {
  projectDir = await createFixtureProject({
    files: {
      // Ensure the config is valid ESM
      "remix.config.js": js`
        export default {
          serverModuleFormat: "esm",
          serverBuildPath: "build/index.mjs",
        };
      `,
      "package.json": json({
        name: "remix-template-remix",
        private: true,
        sideEffects: false,
        type: "module",
        dependencies: {
          "@remix-run/node": "0.0.0-local-version",
          "@remix-run/react": "0.0.0-local-version",
          "@remix-run/serve": "0.0.0-local-version",
          isbot: "0.0.0-local-version",
          react: "0.0.0-local-version",
          "react-dom": "0.0.0-local-version",
        },
        devDependencies: {
          "@remix-run/dev": "0.0.0-local-version",
          "@types/react": "0.0.0-local-version",
          "@types/react-dom": "0.0.0-local-version",
          typescript: "0.0.0-local-version",
        },
        engines: {
          node: ">=18.0.0",
        },
      }),
      "app/routes/_index.tsx": js`
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
