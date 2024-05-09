import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import { createProject, build } from "./helpers/vite.js";

let files = {
  "vite.config.ts": js`
    import { defineConfig } from "vite";
    import { vitePlugin as reactRouter } from "@react-router/dev";

    export default defineConfig({
      build: { manifest: true },
      plugins: [
        reactRouter({
          future: {
            unstable_singleFetch: true,
          },
          prerender: ['/', '/about'],
        })
      ],
    });
  `,
  "app/root.tsx": js`
    import * as React from "react";
    import { Form, Link, Links, Meta, Outlet, Scripts } from "react-router";

    export function meta({ data }) {
      return [{
        title: "Root Title"
      }];
    }

    export default function Root() {
      return (
        <html lang="en">
          <head>
            <Meta />
            <Links />
          </head>
          <body>
            <h1>Root</h1>
            <nav>
            <Link to="/">Home</Link><br/>
            <Link to="/about">About</Link><br/>
            </nav>
            <Outlet />
            <Scripts />
          </body>
        </html>
      );
    }
  `,
  "app/routes/_index.tsx": js`
    import * as React  from "react";
    import { useLoaderData } from "react-router-dom";

    export function meta({ data }) {
      return [{
        title: "Index Title: " + data
      }];
    }

    export async function loader() {
      return "Index Loader Data";
    }

    export default function Component() {
      let data = useLoaderData();
      const [mounted, setMounted] = React.useState(false);
      React.useEffect(() => setMounted(true), []);

      return (
        <>
          <h2 data-route>Index</h2>
          <p data-loader-data>{data}</p>
          {!mounted ? <h3>Unmounted</h3> : <h3 data-mounted>Mounted</h3>}
        </>
      );
    }
  `,
  "app/routes/about.tsx": js`
    import { useActionData, useLoaderData } from "react-router-dom";

    export function meta({ data }) {
      return [{
        title: "About Title: " + data
      }];
    }

    export async function loader() {
      return "About Loader Data";
    }

    export default function Component() {
      let data = useLoaderData();

      return (
        <>
          <h2 data-route>About</h2>
          <p data-loader-data>{data}</p>
        </>
      );
    }
  `,
};

test.describe("Prerendering", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.afterAll(() => {
    appFixture.close();
  });

  test("Prerenders a static array of routes", async () => {
    fixture = await createFixture({
      files,
    });
    appFixture = await createAppFixture(fixture);

    let clientDir = path.join(fixture.projectDir, "build", "client");
    expect(fs.readdirSync(clientDir)).toEqual([
      "_root.data",
      "about",
      "about.data",
      "assets",
      "favicon.ico",
      "index.html",
    ]);
    expect(fs.readdirSync(path.join(clientDir, "about"))).toEqual([
      "index.html",
    ]);

    let res = await fixture.requestDocument("/");
    let html = await res.text();
    expect(html).toMatch("<title>Index Title: Index Loader Data</title>");
    expect(html).toMatch("<h1>Root</h1>");
    expect(html).toMatch('<h2 data-route="true">Index</h2>');
    expect(html).toMatch('<p data-loader-data="true">Index Loader Data</p>');

    res = await fixture.requestDocument("/about");
    html = await res.text();
    expect(html).toMatch("<title>About Title: About Loader Data</title>");
    expect(html).toMatch("<h1>Root</h1>");
    expect(html).toMatch('<h2 data-route="true">About</h2>');
    expect(html).toMatch('<p data-loader-data="true">About Loader Data</p>');
  });

  test("Prerenders a dynamic array of routes", async () => {
    fixture = await createFixture({
      files: {
        ...files,
        "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { vitePlugin as reactRouter } from "@react-router/dev";

          export default defineConfig({
            build: { manifest: true },
            plugins: [
              reactRouter({
                future: {
                  unstable_singleFetch: true,
                },
                async prerender() {
                  await new Promise(r => setTimeout(r, 1));
                  return ['/', '/about'];
                },
              })
            ],
          });
        `,
      },
    });
    appFixture = await createAppFixture(fixture);

    let clientDir = path.join(fixture.projectDir, "build", "client");
    expect(fs.readdirSync(clientDir)).toEqual([
      "_root.data",
      "about",
      "about.data",
      "assets",
      "favicon.ico",
      "index.html",
    ]);
    expect(fs.readdirSync(path.join(clientDir, "about"))).toEqual([
      "index.html",
    ]);

    let res = await fixture.requestDocument("/");
    let html = await res.text();
    expect(html).toMatch("<title>Index Title: Index Loader Data</title>");
    expect(html).toMatch("<h1>Root</h1>");
    expect(html).toMatch('<h2 data-route="true">Index</h2>');
    expect(html).toMatch('<p data-loader-data="true">Index Loader Data</p>');

    res = await fixture.requestDocument("/about");
    html = await res.text();
    expect(html).toMatch("<title>About Title: About Loader Data</title>");
    expect(html).toMatch("<h1>Root</h1>");
    expect(html).toMatch('<h2 data-route="true">About</h2>');
    expect(html).toMatch('<p data-loader-data="true">About Loader Data</p>');
  });
});
