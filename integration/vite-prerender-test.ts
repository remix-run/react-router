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

let files = {
  "vite.config.ts": js`
    import { defineConfig } from "vite";
    import { vitePlugin as reactRouter } from "@react-router/dev";

    export default defineConfig({
      build: { manifest: true },
      plugins: [
        reactRouter({
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
      const [mounted, setMounted] = React.useState(false);
      React.useEffect(() => setMounted(true), []);
      return (
        <html lang="en">
          <head>
            <Meta />
            <Links />
          </head>
          <body>
            <h1>Root</h1>
            {!mounted ? <h3>Unmounted</h3> : <h3 data-mounted>Mounted</h3>}
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
    import { useLoaderData } from "react-router";

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

      return (
        <>
          <h2 data-route>Index</h2>
          <p data-loader-data>{data}</p>
        </>
      );
    }
  `,
  "app/routes/about.tsx": js`
    import { useActionData, useLoaderData } from "react-router";

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
    expect(fs.readdirSync(clientDir).sort()).toEqual([
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
    expect(fs.readdirSync(clientDir).sort()).toEqual([
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

  test("Hydrates into a navigable app", async ({ page }) => {
    fixture = await createFixture({
      files,
    });
    appFixture = await createAppFixture(fixture);

    let requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith(".data")) {
        requests.push(request.url());
      }
    });

    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await page.waitForSelector("[data-mounted]");
    await app.clickLink("/about");
    await page.waitForSelector("[data-route]:has-text('About')");
    expect(requests.length).toBe(1);
    expect(requests[0]).toMatch(/\/about.data$/);
  });

  test("Serves the prerendered HTML file", async ({ page }) => {
    fixture = await createFixture({
      files: {
        ...files,
        "app/routes/about.tsx": js`
          import { useLoaderData } from 'react-router';
          export function loader({ request }) {
            return "ABOUT-" + request.headers.has('X-React-Router-Prerender');
          }

          export default function Comp() {
            let data = useLoaderData();
            return <h1>About: <span>{data}</span></h1>
          }
        `,
        "app/routes/not-prerendered.tsx": js`
          import { useLoaderData } from 'react-router';
          export function loader({ request }) {
            return "NOT-PRERENDERED-" + request.headers.has('X-React-Router-Prerender');
          }

          export default function Comp() {
            let data = useLoaderData();
            return <h1>Not-Prerendered: <span>{data}</span></h1>
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);

    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/about");
    await page.waitForSelector("[data-mounted]");
    expect(await app.getHtml()).toContain("<span>ABOUT-true</span>");

    await app.goto("/not-prerendered");
    await page.waitForSelector("[data-mounted]");
    expect(await app.getHtml()).toContain("<span>NOT-PRERENDERED-false</span>");
  });

  test("Renders/ down to the proper HydrateFallback", async ({ page }) => {
    fixture = await createFixture({
      files: {
        ...files,
        "app/routes/parent.tsx": js`
          import { Outlet, useLoaderData } from 'react-router';
          export function loader() {
            return "PARENT";
          }
          export default function Comp() {
            let data = useLoaderData();
            return <><p>Parent: {data}</p><Outlet/></>
          }
        `,
        "app/routes/parent.child.tsx": js`
          import { Outlet, useLoaderData } from 'react-router';
          export function loader() {
            return "CHILD";
          }
          export function HydrateFallback() {
            return <p>Child loading...</p>
          }
          export default function Comp() {
            let data = useLoaderData();
            return <><p>Child: {data}</p><Outlet/></>
          }
        `,
        "app/routes/parent.child._index.tsx": js`
          import { Outlet, useLoaderData } from 'react-router';
          export function clientLoader() {
            return "INDEX";
          }
          export default function Comp() {
            let data = useLoaderData();
            return <><p>Index: {data}</p><Outlet/></>
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);

    let res = await fixture.requestDocument("/parent/child");
    let html = await res.text();
    expect(html).toContain("<p>Child loading...</p>");

    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/parent/child");
    await page.waitForSelector("[data-mounted]");
    expect(await app.getHtml()).toMatch("Index: INDEX");
  });
});
