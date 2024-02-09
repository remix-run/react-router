import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import getPort from "get-port";
import dedent from "dedent";

import { createProject, viteBuild, viteConfig } from "./helpers/vite.js";

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

  test.beforeAll(async () => {
    cwd = await createProject({
      "vite.config.ts": dedent`
        import { vitePlugin as remix } from "@remix-run/dev";

        export default {
          build: { manifest: true },
          plugins: [remix({ manifest: true })],
        }
      `,
      ...files,
    });

    viteBuild({ cwd });
  });

  test("Vite / manifests enabled / Vite manifests", () => {
    let viteManifestFiles = fs.readdirSync(path.join(cwd, "build", ".vite"));

    expect(viteManifestFiles).toEqual([
      "client-manifest.json",
      "server-manifest.json",
    ]);
  });

  test("Vite / manifests enabled / Remix manifest", async () => {
    let manifestPath = path.join(cwd, "build", ".remix", "manifest.json");
    expect(JSON.parse(fs.readFileSync(manifestPath, "utf8"))).toEqual({
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

test.describe(() => {
  let cwd: string;

  test.beforeAll(async () => {
    cwd = await createProject({
      "vite.config.ts": await viteConfig.basic({ port: await getPort() }),
      ...files,
    });

    viteBuild({ cwd });
  });

  test("Vite / manifest disabled / Vite manifests", () => {
    let manifestDir = path.join(cwd, "build", ".vite");
    expect(fs.existsSync(manifestDir)).toBe(false);
  });

  test("Vite / manifest disabled / Remix manifest doesn't exist", async () => {
    let manifestDir = path.join(cwd, "build", ".remix");
    expect(fs.existsSync(manifestDir)).toBe(false);
  });
});
