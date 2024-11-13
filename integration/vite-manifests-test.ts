import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import getPort from "get-port";
import dedent from "dedent";

import { createProject, build, viteConfig } from "./helpers/vite.js";

const js = String.raw;

function createRoute(path: string) {
  return {
    [`app/routes/${path}`]: js`
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
  "app/root.tsx": js`
    import { Links, Meta, Outlet, Scripts } from "react-router";

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
      "react-router.config.ts": dedent(js`
        export default {
          buildEnd: async ({ buildManifest }) => {
            let fs = await import("node:fs");
            await fs.promises.writeFile(
              "build/test-manifest.json",
              JSON.stringify(buildManifest, null, 2),
              "utf-8",
            );
          },
        }
      `),
      "vite.config.ts": dedent(js`
        import { reactRouter } from "@react-router/dev/vite";

        export default {
          build: { manifest: true },
          plugins: [reactRouter()],
        }
      `),
      ...files,
    });

    build({ cwd });
  });

  test("Vite / manifests enabled / Vite manifests", () => {
    let viteManifestFilesClient = fs.readdirSync(
      path.join(cwd, "build", "client", ".vite")
    );
    expect(viteManifestFilesClient).toEqual(["manifest.json"]);

    let viteManifestFilesServer = fs.readdirSync(
      path.join(cwd, "build", "server", ".vite")
    );
    expect(viteManifestFilesServer).toEqual(["manifest.json"]);
  });

  test("Vite / manifests enabled / React Router build manifest", async () => {
    let manifestPath = path.join(cwd, "build", "test-manifest.json");
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

    build({ cwd });
  });

  test("Vite / manifest disabled / Vite manifests", () => {
    let manifestDirClient = path.join(cwd, "build", "client", ".vite");
    expect(fs.existsSync(manifestDirClient)).toBe(false);

    let manifestDirServer = path.join(cwd, "build", "server", ".vite");
    expect(fs.existsSync(manifestDirServer)).toBe(false);
  });
});
