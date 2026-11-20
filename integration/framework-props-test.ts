import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import dedent from "dedent";

import type { Files } from "./helpers/vite.js";
import { test, viteConfig } from "./helpers/vite.js";

const routeNames = [
  "named-source",
  "aliased-source",
  "named-local",
  "aliased-local",
];

const dataExports = dedent`
  export function loader({ request }) {
    if (new URL(request.url).searchParams.has("error")) {
      throw new Response("loader error", { status: 400 });
    }
    return { message: "loader data" };
  }

  export async function clientLoader({ request, serverLoader }) {
    if (!new URL(request.url).searchParams.has("error")) {
      // Let the test inspect the fallback before hydration finishes.
      await new Promise(resolve => {
        window.__resolveLoader = resolve;
      });
    }
    return serverLoader();
  }
  clientLoader.hydrate = true;
`;

const files: Files = async ({ port }) => ({
  "vite.config.ts": await viteConfig.basic({ port }),
  "app/routes.ts": dedent`
    import { route } from "@react-router/dev/routes";

    export default [
      ${routeNames.map((name) => `route("${name}/:id", "routes/${name}.tsx"),`).join("\n")}
    ];
  `,
  "app/components.tsx": dedent`
    import { Link } from "react-router";

    export default function Component({ loaderData, params }) {
      return (
        <>
          <h1 id="component">{params.id}: {loaderData.message}</h1>
          <Link to="?error">Trigger error</Link>
        </>
      );
    }
    export { Component as Page };

    export function ErrorBoundary({ error, params }) {
      return <h1 id="error">{params.id}: {error.status} {error.data}</h1>;
    }
    export { ErrorBoundary as Boundary };

    export function HydrateFallback({ params }) {
      return <h1 id="fallback">Loading {params.id}</h1>;
    }
    export { HydrateFallback as Fallback };
  `,
  "app/routes/named-source.tsx": dedent`
    export { default, ErrorBoundary, HydrateFallback } from "../components";
    ${dataExports}
  `,
  "app/routes/aliased-source.tsx": dedent`
    export {
      Page as default,
      Boundary as ErrorBoundary,
      Fallback as HydrateFallback,
    } from "../components";
    ${dataExports}
  `,
  "app/routes/named-local.tsx": dedent`
    import Component, { ErrorBoundary, HydrateFallback } from "../components";
    export { Component as default, ErrorBoundary, HydrateFallback };
    ${dataExports}
  `,
  "app/routes/aliased-local.tsx": dedent`
    import { Page, Boundary, Fallback } from "../components";
    export { Page as default, Boundary as ErrorBoundary, Fallback as HydrateFallback };
    ${dataExports}
  `,
});

test.describe("re-exported framework component props", () => {
  test("development", async ({ page, dev }) => {
    let { port } = await dev(files);
    await workflow(page, port);
  });

  test("production", async ({ page, reactRouterServe }) => {
    let { port } = await reactRouterServe(files);
    await workflow(page, port);
  });
});

async function workflow(page: Page, port: number) {
  for (let name of routeNames) {
    let url = `http://localhost:${port}/${name}/123`;
    await page.goto(url);
    await expect(page.locator("#fallback")).toHaveText("Loading 123");

    // Wait for the client loader so this also checks the hydrated fallback.
    await page.waitForFunction("typeof window.__resolveLoader === 'function'");
    await expect(page.locator("#fallback")).toHaveText("Loading 123");
    await page.evaluate("window.__resolveLoader()");
    await expect(page.locator("#component")).toHaveText("123: loader data");

    // Exercise the error boundary on both client navigation and document loads.
    await page.getByRole("link", { name: "Trigger error" }).click();
    await expect(page.locator("#error")).toHaveText("123: 400 loader error");
    let response = await page.goto(`${url}?error`);
    expect(response?.status()).toBe(400);
    await expect(page.locator("#error")).toHaveText("123: 400 loader error");
    expect(page.errors).toEqual([]);
  }
}
