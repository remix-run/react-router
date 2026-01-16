import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import dedent from "dedent";

import type { Files } from "./helpers/vite.js";
import { test, viteConfig } from "./helpers/vite.js";

const tsx = dedent;

const files: Files = async ({ port }) => ({
  "vite.config.ts": tsx`
    import { reactRouter } from "@react-router/dev/vite";

    export default {
      ${await viteConfig.server({ port })}
      plugins: [reactRouter()],
    }
  `,
  "app/lib/components.tsx": tsx`
    function Component({ loaderData }: any) {
      return <h1 data-title>{loaderData.title}</h1>;
    }
    export const ComponentAlias = Component;
    export default Component;

    export function HydrateFallback() {
      return <div>Loading...</div>;
    }
    export const HydrateFallbackAlias = HydrateFallback;

    export function ErrorBoundary() {
      return <div>Error</div>;
    }
    export const ErrorBoundaryAlias = ErrorBoundary;
  `,
  "app/routes.ts": tsx`
    import { type RouteConfig, index, route } from "@react-router/dev/routes";

    export default [
      route("named-reexport-with-source", "routes/named-reexport-with-source.tsx"),
      route("alias-reexport-with-source", "routes/alias-reexport-with-source.tsx"),
      route("named-reexport-without-source", "routes/named-reexport-without-source.tsx"),
      route("alias-reexport-without-source", "routes/alias-reexport-without-source.tsx"),
    ] satisfies RouteConfig;
  `,
  "app/routes/named-reexport-with-source.tsx": tsx`
    export const loader = () => ({ title: "named-reexport-with-source" })

    export {
      default,
      HydrateFallback,
      ErrorBoundary,
    } from "../lib/components"
  `,
  "app/routes/alias-reexport-with-source.tsx": tsx`
    export const loader = () => ({ title: "alias-reexport-with-source" })

    export {
      ComponentAlias as default,
      HydrateFallbackAlias as HydrateFallback,
      ErrorBoundaryAlias as ErrorBoundary,
    } from "../lib/components"
  `,
  "app/routes/named-reexport-without-source.tsx": tsx`
    import { ComponentAlias, HydrateFallbackAlias, ErrorBoundaryAlias } from "../lib/components"

    export const loader = () => ({ title: "named-reexport-without-source" })

    export default ComponentAlias
    const HydrateFallback = HydrateFallbackAlias
    const ErrorBoundary = ErrorBoundaryAlias

    export {
      // note: it would be invalid syntax to use 'default' keyword here,
      // so instead we 'export default' separately
      HydrateFallback,
      ErrorBoundary,
    }
  `,
  "app/routes/alias-reexport-without-source.tsx": tsx`
    import { ComponentAlias, HydrateFallbackAlias, ErrorBoundaryAlias } from "../lib/components"

    export const loader = () => ({ title: "alias-reexport-without-source" })

    export {
      ComponentAlias as default,
      HydrateFallbackAlias as HydrateFallback,
      ErrorBoundaryAlias as ErrorBoundary,
    }
  `,
});

test("dev", async ({ page, dev }) => {
  let { port } = await dev(files);
  await workflow({ page, port });
});

test("build", async ({ page, reactRouterServe }) => {
  let { port } = await reactRouterServe(files);
  await workflow({ page, port });
});

async function workflow({ page, port }: { page: Page; port: number }) {
  const routes = [
    "named-reexport-with-source",
    "alias-reexport-with-source",
    "named-reexport-without-source",
    "alias-reexport-without-source",
  ];
  for (const route of routes) {
    await page.goto(`http://localhost:${port}/${route}`, {
      waitUntil: "networkidle",
    });
    await expect(page.locator("[data-title]")).toHaveText(route);
    expect(page.errors).toEqual([]);
  }
}
