import fs from "node:fs";
import path from "node:path";
import { PassThrough } from "node:stream";
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
    import { reactRouter } from "@react-router/dev/vite";

    export default defineConfig({
      build: { manifest: true },
      plugins: [
        reactRouter({
          prerender: true,
        })
      ],
    });
  `,
  "app/root.tsx": js`
    import * as React from "react";
    import { Form, Link, Links, Meta, Outlet, Scripts, useRouteError } from "react-router";

    export function meta({ data }) {
      return [{
        title: "Root Title"
      }];
    }

    export function Layout({ children }) {
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
            <Link to="/not-found">Not Found</Link><br/>
            </nav>
            {children}
            <Scripts />
          </body>
        </html>
      );
    }

    export default function Root() {
      return <Outlet />
    }

    export function ErrorBoundary() {
      let error = useRouteError();
      let msg = 'status' in error ?
        error.status + " " + error.statusText :
        error.message;
      return <p data-error>{msg}</p>;
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

function listAllFiles(_dir: string) {
  let files: string[] = [];

  function recurse(dir: string) {
    fs.readdirSync(dir).forEach((file) => {
      // Join with posix separator for consistency
      const absolute = dir + "/" + file;
      if (fs.statSync(absolute).isDirectory()) {
        if (![".vite", "assets"].includes(file)) {
          return recurse(absolute);
        }
      } else {
        return files.push(absolute);
      }
    });
  }

  recurse(_dir);

  // Normalize *nix/windows paths
  return files.map((f) => f.replace(_dir, "").replace(/^\//, ""));
}

test.describe("Prerendering", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.afterAll(() => {
    appFixture.close();
  });

  test("Prerenders known static routes when true is specified", async () => {
    let buildStdio = new PassThrough();
    fixture = await createFixture({
      buildStdio,
      prerender: true,
      files: {
        ...files,
        "app/routes/parent.tsx": js`
          import { Outlet } from 'react-router'
          export default function Component() {
            return <Outlet/>
          }
        `,
        "app/routes/parent.child.tsx": js`
          import { Outlet } from 'react-router'
          export function loader() {
            return null;
          }
          export default function Component() {
            return <Outlet/>
          }
        `,
        "app/routes/$slug.tsx": js`
          import { Outlet } from 'react-router'
          export function loader() {
            return null;
          }
          export default function Component() {
            return <Outlet/>
          }
        `,
        "app/routes/$.tsx": js`
          import { Outlet } from 'react-router'
          export function loader() {
            return null;
          }
          export default function Component() {
            return <Outlet/>
          }
        `,
      },
    });

    let buildOutput: string;
    let chunks: Buffer[] = [];
    buildOutput = await new Promise<string>((resolve, reject) => {
      buildStdio.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      buildStdio.on("error", (err) => reject(err));
      buildStdio.on("end", () =>
        resolve(Buffer.concat(chunks).toString("utf8"))
      );
    });

    expect(buildOutput).toContain(
      [
        "⚠️ Paths with dynamic/splat params cannot be prerendered when using `prerender: true`.",
        "You may want to use the `prerender()` API to prerender the following paths:",
        "  - :slug",
        "  - *",
      ].join("\n")
    );

    appFixture = await createAppFixture(fixture);

    let clientDir = path.join(fixture.projectDir, "build", "client");
    expect(listAllFiles(clientDir).sort()).toEqual([
      "__manifest",
      "_root.data",
      "about.data",
      "about/index.html",
      "favicon.ico",
      "index.html",
      "parent/child.data",
      "parent/child/index.html",
      "parent/index.html",
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

  test("Prerenders a static array of routes", async () => {
    fixture = await createFixture({
      prerender: true,
      files: {
        ...files,
        "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { reactRouter } from "@react-router/dev/vite";

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
    expect(listAllFiles(clientDir).sort()).toEqual([
      "__manifest",
      "_root.data",
      "about.data",
      "about/index.html",
      "favicon.ico",
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

  test("Prerenders a dynamic array of routes based on the static routes", async () => {
    fixture = await createFixture({
      files: {
        ...files,
        "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { reactRouter } from "@react-router/dev/vite";

          export default defineConfig({
            build: { manifest: true },
            plugins: [
              reactRouter({
                async prerender({ getStaticPaths }) {
                  return [...getStaticPaths(), "/a", "/b"];
                },
              })
            ],
          });
        `,
        "app/routes/$slug.tsx": js`
          export function loader() {
            return null
          }
          export default function component() {
            return null;
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);

    let clientDir = path.join(fixture.projectDir, "build", "client");
    expect(listAllFiles(clientDir).sort()).toEqual([
      "__manifest",
      "_root.data",
      "a.data",
      "a/index.html",
      "about.data",
      "about/index.html",
      "b.data",
      "b/index.html",
      "favicon.ico",
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
      prerender: true,
      files,
    });
    appFixture = await createAppFixture(fixture);

    let requests: string[] = [];
    page.on("request", (request) => {
      let pathname = new URL(request.url()).pathname;
      if (pathname.endsWith(".data") || pathname.endsWith("__manifest")) {
        requests.push(pathname);
      }
    });

    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await page.waitForSelector("[data-mounted]");
    await app.clickLink("/about");
    await page.waitForSelector("[data-route]:has-text('About')");
    expect(requests).toEqual(["/__manifest", "/about.data"]);
  });

  test("Serves the prerendered HTML file alongside runtime routes", async ({
    page,
  }) => {
    fixture = await createFixture({
      // Even thogh we are prerendering, we want a running server so we can
      // hit the pre-rendered HTML file and a non-prerendered route
      prerender: false,
      files: {
        ...files,
        "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { reactRouter } from "@react-router/dev/vite";

          export default defineConfig({
            build: { manifest: true },
            plugins: [
              reactRouter({
                // Don't prerender the /not-prerendered route
                prerender: ["/", "/about"],
              })
            ],
          });
        `,
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

  test("Does not encounter header limits on large prerendered data", async ({
    page,
  }) => {
    fixture = await createFixture({
      // Even thogh we are prerendering, we want a running server so we can
      // hit the pre-rendered HTML file and a non-prerendered route
      prerender: false,
      files: {
        ...files,
        "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { reactRouter } from "@react-router/dev/vite";

          export default defineConfig({
            build: { manifest: true },
            plugins: [
              reactRouter({
                prerender: ["/", "/about"],
              })
            ],
          });
        `,
        "app/routes/about.tsx": js`
          import { useLoaderData } from 'react-router';
          export function loader({ request }) {
            return {
              prerendered: request.headers.has('X-React-Router-Prerender') ? 'yes' : 'no',
              // 24999 characters
              data: new Array(5000).fill('test').join('-'),
            };
          }

          export default function Comp() {
            let data = useLoaderData();
            return (
              <>
                <h1 data-title>Large loader</h1>
                <p data-prerendered>{data.prerendered}</p>
                <p data-length>{data.data.length}</p>
              </>
            );
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);

    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/about");
    await page.waitForSelector("[data-mounted]");
    expect(await app.getHtml("[data-title]")).toContain("Large loader");
    expect(await app.getHtml("[data-prerendered]")).toContain("yes");
    expect(await app.getHtml("[data-length]")).toBe(
      '<p data-length="true">24999</p>'
    );
  });

  test("Renders down to the proper HydrateFallback", async ({ page }) => {
    fixture = await createFixture({
      prerender: true,
      files: {
        ...files,
        "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { reactRouter } from "@react-router/dev/vite";

          export default defineConfig({
            build: { manifest: true },
            plugins: [
              reactRouter({
                prerender: ['/', '/parent', '/parent/child'],
              })
            ],
          });
        `,
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

  test("Handles 404s on data requests", async ({ page }) => {
    fixture = await createFixture({
      prerender: true,
      files: {
        ...files,
        "app/routes/$slug.tsx": js`
          import * as React  from "react";
          import { useLoaderData } from "react-router";

          export async function loader() {
            return null;
          }

          export default function Component() {
            return <h2>Slug</h2>
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);

    let requests: string[] = [];
    page.on("request", (request) => {
      let pathname = new URL(request.url()).pathname;
      if (pathname.endsWith(".data")) {
        requests.push(pathname);
      }
    });

    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await page.waitForSelector("[data-mounted]");
    await app.clickLink("/not-found");
    await page.waitForSelector("[data-error]:has-text('404 Not Found')");
    expect(requests).toEqual(["/not-found.data"]);
  });
});
