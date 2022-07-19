import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
  mdx,
} from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { PlaywrightFixture } from "./helpers/playwright-fixture";

test.describe("mdx", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/root.jsx": js`
        import { json } from "@remix-run/node";
        import { Links, Meta, Outlet, Scripts } from "@remix-run/react";

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

        "app/routes/blog.jsx": js`
          import { json } from "@remix-run/node";
          import { useMatches, Outlet } from "@remix-run/react";

          export default function Index() {
            const matches = useMatches();
            const mdxMatch = matches[matches.length - 1];
            return (
              <div>
                <p id="additionalData">{mdxMatch.data.additionalData === 10 && 'Additional Data: 10'}</p>
                <p id="handle">{mdxMatch.handle.someData}</p>
                <Outlet />
              </div>
            );
          }
        `,

        "app/routes/blog/post.mdx": mdx`---
meta:
  title: My First Post
  description: Isn't this awesome?
headers:
  Cache-Control: no-cache
---

export const links = () => [
  { rel: "stylesheet", href: "app.css" }
]

export const handle = {
  someData: "abc"
}

import { useLoaderData } from '@remix-run/react';

export const loader = async () => {
  return { mamboNumber: 5 };
};

export function ComponentUsingData() {
  const { mamboNumber } = useLoaderData();

  return <div id="loader">Mambo Number: {mamboNumber}</div>;
}

# This is some markdown!

<ComponentUsingData />
        `.trim(),

        "app/routes/basic.mdx": mdx`
# This is some basic markdown!
        `.trim(),
      },
    });
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(async () => {
    await appFixture.close();
  });

  test("can render basic markdown", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/basic");

    expect(await app.getHtml()).toMatch("This is some basic markdown!");
  });

  test("supports links, meta, headers, handle, and loader", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/blog/post");
    expect(await app.getHtml('meta[name="description"]')).toMatch(
      "Isn't this awesome?"
    );
    expect(await app.getHtml("title")).toMatch("My First Post");
    expect(await app.getHtml("#loader")).toMatch(/Mambo Number:.+5/s);
    expect(await app.getHtml("#handle")).toMatch("abc");
    expect(await app.getHtml('link[rel="stylesheet"]')).toMatch("app.css");
  });
});
