import { expect } from "@playwright/test";
import dedent from "dedent";

import {
  reactRouterConfig,
  viteConfig,
  test,
  type Files,
} from "./helpers/vite.js";

const tsx = dedent;

test.describe("Vite preview", () => {
  for (let prerender of [false, ["/"]] as const) {
    test(`serves API-only apps with prerender: ${JSON.stringify(prerender)}`, async ({
      vitePreview,
      page,
    }) => {
      let manifestPath = prerender ? "/api-manifest" : "/__manifest";
      const files: Files = async ({ port }) => ({
        "react-router.config.ts": reactRouterConfig({
          ssr: "unstable_api-only",
          prerender: prerender ? [...prerender] : false,
          routeDiscovery: { mode: "lazy", manifestPath },
        }),
        "vite.config.ts": await viteConfig.basic({
          port,
          templateName: "vite-8-template",
        }),
        "app/root.tsx": tsx`
          import { Outlet, Scripts } from "react-router";
          export function Layout({ children }) {
            return <html><head /><body>{children}<Scripts /></body></html>;
          }
          export function HydrateFallback() { return <p>API_ONLY_SHELL</p>; }
          export default function Root() { return <Outlet />; }
        `,
        "app/routes/_index.tsx": tsx`
          export function loader() {
            return process.env.IS_RR_BUILD_REQUEST === "yes" ? "BUILD_INDEX_DATA" : "LIVE_INDEX_DATA";
          }
          export default function Index({ loaderData }) {
            return <p>INDEX_UI: {loaderData}</p>;
          }
        `,
        "app/routes/runtime.tsx": tsx`
          import { Form, Link } from "react-router";
          export function loader({ request }) {
            return new URL(request.url).searchParams.get("message");
          }
          export async function action({ request }) {
            return (await request.formData()).get("message");
          }
          export default function Runtime({ loaderData, actionData }) {
            return <>
              <p data-loader>{loaderData}</p>
              <p data-action>{actionData}</p>
              <Form method="post">
                <input type="hidden" name="message" value="ACTION_DATA" />
                <button type="submit">Submit</button>
              </Form>
              <Link to="/discovered" discover="none">Discover</Link>
            </>;
          }
        `,
        "app/routes/discovered.tsx": tsx`
          export function loader() { return "DISCOVERED_DATA"; }
          export default function Discovered({ loaderData }) {
            return <p data-discovered>{loaderData}</p>;
          }
        `,
      });

      const { port } = await vitePreview(files, "vite-8-template");
      let origin = `http://localhost:${port}`;
      let data = await page.request.get(
        `${origin}/runtime.data?message=LOADER_DATA`,
      );
      expect(data.status()).toBe(200);
      expect(await data.text()).toContain("LOADER_DATA");
      let manifest = await page.request.get(`${origin}${manifestPath}`);
      expect(manifest.status()).toBe(204);
      expect(manifest.headers()["x-remix-reload-document"]).toBe("true");

      let document = await page.request.get(`${origin}/runtime`);
      expect(document.status()).toBe(200);
      expect(document.headers()["content-type"]).toContain("text/html");
      expect(await document.text()).toContain("API_ONLY_SHELL");
      expect(await document.text()).not.toContain("INDEX_UI");
      let head = await page.request.head(`${origin}/runtime`);
      expect(head.status()).toBe(200);
      expect(await head.body()).toHaveLength(0);
      if (prerender) {
        let index = await page.request.get(`${origin}/`);
        expect(index.status()).toBe(200);
        expect(await index.text()).toContain("INDEX_UI");
        expect(await index.text()).toContain("BUILD_INDEX_DATA");
        let indexData = await page.request.get(`${origin}/_.data`);
        expect(indexData.status()).toBe(200);
        expect(await indexData.text()).toContain("BUILD_INDEX_DATA");
      }

      await page.goto(`${origin}/runtime?message=LOADER_DATA`);
      await expect(page.locator("[data-loader]")).toHaveText("LOADER_DATA");
      await page.getByRole("button", { name: "Submit" }).click();
      await expect(page.locator("[data-action]")).toHaveText("ACTION_DATA");
      let discovery = page.waitForResponse((response) =>
        new URL(response.url()).pathname.endsWith(manifestPath),
      );
      await page.getByRole("link", { name: "Discover" }).click();
      expect((await discovery).status()).toBe(200);
      await expect(page.locator("[data-discovered]")).toHaveText(
        "DISCOVERED_DATA",
      );
      expect(page.errors).toEqual([]);
    });
  }

  test("serves built app with vite preview", async ({ vitePreview, page }) => {
    const files: Files = async ({ port }) => ({
      "react-router.config.ts": reactRouterConfig(),
      "vite.config.ts": await viteConfig.basic({
        port,
        templateName: "vite-8-template",
      }),
      "app/root.tsx": tsx`
        import { Links, Meta, Outlet, Scripts } from "react-router";

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
      "app/routes/_index.tsx": tsx`
        export default function IndexRoute() {
          return (
            <div id="index">
              <h2 data-title>Index</h2>
              <p data-env>Environment: production</p>
            </div>
          );
        }
      `,
      "app/routes/about.tsx": tsx`
        export default function AboutRoute() {
          return (
            <div id="about">
              <h2 data-title>About</h2>
              <p>This is the about page</p>
            </div>
          );
        }
      `,
      "app/routes/loader-data.tsx": tsx`
        import { useLoaderData } from "react-router";

        export function loader() {
          return { message: "Hello from loader" };
        }

        export default function LoaderDataRoute() {
          const { message } = useLoaderData<typeof loader>();
          return (
            <div id="loader-data">
              <h2 data-title>Loader Data</h2>
              <p data-message>{message}</p>
            </div>
          );
        }
      `,
    });

    const { port } = await vitePreview(files, "vite-8-template");
    await page.goto(`http://localhost:${port}/`, {
      waitUntil: "networkidle",
    });

    // Ensure no errors on page load
    expect(page.errors).toEqual([]);

    await expect(page.locator("#index [data-title]")).toHaveText("Index");
    await expect(page.locator("#index [data-env]")).toHaveText(
      "Environment: production",
    );
  });

  test("handles navigation between routes", async ({ vitePreview, page }) => {
    const files: Files = async ({ port }) => ({
      "react-router.config.ts": reactRouterConfig(),
      "vite.config.ts": await viteConfig.basic({
        port,
        templateName: "vite-8-template",
      }),
      "app/root.tsx": tsx`
        import { Links, Meta, Outlet, Scripts, Link } from "react-router";

        export default function Root() {
          return (
            <html lang="en">
              <head>
                <Meta />
                <Links />
              </head>
              <body>
                <div id="content">
                  <nav>
                    <Link to="/" data-link-home>Home</Link>
                    <Link to="/about" data-link-about>About</Link>
                  </nav>
                  <Outlet />
                </div>
                <Scripts />
              </body>
            </html>
          );
        }
      `,
      "app/routes/_index.tsx": tsx`
        export default function IndexRoute() {
          return (
            <div id="index">
              <h2 data-title>Index</h2>
            </div>
          );
        }
      `,
      "app/routes/about.tsx": tsx`
        export default function AboutRoute() {
          return (
            <div id="about">
              <h2 data-title>About</h2>
            </div>
          );
        }
      `,
    });

    const { port } = await vitePreview(files, "vite-8-template");
    await page.goto(`http://localhost:${port}/`, {
      waitUntil: "networkidle",
    });

    expect(page.errors).toEqual([]);
    await expect(page.locator("#index [data-title]")).toHaveText("Index");

    // Navigate to about page
    await page.click("[data-link-about]");
    await page.waitForLoadState("networkidle");

    expect(page.errors).toEqual([]);
    await expect(page.locator("#about [data-title]")).toHaveText("About");

    // Navigate back to home
    await page.click("[data-link-home]");
    await page.waitForLoadState("networkidle");

    expect(page.errors).toEqual([]);
    await expect(page.locator("#index [data-title]")).toHaveText("Index");
  });

  test("handles loader data correctly", async ({ vitePreview, page }) => {
    const files: Files = async ({ port }) => ({
      "react-router.config.ts": reactRouterConfig(),
      "vite.config.ts": await viteConfig.basic({
        port,
        templateName: "vite-8-template",
      }),
      "app/root.tsx": tsx`
        import { Links, Meta, Outlet, Scripts } from "react-router";

        export default function Root() {
          return (
            <html lang="en">
              <head>
                <Meta />
                <Links />
              </head>
              <body>
                <div id="content">
                  <Outlet />
                </div>
                {Array.from({ length: 100 }).map((_, i) => (
                  <p key={i}>Filler content {i + 1}</p>
                ))}
                <Scripts />
              </body>
            </html>
          );
        }
      `,
      "app/routes/_index.tsx": tsx`
        import { useLoaderData } from "react-router";

        export function loader() {
          return {
            message: "Hello from loader",
            timestamp: Date.now()
          };
        }

        export default function IndexRoute() {
          const { message, timestamp } = useLoaderData<typeof loader>();
          return (
            <div id="index">
              <h2 data-title>Index</h2>
              <p data-message>{message}</p>
              <p data-timestamp>{timestamp}</p>
            </div>
          );
        }
      `,
    });

    const { port } = await vitePreview(files, "vite-8-template");
    await page.goto(`http://localhost:${port}/`, {
      waitUntil: "networkidle",
    });

    expect(page.errors).toEqual([]);
    await expect(page.locator("#index [data-title]")).toHaveText("Index");
    await expect(page.locator("#index [data-message]")).toHaveText(
      "Hello from loader",
    );

    // Check that timestamp exists and is a number
    const timestampText = await page
      .locator("#index [data-timestamp]")
      .textContent();
    expect(timestampText).toBeTruthy();
    expect(Number(timestampText)).toBeGreaterThan(0);
  });

  test("handles direct navigation to dynamic routes", async ({
    vitePreview,
    page,
  }) => {
    const files: Files = async ({ port }) => ({
      "react-router.config.ts": reactRouterConfig(),
      "vite.config.ts": await viteConfig.basic({
        port,
        templateName: "vite-8-template",
      }),
      "app/root.tsx": tsx`
        import { Links, Meta, Outlet, Scripts } from "react-router";

        export default function Root() {
          return (
            <html lang="en">
              <head>
                <Meta />
                <Links />
              </head>
              <body>
                <div id="content">
                  <Outlet />
                </div>
                <Scripts />
              </body>
            </html>
          );
        }
      `,
      "app/routes/_index.tsx": tsx`
        export default function IndexRoute() {
          return <div id="index"><h2>Index</h2></div>;
        }
      `,
      "app/routes/products.$id.tsx": tsx`
        import { useLoaderData, useParams } from "react-router";

        export function loader({ params }: { params: { id: string } }) {
          return {
            productId: params.id,
          };
        }

        export default function ProductRoute() {
          const { productId } = useLoaderData<typeof loader>();
          return (
            <div id="product">
              <h2 data-title>Product Details</h2>
              <p data-id>{productId}</p>
              <p data-name>Product {productId}</p>
            </div>
          );
        }
      `,
    });

    const { port } = await vitePreview(files, "vite-8-template");
    await page.goto(`http://localhost:${port}/products/123`, {
      waitUntil: "networkidle",
    });

    expect(page.errors).toEqual([]);
    await expect(page.locator("#product [data-title]")).toHaveText(
      "Product Details",
    );
    await expect(page.locator("#product [data-id]")).toHaveText("123");
    await expect(page.locator("#product [data-name]")).toHaveText(
      "Product 123",
    );
  });

  test("serves SPA mode app with vite preview", async ({
    vitePreview,
    page,
  }) => {
    const files: Files = async ({ port }) => ({
      "react-router.config.ts": reactRouterConfig({
        ssr: false,
      }),
      "vite.config.ts": await viteConfig.basic({
        port,
        templateName: "vite-8-template",
      }),
      "app/root.tsx": tsx`
        import { Links, Meta, Outlet, Scripts } from "react-router";

        export default function Root() {
          return (
            <html lang="en">
              <head>
                <Meta />
                <Links />
              </head>
              <body>
                <div id="content">
                  <h1>SPA Mode</h1>
                  <Outlet />
                </div>
                <Scripts />
              </body>
            </html>
          );
        }
      `,
      "app/routes/_index.tsx": tsx`
        export default function IndexRoute() {
          return (
            <div id="index">
              <h2 data-title>Index</h2>
              <p data-spa-mode>SPA Mode Enabled</p>
            </div>
          );
        }
      `,
      "app/routes/about.tsx": tsx`
        export default function AboutRoute() {
          return (
            <div id="about">
              <h2 data-title>About</h2>
              <p>About page in SPA mode</p>
            </div>
          );
        }
      `,
    });

    const { port } = await vitePreview(files, "vite-8-template");
    await page.goto(`http://localhost:${port}/`, {
      waitUntil: "networkidle",
    });

    // Ensure no errors on page load (this would fail without the fix)
    expect(page.errors).toEqual([]);

    await expect(page.locator("#index [data-title]")).toHaveText("Index");
    await expect(page.locator("#index [data-spa-mode]")).toHaveText(
      "SPA Mode Enabled",
    );
  });
});
