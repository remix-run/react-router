import { test, expect } from "@playwright/test";
import getPort from "get-port";

import { implementations, js, setupRscTest, validateRSCHtml } from "./utils";

implementations.forEach((implementation) => {
  test.describe(`RSC nojs (${implementation.name})`, () => {
    let port: number;
    let stop: () => void;

    test.afterAll(() => {
      stop?.();
    });

    test.beforeAll(async () => {
      port = await getPort();
      stop = await setupRscTest({
        implementation,
        port,
        files: {
          "src/routes.ts": js`
            import type { unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

            export const routes = [
              {
                id: "root",
                path: "",
                lazy: () => import("./routes/root"),
                children: [
                  {
                    id: "home",
                    index: true,
                    lazy: () => import("./routes/home"),
                  },
                  {
                    id: "render-redirect-lazy",
                    path: "/render-redirect/lazy/:id?",
                    lazy: () => import("./routes/render-redirect/lazy"),
                  },
                  {
                    id: "render-redirect",
                    path: "/render-redirect/:id?",
                    lazy: () => import("./routes/render-redirect/home"),
                  },
                ],
              },
            ] satisfies RSCRouteConfig;
          `,
          "src/routes/home.actions.ts": js`
            "use server";
            import { redirect } from "react-router";

            export async function redirectAction() {
              redirect("/?redirected=true", { headers: { "x-test": "test" } });
              return "redirected";
            }

            export async function incrementAction(prev) {
              return prev + 1;
            }
          `,
          "src/routes/home.client.tsx": js`
            "use client";
            import { useState } from "react";

            export function Counter() {
              const [count, setCount] = useState(0);
              return <button type="button" onClick={() => setCount(c => c + 1)} data-count>Count: {count}</button>;
            }
          `,
          "src/routes/home.tsx": js`
            "use client";
            import {useActionState} from "react";
            import { redirectAction, incrementAction } from "./home.actions";
            import { Counter } from "./home.client";

            export default function HomeRoute(props) {
              const [state, action] = useActionState(redirectAction, null);
              return (
                <div>
                  <form action={action}>
                    <button type="submit" data-submit>
                      Redirect via Server Function
                    </button>
                  </form>
                  {state && <div data-testid="state">{state}</div>}
                  <Counter />
                  <TestActionState />
                </div>
              );
            }

            function TestActionState() {
              const [state, action] = useActionState(incrementAction, 0);
              return (
                <form action={action}>
                  <button type="submit" data-action-state-increment-submit>
                    action-state-increment
                  </button>
                  <div data-action-state-increment-result>{state}</div>
                </form>
              );
            }
          `,

          "src/routes/render-redirect/home.tsx": js`
            import { Link, redirect } from "react-router";

            export default function RenderRedirect({ params: { id } }) {
              if (id === "redirect") {
                throw redirect("/render-redirect/redirected");
              }

              if (id === "external") {
                throw redirect("https://example.com/");
              }

              return (
                <>
                  <h1>{id || "home"}</h1>
                  <Link to="/render-redirect/redirect">Redirect</Link>
                  <Link to="/render-redirect/external">External</Link>
                </>
              )
            }
          `,
          "src/routes/render-redirect/lazy.tsx": js`
            import { Suspense } from "react";
            import { Link, redirect } from "react-router";

            export default function RenderRedirect({ params: { id } }) {
              return (
                <Suspense fallback={<p>Loading...</p>}>
                  <Lazy id={id} />
                </Suspense>
              );
            }

            async function Lazy({ id }) {
              await new Promise((r) => setTimeout(r, 0));

              if (id === "redirect") {
                throw redirect("/render-redirect/lazy/redirected");
              }

              if (id === "external") {
                throw redirect("https://example.com/");
              }

              return (
                <>
                  <h1>{id || "home"}</h1>
                  <Link to="/render-redirect/lazy/redirect">Redirect</Link>
                  <Link to="/render-redirect/external">External</Link>
                </>
              );
            }
          `,
        },
      });
    });

    test("Supports React Server Functions side-effect redirect headers for document requests", async ({
      page,
    }, { project }) => {
      test.skip(
        implementation.name === "parcel" || project.name !== "chromium",
        "TODO: figure out why parcel isn't working here",
      );

      await page.goto(`http://localhost:${port}/`);

      const responseHeadersPromise = new Promise<Record<string, string>>(
        (resolve) => {
          page.addListener("response", (response) => {
            if (response.request().method() === "POST") {
              resolve(response.headers());
            }
          });
        },
      );

      await page.click("[data-submit]");

      await page.waitForURL(`http://localhost:${port}/?redirected=true`);

      expect((await responseHeadersPromise)["x-test"]).toBe("test");

      // Ensure this is using RSC
      validateRSCHtml(await page.content());
    });

    test("Supports form state without JS", async ({ page }, { project }) => {
      test.skip(
        implementation.name === "parcel" || project.name !== "chromium",
        "TODO: figure out why parcel isn't working here",
      );

      await page.goto(`http://localhost:${port}/`);

      await expect(
        page.locator("[data-action-state-increment-result]"),
      ).toHaveText("0");
      await page.click("[data-action-state-increment-submit]");
      await expect(
        page.locator("[data-action-state-increment-result]"),
      ).toHaveText("1");

      // Ensure this is using RSC
      validateRSCHtml(await page.content());
    });

    test("Suppport throwing redirect Response from render", async ({
      page,
    }) => {
      await page.goto(`http://localhost:${port}/render-redirect`);
      await expect(page.getByText("home")).toBeAttached();
      await page.getByText("Redirect").click();
      await page.waitForURL(
        `http://localhost:${port}/render-redirect/redirected`,
      );
      await expect(page.getByText("redirected")).toBeAttached();
    });

    test("Suppport throwing external redirect Response from render", async ({
      browserName,
      page,
    }) => {
      test.skip(
        browserName === "firefox",
        "Playwright doesn't like external redirects for tests. It times out waiting for the URL even though it navigates.",
      );
      await page.goto(`http://localhost:${port}/render-redirect`);
      await expect(page.getByText("home")).toBeAttached();
      await page.getByText("External").click();
      await page.waitForURL(`https://example.com/`);
      await expect(page.getByText("Example Domain")).toBeAttached();
    });

    test("Suppport throwing redirect Response from suspended render", async ({
      page,
    }) => {
      await page.goto(`http://localhost:${port}/render-redirect/lazy/redirect`);
      await page.waitForURL(
        `http://localhost:${port}/render-redirect/lazy/redirected`,
      );
      await expect(page.getByText("redirected")).toBeAttached();
    });

    test("Suppport throwing external redirect Response from suspended render", async ({
      page,
      browserName,
    }) => {
      test.skip(
        browserName === "firefox",
        "Playwright doesn't like external redirects for tests. It times out waiting for the URL even though it navigates.",
      );
      await page.goto(`http://localhost:${port}/render-redirect/lazy/external`);
      await page.waitForURL(`https://example.com/`);
      await expect(page.getByText("Example Domain")).toBeAttached();
    });
  });
});
