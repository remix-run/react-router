import * as path from "node:path";
import { test, expect } from "@playwright/test";
import shell from "shelljs";
import glob from "glob";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture, selectHtml } from "./helpers/playwright-fixture.js";

test.describe("Vite build", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      compiler: "vite",
      files: {
        "remix.config.js": js`
          throw new Error("Remix should not access remix.config.js when using Vite");
          export default {};
        `,
        "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { unstable_vitePlugin as remix } from "@remix-run/dev";

          export default defineConfig({
            plugins: [remix()],
          });
        `,
        "app/root.tsx": js`
          import { Links, Meta, Outlet, Scripts } from "@remix-run/react";

          export default function Root() {
            return (
              <html lang="en">
                <head>
                  <Meta />
                  <Links />
                </head>
                <body>
                  <div id="content">
                    <h1>Root</h1>
                    <Outlet />
                  </div>
                  <Scripts />
                </body>
              </html>
            );
          }
        `,
        "app/routes/_index.tsx": js`
          import { useState, useEffect } from "react";
          import { json } from "@remix-run/node";

          import { serverOnly1, serverOnly2 } from "../utils.server";

          export const loader = () => {
            return json({ serverOnly1 })
          }

          export const action = () => {
            console.log(serverOnly2)
            return null
          }

          export default function() {
            const [mounted, setMounted] = useState(false);
            useEffect(() => {
              setMounted(true);
            }, []);

            return (
              <>
                <h2>Index</h2>
                {!mounted ? <h3>Loading...</h3> : <h3 data-mounted>Mounted</h3>}
              </>
            );
          }
        `,
        "app/routes/resource.ts": js`
          import { json } from "@remix-run/node";

          import { serverOnly1, serverOnly2 } from "../utils.server";

          export const loader = () => {
            return json({ serverOnly1 })
          }

          export const action = () => {
            console.log(serverOnly2)
            return null
          }
        `,
        "app/utils.server.ts": js`
          export const serverOnly1 = "SERVER_ONLY_1"
          export const serverOnly2 = "SERVER_ONLY_2"
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("server code is removed from client assets", async () => {
    let publicBuildDir = path.join(fixture.projectDir, "public/build");

    // detect client asset files
    let assetFiles = glob.sync("**/*.@(js|jsx|ts|tsx)", {
      cwd: publicBuildDir,
      absolute: true,
    });

    // grep for server-only values in client assets
    let result = shell
      .grep("-l", /SERVER_ONLY_1|SERVER_ONLY_2/, assetFiles)
      .stdout.trim()
      .split("\n")
      .filter((line) => line.length > 0);

    expect(result).toHaveLength(0);
  });

  test("server renders matching routes", async () => {
    let res = await fixture.requestDocument("/");
    expect(res.status).toBe(200);
    expect(selectHtml(await res.text(), "#content")).toBe(`<div id="content">
  <h1>Root</h1>
  <h2>Index</h2>
  <h3>Loading...</h3>
</div>`);
  });

  test("hydrates", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    expect(await page.locator("#content h2").textContent()).toBe("Index");
    expect(await page.locator("#content h3[data-mounted]").textContent()).toBe(
      "Mounted"
    );
  });
});
