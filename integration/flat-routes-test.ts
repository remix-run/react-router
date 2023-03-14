import { PassThrough } from "node:stream";
import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { createFixtureProject } from "./helpers/create-fixture";
import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import { flatRoutesWarning } from "../packages/remix-dev/config";

let fixture: Fixture;
let appFixture: AppFixture;

test.describe("flat routes", () => {
  test.beforeAll(async () => {
    fixture = await createFixture({
      future: { v2_routeConvention: true },
      files: {
        "app/root.jsx": js`
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

        "app/routes/_index.jsx": js`
          export default function () {
            return <h2>Index</h2>;
          }
        `,

        "app/routes/folder/route.jsx": js`
          export default function () {
            return <h2>Folder (Route.jsx)</h2>;
          }
        `,

        "app/routes/folder2/index.jsx": js`
          export default function () {
            return <h2>Folder (Index.jsx)</h2>;
          }
        `,

        "app/routes/flat.file.jsx": js`
          export default function () {
            return <h2>Flat File</h2>;
          }
        `,

        "app/routes/dashboard/route.jsx": js`
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

        "app/routes/dashboard._index/route.jsx": js`
          export default function () {
            return <h3>Dashboard Index</h3>;
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
});

test.describe("warns when v1 routesConvention is used", () => {
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
      future: { v2_routeConvention: false },
      files: {
        "routes/index.tsx": js`
          export default function () {
            return <p>routes/index</p>;
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
    expect(buildOutput).toContain(flatRoutesWarning);
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
      future: { v2_routeConvention: true },
      files: {
        "routes/_dashboard._index.tsx": js`
          export default function () {
            return <p>routes/_dashboard._index</p>;
          }
        `,
        "app/routes/_index.jsx": js`
          export default function () {
            return <p>routes._index</p>;
          }
        `,
        "app/routes/_landing._index.jsx": js`
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
