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
  test("serves built app with vite preview", async ({ vitePreview, page }) => {
    const files: Files = async ({ port }) => ({
      "react-router.config.ts": reactRouterConfig({
        viteEnvironmentApi: true,
      }),
      "vite.config.ts": await viteConfig.basic({
        port,
        templateName: "vite-6-template",
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

    const { port } = await vitePreview(files, "vite-6-template");
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
      "react-router.config.ts": reactRouterConfig({
        viteEnvironmentApi: true,
      }),
      "vite.config.ts": await viteConfig.basic({
        port,
        templateName: "vite-6-template",
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

    const { port } = await vitePreview(files, "vite-6-template");
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
      "react-router.config.ts": reactRouterConfig({
        viteEnvironmentApi: true,
      }),
      "vite.config.ts": await viteConfig.basic({
        port,
        templateName: "vite-6-template",
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

    const { port } = await vitePreview(files, "vite-6-template");
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
      "react-router.config.ts": reactRouterConfig({
        viteEnvironmentApi: true,
      }),
      "vite.config.ts": await viteConfig.basic({
        port,
        templateName: "vite-6-template",
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

    const { port } = await vitePreview(files, "vite-6-template");
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
});
