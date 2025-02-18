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
          import { HydratedRouter } from "react-router/dom";
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
        Object.keys((window as any).__reactRouterManifest.routes)
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
        Object.keys((window as any).__reactRouterManifest.routes)
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
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a"]);

    await app.clickLink("/a");
    await page.waitForSelector("#a");

    await page.waitForFunction(
      () => (window as any).__reactRouterManifest.routes["routes/a.b"]
    );

    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
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
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a"]);

    await app.clickElement("button");
    await page.waitForFunction(
      () => (window as any).__reactRouterManifest.routes["routes/a.b"]
    );

    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
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
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index"]);

    await app.clickElement("button");
    await page.waitForFunction(
      () => (window as any).__reactRouterManifest.routes["routes/a"]
    );

    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
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
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a"]);

    await app.clickLink("/a");
    await page.waitForSelector("#a");
    await new Promise((resolve) => setTimeout(resolve, 250));

    // /a/b is not discovered yet even thought it's rendered
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a"]);

    // /a/b gets discovered on click
    await app.clickLink("/a/b");
    await page.waitForSelector("#b");

    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a", "routes/a.b"]);
  });

  test("prefetches initially rendered forms", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...getFiles(),
        "app/root.tsx": js`
          import * as React from "react";
          import { Form, Links, Meta, Outlet, Scripts } from "react-router";
          export default function Root() {
            let [showLink, setShowLink] = React.useState(false);
            return (
              <html lang="en">
                <head>
                  <Meta />
                  <Links />
                </head>
                <body>
                  <Form method="post" action="/a">
                    <button type="submit">Submit</button>
                  </Form>
                  <Outlet />
                  <Scripts />
                </body>
              </html>
            );
          }
        `,
        "app/routes/a.tsx": js`
          import { useActionData } from "react-router";
          export function action() {
            return { message: "A ACTION" };
          }
          export default function Index() {
            let actionData = useActionData();
            return <h1 id="a">A: {actionData.message}</h1>
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/", true);
    await page.waitForFunction(
      () => (window as any).__reactRouterManifest.routes["routes/a"]
    );
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a"]);

    await app.clickSubmitButton("/a");
    await page.waitForSelector("#a");
    expect(await app.getHtml("#a")).toBe(`<h1 id="a">A: A ACTION</h1>`);
  });

  test("prefetches forms rendered via navigations", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...getFiles(),
        "app/routes/a.tsx": js`
          import { Form } from "react-router";
          export default function Component() {
            return (
              <Form method="post" action="/a/b">
                <button type="submit">Submit</button>
              </Form>
            );
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/", true);
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a"]);

    await app.clickLink("/a");
    await page.waitForSelector("form");

    await page.waitForFunction(
      () => (window as any).__reactRouterManifest.routes["routes/a.b"]
    );

    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a", "routes/a.b"]);
  });

  test("prefetches root index child when SSR-ing a deep route", async ({
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

    let manifestRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/__manifest")) {
        manifestRequests.push(req.url());
      }
    });

    await app.goto("/deep", true);
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/deep", "routes/_index"]);

    // Without pre-loading the index, we'd "match" `/` to just the root route
    // client side and never fetch the `routes/_index` route
    await app.clickLink("/");
    await page.waitForSelector("#index");
    expect(await app.getHtml("#index")).toMatch(`Index`);

    expect(manifestRequests.length).toBe(0);
  });

  test("prefetches ancestor index children when SSR-ing a deep route", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import { Link, Outlet, Scripts } from "react-router";
          export default function Root() {
            return (
              <html lang="en">
                <head></head>
                <body >
                  <nav>
                    <Link to="/parent" discover="none">Parent Index</Link>
                    <Link to="/parent/child" discover="none">Child Index</Link>
                  </nav>
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
        "app/routes/parent.tsx": js`
          import { Outlet } from "react-router";
          export default function Component() {
            return (
              <>
                <h1 id="parent">Parent</h1>
                <Outlet />
              </>
            )
          }
        `,
        "app/routes/parent._index.tsx": js`
          export default function Component() {
            return <h2 id="parent-index">Parent Index</h2>;
          }
        `,
        "app/routes/parent.child.tsx": js`
          import { Outlet } from "react-router";
          export default function Component() {
            return (
              <>
                <h2 id="child">Child</h2>
                <Outlet />
              </>
            )
          }
        `,
        "app/routes/parent.child._index.tsx": js`
          export default function Component() {
            return <h3 id="child-index">Child Index</h3>;
          }
        `,
        "app/routes/parent.child.grandchild.tsx": js`
          export default function Component() {
            return <h3 id="grandchild">Grandchild</h3>;
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    let manifestRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/__manifest")) {
        manifestRequests.push(req.url());
      }
    });

    await app.goto("/parent/child/grandchild", true);
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual([
      "root",
      "routes/parent",
      "routes/parent.child",
      "routes/parent.child.grandchild",
      "routes/_index",
      "routes/parent.child._index",
      "routes/parent._index",
    ]);

    // Without pre-loading the index, we'd "match" `/parent/child` to just the
    // parent and child routes client side and never fetch the
    // `routes/parent.child._index` route
    await app.clickLink("/parent/child");
    await page.waitForSelector("#child-index");
    expect(await app.getHtml("#parent")).toMatch("Parent");
    expect(await app.getHtml("#child")).toMatch("Child");
    expect(await app.getHtml("#child-index")).toMatch(`Child Index`);

    await app.clickLink("/parent");
    await page.waitForSelector("#parent-index");
    expect(await app.getHtml("#parent")).toMatch(`Parent`);
    expect(await app.getHtml("#parent-index")).toMatch(`Parent Index`);

    expect(manifestRequests.length).toBe(0);
  });

  test("prefetches ancestor pathless children when SSR-ing a deep route", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import { Link, Outlet, Scripts } from "react-router";
          export default function Root() {
            return (
              <html lang="en">
                <head></head>
                <body >
                  <nav>
                    <Link to="/parent" discover="none">Parent Index</Link>
                    <Link to="/parent/child2" discover="none">Child2</Link>
                  </nav>
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
        "app/routes/parent.tsx": js`
          import { Outlet } from "react-router";
          export default function Component() {
            return (
              <>
                <h1 id="parent">Parent</h1>
                <Outlet />
              </>
            )
          }
        `,
        "app/routes/parent.child.tsx": js`
          export default function Component() {
            return <h2 id="child">Child</h2>;
          }
        `,
        "app/routes/parent._a.tsx": js`
          import { Outlet } from 'react-router';
          export default function Component() {
            return <div id="a"><Outlet/></div>;
          }
        `,
        "app/routes/parent._a._b._index.tsx": js`
          export default function Component() {
            return <h2 id="parent-index">Parent Pathless Index</h2>;
          }
        `,
        "app/routes/parent._a._b.tsx": js`
          import { Outlet } from 'react-router';
          export default function Component() {
            return <div id="b"><Outlet/></div>;
          }
        `,
        "app/routes/parent._a._b.child2.tsx": js`
          export default function Component() {
            return <h2 id="child2">Child 2</h2>;
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    let manifestRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/__manifest")) {
        manifestRequests.push(req.url());
      }
    });

    await app.goto("/parent/child", true);
    expect(await app.getHtml("#child")).toMatch("Child");
    expect(await page.$("#a")).toBeNull();
    expect(await page.$("#b")).toBeNull();

    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual([
      "root",
      "routes/parent",
      "routes/parent.child",
      "routes/_index",
      "routes/parent._a",
      "routes/parent._a._b",
      "routes/parent._a._b._index",
    ]);
    expect(manifestRequests).toEqual([]);

    // Without pre-loading the index, we'd "match" `/parent` to just the
    // parent route client side and never fetch the children pathless/index routes
    await app.clickLink("/parent");
    await page.waitForSelector("#parent-index");
    expect(await page.$("#a")).not.toBeNull();
    expect(await page.$("#b")).not.toBeNull();
    expect(await app.getHtml("#parent")).toMatch("Parent");
    expect(await app.getHtml("#parent-index")).toMatch("Parent Pathless Index");
    expect(manifestRequests.length).toBe(0);

    // This will require a new fetch for the child2 portion
    await app.clickLink("/parent/child2");
    await page.waitForSelector("#child2");
    expect(await app.getHtml("#parent")).toMatch(`Parent`);
    expect(await app.getHtml("#child2")).toMatch(`Child 2`);
    expect(manifestRequests).toEqual([
      expect.stringMatching(/\/__manifest\?p=%2Fparent%2Fchild2&version=/),
    ]);
  });

  test("detects higher-ranking static routes on the server when a slug match is already known by the client", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import { Link, Outlet, Scripts } from "react-router";
          export default function Root() {
            return (
              <html lang="en">
                <head></head>
                <body >
                  <nav>
                    <Link to="/something">/something</Link>
                  </nav>
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
        "app/routes/$slug.tsx": js`
          import { Link } from "react-router";
          export default function Component() {
            return (
              <>
                <h2 id="slug">Slug</h2>;
                <Link to="/static" discover="none">Go to /static</Link>
              </>
            );
          }
        `,
        "app/routes/static.tsx": js`
          export default function Component() {
            return <h2 id="static">Static</h2>;
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    let manifestRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/__manifest")) {
        manifestRequests.push(req.url());
      }
    });

    await app.goto("/", true);
    expect(await app.getHtml("#index")).toMatch("Index");
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/$slug"]);
    expect(manifestRequests).toEqual([
      expect.stringMatching(/\/__manifest\?p=%2Fsomething&version=/),
    ]);
    manifestRequests = [];

    await app.clickLink("/something");
    await page.waitForSelector("#slug");
    expect(await app.getHtml("#slug")).toMatch("Slug");
    expect(manifestRequests).toEqual([]);

    // This will require a new fetch for the /static route
    await app.clickLink("/static");
    await page.waitForSelector("#static");
    expect(await app.getHtml("#static")).toMatch("Static");
    expect(manifestRequests).toEqual([
      expect.stringMatching(/\/__manifest\?p=%2Fstatic&version=/),
    ]);
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/$slug", "routes/static"]);
  });

  test("detects higher-ranking static routes on the server when a splat match is already known by the client", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import { Link, Outlet, Scripts } from "react-router";
          export default function Root() {
            return (
              <html lang="en">
                <head></head>
                <body >
                  <nav>
                    <Link to="/something">/something</Link>
                  </nav>
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
        "app/routes/$.tsx": js`
          import { Link } from "react-router";
          export default function Component() {
            return (
              <>
                <h2 id="splat">Splat</h2>;
                <Link to="/static" discover="none">Go to /static</Link>
              </>
            );
          }
        `,
        "app/routes/static.tsx": js`
          export default function Component() {
            return <h2 id="static">Static</h2>;
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    let manifestRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/__manifest")) {
        manifestRequests.push(req.url());
      }
    });

    await app.goto("/", true);
    expect(await app.getHtml("#index")).toMatch("Index");
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/$"]);
    expect(manifestRequests).toEqual([
      expect.stringMatching(/\/__manifest\?p=%2Fsomething&version=/),
    ]);
    manifestRequests = [];

    await app.clickLink("/something");
    await page.waitForSelector("#splat");
    expect(await app.getHtml("#splat")).toMatch("Splat");
    expect(manifestRequests).toEqual([]);

    // This will require a new fetch for the /static route
    await app.clickLink("/static");
    await page.waitForSelector("#static");
    expect(await app.getHtml("#static")).toMatch("Static");
    expect(manifestRequests).toEqual([
      expect.stringMatching(/\/__manifest\?p=%2Fstatic&version=/),
    ]);
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/$", "routes/static"]);
  });

  test("does not re-request for previously discovered slug routes", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import { Link, Outlet, Scripts } from "react-router";
          export default function Root() {
            return (
              <html lang="en">
                <head></head>
                <body >
                  <nav>
                    <Link to="/" discover="none">Go to /</Link>
                    <Link to="/a" discover="none">Go to /a</Link>
                    <Link to="/b" discover="none">Go to /b</Link>
                  </nav>
                  <Outlet />
                  <Scripts />
                  </body>
              </html>
            );
          }
        `,

        "app/routes/_index.tsx": js`
          export default function Index() {
            return <h1 id="index">Index</h1>;
          }
        `,
        "app/routes/$slug.tsx": js`
          import { Link, useParams } from "react-router";
          export default function Component() {
            let params = useParams();
            return <h2 id="slug">Slug: {params.slug}</h2>;
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    let manifestRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/__manifest")) {
        manifestRequests.push(req.url());
      }
    });

    await app.goto("/", true);
    expect(await app.getHtml("#index")).toMatch("Index");
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index"]);
    expect(manifestRequests.length).toBe(0);

    // Click /a which will discover via a manifest request
    await app.clickLink("/a");
    await page.waitForSelector("#slug");
    expect(await app.getHtml("#slug")).toMatch("Slug: a");
    expect(manifestRequests).toEqual([
      expect.stringMatching(/\/__manifest\?p=%2Fa&version=/),
    ]);
    manifestRequests = [];

    // Go back home
    await app.clickLink("/");
    await page.waitForSelector("#index");
    expect(manifestRequests).toEqual([]);

    // Click /a again which will not re-discover
    await app.clickLink("/a");
    await page.waitForSelector("#slug");
    expect(await app.getHtml("#slug")).toMatch("Slug: a");
    expect(manifestRequests).toEqual([]);
    manifestRequests = [];

    // Click /b which will need to discover
    await app.clickLink("/b");
    await page.waitForSelector("#slug");
    expect(await app.getHtml("#slug")).toMatch("Slug: b");
    expect(manifestRequests).toEqual([
      expect.stringMatching(/\/__manifest\?p=%2Fb&version=/),
    ]);
  });

  test("does not re-request for previously discovered splat routes", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import { Link, Outlet, Scripts } from "react-router";
          export default function Root() {
            return (
              <html lang="en">
                <head></head>
                <body >
                  <nav>
                    <Link to="/" discover="none">Go to /</Link>
                    <Link to="/a" discover="none">Go to /a</Link>
                    <Link to="/b/c" discover="none">Go to /b/c</Link>
                  </nav>
                  <Outlet />
                  <Scripts />
                  </body>
              </html>
            );
          }
        `,

        "app/routes/_index.tsx": js`
          export default function Index() {
            return <h1 id="index">Index</h1>;
          }
        `,
        "app/routes/$.tsx": js`
          import { Link, useParams } from "react-router";
          export default function Component() {
            let params = useParams();
            return <h2 id="splat">Splat: {params["*"]}</h2>;
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    let manifestRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/__manifest")) {
        manifestRequests.push(req.url());
      }
    });

    await app.goto("/", true);
    expect(await app.getHtml("#index")).toMatch("Index");
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index"]);
    expect(manifestRequests.length).toBe(0);

    // Click /a which will discover via a manifest request
    await app.clickLink("/a");
    await page.waitForSelector("#splat");
    expect(await app.getHtml("#splat")).toMatch("Splat: a");
    expect(manifestRequests).toEqual([
      expect.stringMatching(/\/__manifest\?p=%2Fa&version=/),
    ]);
    manifestRequests = [];

    // Go back home
    await app.clickLink("/");
    await page.waitForSelector("#index");
    expect(manifestRequests).toEqual([]);

    // Click /a again which will not re-discover
    await app.clickLink("/a");
    await page.waitForSelector("#splat");
    expect(await app.getHtml("#splat")).toMatch("Splat: a");
    expect(manifestRequests).toEqual([]);
    manifestRequests = [];

    // Click /b which will need to discover
    await app.clickLink("/b/c");
    await page.waitForSelector("#splat");
    expect(await app.getHtml("#splat")).toMatch("Splat: b/c");
    expect(manifestRequests).toEqual([
      expect.stringMatching(/\/__manifest\?p=%2Fb%2Fc&version=/),
    ]);
  });

  test("does not re-request for previously navigated 404 routes", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import { Link, Outlet, Scripts } from "react-router";
          export function Layout({ children }) {
            return (
              <html lang="en">
                <head></head>
                <body >
                  <nav>
                    <Link to="/" discover="none">Go to /</Link>
                    <Link to="/something" discover="none">Go to /something</Link>
                    <Link to="/not/a/path" discover="none">Go to /not/a/path</Link>
                  </nav>
                  {children}
                  <Scripts />
                  </body>
              </html>
            );
          }
          export default function Root() {
            return <Outlet />;
          }
          export function ErrorBoundary() {
            return <h1 id="error">Error</h1>;
          }
        `,

        "app/routes/_index.tsx": js`
          export default function Index() {
            return <h1 id="index">Index</h1>;
          }
        `,
        "app/routes/$slug.tsx": js`
          import { Link, useParams } from "react-router";
          export default function Component() {
            let params = useParams();
            return <h2 id="slug">Slug: {params.slug}</h2>;
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    let manifestRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/__manifest")) {
        manifestRequests.push(req.url());
      }
    });

    await app.goto("/", true);
    expect(await app.getHtml("#index")).toMatch("Index");
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index"]);
    expect(manifestRequests.length).toBe(0);

    // Click a 404 link which will try to discover via a manifest request
    await app.clickLink("/not/a/path");
    await page.waitForSelector("#error");
    expect(manifestRequests).toEqual([
      expect.stringMatching(/\/__manifest\?p=%2Fnot%2Fa%2Fpath&version=/),
    ]);
    manifestRequests = [];

    // Go to a valid slug route
    await app.clickLink("/something");
    await page.waitForSelector("#slug");
    expect(manifestRequests).toEqual([
      expect.stringMatching(/\/__manifest\?p=%2Fsomething&version=/),
    ]);
    manifestRequests = [];

    // Click the same 404 link again which will not re-discover
    await app.clickLink("/not/a/path");
    await page.waitForSelector("#error");
    expect(manifestRequests).toEqual([]);
  });

  test("skips prefetching if the URL gets too large", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...getFiles(),
        "app/routes/_index.tsx": js`
          import { Link } from "react-router";
          export default function Index() {
            return (
              <>
                <h1 id="index">Index</h1>
                {/* 400 links * ~19 chars per link > our 7198 char URL limit */}
                {...new Array(400).fill(null).map((el, i) => (
                  <Link to={"/dummy-link-" + i}>{i}</Link>
                ))}
              </>
            );
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    let manifestRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/__manifest")) {
        manifestRequests.push(req.url());
      }
    });

    await app.goto("/", true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(manifestRequests.length).toBe(0);

    await app.clickLink("/a");
    await page.waitForSelector("#a");
    expect(await app.getHtml("#a")).toMatch("A LOADER");
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/_index", "routes/a"]);
  });

  test("includes a version query parameter as a cachebuster", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        ...getFiles(),
        "app/routes/_index.tsx": js`
          import { Link } from "react-router";
          export default function Index() {
            return (
              <>
                <h1 id="index">Index</h1>
                <Link to="/a">/a</Link>
                <Link to="/b">/b</Link>
              </>
            );
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    let manifestRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/__manifest")) {
        manifestRequests.push(req.url());
      }
    });

    await app.goto("/", true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(manifestRequests).toEqual([
      expect.stringMatching(
        /\/__manifest\?p=%2F&p=%2Fa&p=%2Fb&version=[a-z0-9]{8}/
      ),
    ]);
  });

  test("sorts url parameters", async ({ page }) => {
    let fixture = await createFixture({
      files: {
        ...getFiles(),
        "app/routes/_index.tsx": js`
          import { Link } from "react-router";
          export default function Index() {
            return (
              <>
                <h1 id="index">Index</h1>
                <Link to="/a">/a</Link>
                <Link to="/c">/c</Link>
                <Link to="/e">/e</Link>
                <Link to="/g">/g</Link>
                <Link to="/f">/f</Link>
                <Link to="/d">/d</Link>
                <Link to="/b">/b</Link>
              </>
            );
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    let manifestRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/__manifest")) {
        manifestRequests.push(req.url());
      }
    });

    await app.goto("/", true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(manifestRequests).toEqual([
      expect.stringMatching(
        /\/__manifest\?p=%2F&p=%2Fa&p=%2Fb&p=%2Fc&p=%2Fd&p=%2Fe&p=%2Ff&p=%2F/
      ),
    ]);
  });

  test("handles interruptions from back to back navigations", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        ...getFiles(),
        "app/routes/a.tsx": js`
          import { Link, Outlet, useLoaderData, useNavigate } from "react-router";
          export function loader({ request }) {
            return { message: "A LOADER" };
          }
          export default function Index() {
            let data = useLoaderData();
            let navigate = useNavigate();
            return (
              <>
                <h1 id="a">A: {data.message}</h1>
                <button data-link onClick={async () => {
                  navigate('/a/b');
                  setTimeout(() => navigate('/a/b'), 0)
                }}>
                  /a/b
                </button>
                <Outlet/>
              </>
            )
          }
        `,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/a", true);
    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/a", "routes/_index"]);

    // /a/b gets discovered on click
    await app.clickElement("[data-link]");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(await (await page.$("body"))?.textContent()).not.toContain(
      "Not Found"
    );
    await page.waitForSelector("#b");

    expect(
      await page.evaluate(() =>
        Object.keys((window as any).__reactRouterManifest.routes)
      )
    ).toEqual(["root", "routes/a", "routes/_index", "routes/a.b"]);
  });
});
