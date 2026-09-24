import { test, expect } from "@playwright/test";
import { reactRouterConfig } from "./helpers/vite.js";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes.ts": js`
        import { type RouteConfig, route, index } from "@react-router/dev/routes";
        export default [
          index("routes/_index.tsx"),
          route("lazy", "routes/lazy.tsx"),
          route("throws", "routes/throws.tsx"),
          route("hydrate", "routes/hydrate.tsx"),
          route("parent", "routes/parent.tsx", [
            index("routes/parent._index.tsx"),
          ]),
        ] satisfies RouteConfig;
      `,

      "app/routes/_index.tsx": js`
        import { Link } from "react-router";

        export function Layout({ children }: { children: React.ReactNode }) {
          return (
            <div>
              <p data-testid="layout">route layout</p>
              {children}
            </div>
          );
        }

        export default function Index() {
          return (
            <>
              <p data-testid="component">index component</p>
              <Link to="/lazy">go to lazy</Link>
              <Link to="/throws">go to throws</Link>
            </>
          );
        }
      `,

      "app/routes/lazy.tsx": js`
        import * as React from "react";
        import { Link } from "react-router";

        export function loader({ request }: { request: Request }) {
          let url = new URL(request.url);
          if (url.searchParams.get("error") === "1") {
            throw new Error("boom");
          }

          return "lazy route";
        }

        export function Layout({ children }: { children: React.ReactNode }) {
          React.useEffect(() => {
            let appWindow = window as typeof window & {
              __layoutMounts?: number;
            };
            appWindow.__layoutMounts = (appWindow.__layoutMounts || 0) + 1;
          }, []);

          return (
            <div>
              <p data-testid="lazy-layout">lazy layout</p>
              {children}
            </div>
          );
        }

        export function ErrorBoundary() {
          return <p data-testid="lazy-error">lazy error</p>;
        }

        export default function Lazy() {
          return (
            <>
              <p data-testid="lazy-component">lazy route</p>
              <Link to="/lazy?error=1">trigger error</Link>
            </>
          );
        }
      `,

      "app/routes/throws.tsx": js`
        export function loader() {
           throw new Error("boom");
         }

        export function Layout({ children }: { children: React.ReactNode }) {
          return (
            <div>
              <p data-testid="layout">route layout</p>
              {children}
            </div>
          );
        }

        export function ErrorBoundary() {
          return <p data-testid="error">error boundary</p>;
        }
      `,
      "app/routes/hydrate.tsx": js`
        export async function clientLoader() {
          return "hydrated data";
        }
        clientLoader.hydrate = true;

        export function Layout({ children }: { children: React.ReactNode }) {
          return (
            <div>
              <p data-testid="layout">route layout</p>
              {children}
            </div>
          );
        }

        export function HydrateFallback() {
          return <p data-testid="fallback">loading...</p>;
        }

        export default function Hydrate({ loaderData }: { loaderData: string }) {
          return <p data-testid="component">{loaderData}</p>;
        }
      `,
      "app/routes/parent.tsx": js`
        import { Outlet } from "react-router";

        export function Layout({ children }: { children: React.ReactNode }) {
          return (
            <div>
              <p data-testid="parent-layout">parent layout</p>
              {children}
            </div>
          );
        }

        export default function Parent() {
          return <Outlet />;
        }
      `,

      "app/routes/parent._index.tsx": js`
        export function Layout({ children }: { children: React.ReactNode }) {
          return (
            <div>
              <p data-testid="child-layout">child layout</p>
              {children}
            </div>
          );
        }

        export default function Child() {
          return <p data-testid="child-component">child component</p>;
        }
      `,
    },
  });
  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => appFixture.close());

test("renders the Layout around the component", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");
  expect(await page.locator("[data-testid=layout]").textContent()).toBe(
    "route layout",
  );
  expect(await page.locator("[data-testid=component]").textContent()).toBe(
    "index component",
  );
});

test("renders the Layout around the ErrorBoundary", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/throws");
  expect(await page.locator("[data-testid=layout]").textContent()).toBe(
    "route layout",
  );
  expect(await page.locator("[data-testid=error]").textContent()).toBe(
    "error boundary",
  );
});

test("renders nested Layout components independently", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/parent");
  expect(await page.locator("[data-testid=parent-layout]").textContent()).toBe(
    "parent layout",
  );
  expect(await page.locator("[data-testid=child-layout]").textContent()).toBe(
    "child layout",
  );
  expect(
    await page.locator("[data-testid=child-component]").textContent(),
  ).toBe("child component");
});

test("renders the Layout around the ErrorBoundary on client-side navigation", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");
  await app.clickLink("/throws");
  await page.waitForSelector("[data-testid=error]");
  expect(await page.locator("[data-testid=layout]").textContent()).toBe(
    "route layout",
  );
  expect(await page.locator("[data-testid=error]").textContent()).toBe(
    "error boundary",
  );
});

test("keeps a lazy route Layout mounted when switching to the ErrorBoundary", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");
  await app.clickLink("/lazy");
  await page.waitForSelector("[data-testid=lazy-component]");
  expect(await page.locator("[data-testid=lazy-layout]").textContent()).toBe(
    "lazy layout",
  );
  expect(
    await page.evaluate(() => {
      let appWindow = window as typeof window & {
        __layoutMounts?: number;
      };
      return appWindow.__layoutMounts;
    }),
  ).toBe(1);

  await app.clickLink("/lazy?error=1");
  await page.waitForSelector("[data-testid=lazy-error]");
  expect(await page.locator("[data-testid=lazy-layout]").textContent()).toBe(
    "lazy layout",
  );
  expect(await page.locator("[data-testid=lazy-error]").textContent()).toBe(
    "lazy error",
  );
  expect(
    await page.evaluate(() => {
      let appWindow = window as typeof window & {
        __layoutMounts?: number;
      };
      return appWindow.__layoutMounts;
    }),
  ).toBe(1);
});

test("renders the Layout around the HydrateFallback", async ({ page }) => {
  let res = await fixture.requestDocument("/hydrate");
  let html = await res.text();
  expect(html).toContain("route layout");
  expect(html).toContain("loading...");
});

test("renders the Layout around the component in SPA mode", async ({
  page,
}) => {
  let spaFixture = await createFixture({
    spaMode: true,
    files: {
      "react-router.config.ts": reactRouterConfig({ ssr: false }),
      "app/routes.ts": js`
        import { type RouteConfig, index } from "@react-router/dev/routes";
        export default [
          index("routes/_index.tsx"),
        ] satisfies RouteConfig;
      `,
      "app/routes/_index.tsx": js`
        export function Layout({ children }: { children: React.ReactNode }) {
          return (
            <div>
              <p data-testid="layout">spa route layout</p>
              {children}
            </div>
          );
        }
        export default function Index() {
          return <p data-testid="component">spa index</p>;
        }
      `,
    },
  });
  let spaAppFixture = await createAppFixture(spaFixture);
  let app = new PlaywrightFixture(spaAppFixture, page);
  await app.goto("/");
  await page.waitForSelector("[data-testid=component]");
  expect(await page.locator("[data-testid=layout]").textContent()).toBe(
    "spa route layout",
  );
  expect(await page.locator("[data-testid=component]").textContent()).toBe(
    "spa index",
  );
  await spaAppFixture.close();
});
