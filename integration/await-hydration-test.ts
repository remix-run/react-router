import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
  type AppFixture,
} from "./helpers/create-fixture.js";

declare global {
  interface Window {
    __awaitHydrate(): void;
    __awaitResolveSlow(value: string): void;
  }
}

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
          window.__awaitSlowPromise = new Promise((resolve) => {
            window.__awaitResolveSlow = resolve;
          });
          window.__awaitHydrate = () => startTransition(() => {
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
            return {
              mode: params.get("mode"),
              fast: new Promise((resolve, reject) => setTimeout(() => {
                if (params.get("status") === "rejected") {
                  reject(new Error("Fast rejected"));
                } else {
                  resolve("Fast resolved");
                }
              }, 30)),
            };
          }

          export default function Root() {
            let { fast, mode } = useLoaderData();
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
                      <Slow mode={mode} />
                    </React.Suspense>
                  </RevisionContext.Provider>
                  <Scripts />
                </body>
              </html>
            );
          }

          function Slow({ mode }) {
            let [hydrated, setHydrated] = React.useState(false);
            React.useEffect(() => setHydrated(true), []);
            // Match the server markup before suspending on a client-controlled
            // promise, so the slow boundary doesn't hold the document open.
            if (!hydrated) return <p id="slow-placeholder">Loading slow</p>;
            return (
              <Await {...(mode === "unstable_promise"
                ? { unstable_promise: window.__awaitSlowPromise }
                : { resolve: window.__awaitSlowPromise })}>
                {(value) => <Content id="slow">{value}</Content>}
              </Await>
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
      let origin = appFixture.serverUrl;
      // WebKit waits for page loading to finish before running the animation
      // frames React uses to reveal streamed boundaries. Let the document and
      // scripts finish loading, and hold hydration in the client entry instead.
      await page.goto(
        `${origin}/?mode=${mode}&status=${status}&reporterThrows=${!!reporterThrows}`,
        {
          waitUntil: "load",
        },
      );
      await page.waitForFunction(
        () => typeof window.__awaitHydrate === "function",
      );
      await expect(page.locator("#fast")).toBeVisible();
      await expect(page.locator("#fast")).toHaveText(
        status === "fulfilled" ? "Fast resolved" : "Fast rejected",
      );
      await expect(page.locator("#fast")).toHaveAttribute(
        "data-hydrated",
        "false",
      );
      await expect(page.locator("#slow-placeholder")).toBeVisible();
      await page.evaluate(() => window.__awaitHydrate());
      await expect(page.locator("#fast")).toHaveAttribute(
        "data-hydrated",
        "true",
      );
      await expect(page.locator("#fast")).toHaveAttribute("data-revision", "1");
      await expect(page.locator("#slow-fallback")).toBeVisible();
      let fallbacks = await page.evaluate(
        () => (window as any).__awaitFallbacks,
      );
      expect(fallbacks).toContain("slow");
      expect(fallbacks).not.toContain("fast");
      await page.evaluate(() => window.__awaitResolveSlow("Slow resolved"));
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
