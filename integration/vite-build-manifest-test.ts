import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import getPort from "get-port";

import { createProject, viteBuild, VITE_CONFIG } from "./helpers/vite.js";

function createRoute(path: string) {
  return {
    [`app/routes/${path}`]: `
      export default function Route() {
        return <p>Path: ${path}</p>;
      }
    `,
  };
}

const TEST_ROUTES = [
  "_index.tsx",
  "parent-route.tsx",
  "parent-route.child-route.tsx",
];

const files = {
  "app/root.tsx": `
    import { Links, Meta, Outlet, Scripts, LiveReload } from "@remix-run/react";

    export default function Root() {
      return (
        <html lang="en">
          <head>
            <Meta />
            <Links />
          </head>
          <body>
            <Outlet />
            <Scripts />
            <LiveReload />
          </body>
        </html>
      );
    }
  `,
  ...Object.assign({}, ...TEST_ROUTES.map(createRoute)),
};

test.describe(() => {
  let cwd: string;
  let devPort: number;

  test.beforeAll(async () => {
    devPort = await getPort();
    cwd = await createProject({
      "vite.config.ts": await VITE_CONFIG({
        port: devPort,
        pluginOptions: "{ manifest: true }",
      }),
      ...files,
    });

    await viteBuild({ cwd });
  });

  test("Vite / build manifest", async () => {
    expect(
      JSON.parse(fs.readFileSync(path.join(cwd, "build/manifest.json"), "utf8"))
    ).toEqual({
      routes: {
        root: {
          file: "root.tsx",
          id: "root",
          path: "",
        },
        "routes/_index": {
          file: "routes/_index.tsx",
          id: "routes/_index",
          index: true,
          parentId: "root",
        },
        "routes/parent-route": {
          file: "routes/parent-route.tsx",
          id: "routes/parent-route",
          parentId: "root",
          path: "parent-route",
        },
        "routes/parent-route.child-route": {
          file: "routes/parent-route.child-route.tsx",
          id: "routes/parent-route.child-route",
          parentId: "routes/parent-route",
          path: "child-route",
        },
      },
    });
  });
});
