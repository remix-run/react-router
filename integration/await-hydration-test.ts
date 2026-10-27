import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
  type AppFixture,
} from "./helpers/create-fixture.js";

test.describe("streamed promise hydration", () => {
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
              onError={(error) => {
                window.__awaitErrors.push(error.message);
                if (new URL(window.location.href).searchParams.get("reporterThrows") === "true") {
                  throw new Error("Error reporting failed");
                }
              }}
            />);
          });
        `,
        "app/root.tsx": js`
          import * as React from "react";
          import { Await, Scripts, useAsyncError, useLoaderData } from "react-router";

          let RevisionContext = React.createContext(0);

          export function loader({ request }) {
            let params = new URL(request.url).searchParams;
            let key = params.get("key");
            globalThis.__awaitSlowResolvers ??= new Map();
            return {
              mode: params.get("mode"),
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
            let { fast, slow, mode } = useLoaderData();
            let [revision, setRevision] = React.useState(0);
            React.useLayoutEffect(() => setRevision(1), []);
            return (
              <html>
                <head />
                <body>
                  <RevisionContext.Provider value={revision}>
                    <React.Suspense fallback={<Fallback name="fast" />}>
                      {mode === "react-use" ? <ReadPromise promise={fast} /> : (
                        <Await
                          {...(mode === "unstable_promise" ? { unstable_promise: fast } : { resolve: fast })}
                          errorElement={<FastError />}
                        >
                          {(value) => <Content id="fast">{value}</Content>}
                        </Await>
                      )}
                    </React.Suspense>
                    <React.Suspense fallback={<Fallback name="slow" />}>
                      <Await {...(mode === "unstable_promise" ? { unstable_promise: slow } : { resolve: slow })}>
                        {(value) => <Content id="slow">{value}</Content>}
                      </Await>
                    </React.Suspense>
                  </RevisionContext.Provider>
                  <Scripts />
                </body>
              </html>
            );
          }

          function ReadPromise({ promise }) {
            return <Content id="fast">{React.use(promise)}</Content>;
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

  [
    { mode: "resolve", status: "fulfilled" },
    { mode: "resolve", status: "rejected" },
    { mode: "unstable_promise", status: "fulfilled" },
    { mode: "unstable_promise", status: "rejected" },
    { mode: "react-use", status: "fulfilled" },
    { mode: "resolve", status: "rejected", reporterThrows: true },
    { mode: "unstable_promise", status: "rejected", reporterThrows: true },
  ].forEach(({ mode, status, reporterThrows }) => {
    test(`${mode} keeps ${status} server content visible during a parent layout effect update${reporterThrows ? " when onError throws" : ""}`, async ({
      page,
    }) => {
      let pageErrors: Error[] = [];
      let consoleErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      let allowHydration!: () => void;
      let hydrationGate = new Promise<void>((resolve) => {
        allowHydration = resolve;
      });
      await page.route(/\/assets\/entry\.client-[^/]+\.js$/, async (route) => {
        await hydrationGate;
        await route.continue();
      });
      let key = `${mode}-${status}-${!!reporterThrows}`;
      let origin = appFixture.serverUrl;
      await page.goto(
        `${origin}/?mode=${mode}&status=${status}&key=${key}&reporterThrows=${!!reporterThrows}`,
        {
          waitUntil: "commit",
        },
      );
      try {
        // Wait for the server to reveal the fast boundary before hydration. The
        // slow boundary stays pending, so this does not wait for the stream to end.
        await expect(page.locator("#fast")).toBeVisible();
        await expect(page.locator("#fast")).toHaveText(
          status === "fulfilled" ? "Fast resolved" : "Fast rejected",
        );
        await expect(page.locator("#fast")).toHaveAttribute(
          "data-hydrated",
          "false",
        );
        await expect(page.locator("#slow-fallback")).toBeVisible();
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
        let fallbacks = await page.evaluate(
          () => (window as any).__awaitFallbacks,
        );
        expect(fallbacks).toContain("slow");
        expect(fallbacks).not.toContain("fast");
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
      expect(consoleErrors).toEqual(
        reporterThrows
          ? [
              expect.stringContaining(
                "<Await> caught the following error in onError",
              ),
            ]
          : [],
      );
    });
  });
});
