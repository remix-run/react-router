import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import { reactRouterConfig } from "./helpers/vite.js";

function getFiles(detectVersionSkew: boolean) {
  return {
    "react-router.config.ts": reactRouterConfig({
      future: { unstable_detectVersionSkew: detectVersionSkew },
    }),
    "app/root.tsx": js`
      import { Link, Links, Meta, Outlet, Scripts } from "react-router";

      export default function Root() {
        return (
          <html lang="en">
            <head>
              <Meta />
              <Links />
            </head>
            <body>
              <Link to="/">Home</Link><br/>
              <Link to="/a">/a</Link><br/>
              <Outlet />
              <Scripts />
            </body>
          </html>
        );
      }
    `,
    "app/routes/_index.tsx": js`
      export function loader() { return { value: "INDEX" }; }
      export default function Index({ loaderData }) {
        return <h1 data-index>{loaderData.value}</h1>;
      }
    `,
    "app/routes/a.tsx": js`
      export function loader() { return { value: "A" }; }
      export default function A({ loaderData }) {
        return <h1 data-a>{loaderData.value}</h1>;
      }
    `,
  };
}

test.describe("version skew on single fetch", () => {
  test("reloads the document when a .data response comes from a different build", async ({
    page,
  }) => {
    let fixture = await createFixture({ files: getFiles(true) });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    try {
      let documents: string[] = [];
      page.on("request", (request) => {
        if (request.resourceType() === "document") {
          documents.push(request.url());
        }
      });

      await app.goto("/");
      await expect(page.locator("[data-index]")).toHaveText("INDEX");

      // Discover /a, then come back so the next hop needs no manifest request.
      await page.getByRole("link", { name: "/a" }).click();
      await expect(page.locator("[data-a]")).toHaveText("A");
      await page.getByRole("link", { name: "Home" }).click();
      await expect(page.locator("[data-index]")).toHaveText("INDEX");

      expect(documents).toHaveLength(1);

      // From here on the server answers as a different build.
      await page.route(/\.data(\?|$)/, async (route) => {
        let response = await route.fetch();
        await route.fulfill({
          response,
          headers: {
            ...response.headers(),
            "X-React-Router-Build": "a-different-build",
          },
        });
      });

      await page.getByRole("link", { name: "/a" }).click();

      await page.waitForFunction(
        () => performance.getEntriesByType("navigation").length > 0,
      );
      await expect(page.locator("[data-a]")).toHaveText("A");

      // The stale client must not render B's data; it reloads instead.
      expect(documents).toHaveLength(2);
      expect(documents[1]).toMatch(/\/a$/);
    } finally {
      await appFixture.close();
    }
  });

  test("does not send the build version when the flag is off", async ({
    page,
  }) => {
    let fixture = await createFixture({ files: getFiles(false) });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    try {
      let dataResponseHeaders: Array<Record<string, string>> = [];
      page.on("response", async (response) => {
        if (new URL(response.url()).pathname.endsWith(".data")) {
          dataResponseHeaders.push(await response.allHeaders());
        }
      });

      await app.goto("/");
      await page.getByRole("link", { name: "/a" }).click();
      await expect(page.locator("[data-a]")).toHaveText("A");

      expect(dataResponseHeaders.length).toBeGreaterThan(0);
      for (let headers of dataResponseHeaders) {
        expect(headers["x-react-router-build"]).toBeUndefined();
      }
    } finally {
      await appFixture.close();
    }
  });
});
