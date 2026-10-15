import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
  type AppFixture,
} from "./helpers/create-fixture.js";

test.describe("Await hydration priming", () => {
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    let fixture = await createFixture({
      files: {
        "app/entry.client.tsx": js`
          import { startTransition } from "react";
          import { hydrateRoot } from "react-dom/client";
          import { HydratedRouter } from "react-router/dom";

          window.__awaitFallbacks = [];
          window.__awaitErrors = [];
          startTransition(() => {
            hydrateRoot(document, <HydratedRouter
              onError={(error) => window.__awaitErrors.push(error.message)}
            />);
          });
        `,
        "app/root.tsx": js`
          import * as React from "react";
          import { flushSync } from "react-dom";
          import { Await, Scripts, useAsyncError, useLoaderData } from "react-router";

          let RevisionContext = React.createContext(0);

          export function loader({ request }) {
            let params = new URL(request.url).searchParams;
            let key = params.get("key");
            globalThis.__awaitSlowResolvers ??= new Map();
            return {
              fast: new Promise((resolve, reject) => setTimeout(() => {
                if (params.get("status") === "rejected") {
                  reject(new Error("Fast rejected"));
                } else {
                  resolve("Fast resolved");
                }
              }, 30)),
              slow: new Promise((resolve) => {
                globalThis.__awaitSlowResolvers.set(key, resolve);
              }),
            };
          }

          export default function Root() {
            let { fast, slow } = useLoaderData();
            let [revision, setRevision] = React.useState(0);
            React.useLayoutEffect(() => {
              let update = () => flushSync(() => setRevision(1));
              fast.then(update, update);
            }, [fast]);
            return (
              <html>
                <head />
                <body>
                  <RevisionContext.Provider value={revision}>
                    <React.Suspense fallback={<Fallback name="fast" />}>
                      <Await resolve={fast} errorElement={<FastError />}>
                        {(value) => <Content id="fast">{value}</Content>}
                      </Await>
                    </React.Suspense>
                    <React.Suspense fallback={<Fallback name="slow" />}>
                      <Await resolve={slow}>
                        {(value) => <Content id="slow">{value}</Content>}
                      </Await>
                    </React.Suspense>
                  </RevisionContext.Provider>
                  <Scripts />
                </body>
              </html>
            );
          }

          function Fallback({ name }) {
            React.useLayoutEffect(() => {
              window.__awaitFallbacks.push(name);
            }, [name]);
            return <p id={name + "-fallback"}>Loading {name}</p>;
          }

          function Content({ id, children }) {
            let revision = React.useContext(RevisionContext);
            let [hydrated, setHydrated] = React.useState(false);
            React.useEffect(() => setHydrated(true), []);
            return <p id={id} data-revision={revision} data-hydrated={hydrated}>
              {children}
            </p>;
          }

          function FastError() {
            let error = useAsyncError();
            return <Content id="fast">
              {error instanceof Error ? "Fast rejected" : "Unexpected rejection"}
            </Content>;
          }
        `,
        "app/routes/resolve.tsx": js`
          export function action({ request }) {
            let key = new URL(request.url).searchParams.get("key");
            globalThis.__awaitSlowResolvers.get(key)("Slow resolved");
            globalThis.__awaitSlowResolvers.delete(key);
            return null;
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(async () => appFixture.close());

  (["fulfilled", "rejected"] as const).forEach((status) => {
    test(`keeps ${status} server content visible through a context update while another promise is pending`, async ({
      page,
    }) => {
      let pageErrors: Error[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));
      let allowHydration!: () => void;
      let hydrationGate = new Promise<void>((resolve) => {
        allowHydration = resolve;
      });
      await page.route(/\/assets\/entry\.client-[^/]+\.js$/, async (route) => {
        await hydrationGate;
        await route.continue();
      });
      let key = status;
      let origin = appFixture.serverUrl;
      await page.goto(`${origin}/?status=${status}&key=${key}`, {
        waitUntil: "commit",
      });
      try {
        await expect(page.locator("#fast")).toBeVisible();
        await expect(page.locator("#fast")).toHaveText(
          status === "fulfilled" ? "Fast resolved" : "Fast rejected",
        );
        await expect(page.locator("#fast")).toHaveAttribute(
          "data-hydrated",
          "false",
        );
        allowHydration();
        await expect(page.locator("#fast")).toHaveAttribute(
          "data-hydrated",
          "true",
        );
        await expect(page.locator("#fast")).toHaveAttribute(
          "data-revision",
          "1",
        );
        await expect(page.locator("#slow-fallback")).toBeVisible();
        expect(
          await page.evaluate(() => (window as any).__awaitFallbacks),
        ).not.toContain("fast");
      } finally {
        allowHydration();
        await page.request.post(`${origin}/resolve?key=${key}`);
      }
      await expect(page.locator("#slow")).toHaveText("Slow resolved");
      await expect(page.locator("#slow")).toHaveAttribute(
        "data-hydrated",
        "true",
      );
      expect(
        await page.evaluate(() => (window as any).__awaitFallbacks),
      ).not.toContain("fast");
      expect(await page.evaluate(() => (window as any).__awaitErrors)).toEqual(
        // Production loader rejections are sanitized before streaming.
        status === "rejected" ? ["Unexpected Server Error"] : [],
      );
      expect(pageErrors).toEqual([]);
    });
  });
});
