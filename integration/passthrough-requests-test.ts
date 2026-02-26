import { test, expect } from "@playwright/test";
import {
  type AppFixture,
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import { reactRouterConfig } from "./helpers/vite.js";

const files = {
  "app/root.tsx": js`
    import { Links, Meta, Outlet, Scripts } from "react-router";

    export function loader() {
      return "ROOT";
    }

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

    export function shouldRevalidate({ defaultShouldRevalidate }) {
      return defaultShouldRevalidate;
    }
  `,
  "app/routes/_index.tsx": js`
    import { Form, Link } from "react-router";

    export function loader({ request, unstable_url }) {
      let url = new URL(request.url);
      return {
        url: url.pathname + url.search,
        path: unstable_url.pathname + unstable_url.search
      };
    }

    export function action({ request, unstable_url }) {
      let url = new URL(request.url);
      return {
        url: url.pathname + url.search,
        path: unstable_url.pathname + unstable_url.search
      };
    }

    export default function Component({ loaderData, actionData }) {
      return (
        <>
          <Link to="/?a=1" data-link>Add param</Link>
          <Form method="post">
            <button type="submit">Submit</button>
          </Form>
          <Link to="/page?b=2" unstable_defaultShouldRevalidate={false}>
            Go to new page
          </Link>
          <p data-loader-url>{loaderData.url}</p>
          <p data-loader-path>{loaderData.path}</p>
          {actionData ?
            <>
              <p data-action-url>{actionData.url}</p>
              <p data-action-path>{actionData.path}</p>
            </> :
            null}
        </>
      )
    }
  `,
  "app/routes/page.tsx": js`
    export function loader({ request, unstable_url }) {
      let url = new URL(request.url);
      return {
        url: url.pathname + url.search,
        path: unstable_url.pathname + unstable_url.search
      };
    }

    export default function Component({ loaderData }) {
      return (
        <>
          <p data-loader-url>{loaderData.url}</p>
          <p data-loader-path>{loaderData.path}</p>
        </>
      )
    }
  `,
};

test.describe("pass through requests", () => {
  test("sends proper arguments to loaders when future.unstable_passThroughRequests is disabled", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        "react-router.config.ts": reactRouterConfig({
          future: {
            unstable_passThroughRequests: false,
          },
        }),
        ...files,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    let requests: string[] = [];
    page.on("request", (req) => {
      let url = new URL(req.url());
      if (url.pathname.endsWith(".data")) {
        requests.push(url.pathname + url.search);
      }
    });

    // Document load
    await app.goto("/");
    expect(await page.locator("[data-loader-url]").textContent()).toBe("/");
    expect(await page.locator("[data-loader-path]").textContent()).toBe("/");

    // Client-side navigation with query params
    await app.clickLink("/?a=1");
    expect(await page.locator("[data-loader-url]").textContent()).toBe("/?a=1");
    expect(await page.locator("[data-loader-path]").textContent()).toBe(
      "/?a=1",
    );
    expect(requests).toEqual(["/_root.data?a=1"]);
    requests = [];

    // Client-side form submission with query params
    await app.clickElement('button[type="submit"]');
    expect(await page.locator("[data-action-url]").textContent()).toBe("/?a=1");
    expect(await page.locator("[data-action-path]").textContent()).toBe(
      "/?a=1",
    );
    expect(await page.locator("[data-loader-url]").textContent()).toBe("/?a=1");
    expect(await page.locator("[data-loader-path]").textContent()).toBe(
      "/?a=1",
    );
    expect(requests).toEqual(["/_root.data?index&a=1", "/_root.data?a=1"]);
    requests = [];

    // Navigate to new page
    await app.clickLink("/page?b=2");
    expect(await page.locator("[data-loader-url]").textContent()).toBe(
      "/page?b=2",
    );
    expect(await page.locator("[data-loader-path]").textContent()).toBe(
      "/page?b=2",
    );
    expect(requests).toEqual(["/page.data?b=2&_routes=routes%2Fpage"]);
    requests = [];
  });

  test("sends proper arguments to loaders when future.unstable_passThroughRequests is enabled", async ({
    page,
  }) => {
    let fixture = await createFixture({
      files: {
        "react-router.config.ts": reactRouterConfig({
          future: {
            unstable_passThroughRequests: true,
          },
        }),
        ...files,
      },
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    let requests: string[] = [];
    page.on("request", (req) => {
      let url = new URL(req.url());
      if (url.pathname.endsWith(".data")) {
        requests.push(url.pathname + url.search);
      }
    });

    // Document load
    await app.goto("/");
    expect(await page.locator("[data-loader-url]").textContent()).toBe("/");
    expect(await page.locator("[data-loader-path]").textContent()).toBe("/");

    // Client-side navigation with query params
    await app.clickLink("/?a=1");
    expect(await page.locator("[data-loader-url]").textContent()).toBe(
      "/_root.data?a=1",
    );
    expect(await page.locator("[data-loader-path]").textContent()).toBe(
      "/?a=1",
    );
    expect(requests).toEqual(["/_root.data?a=1"]);
    requests = [];

    // Client-side form submission with query params
    await app.clickElement('button[type="submit"]');
    expect(await page.locator("[data-action-url]").textContent()).toBe(
      "/_root.data?index&a=1",
    );
    expect(await page.locator("[data-action-path]").textContent()).toBe(
      "/?a=1",
    );
    expect(await page.locator("[data-loader-url]").textContent()).toBe(
      "/_root.data?a=1",
    );
    expect(await page.locator("[data-loader-path]").textContent()).toBe(
      "/?a=1",
    );
    expect(requests).toEqual(["/_root.data?index&a=1", "/_root.data?a=1"]);
    requests = [];

    // Navigate to new page
    await app.clickLink("/page?b=2");
    expect(await page.locator("[data-loader-url]").textContent()).toBe(
      "/page.data?b=2&_routes=routes%2Fpage",
    );
    expect(await page.locator("[data-loader-path]").textContent()).toBe(
      "/page?b=2",
    );
    expect(requests).toEqual(["/page.data?b=2&_routes=routes%2Fpage"]);
    requests = [];
  });
});
