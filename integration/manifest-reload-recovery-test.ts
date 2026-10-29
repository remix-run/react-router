import { chromium, expect, type Page, type Route } from "@playwright/test";

import { test, type Files } from "./helpers/vite.js";

const js = String.raw;
const manifestRequest = /\/__manifest\?|\.manifest(?:\?|$)/;

function getFiles(rsc: boolean) {
  return {
    "app/root.tsx": js`
      import { useCallback } from "react";
      import {
        Link, Outlet, Scripts, useBeforeUnload, useFetcher,
        useNavigation, useRouteError,
      } from "react-router";

      export function Layout({ children }) {
        let navigation = useNavigation();
        let fetcher = useFetcher();
        useBeforeUnload(useCallback((event) => {
          if (window.blockUnload) {
            event.preventDefault();
            event.returnValue = "Unsaved changes";
          }
        }, []));
        return (
          <html lang="en">
            <body>
              <p data-navigation-state>{navigation.state}</p>
              <p data-fetcher-state>{fetcher.state}</p>
              <button onClick={() => fetcher.load("/fetch")}>Fetch</button>
              <Link to="/other" discover="none">Navigate</Link>
              <Link to="/recovered" discover="none">Recover</Link>
              {children}
              ${rsc ? "" : "<Scripts />"}
            </body>
          </html>
        );
      }

      export default function Root() {
        return <Outlet />;
      }

      export function ErrorBoundary() {
        let error = useRouteError();
        return <p data-error>{error.message}</p>;
      }
    `,
    "app/routes/$.tsx": js`
      export function loader() { return "STALE SPLAT"; }
      export default function Splat() { return <h1>Splat</h1>; }
    `,
    "app/routes/fetch.tsx": js`
      export function loader() { return "FETCH"; }
      export default function Fetch() { return <h1>Fetch</h1>; }
    `,
    "app/routes/other.tsx": js`
      export function loader() { return "OTHER"; }
      export default function Other() { return <h1>Other</h1>; }
    `,
    "app/routes/recovered.tsx": js`
      import { useLoaderData } from "react-router";
      export function loader() { return "Recovered"; }
      export default function Recovered() {
        return <h1>{useLoaderData()}</h1>;
      }
    `,
    "app/routes/away.tsx": js`
      export default function Away() { return <h1>Away</h1>; }
    `,
  };
}

async function cancelConcurrentReload(page: Page, baseUrl: string) {
  let documents: string[] = [];
  let dataRequests: string[] = [];
  let manifestRoutes: Route[] = [];
  let dialogs = 0;
  page.on("request", (request) => {
    if (request.resourceType() === "document") {
      documents.push(request.url());
    }
    if (/\.(?:data|rsc)$/.test(new URL(request.url()).pathname)) {
      dataRequests.push(request.url());
    }
  });
  page.on("dialog", async (dialog) => {
    expect(dialog.type()).toBe("beforeunload");
    dialogs++;
    await dialog.dismiss();
  });
  await page.route(manifestRequest, (route) => {
    manifestRoutes.push(route);
  });
  await page.addInitScript(() => {
    (window as any).blockUnload = true;
    (window as any).restoredFromBFCache = false;
    window.addEventListener("pageshow", (event) => {
      (window as any).restoredFromBFCache = event.persisted;
    });
  });

  // The splat is already in the stale client tree, but neither destination is.
  await page.goto(`${baseUrl}/unknown`);
  await expect(page.getByRole("heading", { name: "Splat" })).toBeVisible();
  await page.getByRole("button", { name: "Fetch", exact: true }).click();
  await page.getByRole("link", { name: "Navigate", exact: true }).click();
  await expect.poll(() => manifestRoutes.length).toBe(2);
  await expect(page.locator("[data-fetcher-state]")).toHaveText("loading");
  await expect(page.locator("[data-navigation-state]")).toHaveText("loading");

  await Promise.all(
    manifestRoutes.map((route) =>
      route.fulfill({
        status: 204,
        headers: { "X-Remix-Reload-Document": "true" },
      }),
    ),
  );
  await expect.poll(() => dialogs).toBe(1);
  // Successful discovery must be available after the cancelled attempt settles.
  await page.unroute(manifestRequest);
  expect(dataRequests).toEqual([]);
  expect(documents).toHaveLength(1);
  return { documents, dataRequests, getDialogs: () => dialogs };
}

async function expectSettledAndRecover(page: Page, timeout = 10_000) {
  await expect(page.locator("[data-error]")).toHaveText(
    "Unable to discover routes due to manifest version mismatch.",
    { timeout },
  );
  await expect(page.locator("[data-navigation-state]")).toHaveText("idle");
  await expect(page.locator("[data-fetcher-state]")).toHaveText("idle");
  await page.getByRole("link", { name: "Recover", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Recovered" })).toBeVisible();
  await expect(page.locator("[data-error]")).toHaveCount(0);
}

for (let rsc of [false, true]) {
  test.describe(rsc ? "RSC Framework" : "Framework", () => {
    test("settles concurrent discovery when the user cancels the document reload", async ({
      page,
      reactRouterServe,
      vitePreview,
    }) => {
      let files: Files = async () => getFiles(rsc);
      let { port } = rsc
        ? await vitePreview(files, "rsc-vite-framework")
        : await reactRouterServe(files);
      let { documents, dataRequests, getDialogs } =
        await cancelConcurrentReload(page, `http://localhost:${port}`);

      await expectSettledAndRecover(page);
      expect(getDialogs()).toBe(1);
      expect(documents).toHaveLength(1);
      expect(dataRequests.every((url) => url.includes("/recovered."))).toBe(
        true,
      );
    });

    test.describe("BFCache", () => {
      // Playwright disables BFCache by default. Use full Chromium with the cache
      // enabled for a real history restoration, including its frozen JS state.
      test("settles parked discovery after restoring the document", async ({
        browserName,
        channel,
        reactRouterServe,
        vitePreview,
      }) => {
        test.skip(browserName !== "chromium", "Requires Chromium BFCache");
        let files: Files = async () => getFiles(rsc);
        let { port } = rsc
          ? await vitePreview(files, "rsc-vite-framework")
          : await reactRouterServe(files);
        let baseUrl = `http://localhost:${port}`;
        let browser = await chromium.launch({
          channel: channel ?? "chromium",
          ignoreDefaultArgs: ["--disable-back-forward-cache"],
        });
        let page = await browser.newPage();
        try {
          // Keep the grace-period timer frozen so only pageshow can settle the
          // requests, even when the history traversal is slow on CI.
          let time = new Date("2026-01-01T00:00:00Z");
          await page.clock.install({ time });
          await page.clock.pauseAt(time);
          await cancelConcurrentReload(page, baseUrl);
          await page.evaluate(() => {
            (window as any).blockUnload = false;
          });

          await expect(page.locator("[data-navigation-state]")).toHaveText(
            "loading",
          );
          await expect(page.locator("[data-fetcher-state]")).toHaveText(
            "loading",
          );
          await page.goto(`${baseUrl}/away`, { timeout: 5_000 });
          await expect(
            page.getByRole("heading", { name: "Away" }),
          ).toBeVisible();
          await page.evaluate(() => {
            (window as any).blockUnload = false;
          });
          // BFCache restoration does not emit a new load event.
          await page.goBack({ waitUntil: "commit", timeout: 5_000 });
          // A new document or a synthetic pageshow cannot satisfy this assertion.
          await expect
            .poll(() =>
              page.evaluate(() => (window as any).restoredFromBFCache),
            )
            .toBe(true);
          await expectSettledAndRecover(page, 1_000);
        } finally {
          await browser.close();
        }
      });
    });
  });
}
