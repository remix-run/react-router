import { test, expect, type Page } from "@playwright/test";
import getPort from "get-port";

import {
  build,
  createEditor,
  createProject,
  reactRouterServe,
  viteConfig,
} from "./helpers/vite.js";

const js = String.raw;

function collectStylesheetRequests(page: Page): string[] {
  let stylesheetRequests: string[] = [];
  page.on("requestfinished", (request) => {
    if (request.resourceType() === "stylesheet") {
      stylesheetRequests.push(request.url());
    }
  });
  return stylesheetRequests;
}

async function assertNoDuplicateStylesheets({
  page,
  stylesheetRequests,
  assetName,
}: {
  page: Page;
  stylesheetRequests: string[];
  assetName: string;
}) {
  let stylesheetHrefs = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']"),
    )
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => href != null),
  );

  let normalizeHref = (href: string) => href.replace(/#$/, "");
  let normalizedLinkHrefs = stylesheetHrefs
    .map(normalizeHref)
    .filter((href) => href.includes(assetName));
  let normalizedRequestHrefs = stylesheetRequests
    .map((requestUrl) => {
      let url = new URL(requestUrl);
      return normalizeHref(url.pathname + url.search + url.hash);
    })
    .filter((href) => href.includes(assetName));

  let duplicateLinkHrefs = normalizedLinkHrefs.filter(
    (href, index, hrefs) => hrefs.indexOf(href) !== index,
  );
  let duplicateRequestHrefs = normalizedRequestHrefs.filter(
    (href, index, hrefs) => hrefs.indexOf(href) !== index,
  );

  expect(normalizedLinkHrefs.length).toBeGreaterThan(0);
  expect(
    duplicateLinkHrefs,
    `Duplicate stylesheet links found.\nraw=${JSON.stringify(stylesheetHrefs)}\nnormalized=${JSON.stringify(normalizedLinkHrefs)}`,
  ).toEqual([]);

  if (normalizedRequestHrefs.length > 0) {
    expect(
      duplicateRequestHrefs,
      `Duplicate stylesheet requests found.\nraw=${JSON.stringify(stylesheetRequests)}\nnormalized=${JSON.stringify(normalizedRequestHrefs)}`,
    ).toEqual([]);
  }
}

test.describe("Vite CSS suspended duplicate styles", () => {
  let port: number;
  let cwd: string;
  let stop: () => void;

  test.beforeAll(async () => {
    port = await getPort();
    cwd = await createProject(
      {
        "vite.config.ts": await viteConfig.basic({
          port,
          templateName: "vite-6-template",
          vanillaExtract: true,
        }),
        "app/routes.ts": js`
          import { type RouteConfig, index, route } from "@react-router/dev/routes";

          export default [
            route("layout-shared", "routes/layout-shared/layout.tsx", [
              index("routes/layout-shared/route.tsx"),
            ]),
            route(":slug", "routes/$slug/layout.tsx", [
              index("routes/$slug/route.tsx"),
            ]),
          ] satisfies RouteConfig;
        `,
        "app/root.tsx": js`
          import { Links, Meta, Outlet, Scripts } from "react-router";
          import { WithStyles } from "./components/WithStyles";

          export default function Root() {
            return (
              <html lang="en">
                <head>
                  <Meta />
                  <Links />
                </head>
                <body>
                  <WithStyles />
                  <Outlet />
                  <Scripts />
                </body>
              </html>
            );
          }
        `,
        "app/components/WithStyles.css.ts": js`
          import { style } from "@vanilla-extract/css";

          export const withStyles = style({
            color: "rgb(255, 0, 0)",
          });
        `,
        "app/components/WithStyles.tsx": js`
          import * as styles from "./WithStyles.css";

          export function WithStyles() {
            return <div data-with-styles className={styles.withStyles}>with styles</div>;
          }
        `,
        "app/components/Suspended.tsx": js`
          import { WithStyles } from "./WithStyles";

          export function Suspended() {
            return <WithStyles />;
          }
        `,
        "app/components/LayoutWithStyles.css.ts": js`
          import { style } from "@vanilla-extract/css";

          export const layoutWithStyles = style({
            color: "rgb(0, 128, 0)",
          });
        `,
        "app/components/LayoutWithStyles.tsx": js`
          import * as styles from "./LayoutWithStyles.css";

          export function LayoutWithStyles() {
            return <div data-layout-with-styles className={styles.layoutWithStyles}>layout with styles</div>;
          }
        `,
        "app/components/LayoutSuspended.tsx": js`
          import { LayoutWithStyles } from "./LayoutWithStyles";

          export function LayoutSuspended() {
            return <LayoutWithStyles />;
          }
        `,
        "app/routes/layout-shared/layout.tsx": js`
          import { Outlet } from "react-router";
          import { LayoutWithStyles } from "../../components/LayoutWithStyles";

          export default function LayoutSharedRoute() {
            return (
              <>
                <h1 data-layout-shared>layout shared</h1>
                <LayoutWithStyles />
                <Outlet />
              </>
            );
          }
        `,
        "app/routes/layout-shared/route.tsx": js`
          import { lazy, Suspense } from "react";

          const LayoutSuspendedLazy = lazy(() =>
            import("../../components/LayoutSuspended").then(({ LayoutSuspended }) => ({
              default: LayoutSuspended,
            })),
          );

          export default function LayoutSharedIndexRoute() {
            return (
              <>
                <h2 data-layout-shared-route>layout shared route</h2>
                <Suspense fallback={"loading-layout-shared-route"}>
                  <LayoutSuspendedLazy />
                </Suspense>
              </>
            );
          }
        `,
        "app/routes/$slug/layout.tsx": js`
          import { Outlet } from "react-router";

          export default function LayoutRoute() {
            return (
              <>
                <h1 data-layout>layout</h1>
                <Outlet />
              </>
            );
          }
        `,
        "app/routes/$slug/route.tsx": js`
          import { lazy, Suspense } from "react";

          const SuspendedLazy = lazy(() =>
            import("../../components/Suspended").then(({ Suspended }) => ({
              default: Suspended,
            })),
          );

          export default function SlugIndexRoute() {
            return (
              <>
                <h2 data-route>route</h2>
                <Suspense fallback={"loading-route"}>
                  <SuspendedLazy />
                </Suspense>
              </>
            );
          }
        `,
      },
      "vite-6-template",
    );

    let edit = createEditor(cwd);
    await edit("package.json", (contents) =>
      contents.replace('"sideEffects": false', '"sideEffects": true'),
    );

    let { status } = build({ cwd });
    expect(status).toBe(0);
    stop = await reactRouterServe({ cwd, port });
  });

  test.afterAll(() => stop());

  test("does not duplicate stylesheet links when root and leaf routes share suspended component CSS", async ({
    page,
  }) => {
    let stylesheetRequests = collectStylesheetRequests(page);

    await page.goto(`http://localhost:${port}/some`, {
      waitUntil: "networkidle",
    });

    await expect(page.locator("[data-layout]")).toHaveText("layout");
    await expect(page.locator("[data-route]")).toHaveText("route");
    await expect(page.locator("[data-with-styles]")).toHaveCount(2);
    await expect(page.locator("[data-with-styles]").first()).toHaveCSS(
      "color",
      "rgb(255, 0, 0)",
    );
    await expect(page.locator("[data-with-styles]").last()).toHaveCSS(
      "color",
      "rgb(255, 0, 0)",
    );

    await assertNoDuplicateStylesheets({
      page,
      stylesheetRequests,
      assetName: "WithStyles-",
    });
  });

  test("does not duplicate stylesheet links when layout and leaf routes share suspended component CSS", async ({
    page,
  }) => {
    let stylesheetRequests = collectStylesheetRequests(page);

    await page.goto(`http://localhost:${port}/layout-shared`, {
      waitUntil: "networkidle",
    });

    await expect(page.locator("[data-layout-shared]")).toHaveText(
      "layout shared",
    );
    await expect(page.locator("[data-layout-shared-route]")).toHaveText(
      "layout shared route",
    );
    await expect(page.locator("[data-layout-with-styles]")).toHaveCount(2);
    await expect(page.locator("[data-layout-with-styles]").first()).toHaveCSS(
      "color",
      "rgb(0, 128, 0)",
    );
    await expect(page.locator("[data-layout-with-styles]").last()).toHaveCSS(
      "color",
      "rgb(0, 128, 0)",
    );

    await assertNoDuplicateStylesheets({
      page,
      stylesheetRequests,
      assetName: "LayoutWithStyles-",
    });
  });
});
