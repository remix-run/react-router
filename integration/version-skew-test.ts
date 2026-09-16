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
      import { Form, Link, Links, Meta, Outlet, Scripts } from "react-router";

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
              <Form method="post" action="/submit">
                <button type="submit">Submit</button>
              </Form>
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
    "app/routes/submit.tsx": js`
      import { redirect } from "react-router";
      export function action() { return redirect("/thanks"); }
    `,
    "app/routes/thanks.tsx": js`
      export function loader() { return { value: "THANKS" }; }
      export default function Thanks({ loaderData }) {
        return <h1 data-thanks>{loaderData.value}</h1>;
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

      await page.waitForURL(/\/a$/);
      await expect(page.locator("[data-a]")).toHaveText("A");

      // The stale client reloads rather than rendering the newer build's data.
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

  test("stamps the client's own build version on .data responses", async ({
    page,
  }) => {
    let fixture = await createFixture({ files: getFiles(true) });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    try {
      let documents: string[] = [];
      let buildHeaders: Array<string | undefined> = [];
      page.on("request", (request) => {
        if (request.resourceType() === "document") {
          documents.push(request.url());
        }
      });
      page.on("response", async (response) => {
        if (new URL(response.url()).pathname.endsWith(".data")) {
          buildHeaders.push(
            (await response.allHeaders())["x-react-router-build"],
          );
        }
      });

      await app.goto("/");
      await page.getByRole("link", { name: "/a" }).click();
      await expect(page.locator("[data-a]")).toHaveText("A");

      let clientVersion = await page.evaluate(
        () => (window as any).__reactRouterManifest.version,
      );

      expect(buildHeaders.length).toBeGreaterThan(0);
      for (let header of buildHeaders) {
        expect(header).toBe(clientVersion);
      }

      // Matching versions must not disturb the client navigation.
      expect(documents).toHaveLength(1);
    } finally {
      await appFixture.close();
    }
  });

  test("follows an action redirect before reloading on a mismatch", async ({
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

      await page.getByRole("button", { name: "Submit" }).click();

      // The reload must land on the redirect target, not back on the form.
      await page.waitForURL(/\/thanks$/);
      expect(documents.at(-1)).toMatch(/\/thanks$/);
    } finally {
      await appFixture.close();
    }
  });
});
