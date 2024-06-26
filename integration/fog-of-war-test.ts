import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

function getFiles() {
  return {
    "app/root.tsx": js`
      import * as React from "react";
      import { Link, Links, Meta, Outlet, Scripts } from "react-router";
      export default function Root() {
        let [showLink, setShowLink] = React.useState(false);
        return (
          <html lang="en">
            <head>
              <Meta />
              <Links />
            </head>
            <body>
              <Link to="/">Home</Link><br/>
              <Link to="/a">/a</Link><br/>
              <button onClick={() => setShowLink(true)}>Show Link</button>
              {showLink ? <Link to="/a/b">/a/b</Link> : null}
              <Outlet />
              <Scripts />
            </body>
          </html>
        );
      }
    `,

    "app/routes/_index.tsx": js`
      export default function Index() {
        return <h1 id="index">Index</h1>
      }
    `,

    "app/routes/a.tsx": js`
      import { Link, Outlet, useLoaderData } from "react-router";
      export function loader({ request }) {
        return { message: "A LOADER" };
      }
      export default function Index() {
        let data = useLoaderData();
        return (
          <>
            <h1 id="a">A: {data.message}</h1>
            <Link to="/a/b">/a/b</Link>
            <Outlet/>
          </>
        )
      }
    `,
    "app/routes/a.b.tsx": js`
      import { Outlet, useLoaderData } from "react-router";
      export function loader({ request }) {
        return { message: "B LOADER" };
      }
      export default function Index() {
        let data = useLoaderData();
        return (
          <>
            <h2 id="b">B: {data.message}</h2>
            <Outlet/>
          </>
        )
      }
    `,
    "app/routes/a.b.c.tsx": js`
      import { Outlet, useLoaderData } from "react-router";
      export function loader({ request }) {
        return { message: "C LOADER" };
      }
      export default function Index() {
        let data = useLoaderData();
        return <h3 id="c">C: {data.message}</h3>
      }
    `,
  };
}

test.describe("Fog of War", () => {
  let oldConsoleError: typeof console.error;

  test.beforeEach(() => {
    oldConsoleError = console.error;
  });

  test.afterEach(() => {
    console.error = oldConsoleError;
  });

  test("loads minimal manifest on initial load", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...getFiles(),
        "app/entry.client.tsx": js`
          import { HydratedRouter } from "react-router";
          import { startTransition, StrictMode } from "react";
          import { hydrateRoot } from "react-dom/client";
          startTransition(() => {
            hydrateRoot(
              document,
              <StrictMode>
                <HydratedRouter discover={"none"} />
              </StrictMode>
            );
          });
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);
    let res = await fixture.requestDocument("/");
    let html = await res.text();

    expect(html).toContain('"root": {');
    expect(html).toContain('"routes/_index": {');
    expect(html).not.toContain('"routes/a"');

    // Linking to A loads A and succeeds
    await app.goto("/", true);
    await app.clickLink("/a");
    await page.waitForSelector("#a");
    expect(await app.getHtml("#a")).toBe(`<h1 id="a">A: A LOADER</h1>`);
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__remixManifest.routes)
      )
    ).toContain("routes/a");
  });

  test("prefetches initially rendered links", async ({ page }) => {
    let fixture = await createFixture({
      files: getFiles(),
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/", true);
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__remixManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a"]);

    await app.clickLink("/a");
    await page.waitForSelector("#a");
    expect(await app.getHtml("#a")).toBe(`<h1 id="a">A: A LOADER</h1>`);
  });

  test("prefetches links rendered via navigations", async ({ page }) => {
    let fixture = await createFixture({
      files: getFiles(),
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/", true);
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__remixManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a"]);

    await app.clickLink("/a");
    await page.waitForSelector("#a");

    await page.waitForFunction(
      () => (window as any).__remixManifest.routes["routes/a.b"]
    );

    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__remixManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a", "routes/a.b"]);
  });

  test("prefetches links rendered via in-page stateful updates", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: getFiles(),
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/", true);
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__remixManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a"]);

    await app.clickElement("button");
    await page.waitForFunction(
      () => (window as any).__remixManifest.routes["routes/a.b"]
    );

    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__remixManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a", "routes/a.b"]);
  });

  test("prefetches links who opt-into [data-discover] via an in-page stateful update", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import { Outlet, Scripts } from "react-router";
          export default function Root() {
            return (
              <html lang="en">
                <head> </head>
                <body>
                  <Outlet />
                  <Scripts />
                </body>
              </html>
            );
          }
        `,
        "app/routes/_index.tsx": js`
          import * as React from 'react';
          import { Link, Outlet, useLoaderData } from "react-router";
          export default function Index() {
            let [discover, setDiscover] = React.useState(false)
            return (
              <>
                <Link to="/a" discover={discover ? "render" : "none"}>/a</Link>
                <button onClick={() => setDiscover(true)}>Toggle</button>
              </>
            )
          }
        `,
        "app/routes/a.tsx": js`
          export default function Index() {
            return <h1 id="a">A</h1>
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/", true);
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__remixManifest.routes)
      )
    ).toEqual(["root", "routes/_index"]);

    await app.clickElement("button");
    await page.waitForFunction(
      () => (window as any).__remixManifest.routes["routes/a"]
    );

    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__remixManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a"]);
  });

  test('does not prefetch links with discover="none"', async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...getFiles(),
        "app/routes/a.tsx": js`
          import { Link, Outlet, useLoaderData } from "react-router";
          export function loader({ request }) {
            return { message: "A LOADER" };
          }
          export default function Index() {
            let data = useLoaderData();
            return (
              <>
                <h1 id="a">A: {data.message}</h1>
                <Link to="/a/b" discover="none">/a/b</Link>
                <Outlet/>
              </>
            )
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/", true);
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__remixManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a"]);

    await app.clickLink("/a");
    await page.waitForSelector("#a");
    await new Promise((resolve) => setTimeout(resolve, 250));

    // /a/b is not discovered yet even thought it's rendered
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__remixManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a"]);

    // /a/b gets discovered on click
    await app.clickLink("/a/b");
    await page.waitForSelector("#b");

    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__remixManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a", "routes/a.b"]);
  });

  test("prefetches `routes/_index` when SSR-ing a deep route for client-side links to '/'", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import { Outlet, Scripts } from "react-router";
          export default function Root() {
            return (
              <html lang="en">
                <head></head>
                <body>
                  <Outlet />
                  <Scripts />
                </body>
              </html>
            );
          }
        `,

        "app/routes/_index.tsx": js`
          export default function Index() {
            return <h1 id="index">Index</h1>
          }
        `,
        "app/routes/deep.tsx": js`
          import { Link } from "react-router";
          export default function Component() {
            return (
              <>
                <h1>Deep</h1>
                <Link to="/" discover="none">Home</Link>
              </>
            )
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/deep", true);
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__remixManifest.routes)
      )
    ).toEqual(["routes/_index", "root", "routes/deep"]);

    await app.clickLink("/");
    await page.waitForSelector("#index");
    expect(await app.getHtml("#index")).toMatch(`Index`);
  });
});
