import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("useMatches", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import * as React from 'react';
          import { json } from "@remix-run/node";
          import { Link, Links, Meta, Outlet, Scripts, useMatches } from "@remix-run/react";
          export const handle = { stuff: "root handle"};
          export const loader = () => json("ROOT");
          export default function Root() {
            let matches = useMatches();
            let [matchesCount, setMatchesCount] = React.useState(0);
            React.useEffect(() => setMatchesCount(matchesCount + 1), [matches]);

            return (
              <html lang="en">
                <head>
                  <Meta />
                  <Links />
                </head>
                <body>
                  <Link to="/about">About</Link>
                  <pre id="matches">
                    {JSON.stringify(matches, null, 2)}
                  </pre>
                  {matchesCount > 0 ? <pre id="matches-count-root">{matchesCount}</pre> : null}
                  <Outlet />
                  <Scripts />
                </body>
              </html>
            );
          }
        `,

        "app/routes/_index.tsx": js`
          import { json } from "@remix-run/node";
          export const handle = { stuff: "index handle"};
          export const loader = () => json("INDEX");
          export default function Index() {
            return <h1 id="index">Index Page</h1>
          }
        `,

        "app/routes/about.tsx": js`
          import { json } from "@remix-run/node";
          export const handle = { stuff: "about handle"};
          export const loader = async () => {
            await new Promise(r => setTimeout(r, 100));
            return json("ABOUT");
          }
          export default function About() {
            return <h1 id="about">About Page</h1>
          }
        `,

        "app/routes/count.tsx": js`
          import * as React from 'react';
          import { useMatches } from "@remix-run/react";
          export default function Count() {
            let matches = useMatches();
            let [count, setCount] = React.useState(0);
            let [matchesCount, setMatchesCount] = React.useState(0);
            React.useEffect(() => setMatchesCount(matchesCount + 1), [matches]);
            return (
              <>
                <h1>Count Page</h1>
                <button id="increment" onClick={() => setCount(count + 1)}>
                  Increment
                </button>
                <pre id="count">{count}</pre>
                {matchesCount > 0 ? <pre id="matches-count-child">{matchesCount}</pre> : null}
              </>
            );
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("grabs the handle from the route module cache", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");

    // Wait for effect
    await page.waitForSelector("#matches-count-root");
    expect(await app.getHtml("#matches-count-root")).toMatch(">1<");
    expect(await app.getHtml()).toMatch("Index Page");
    expect(await app.getHtml("#matches")).toEqual(`<pre id="matches">
[
  {
    "id": "root",
    "pathname": "/",
    "params": {},
    "data": "ROOT",
    "handle": {
      "stuff": "root handle"
    }
  },
  {
    "id": "routes/_index",
    "pathname": "/",
    "params": {},
    "data": "INDEX",
    "handle": {
      "stuff": "index handle"
    }
  }
]</pre
>`);

    // Click and don't wait so we can assert _during_ the navigation that we're
    // still showing the index matches and we haven't triggered a new effect
    await app.clickLink("/about", { wait: false });
    expect(await app.getHtml("#matches")).toEqual(`<pre id="matches">
[
  {
    "id": "root",
    "pathname": "/",
    "params": {},
    "data": "ROOT",
    "handle": {
      "stuff": "root handle"
    }
  },
  {
    "id": "routes/_index",
    "pathname": "/",
    "params": {},
    "data": "INDEX",
    "handle": {
      "stuff": "index handle"
    }
  }
]</pre
>`);
    expect(await app.getHtml("#matches-count-root")).toMatch(">1<");

    // Once the new page shows up we should get update dmatches and a single
    // new effect execution
    await page.waitForSelector("#about");
    expect(await app.getHtml()).toMatch("About Page");
    expect(await app.getHtml("#matches-count-root")).toMatch(">2<");
    expect(await app.getHtml("#matches")).toEqual(`<pre id="matches">
[
  {
    "id": "root",
    "pathname": "/",
    "params": {},
    "data": "ROOT",
    "handle": {
      "stuff": "root handle"
    }
  },
  {
    "id": "routes/about",
    "pathname": "/about",
    "params": {},
    "data": "ABOUT",
    "handle": {
      "stuff": "about handle"
    }
  }
]</pre
>`);
  });

  test("memoizes matches from react router", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/count");
    await page.waitForSelector("#matches-count-child");
    expect(await app.getHtml("#count")).toMatch(">0<");
    expect(await app.getHtml("#matches-count-child")).toMatch(">1<");
    await app.clickElement("#increment");
    expect(await app.getHtml("#count")).toMatch(">1<");
    expect(await app.getHtml("#matches-count-child")).toMatch(">1<");
    await app.clickElement("#increment");
    expect(await app.getHtml("#count")).toMatch(">2<");
    expect(await app.getHtml("#matches-count-child")).toMatch(">1<");
  });
});
