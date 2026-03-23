import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { js } from "../helpers/create-fixture";
import type { TemplateName, Files } from "../helpers/vite";
import { reactRouterConfig, test } from "../helpers/vite";

type PrerenderPaths =
  | boolean
  | Array<string>
  | ((args: {
      getStaticPaths: () => string[];
    }) => Array<string> | Promise<Array<string>>);

function simplePage(name: string) {
  return js`
    export default function Route({ params: { slug } }) {
      return (
        <div>
          <h1 data-testid="${name}">{${JSON.stringify(name)} + (slug ? " " + slug : "")}</h1>
        </div>
      );
    }
  `;
}

function prerender({
  files,
  links,
  prerender = true,
  ssr,
  vitePreview,
}: {
  files?: Files;
  links?: string[];
  prerender?:
    | PrerenderPaths
    | {
        paths: PrerenderPaths;
        unstable_concurrency?: number;
      };
  ssr?: boolean;
  vitePreview: (
    files: Files,
    templateName?: TemplateName | undefined,
  ) => Promise<{
    port: number;
    cwd: string;
  }>;
}) {
  return vitePreview(async (args) => {
    return {
      "react-router.config.ts": reactRouterConfig({ prerender, ssr }),
      "app/root.tsx": js`
      import { Link, Links, Meta, Outlet, ScrollRestoration, useRouteLoaderData } from "react-router";

      export function loader() {
        return {
          IS_RR_BUILD_REQUEST: process.env.IS_RR_BUILD_REQUEST
        }
      }
      
      export default function Route() {
        return (
          <Outlet />
        )
      }

      export function ErrorBoundary() {
        return <p data-testid="root-error-boundary">Root Error Boundary</p>
      }

      export function Layout({ children }) {
        const { IS_RR_BUILD_REQUEST } = useRouteLoaderData("root") ?? {};

        return (
          <html lang="en">
            <head>
              <meta charSet="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <Meta />
              <Links />
            </head>
            <body>
              <p data-testid="IS_RR_BUILD_REQUEST">{IS_RR_BUILD_REQUEST}</p>
              ${links ? links.map((link) => js`<Link to="${link}">${link}</Link>`).join("\n") : ``}
              {children}
              <ScrollRestoration />
            </body>
          </html>
        );
      }
    `,
      "app/routes/_index.tsx": simplePage("index"),
      ...(await files?.(args)),
    };
  }, "rsc-vite-framework");
}

async function assertPrerendered(page: Page, expectedPrerender = true) {
  const isBuildRequest = await page
    .getByTestId("IS_RR_BUILD_REQUEST")
    .textContent();
  expect(isBuildRequest).toBe(expectedPrerender ? "yes" : "");
}

test.describe("rsc prerender", () => {
  test.only("prerenders single route", async ({ page, vitePreview }) => {
    const { port } = await prerender({
      links: ["/", "/404/not-found"],
      vitePreview,
    });
    const baseUrl = `http://localhost:${port}`;

    await page.goto(baseUrl);
    await assertPrerendered(page);
    const index = await page.getByTestId("index").textContent();
    expect(index).toBe("index");

    await page.click('text="/404/not-found"');
    await page.waitForURL(`${baseUrl}/404/not-found`);
    const errorBoundary = await page
      .getByTestId("root-error-boundary")
      .textContent();
    expect(errorBoundary).toBe("Root Error Boundary");

    await page.click('text="/"');
    await page.waitForURL(baseUrl + "/");
    const index2 = await page.getByTestId("index").textContent();
    expect(index2).toBe("index");
  });

  test("prerenders dynamic route", async ({ page, vitePreview }) => {
    const { port } = await prerender({
      files: async () => ({
        "app/routes/products.$slug.tsx": simplePage("product"),
      }),
      links: ["/", "/products/1", "/products/2"],
      prerender: ["/", "/products/1"],
      vitePreview,
    });
    const baseUrl = `http://localhost:${port}`;

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    const index = await page.getByTestId("index").textContent();
    expect(index).toBe("index");
    await assertPrerendered(page);

    await page.click('text="/products/1"');
    await page.waitForURL(`${baseUrl}/products/1`);
    const product1 = await page.getByTestId("product").textContent();
    expect(product1).toBe("product 1");

    await page.click('text="/products/2"');
    await page.waitForURL(`${baseUrl}/products/2`);
    const product2 = await page.getByTestId("product").textContent();
    expect(product2).toBe("product 2");

    await page.click('text="/"');
    await page.waitForURL(baseUrl + "/");
    const index2 = await page.getByTestId("index").textContent();
    expect(index2).toBe("index");
  });

  test("prerenders single page app", async ({ page, vitePreview }) => {
    const { port } = await prerender({
      links: ["/", "/404/not-found"],
      ssr: false,
      vitePreview,
    });
    const baseUrl = `http://localhost:${port}`;

    await page.goto(baseUrl);
    const index = await page.getByTestId("index").textContent();
    expect(index).toBe("index");
    await assertPrerendered(page);

    await page.click('text="/404/not-found"');
    await page.waitForURL(`${baseUrl}/404/not-found`);
    const errorBoundary = await page
      .getByTestId("root-error-boundary")
      .textContent();
    expect(errorBoundary).toBe("Root Error Boundary");
  });
});
