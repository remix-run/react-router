import { PassThrough } from "node:stream";
import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { createFixtureProject } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

test.describe("flat routes", () => {
  let IGNORED_ROUTE = "ignore-me-pls";
  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "vite.config.js": `
          import { defineConfig } from "vite";
          import { vitePlugin as remix } from "@remix-run/dev";

          export default defineConfig({
            plugins: [remix({
              ignoredRouteFiles: [${JSON.stringify(`**/${IGNORED_ROUTE}.*`)}],
            })],
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
          export default function () {
            return <h2>Index</h2>;
          }
        `,

        "app/routes/folder/route.tsx": js`
          export default function () {
            return <h2>Folder (Route.jsx)</h2>;
          }
        `,

        "app/routes/folder2/index.tsx": js`
          export default function () {
            return <h2>Folder (Index.jsx)</h2>;
          }
        `,

        "app/routes/flat.file.tsx": js`
          export default function () {
            return <h2>Flat File</h2>;
          }
        `,

        "app/routes/.dotfile": `
          DOTFILE SHOULD BE IGNORED
        `,

        "app/routes/.route-with-unescaped-leading-dot.tsx": js`
          throw new Error("This file should be ignored as a route");
        `,

        "app/routes/[.]route-with-escaped-leading-dot.tsx": js`
          export default function () {
            return <h2>Route With Escaped Leading Dot</h2>;
          }
        `,

        "app/routes/dashboard/route.tsx": js`
          import { Outlet } from "@remix-run/react";

          export default function () {
            return (
              <>
                <h2>Dashboard Layout</h2>
                <Outlet />
              </>
            )
          }
        `,

        "app/routes/dashboard._index/route.tsx": js`
          export default function () {
            return <h3>Dashboard Index</h3>;
          }
        `,

        [`app/routes/${IGNORED_ROUTE}.jsx`]: js`
          export default function () {
            return <h2>i should 404</h2>;
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    runTests();
  });

  test.describe("with JavaScript", () => {
    test.use({ javaScriptEnabled: true });
    runTests();
  });

  function runTests() {
    test("renders matching routes (index)", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      expect(await app.getHtml("#content")).toBe(`<div id="content">
  <h1>Root</h1>
  <h2>Index</h2>
</div>`);
    });

    test("renders matching routes (folder route.jsx)", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/folder");
      expect(await app.getHtml("#content")).toBe(`<div id="content">
  <h1>Root</h1>
  <h2>Folder (Route.jsx)</h2>
</div>`);
    });

    test("renders matching routes (folder index.jsx)", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/folder2");
      expect(await app.getHtml("#content")).toBe(`<div id="content">
  <h1>Root</h1>
  <h2>Folder (Index.jsx)</h2>
</div>`);
    });

    test("renders matching routes (flat file)", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/flat/file");
      expect(await app.getHtml("#content")).toBe(`<div id="content">
  <h1>Root</h1>
  <h2>Flat File</h2>
</div>`);
    });

    test("renders matching routes (route with escaped leading dot)", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/.route-with-escaped-leading-dot");
      expect(await app.getHtml("#content")).toBe(`<div id="content">
  <h1>Root</h1>
  <h2>Route With Escaped Leading Dot</h2>
</div>`);
    });

    test("renders matching routes (nested)", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/dashboard");
      expect(await app.getHtml("#content")).toBe(`<div id="content">
  <h1>Root</h1>
  <h2>Dashboard Layout</h2>
  <h3>Dashboard Index</h3>
</div>`);
    });
  }

  test("allows ignoredRouteFiles to be configured", async () => {
    let response = await fixture.requestDocument("/" + IGNORED_ROUTE);

    expect(response.status).toBe(404);
  });
});

test.describe("emits warnings for route conflicts", async () => {
  let buildStdio = new PassThrough();
  let buildOutput: string;

  let originalConsoleLog = console.log;
  let originalConsoleWarn = console.warn;
  let originalConsoleError = console.error;

  test.beforeAll(async () => {
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    await createFixtureProject({
      buildStdio,
      files: {
        "routes/_dashboard._index.tsx": js`
          export default function () {
            return <p>routes/_dashboard._index</p>;
          }
        `,
        "app/routes/_index.tsx": js`
          export default function () {
            return <p>routes._index</p>;
          }
        `,
        "app/routes/_landing._index.tsx": js`
          export default function () {
            return <p>routes/_landing._index</p>;
          }
        `,
      },
    });

    let chunks: Buffer[] = [];
    buildOutput = await new Promise<string>((resolve, reject) => {
      buildStdio.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      buildStdio.on("error", (err) => reject(err));
      buildStdio.on("end", () =>
        resolve(Buffer.concat(chunks).toString("utf8"))
      );
    });
  });

  test.afterAll(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  test("warns about conflicting routes", () => {
    console.log(buildOutput);
    expect(buildOutput).toContain(`⚠️ Route Path Collision: "/"`);
  });
});

test.describe("", () => {
  let buildStdio = new PassThrough();
  let buildOutput: string;

  let originalConsoleLog = console.log;
  let originalConsoleWarn = console.warn;
  let originalConsoleError = console.error;

  test.beforeAll(async () => {
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    await createFixtureProject({
      buildStdio,
      files: {
        "app/routes/_index/route.tsx": js``,
        "app/routes/_index/utils.ts": js``,
      },
    });

    let chunks: Buffer[] = [];
    buildOutput = await new Promise<string>((resolve, reject) => {
      buildStdio.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      buildStdio.on("error", (err) => reject(err));
      buildStdio.on("end", () =>
        resolve(Buffer.concat(chunks).toString("utf8"))
      );
    });
  });

  test.afterAll(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  test("doesn't emit a warning for nested index files with co-located files", () => {
    expect(buildOutput).not.toContain(`Route Path Collision`);
  });
});

test.describe("pathless routes and route collisions", () => {
  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import { Link, Outlet, Scripts, useMatches } from "@remix-run/react";

          export default function App() {
            let matches = 'Number of matches: ' + useMatches().length;
            return (
              <html lang="en">
                <body>
                  <nav>
                    <Link to="/nested">/nested</Link>
                    <br />
                    <Link to="/nested/foo">/nested/foo</Link>
                    <br />
                  </nav>
                  <p>{matches}</p>
                  <Outlet />
                  <Scripts />
                </body>
              </html>
            );
          }
        `,
        "app/routes/nested._index.tsx": js`
          export default function Index() {
            return <h1>Index</h1>;
          }
        `,
        "app/routes/nested._pathless.tsx": js`
          import { Outlet } from "@remix-run/react";

          export default function Layout() {
            return (
              <>
                <div>Pathless Layout</div>
                <Outlet />
              </>
            );
          }
        `,
        "app/routes/nested._pathless.foo.tsx": js`
          export default function Foo() {
            return <h1>Foo</h1>;
          }
        `,
        "app/routes/nested._pathless2.tsx": js`
          import { Outlet } from "@remix-run/react";

          export default function Layout() {
            return (
              <>
                <div>Pathless 2 Layout</div>
                <Outlet />
              </>
            );
          }
        `,
        "app/routes/nested._pathless2.bar.tsx": js`
          export default function Bar() {
            return <h1>Bar</h1>;
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(async () => appFixture.close());

  test.describe("with JavaScript", () => {
    runTests();
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    runTests();
  });

  /**
   * Routes for this test look like this, for reference for the matches assertions:
   *
   * <Routes>
   *   <Route file="root.jsx">
   *     <Route path="nested" file="routes/nested._pathless.jsx">
   *       <Route path="foo" file="routes/nested._pathless/foo.jsx" />
   *     </Route>
   *     <Route path="nested" index file="routes/nested._index.jsx" />
   *     <Route index file="routes/_index.jsx" />
   *   </Route>
   * </Routes>
   */

  function runTests() {
    test("displays index page and not pathless layout page", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/nested");
      expect(await app.getHtml()).toMatch("Index");
      expect(await app.getHtml()).not.toMatch("Pathless Layout");
      expect(await app.getHtml()).toMatch("Number of matches: 2");
    });

    test("displays page inside of pathless layout", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/nested/foo");
      expect(await app.getHtml()).not.toMatch("Index");
      expect(await app.getHtml()).toMatch("Pathless Layout");
      expect(await app.getHtml()).toMatch("Foo");
      expect(await app.getHtml()).toMatch("Number of matches: 3");
    });

    // This also asserts that we support multiple sibling pathless route layouts
    test("displays page inside of second pathless layout", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/nested/bar");
      expect(await app.getHtml()).not.toMatch("Index");
      expect(await app.getHtml()).toMatch("Pathless 2 Layout");
      expect(await app.getHtml()).toMatch("Bar");
      expect(await app.getHtml()).toMatch("Number of matches: 3");
    });
  }
});
