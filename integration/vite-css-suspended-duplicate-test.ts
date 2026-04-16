import { test, expect } from "@playwright/test";
import getPort from "get-port";

import {
  build,
  createEditor,
  createProject,
  reactRouterServe,
  viteConfig,
} from "./helpers/vite.js";

const js = String.raw;

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
            route(":slug", "routes/$slug/layout.tsx", [
              index("routes/$slug/route.tsx"),
            ]),
          ] satisfies RouteConfig;
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
        "app/routes/$slug/layout.tsx": js`
          import { lazy, Suspense } from "react";
          import { Outlet } from "react-router";

          const SuspendedLazy = lazy(() =>
            import("../../components/Suspended").then(({ Suspended }) => ({
              default: Suspended,
            })),
          );

          import { WithStyles } from "../../components/WithStyles";

          export default function LayoutRoute() {
            return (
              <>
                <h1 data-layout>layout</h1>
                <Suspense fallback={"loading-layout"}>
                  <SuspendedLazy />
                </Suspense>
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

  test("does not duplicate stylesheet links for suspended components in nested routes", async ({
    page,
  }) => {
    let stylesheetRequests: string[] = [];
    page.on("requestfinished", (request) => {
      if (request.resourceType() === "stylesheet") {
        stylesheetRequests.push(request.url());
      }
    });

    await page.goto(`http://localhost:${port}/some`, {
      waitUntil: "networkidle",
    });

    await expect(page.locator("[data-layout]")).toHaveText("layout");
    await expect(page.locator("[data-route]")).toHaveText("route");
    await expect(page.locator("[data-with-styles]").first()).toHaveCSS(
      "color",
      "rgb(255, 0, 0)",
    );

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
      .filter((href) => href.includes("WithStyles.css.ts-"));
    let normalizedRequestHrefs = stylesheetRequests.map((requestUrl) => {
      let url = new URL(requestUrl);
      return normalizeHref(url.pathname + url.search + url.hash);
    })
      .filter((href) => href.includes("WithStyles.css.ts-"));

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
  });
});
