import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import getPort from "get-port";
import dedent from "dedent";

import { createProject, build, viteConfig } from "./helpers/vite.js";

const js = String.raw;

const files = {
  "app/root.tsx": js`
    import { Links, Meta, Outlet, Scripts } from "react-router-dom";

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
  "app/routes/_index.tsx": js`
    export default function Route() {
      return <p>Hello world</p>;
    }
  `,
};

test.describe(() => {
  let cwd: string;

  test.beforeAll(async () => {
    cwd = await createProject({
      "vite.config.ts": dedent`
        import { vitePlugin as reactRouter } from "@react-router/dev";

        export default {
          build: { manifest: true },
          plugins: [reactRouter()],
        }
      `,
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
