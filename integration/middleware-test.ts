import type {
  Request as PlaywrightRequest,
  Response as PlaywrightResponse,
} from "@playwright/test";
import { test, expect } from "@playwright/test";
import {
  UNSAFE_ErrorResponseImpl,
  UNSAFE_ServerMode,
  UNSAFE_SingleFetchRedirectSymbol,
} from "react-router";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import { reactRouterConfig } from "./helpers/vite.js";

let ENTRY_SERVER_WITH_HANDLE_ERROR = js`
import { PassThrough } from "node:stream";

import type { AppLoadContext, EntryContext } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";

export const streamTimeout = 5_000;

export function handleError(error, { request }) {
  if (!request.signal.aborted) {
    let {pathname, search} = new URL(request.url);
    console.error("handleError", request.method, pathname + search, error);
  }
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(abort, streamTimeout + 1000);
  });
}
  `;

test.describe("Middleware", () => {
  let originalConsoleError = console.error;

  test.beforeEach(() => {
    console.error = () => {};
  });

  test.afterEach(() => {
    console.error = originalConsoleError;
  });

  test.describe("SPA Mode", () => {
    test("calls clientMiddleware before/after loaders", async ({ page }) => {
      let fixture = await createFixture({
        spaMode: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false,
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true, minify: false },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const orderContext = createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            import { orderContext } from '../context'

            export const clientMiddleware = [
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'a']);
              },
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'b']);
              },
            ];

            export async function clientLoader({ request, context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return (
                <>
                  <h2 data-route>Index: {loaderData}</h2>
                  <Link to="/about">Go to about</Link>
                </>
               );
            }
          `,
          "app/routes/about.tsx": js`
            import { orderContext } from '../context'

            export const clientMiddleware = [
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'c']);
              },
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'd']);
              },
            ];

            export async function clientLoader({ context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return <h2 data-route>About: {loaderData}</h2>;
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('[data-route]:has-text("Index")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "Index: a,b",
      );

      (await page.$('a[href="/about"]'))?.click();
      await page.waitForSelector('[data-route]:has-text("About")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "About: c,d",
      );

      appFixture.close();
    });

    test("calls clientMiddleware before/after loaders with split route modules", async ({
      page,
    }) => {
      let fixture = await createFixture({
        spaMode: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false,
            middleware: true,
            splitRouteModules: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true, minify: false },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const orderContext = createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            import { orderContext } from '../context'

            export const clientMiddleware = [
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'a']);
              },
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'b']);
              },
            ];

            export async function clientLoader({ request, context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return (
                <>
                  <h2 data-route>Index: {loaderData}</h2>
                  <Link to="/about">Go to about</Link>
                </>
               );
            }
          `,
          "app/routes/about.tsx": js`
            import { orderContext } from '../context'

            export const clientMiddleware = [
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'c']);
              },
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'd']);
              },
            ];

            export async function clientLoader({ context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return <h2 data-route>About: {loaderData}</h2>;
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('[data-route]:has-text("Index")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "Index: a,b",
      );

      (await page.$('a[href="/about"]'))?.click();
      await page.waitForSelector('[data-route]:has-text("About")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "About: c,d",
      );

      appFixture.close();
    });

    test("calls clientMiddleware before/after actions", async ({ page }) => {
      let fixture = await createFixture({
        spaMode: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false,
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const orderContext = createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Form } from 'react-router'
            import { orderContext } from '../context';

            export const clientMiddleware = [
              ({ request, context }) => {
                context.set(orderContext, ['a']);
              },
              ({ request, context }) => {
                context.set(orderContext, [...context.get(orderContext), 'b']);
              },
            ];

            export async function clientAction({ request, context }) {
              return context.get(orderContext).join(',');
            }

            export async function clientLoader({ request, context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData, actionData }) {
              return (
                <>
                  <h2 data-route>Index: {loaderData} - {actionData || 'empty'}</h2>
                  <Form method="post">
                    <input name="name" />
                    <button type="submit">Submit</button>
                  </Form>
                </>
               );
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('[data-route]:has-text("Index")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "Index: a,b - empty",
      );

      (await page.getByRole("button"))?.click();
      await new Promise((r) => setTimeout(r, 1000));
      await page.waitForSelector('[data-route]:has-text("- a,b")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "Index: a,b - a,b",
      );

      appFixture.close();
    });

    test("handles redirects thrown on the way down", async ({ page }) => {
      let fixture = await createFixture({
        spaMode: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false,
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true },
              plugins: [reactRouter()],
            });
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'

            export default function Component({ loaderData, actionData }) {
              return <Link to="/redirect">Link</Link>;
            }
          `,
          "app/routes/redirect.tsx": js`
            import { Link, redirect } from 'react-router'
            export const clientMiddleware = [
              ({ request, context }) => { throw redirect('/target'); }
            ]
            export default function Component() {
              return <h1>Redirect</h1>
            }
          `,
          "app/routes/target.tsx": js`
            export default function Component() {
              return <h1>Target</h1>
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a:has-text("Link")');

      (await page.getByRole("link"))?.click();
      await page.waitForSelector('h1:has-text("Target")');

      appFixture.close();
    });

    test("handles redirects thrown on the way up", async ({ page }) => {
      let fixture = await createFixture({
        spaMode: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false,
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true },
              plugins: [reactRouter()],
            });
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'

            export default function Component({ loaderData, actionData }) {
              return <Link to="/redirect">Link</Link>;
            }
          `,
          "app/routes/redirect.tsx": js`
            import { Link, redirect } from 'react-router'
            export const clientMiddleware = [
              async ({ request, context }, next) => {
                await next();
                throw redirect('/target');
              }
            ]
            export default function Component() {
              return <h1>Redirect</h1>
            }
          `,
          "app/routes/target.tsx": js`
            export default function Component() {
              return <h1>Target</h1>
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a:has-text("Link")');

      (await page.getByRole("link"))?.click();
      await page.waitForSelector('h1:has-text("Target")');

      appFixture.close();
    });

    test("handles errors thrown on the way down", async ({ page }) => {
      let fixture = await createFixture(
        {
          spaMode: true,
          files: {
            "react-router.config.ts": reactRouterConfig({
              ssr: false,
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true },
                plugins: [reactRouter()],
              });
            `,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'

              export default function Component() {
                return <Link to="/broken">Link</Link>;
              }
            `,
            "app/routes/broken.tsx": js`
              export const clientMiddleware = [
                async ({ request, context }, next) => {
                  throw new Error('broken!');
                }
              ]
              export default function Component() {
                return <h1>Should not see me</h1>
              }
              export function ErrorBoundary({ error }) {
                return <h1 data-error>{error.message}</h1>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a:has-text("Link")');

      (await page.getByRole("link"))?.click();
      await page.waitForSelector("[data-error]");
      expect(await page.innerText("[data-error]")).toBe("broken!");

      appFixture.close();
    });

    test("handles errors thrown on the way up", async ({ page }) => {
      let fixture = await createFixture(
        {
          spaMode: true,
          files: {
            "react-router.config.ts": reactRouterConfig({
              ssr: false,
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true },
                plugins: [reactRouter()],
              });
            `,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'

              export default function Component() {
                return <Link to="/broken">Link</Link>;
              }
            `,
            "app/routes/broken.tsx": js`
              export const clientMiddleware = [
                async ({ request, context }, next) => {
                  await next();
                  throw new Error('broken!');
                }
              ]
              export function clientLoader() {
                return "nope"
              }
              export default function Component() {
                return <h1>Should not see me</h1>
              }
              export function ErrorBoundary({ loaderData, error }) {
                return (
                  <>
                    <h1 data-error>{error.message}</h1>
                    <pre>{loaderData ?? 'empty'}</pre>
                  </>
                );
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a:has-text("Link")');

      (await page.getByRole("link"))?.click();
      await page.waitForSelector("[data-error]");
      expect(await page.innerText("[data-error]")).toBe("broken!");
      expect(await page.innerText("pre")).toBe("empty");

      appFixture.close();
    });

    test("calls clientMiddleware for routes even without a loader", async ({
      page,
    }) => {
      let fixture = await createFixture({
        spaMode: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false,
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true, minify: false },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const orderContext = createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            export default function Component({ loaderData }) {
              return <Link to="/a/b/c">Link</Link>;
            }
          `,
          "app/routes/a.tsx": js`
            import { Outlet } from 'react-router'
            import { orderContext } from '../context';
            export const clientMiddleware = [
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'a']);
              },
            ];

            export function clientLoader({ context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return <><h2>A: {loaderData}</h2><Outlet /></>;
            }
          `,
          "app/routes/a.b.tsx": js`
            import { Outlet } from 'react-router'
            import { orderContext } from '../context';
            export const clientMiddleware = [
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'b']);
              }
            ];

            export default function Component() {
              return <><h3>B</h3><Outlet /></>;
            }
          `,
          "app/routes/a.b.c.tsx": js`
            import { orderContext } from '../context';
            export function clientLoader({ context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return <h4>C: {loaderData}</h4>;
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);
      (await page.$('a[href="/a/b/c"]'))?.click();
      await page.waitForSelector("h4");
      expect(await page.innerText("h2")).toBe("A: a,b");
      expect(await page.innerText("h3")).toBe("B");
      expect(await page.innerText("h4")).toBe("C: a,b");

      appFixture.close();
    });
  });

  test.describe("Client Middleware", () => {
    test("calls clientMiddleware before/after loaders", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true, minify: false },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const orderContext = createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            import { orderContext } from "../context";;

            export const clientMiddleware = [
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'a']);
              },
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'b']);
              },
            ];

            export async function clientLoader({ request, context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return (
                <>
                  <h2 data-route>Index: {loaderData}</h2>
                  <Link to="/about">Go to about</Link>
                </>
               );
            }
          `,
          "app/routes/about.tsx": js`
            import { orderContext } from "../context";;
            export const clientMiddleware = [
              ({ context }) => {
                context.set(orderContext, ['c']); // reset order from hydration
              },
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'd']);
              },
            ];

            export async function clientLoader({ context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return <h2 data-route>About: {loaderData}</h2>;
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('[data-route]:has-text("Index")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "Index: a,b",
      );

      (await page.$('a[href="/about"]'))?.click();
      await page.waitForSelector('[data-route]:has-text("About")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "About: c,d",
      );

      appFixture.close();
    });

    test("calls clientMiddleware before/after loaders with split route modules", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
            splitRouteModules: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true, minify: false },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const orderContext = createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            import { orderContext } from "../context";;

            export const clientMiddleware = [
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'a']);
              },
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'b']);
              },
            ];

            export async function clientLoader({ request, context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return (
                <>
                  <h2 data-route>Index: {loaderData}</h2>
                  <Link to="/about">Go to about</Link>
                </>
               );
            }
          `,
          "app/routes/about.tsx": js`
            import { orderContext } from "../context";;
            export const clientMiddleware = [
              ({ context }) => {
                context.set(orderContext, ['c']); // reset order from hydration
              },
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'd']);
              },
            ];

            export async function clientLoader({ context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return <h2 data-route>About: {loaderData}</h2>;
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('[data-route]:has-text("Index")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "Index: a,b",
      );

      (await page.$('a[href="/about"]'))?.click();
      await page.waitForSelector('[data-route]:has-text("About")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "About: c,d",
      );

      appFixture.close();
    });

    test("calls clientMiddleware when no loaders exist", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true, minify: false },
              plugins: [reactRouter()],
            });
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'

            export const clientMiddleware = [
              ({ context }) => {
                console.log('running index middleware')
              },
            ];

            export default function Component() {
              return (
                <>
                  <h2 data-route>Index</h2>
                  <Link to="/about">Go to about</Link>
                </>
               );
            }
          `,
          "app/routes/about.tsx": js`
            import { Link } from 'react-router'
            export const clientMiddleware = [
              ({ context }) => {
                console.log('running about middleware')
              },
            ];

            export default function Component() {
              return (
                <>
                  <h2 data-route>About</h2>
                  <Link to="/">Go to index</Link>
                </>
              );
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let logs: string[] = [];
      page.on("console", (msg) => logs.push(msg.text()));

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      (await page.$('a[href="/about"]'))?.click();
      await page.waitForSelector('[data-route]:has-text("About")');
      expect(logs).toEqual(["running about middleware"]);
      logs.splice(0);

      (await page.$('a[href="/"]'))?.click();
      await page.waitForSelector('[data-route]:has-text("Index")');
      expect(logs).toEqual(["running index middleware"]);

      appFixture.close();
    });

    test("calls clientMiddleware before/after actions", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const orderContext = createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Form } from 'react-router'
            import { orderContext } from "../context";;

            export const clientMiddleware = [
              ({ context }) => {
                context.set(orderContext, ['a']);
              },
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'b']);
              },
            ];

            export async function clientAction({ request, context }) {
              return context.get(orderContext).join(',');
            }

            export async function clientLoader({ request, context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData, actionData }) {
              return (
                <>
                  <h2 data-route>Index: {loaderData} - {actionData || 'empty'}</h2>
                  <Form method="post">
                    <input name="name" />
                    <button type="submit">Submit</button>
                  </Form>
                </>
               );
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('[data-route]:has-text("Index")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "Index: a,b - empty",
      );

      (await page.getByRole("button"))?.click();
      await new Promise((r) => setTimeout(r, 1000));
      await page.waitForSelector('[data-route]:has-text("- a,b")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "Index: a,b - a,b",
      );

      appFixture.close();
    });

    test("handles redirects thrown on the way down", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true },
              plugins: [reactRouter()],
            });
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'

            export default function Component({ loaderData, actionData }) {
              return <Link to="/redirect">Link</Link>;
            }
          `,
          "app/routes/redirect.tsx": js`
            import { Link, redirect } from 'react-router'
            export const clientMiddleware = [
              ({ request, context }) => { throw redirect('/target'); }
            ]
            export default function Component() {
              return <h1>Redirect</h1>
            }
          `,
          "app/routes/target.tsx": js`
            export default function Component() {
              return <h1>Target</h1>
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a:has-text("Link")');

      (await page.getByRole("link"))?.click();
      await page.waitForSelector('h1:has-text("Target")');

      appFixture.close();
    });

    test("handles redirects thrown on the way up", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true },
              plugins: [reactRouter()],
            });
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'

            export default function Component({ loaderData, actionData }) {
              return <Link to="/redirect">Link</Link>;
            }
          `,
          "app/routes/redirect.tsx": js`
            import { Link, redirect } from 'react-router'
            export const clientMiddleware = [
              async ({ request, context }, next) => {
                await next();
                throw redirect('/target');
              }
            ]
            export default function Component() {
              return <h1>Redirect</h1>
            }
          `,
          "app/routes/target.tsx": js`
            export default function Component() {
              return <h1>Target</h1>
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a:has-text("Link")');

      (await page.getByRole("link"))?.click();
      await page.waitForSelector('h1:has-text("Target")');

      appFixture.close();
    });

    test("handles errors thrown on the way down", async ({ page }) => {
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true },
                plugins: [reactRouter()],
              });
            `,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'

              export default function Component() {
                return <Link to="/broken">Link</Link>;
              }
            `,
            "app/routes/broken.tsx": js`
              export const clientMiddleware = [
                async ({ request, context }, next) => {
                  throw new Error('broken!')
                }
              ]
              export default function Component() {
                return <h1>Should not see me</h1>
              }
              export function ErrorBoundary({ error }) {
                return <h1 data-error>{error.message}</h1>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a:has-text("Link")');

      (await page.getByRole("link"))?.click();
      await page.waitForSelector("[data-error]");
      expect(await page.innerText("[data-error]")).toBe("broken!");

      appFixture.close();
    });

    test("handles errors thrown on the way up", async ({ page }) => {
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true },
                plugins: [reactRouter()],
              });
            `,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'

              export default function Component() {
                return <Link to="/broken">Link</Link>;
              }
            `,
            "app/routes/broken.tsx": js`
              import { useRouteError } from 'react-router'
              export const clientMiddleware = [
                async ({ request, context }, next) => {
                  await next();
                  throw new Error('broken!')
                }
              ]
              export function clientLoader() {
                return "nope"
              }
              export default function Component() {
                return <h1>Should not see me</h1>
              }
              export function ErrorBoundary({ loaderData, error }) {
                return (
                  <>
                    <h1 data-error>{error.message}</h1>
                    <pre>{loaderData ?? 'empty'}</pre>
                  </>
                );
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a:has-text("Link")');

      (await page.getByRole("link"))?.click();
      await page.waitForSelector("[data-error]");
      expect(await page.innerText("[data-error]")).toBe("broken!");
      expect(await page.innerText("pre")).toBe("empty");

      appFixture.close();
    });

    test("calls clientMiddleware for routes even without a loader", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true, minify: false },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const orderContext = createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            export default function Component({ loaderData }) {
              return <Link to="/a/b/c">Link</Link>;
            }
          `,
          "app/routes/a.tsx": js`
            import { Outlet } from 'react-router'
            import { orderContext } from '../context';
            export const clientMiddleware = [
              ({ context }) => { context.set(orderContext, ['a']); }
            ];

            export function clientLoader({ context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return <><h2>A: {loaderData}</h2><Outlet /></>;
            }
          `,
          "app/routes/a.b.tsx": js`
            import { Outlet } from 'react-router'
            import { orderContext } from '../context';
            export const clientMiddleware = [
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'b']);
              },
            ];

            export default function Component() {
              return <><h3>B</h3><Outlet /></>;
            }
          `,
          "app/routes/a.b.c.tsx": js`
            import { orderContext } from '../context';
            export function clientLoader({ context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return <h4>C: {loaderData}</h4>;
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      (await page.$('a[href="/a/b/c"]'))?.click();
      await page.waitForSelector("h4");
      expect(await page.innerText("h2")).toBe("A: a,b");
      expect(await page.innerText("h3")).toBe("B");
      expect(await page.innerText("h4")).toBe("C: a,b");

      appFixture.close();
    });

    test("calls clientMiddleware once when multiple server requests happen", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true, minify: false },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const countContext = createContext({
              parent: 0,
              child: 0,
            });
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            export default function Component({ loaderData }) {
              return <Link to="/parent/child">Go to /parent/child</Link>;
            }
          `,
          "app/routes/parent.tsx": js`
            import { countContext } from '../context';
            import { Outlet } from 'react-router';
            export function loader() {
              return 'PARENT'
            }
            export const clientMiddleware = [
              ({ context }) => { context.get(countContext).parent++ },
            ];

            export async function clientLoader({ serverLoader, context }) {
              return {
                serverData: await serverLoader(),
                context: context.get(countContext)
              }
            }

            export default function Component({ loaderData }) {
              return (
                <>
                  <h2 data-parent>{JSON.stringify(loaderData)}</h2>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/parent.child.tsx": js`
            import { countContext } from '../context';
            export function loader() {
              return 'CHILD'
            }
            export const clientMiddleware = [
              ({ context }) => { context.get(countContext).child++ },
            ];

            export async function clientLoader({ serverLoader, context }) {
              return {
                serverData: await serverLoader(),
                context: context.get(countContext)
              }
            }

            export default function Component({ loaderData }) {
              return <h3 data-child>{JSON.stringify(loaderData)}</h3>;
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let requests: string[] = [];
      page.on("request", (request: PlaywrightRequest) => {
        if (request.url().includes(".data")) {
          requests.push(request.url());
        }
      });

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      (await page.$('a[href="/parent/child"]'))?.click();
      await page.waitForSelector("[data-child]");

      // 2 separate server requests made
      expect(requests.sort()).toEqual([
        expect.stringContaining("/parent/child.data?_routes=routes%2Fparent"),
        expect.stringContaining(
          "/parent/child.data?_routes=routes%2Fparent.child",
        ),
      ]);

      // But client middlewares only ran once
      let json = (await page.locator("[data-parent]").textContent()) as string;
      expect(JSON.parse(json)).toEqual({
        serverData: "PARENT",
        context: {
          parent: 1,
          child: 1,
        },
      });
      json = (await page.locator("[data-child]").textContent()) as string;
      expect(JSON.parse(json)).toEqual({
        serverData: "CHILD",
        context: {
          parent: 1,
          child: 1,
        },
      });

      appFixture.close();
    });

    test("calls clientMiddleware once when multiple server requests happen and some routes opt out", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true, minify: false },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const countContext = createContext({
              parent: 0,
              child: 0,
              index: 0,
            });
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            export default function Component({ loaderData }) {
              return <Link to="/parent/child">Go to /parent/child</Link>;
            }
          `,
          "app/routes/parent.tsx": js`
            import { Outlet } from 'react-router';
            import { countContext } from '../context';
            export function loader() {
              return 'PARENT'
            }
            export const clientMiddleware = [
              ({ context }) => { context.get(countContext).parent++ },
            ];
            export default function Component({ loaderData }) {
              return (
                <>
                  <h2 data-parent>{loaderData}</h2>
                  <Outlet/>
                </>
              );
            }
            export function shouldRevalidate() {
              return false;
            }
          `,
          "app/routes/parent.child.tsx": js`
            import { Outlet } from 'react-router';
            import { countContext } from '../context';
            export function loader() {
              return 'CHILD'
            }
            export const clientMiddleware = [
              ({ context }) => { context.get(countContext).child++ },
            ];
            export default function Component({ loaderData }) {
              return (
                <>
                  <h3 data-child>{loaderData}</h3>
                  <Outlet/>
                </>
              );
            }
          `,
          "app/routes/parent.child._index.tsx": js`
            import { Form } from 'react-router';
            import { countContext } from '../context';
            export function action() {
              return 'INDEX ACTION'
            }
            export function loader() {
              return 'INDEX'
            }
            export const clientMiddleware = [
              ({ context }) => { context.get(countContext).index++ },
            ];
            export async function clientLoader({ serverLoader, context }) {
              return {
                serverData: await serverLoader(),
                context: context.get(countContext)
              }
            }
            export default function Component({ loaderData, actionData }) {
              return (
                <>
                  <h4 data-index>{JSON.stringify(loaderData)}</h4>
                  <Form method="post">
                    <button type="submit">Submit</button>
                  </Form>
                  {actionData ? <p data-action>{JSON.stringify(actionData)}</p> : null}
                </>
              );
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let requests: string[] = [];
      page.on("request", (request: PlaywrightRequest) => {
        if (request.method() === "GET" && request.url().includes(".data")) {
          requests.push(request.url());
        }
      });

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      (await page.$('a[href="/parent/child"]'))?.click();
      await page.waitForSelector("[data-child]");
      expect(await page.locator("[data-parent]").textContent()).toBe("PARENT");
      expect(await page.locator("[data-child]").textContent()).toBe("CHILD");
      expect(
        JSON.parse((await page.locator("[data-index]").textContent())!),
      ).toEqual({
        serverData: "INDEX",
        context: {
          parent: 1,
          child: 1,
          index: 1,
        },
      });

      requests = []; // clear before form submission
      (await page.$('button[type="submit"]'))?.click();
      await page.waitForSelector("[data-action]");

      // 2 separate server requests made
      expect(requests.sort()).toEqual([
        // This is the normal request but only included parent.child because parent opted out
        expect.stringMatching(
          /\/parent\/child\.data\?_routes=routes%2Fparent\.child$/,
        ),
        // index gets it's own due to clientLoader
        expect.stringMatching(
          /\/parent\/child\.data\?_routes=routes%2Fparent\.child\._index$/,
        ),
      ]);

      // But client middlewares only ran once for the action and once for the revalidation
      expect(await page.locator("[data-parent]").textContent()).toBe("PARENT");
      expect(await page.locator("[data-child]").textContent()).toBe("CHILD");
      expect(
        JSON.parse((await page.locator("[data-index]").textContent())!),
      ).toEqual({
        serverData: "INDEX",
        context: {
          parent: 3,
          child: 3,
          index: 3,
        },
      });

      appFixture.close();
    });
  });

  test.describe("Server Middleware", () => {
    test("calls middleware before/after loaders", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true, minify: false },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const orderContext = createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            import { orderContext } from "../context";;

            export const middleware = [
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'a']);
              },
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'b']);
              },
            ];

            export async function loader({ request, context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return (
                <>
                  <h2 data-route>Index: {loaderData}</h2>
                  <Link to="/about">Go to about</Link>
                </>
               );
            }
          `,
          "app/routes/about.tsx": js`
            import { orderContext } from "../context";;
            export const middleware = [
              ({ context }) => {
                context.set(orderContext, ['c']);
              },
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'd']);
              }
            ];

            export async function loader({ context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return <h2 data-route>About: {loaderData}</h2>;
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('[data-route]:has-text("Index")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "Index: a,b",
      );

      (await page.$('a[href="/about"]'))?.click();
      await page.waitForSelector('[data-route]:has-text("About")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "About: c,d",
      );

      appFixture.close();
    });

    test("calls middleware when no loaders exist on document, but not data requests", async ({
      page,
    }) => {
      let oldConsoleLog = console.log;
      let logs: any[] = [];
      console.log = (...args) => logs.push(args);

      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true, minify: false },
              plugins: [reactRouter()],
            });
          `,
          "app/routes/parent.tsx": js`
            import { Link, Outlet } from 'react-router'

            export const middleware = [
              ({ request }) => {
                console.log('Running parent middleware', new URL(request.url).pathname)
              },
            ];

            export default function Component() {
              return (
                <>
                  <h2>Parent</h2>
                  <Link to="/parent/a">Go to A</Link>
                  <Link to="/parent/b">Go to B</Link>
                  <Outlet/>
                </>
               );
            }
          `,
          "app/routes/parent.a.tsx": js`
            export const middleware = [
              ({ request }) => {
                console.log('Running A middleware', new URL(request.url).pathname)
              },
            ];

            export default function Component() {
              return <h3>A</h3>;
            }
          `,
          "app/routes/parent.b.tsx": js`
            export const middleware = [
              ({ request }) => {
                console.log('Running B middleware', new URL(request.url).pathname)
              },
            ];

            export default function Component() {
              return <h3>B</h3>;
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/parent/a");
      await page.waitForSelector('h2:has-text("Parent")');
      await page.waitForSelector('h3:has-text("A")');
      expect(logs).toEqual([
        ["Running parent middleware", "/parent/a"],
        ["Running A middleware", "/parent/a"],
      ]);

      (await page.$('a[href="/parent/b"]'))?.click();
      await page.waitForSelector('h3:has-text("B")');
      expect(logs).toEqual([
        ["Running parent middleware", "/parent/a"],
        ["Running A middleware", "/parent/a"],
      ]);

      appFixture.close();
      console.log = oldConsoleLog;
    });

    test("calls middleware before/after actions", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const orderContext = createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Form } from 'react-router'
            import { orderContext } from "../context";;

            export const middleware = [
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'a']);
              },
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'b']);
              },
            ];

            export async function action({ request, context }) {
              return context.get(orderContext).join(',');
            }

            export async function loader({ request, context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData, actionData }) {
              return (
                <>
                  <h2 data-route>Index: {loaderData} - {actionData || 'empty'}</h2>
                  <Form method="post">
                    <input name="name" />
                    <button type="submit">Submit</button>
                  </Form>
                </>
               );
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('[data-route]:has-text("Index")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "Index: a,b - empty",
      );

      (await page.getByRole("button"))?.click();
      await new Promise((r) => setTimeout(r, 1000));
      await page.waitForSelector('[data-route]:has-text("- a,b")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "Index: a,b - a,b",
      );

      appFixture.close();
    });

    test("handles redirects thrown on the way down", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true },
              plugins: [reactRouter()],
            });
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'

            export default function Component({ loaderData, actionData }) {
              return <Link to="/redirect">Link</Link>;
            }
          `,
          "app/routes/redirect.tsx": js`
            import { Link, redirect } from 'react-router'
            export const middleware = [
              ({ request, context }) => { throw redirect('/target'); }
            ]
            export function loader() {
              return null;
            }
            export default function Component() {
              return <h1>Redirect</h1>
            }
          `,
          "app/routes/target.tsx": js`
            export default function Component() {
              return <h1>Target</h1>
            }
          `,
        },
      });

      let res = await fixture.requestDocument("/redirect");
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("/target");
      expect(res.body).toBeNull();

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a:has-text("Link")');

      (await page.getByRole("link"))?.click();
      await page.waitForSelector('h1:has-text("Target")');

      appFixture.close();
    });

    test("handles redirects thrown on the way up", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true },
              plugins: [reactRouter()],
            });
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'

            export default function Component({ loaderData, actionData }) {
              return <Link to="/redirect">Link</Link>;
            }
          `,
          "app/routes/redirect.tsx": js`
            import { Link, redirect } from 'react-router'
            export const middleware = [
              async ({ request, context }, next) => {
                await next();
                throw redirect('/target');
              }
            ]
            export function loader() {
              return null;
            }
            export default function Component() {
              return <h1>Redirect</h1>
            }
          `,
          "app/routes/target.tsx": js`
            export default function Component() {
              return <h1>Target</h1>
            }
          `,
        },
      });

      let res = await fixture.requestDocument("/redirect");
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("/target");
      expect(res.body).toBeNull();

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a:has-text("Link")');

      (await page.getByRole("link"))?.click();
      await page.waitForSelector('h1:has-text("Target")');

      appFixture.close();
    });

    test("doesn't serialize single fetch redirects until after the middleware chain", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true },
              plugins: [reactRouter()],
            });
          `,
          "app/routes/redirect.tsx": js`
            import { Link, redirect } from 'react-router'
            export const middleware = [
              async ({ request, context }, next) => {
                let res = await next();
                // Should still be a normal redirect here, not yet encoded into
                // a single fetch redirect
                res.headers.set("X-Status", res.status);
                res.headers.set("X-Location", res.headers.get('Location'));
                return res;
              }
            ]
            export function loader() {
              throw redirect('/target');
            }
            export default function Component() {
              return <h1>Redirect</h1>
            }
          `,
          "app/routes/target.tsx": js`
            export default function Component() {
              return <h1>Target</h1>
            }
          `,
        },
      });

      let res = await fixture.requestSingleFetchData("/redirect.data");
      expect(res.status).toBe(202);
      expect(res.headers.get("location")).toBe(null);
      expect(res.headers.get("x-status")).toBe("302");
      expect(res.headers.get("x-location")).toBe("/target");
      expect(res.data).toEqual({
        [UNSAFE_SingleFetchRedirectSymbol]: {
          redirect: "/target",
          reload: false,
          replace: false,
          revalidate: false,
          status: 302,
        },
      });
    });

    test("handles errors thrown on the way down (document)", async ({
      page,
    }) => {
      let errors: any[] = [];
      console.error = (...args) => errors.push(args);

      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true },
                plugins: [reactRouter()],
              });
            `,
            "app/entry.server.tsx": ENTRY_SERVER_WITH_HANDLE_ERROR,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'

              export default function Component() {
                return <Link to="/broken">Link</Link>;
              }
            `,
            "app/routes/broken.tsx": js`
              export const middleware = [
                async ({ request, context }, next) => {
                  throw new Error('broken!');
                }
              ]
              export default function Component() {
                return <h1>Should not see me</h1>
              }
              export function ErrorBoundary({ error }) {
                return <h1 data-error>{error.message}</h1>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/broken");
      expect(await page.innerText("[data-error]")).toBe("broken!");
      expect(errors).toEqual([
        ["handleError", "GET", "/broken", new Error("broken!")],
      ]);

      appFixture.close();
    });

    test("handles errors thrown on the way down (data)", async ({ page }) => {
      let errors: any[] = [];
      console.error = (...args) => errors.push(args);
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true },
                plugins: [reactRouter()],
              });
            `,
            "app/entry.server.tsx": ENTRY_SERVER_WITH_HANDLE_ERROR,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'

              export default function Component() {
                return <Link to="/broken">Link</Link>;
              }
            `,
            "app/routes/broken.tsx": js`
              export const middleware = [
                async ({ request, context }, next) => {
                  throw new Error('broken!');
                }
              ]
              export function loader() {
                return null
              }
              export default function Component() {
                return <h1>Should not see me</h1>
              }
              export function ErrorBoundary({ error }) {
                return <h1 data-error>{error.message}</h1>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      (await page.$('a[href="/broken"]'))?.click();
      await page.waitForSelector("[data-error]");
      expect(await page.innerText("[data-error]")).toBe("broken!");
      expect(errors).toEqual([
        ["handleError", "GET", "/broken.data", new Error("broken!")],
      ]);

      appFixture.close();
    });

    test("handles errors thrown on the way up (document)", async ({ page }) => {
      let errors: any[] = [];
      console.error = (...args) => errors.push(args);
      let fixture = await createFixture(
        {
          files: {
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true },
                plugins: [reactRouter()],
              });
            `,
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "app/entry.server.tsx": ENTRY_SERVER_WITH_HANDLE_ERROR,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'

              export default function Component() {
                return <Link to="/broken">Link</Link>;
              }
            `,
            "app/routes/broken.tsx": js`
              export const middleware = [
                async ({ request, context }, next) => {
                  await next();
                  throw new Error('broken!');
                }
              ]
              export function loader() {
                return "nope"
              }
              export default function Component() {
                return <h1>Should not see me</h1>
              }
              export function ErrorBoundary({ error, loaderData }) {
                return (
                  <>
                    <h1 data-error>{error.message}</h1>
                    <pre>{loaderData ?? 'empty'}</pre>
                  </>
                );
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/broken");
      expect(await page.innerText("[data-error]")).toBe("broken!");
      expect(await page.innerText("pre")).toBe("empty");
      expect(errors).toEqual([
        ["handleError", "GET", "/broken", new Error("broken!")],
      ]);

      appFixture.close();
    });

    test("handles errors thrown on the way up (data)", async ({ page }) => {
      let errors: any[] = [];
      console.error = (...args) => errors.push(args);
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true },
                plugins: [reactRouter()],
              });
            `,
            "app/entry.server.tsx": ENTRY_SERVER_WITH_HANDLE_ERROR,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'

              export default function Component() {
                return <Link to="/broken">Link</Link>;
              }
            `,
            "app/routes/broken.tsx": js`
              export const middleware = [
                async ({ request, context }, next) => {
                  await next()
                  throw new Error('broken!');
                }
              ]
              export function loader() {
                return "nope"
              }
              export default function Component() {
                return <h1>Should not see me</h1>
              }
              export function ErrorBoundary({ error, loaderData }) {
                return (
                  <>
                    <h1 data-error>{error.message}</h1>
                    <pre>{loaderData ?? 'empty'}</pre>
                  </>
                );
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      (await page.$('a[href="/broken"]'))?.click();
      await page.waitForSelector("h1");
      await page.waitForSelector("[data-error]");
      expect(await page.innerText("[data-error]")).toBe("broken!");
      expect(await page.innerText("pre")).toBe("empty");
      expect(errors).toEqual([
        ["handleError", "GET", "/broken.data", new Error("broken!")],
      ]);

      appFixture.close();
    });

    test("bubbles errors up on document requests", async ({ page }) => {
      let errors: any[] = [];
      console.error = (...args) => errors.push(args);
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true, minify: false },
                plugins: [reactRouter()],
              });
            `,
            "app/entry.server.tsx": ENTRY_SERVER_WITH_HANDLE_ERROR,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'
              export default function Component({ loaderData }) {
                return <Link to="/a/b">Link</Link>
              }
            `,
            "app/routes/a.tsx": js`
              import { Outlet } from 'react-router'

              export const middleware = [
                async ({ context }, next) => {
                  let res = await next();
                  res.headers.set('x-a', 'true');
                  return res;
                },
              ];

              export function loader() {
                return "A";
              }

              export default function Component() {
                return <><h1>A</h1><Outlet/></>;
              }

              export function ErrorBoundary({ error }) {
                return <><h1>A Error Boundary</h1><pre>{error.message}</pre></>
              }
            `,
            "app/routes/a.b.tsx": js`
              export const middleware = [
                async ({ context }, next) => {
                  let res = await next();
                  throw new Error('broken!')
                },
              ];

              export function loader() {
                return "B";
              }

              export default function Component() {
                return <h2>B</h2>;
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/a/b");
      expect(await page.locator("h1").textContent()).toBe("A Error Boundary");
      expect(await page.locator("pre").textContent()).toBe("broken!");
      expect(errors).toEqual([
        ["handleError", "GET", "/a/b", new Error("broken!")],
      ]);

      appFixture.close();
    });

    test("bubbles errors up on data requests", async ({ page }) => {
      let errors: any[] = [];
      console.error = (...args) => errors.push(args);
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true, minify: false },
                plugins: [reactRouter()],
              });
            `,
            "app/entry.server.tsx": ENTRY_SERVER_WITH_HANDLE_ERROR,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'
              export default function Component({ loaderData }) {
                return <Link to="/a/b">Link</Link>
              }
            `,
            "app/routes/a.tsx": js`
              import { Outlet } from 'react-router'

              export const middleware = [
                async ({ context }, next) => {
                  let res = await next();
                  res.headers.set('x-a', 'true');
                  return res;
                },
              ];

              export function loader() {
                return "A";
              }

              export default function Component() {
                return <><h1>A</h1><Outlet/></>;
              }

              export function ErrorBoundary({ error }) {
                return <><h1>A Error Boundary</h1><pre>{error.message}</pre></>
              }
            `,
            "app/routes/a.b.tsx": js`
              export const middleware = [
                async ({ context }, next) => {
                  let res = await next();
                  throw new Error('broken!')
                },
              ];

              export function loader() {
                return "B";
              }

              export default function Component() {
                return <h2>B</h2>;
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      (await page.$('a[href="/a/b"]'))?.click();
      await page.waitForSelector("pre");
      expect(await page.locator("h1").textContent()).toBe("A Error Boundary");
      expect(await page.locator("pre").textContent()).toBe("broken!");
      expect(errors).toEqual([
        ["handleError", "GET", "/a/b.data", new Error("broken!")],
      ]);

      appFixture.close();
    });

    test("bubbles errors on the way down up to at least the highest route with a loader", async ({
      page,
    }) => {
      let errors: any[] = [];
      console.error = (...args) => errors.push(args);
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true, minify: false },
                plugins: [reactRouter()],
              });
            `,
            "app/entry.server.tsx": ENTRY_SERVER_WITH_HANDLE_ERROR,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'
              export default function Component({ loaderData }) {
                return <Link to="/a/b/c/d">Link</Link>
              }
            `,
            "app/routes/a.tsx": js`
              import { Outlet } from 'react-router'
              export default function Component() {
                return <Outlet/>
              }
              export function ErrorBoundary({ error }) {
                return <><h1>A Error Boundary</h1><pre>{error.message}</pre></>
              }
            `,
            "app/routes/a.b.tsx": js`
              import { Outlet } from 'react-router'
              export function loader() {
                return null;
              }
              export default function Component() {
                return <Outlet />
              }
            `,
            "app/routes/a.b.c.tsx": js`
              import { Outlet } from 'react-router'
              export default function Component() {
                return <Outlet/>
              }
              export function ErrorBoundary({ error }) {
                return <><h1>C Error Boundary</h1><pre>{error.message}</pre></>
              }
            `,
            "app/routes/a.b.c.d.tsx": js`
              import { Outlet } from 'react-router'
              export const middleware = [() => { throw new Error("broken!") }]
              export default function Component() {
                return <Outlet/>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/a/b/c/d");
      expect(await page.locator("h1").textContent()).toBe("A Error Boundary");
      expect(await page.locator("pre").textContent()).toBe("broken!");
      expect(errors).toEqual([
        ["handleError", "GET", "/a/b/c/d", new Error("broken!")],
      ]);
      errors.splice(0);

      await app.goto("/");
      await app.clickLink("/a/b/c/d");
      expect(await page.locator("h1").textContent()).toBe("A Error Boundary");
      expect(await page.locator("pre").textContent()).toBe("broken!");
      expect(errors).toEqual([
        ["handleError", "GET", "/a/b/c/d.data", new Error("broken!")],
      ]);

      appFixture.close();
    });

    test("bubbles errors on the way down up to the deepest error boundary when loaders aren't revalidating", async ({
      page,
    }) => {
      let errors: any[] = [];
      console.error = (...args) => errors.push(args);
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true, minify: false },
                plugins: [reactRouter()],
              });
            `,
            "app/entry.server.tsx": ENTRY_SERVER_WITH_HANDLE_ERROR,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'
              export default function Component({ loaderData }) {
                return (
                  <>
                    <Link to="/a/b">/a/b</Link>
                    <br/>
                    <Link to="/a/b/c/d">/a/b/c/d</Link>
                  </>
                );
              }
            `,
            "app/routes/a.tsx": js`
              import { Outlet } from 'react-router'
              export default function Component() {
                return <Outlet/>
              }
              export function ErrorBoundary({ error }) {
                return <><h1 data-error-a>A Error Boundary</h1><pre>{error.message}</pre></>
              }
            `,
            "app/routes/a.b.tsx": js`
              import { Link, Outlet } from 'react-router'
              export function loader() {
                return { message: "DATA" };
              }
              export default function Component({ loaderData }) {
                return (
                  <>
                    <h2 data-ab>AB: {loaderData.message}</h2>
                    <Link to="/a/b/c/d">/a/b/c/d</Link>
                    <Outlet/>
                  </>
                );
              }
              export function shouldRevalidate() {
                return false;
              }
            `,
            "app/routes/a.b.c.tsx": js`
              import { Outlet } from 'react-router'
              export default function Component() {
                return <Outlet/>
              }
              export function ErrorBoundary({ error }) {
                return <><h1 data-error-c>C Error Boundary</h1><pre>{error.message}</pre></>
              }
            `,
            "app/routes/a.b.c.d.tsx": js`
              import { Outlet } from 'react-router'
              export const middleware = [() => { throw new Error("broken!") }]
              export const loader = () => null;
              export default function Component() {
                return <Outlet/>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/a/b");
      await page.waitForSelector("[data-ab]");
      expect(await page.locator("[data-ab]").textContent()).toBe("AB: DATA");
      expect(errors).toEqual([]);

      await app.clickLink("/a/b/c/d");
      await page.waitForSelector("[data-error-c]");
      expect(await page.locator("h1").textContent()).toBe("C Error Boundary");
      expect(await page.locator("pre").textContent()).toBe("broken!");
      expect(errors).toEqual([
        [
          "handleError",
          "GET",
          "/a/b/c/d.data?_routes=routes%2Fa.b.c.d",
          new Error("broken!"),
        ],
      ]);

      appFixture.close();
    });

    test("bubbles response up the chain when middleware throws before next", async ({
      page,
    }) => {
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true, minify: false },
                plugins: [reactRouter()],
              });
            `,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'
              export default function Component({ loaderData }) {
                return <Link to="/a/b/c">/a/b/c</Link>;
              }
            `,
            "app/routes/a.tsx": js`
              import { Outlet } from 'react-router'
              export const middleware = [
                async (_, next) => {
                  let res = await next();
                  res.headers.set('x-a', 'true');
                  return res;
                }
              ];
              export default function Component() {
                return <Outlet/>
              }
              export function ErrorBoundary({ error }) {
                return <><h1 data-error>A Error Boundary</h1><pre>{error.message}</pre></>
              }
            `,
            "app/routes/a.b.tsx": js`
              import { Link, Outlet } from 'react-router'
              export const middleware = [
                async (_, next) => {
                  let res = await next();
                  res.headers.set('x-b', 'true');
                  return res;
                }
              ];
              export default function Component({ loaderData }) {
                return <Outlet/>;
              }
            `,
            "app/routes/a.b.c.tsx": js`
              export const middleware = [(_, next) => {
                throw new Error('C ERROR')
              }];
              // Force middleware to run on client side navs
              export function loader() {
                return null;
              }
              export default function Component({ loaderData }) {
                return <h1>C</h1>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let res = await fixture.requestDocument("/a/b/c");
      expect(res.status).toBe(500);
      expect(res.headers.get("x-a")).toBe("true");
      expect(res.headers.get("x-b")).toBe("true");
      let html = await res.text();
      expect(html).toContain("A Error Boundary");
      expect(html).toContain("C ERROR");

      let data = await fixture.requestSingleFetchData("/a/b/c.data");
      expect(data.status).toBe(500);
      expect(data.headers.get("x-a")).toBe("true");
      expect(data.headers.get("x-b")).toBe("true");
      expect((data.data as any)["routes/a.b.c"]).toEqual({
        error: new Error("C ERROR"),
      });

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/a/b/c");
      await page.waitForSelector("[data-error]");
      expect(await page.locator("[data-error]").textContent()).toBe(
        "A Error Boundary",
      );
      expect(await page.locator("pre").textContent()).toBe("C ERROR");

      appFixture.close();
    });

    test("bubbles response up the chain when middleware throws after next", async ({
      page,
    }) => {
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true, minify: false },
                plugins: [reactRouter()],
              });
            `,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'
              export default function Component({ loaderData }) {
                return <Link to="/a/b/c">/a/b/c</Link>;
              }
            `,
            "app/routes/a.tsx": js`
              import { Outlet } from 'react-router'
              export const middleware = [
                async (_, next) => {
                  let res = await next();
                  res.headers.set('x-a', 'true');
                  return res;
                }
              ];
              export function loader() {
                return "A LOADER";
              }
              export default function Component() {
                return <Outlet/>
              }
              export function ErrorBoundary({ error, loaderData }) {
                return (
                  <>
                    <h1 data-error>A Error Boundary</h1>
                    <pre>{error.message}</pre>
                    <p>{loaderData}</p>
                  </>
                );
              }
            `,
            "app/routes/a.b.tsx": js`
              import { Link, Outlet } from 'react-router'
              export const middleware = [
                async (_, next) => {
                  let res = await next();
                  res.headers.set('x-b', 'true');
                  return res;
                }
              ];
              export default function Component({ loaderData }) {
                return <Outlet/>;
              }
            `,
            "app/routes/a.b.c.tsx": js`
              export const middleware = [async (_, next) => {
                let res = await next();
                throw new Error('C ERROR')
              }];
              // Force middleware to run on client side navs
              export function loader() {
                return null;
              }
              export default function Component({ loaderData }) {
                return <h1>C</h1>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let res = await fixture.requestDocument("/a/b/c");
      expect(res.status).toBe(500);
      expect(res.headers.get("x-a")).toBe("true");
      expect(res.headers.get("x-b")).toBe("true");
      let html = await res.text();
      expect(html).toContain("A Error Boundary");
      expect(html).toContain("C ERROR");
      expect(html).toContain("A LOADER");

      let data = await fixture.requestSingleFetchData("/a/b/c.data");
      expect(data.status).toBe(500);
      expect(data.headers.get("x-a")).toBe("true");
      expect(data.headers.get("x-b")).toBe("true");
      expect((data.data as any)["routes/a"]).toEqual({
        data: "A LOADER",
      });
      expect((data.data as any)["routes/a.b.c"]).toEqual({
        error: new Error("C ERROR"),
      });

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/a/b/c");
      await page.waitForSelector("[data-error]");
      expect(await page.locator("[data-error]").textContent()).toBe(
        "A Error Boundary",
      );
      expect(await page.locator("pre").textContent()).toBe("C ERROR");
      expect(await page.locator("p").textContent()).toBe("A LOADER");

      appFixture.close();
    });

    test("bubbles response up the chain when multiple middlewares throw in sequence", async ({
      page,
    }) => {
      let errors: any[] = [];
      console.error = (...args) => errors.push(args);
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true, minify: false },
                plugins: [reactRouter()],
              });
            `,
            "app/entry.server.tsx": ENTRY_SERVER_WITH_HANDLE_ERROR,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'
              export default function Component({ loaderData }) {
                return <Link to="/a/b/c">/a/b/c</Link>;
              }
            `,
            "app/routes/a.tsx": js`
              import { Outlet } from 'react-router'
              export const middleware = [
                async (_, next) => {
                  let res = await next();
                  res.headers.set('x-a', 'true');
                  return res;
                }
              ];
              export function loader() {
                return "A LOADER";
              }
              export default function Component() {
                return <Outlet/>
              }
              export function ErrorBoundary({ error, loaderData }) {
                return (
                  <>
                    <h1 data-error>A Error Boundary</h1>
                    <pre>{error.message}</pre>
                    <p>{loaderData}</p>
                  </>
                );
              }
            `,
            "app/routes/a.b.tsx": js`
              import { Link, Outlet } from 'react-router'
              export const middleware = [async (_, next) => {
                let res = await next();
                throw new Error('B ERROR')
              }];
              export default function Component({ loaderData }) {
                return <Outlet/>;
              }
            `,
            "app/routes/a.b.c.tsx": js`
              export const middleware = [async (_, next) => {
                let res = await next();
                throw new Error('C ERROR')
              }];
              // Force middleware to run on client side navs
              export function loader() {
                return null;
              }
              export default function Component({ loaderData }) {
                return <h1>C</h1>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let res = await fixture.requestDocument("/a/b/c");
      expect(res.status).toBe(500);
      expect(res.headers.get("x-a")).toBe("true");
      expect(res.headers.get("x-b")).toBe(null);
      let html = await res.text();
      expect(html).toContain("A Error Boundary");
      expect(html).toContain("B ERROR");
      expect(html).toContain("A LOADER");
      expect(errors).toEqual([
        ["handleError", "GET", "/a/b/c", new Error("C ERROR")],
        ["handleError", "GET", "/a/b/c", new Error("B ERROR")],
      ]);
      errors.splice(0);

      let data = await fixture.requestSingleFetchData("/a/b/c.data");
      expect(data.status).toBe(500);
      expect(data.headers.get("x-a")).toBe("true");
      expect(data.headers.get("x-b")).toBe(null);
      expect((data.data as any)["routes/a"]).toEqual({
        data: "A LOADER",
      });
      expect((data.data as any)["routes/a.b"]).toEqual({
        error: new Error("B ERROR"),
      });
      expect(errors).toEqual([
        ["handleError", "GET", "/a/b/c.data", new Error("C ERROR")],
        ["handleError", "GET", "/a/b/c.data", new Error("B ERROR")],
      ]);
      errors.splice(0);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/a/b/c");
      await page.waitForSelector("[data-error]");
      expect(await page.locator("[data-error]").textContent()).toBe(
        "A Error Boundary",
      );
      expect(await page.locator("pre").textContent()).toBe("B ERROR");
      expect(await page.locator("p").textContent()).toBe("A LOADER");
      expect(errors).toEqual([
        ["handleError", "GET", "/a/b/c.data", new Error("C ERROR")],
        ["handleError", "GET", "/a/b/c.data", new Error("B ERROR")],
      ]);
      errors.splice(0);

      appFixture.close();
    });

    test("bubbles response up the chain when middleware throws data() before next", async ({
      page,
    }) => {
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true, minify: false },
                plugins: [reactRouter()],
              });
            `,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'
              export default function Component({ loaderData }) {
                return <Link to="/a/b/c">/a/b/c</Link>;
              }
            `,
            "app/routes/a.tsx": js`
              import { Outlet } from 'react-router'
              export const middleware = [
                async (_, next) => {
                  let res = await next();
                  res.headers.set('x-a', 'true');
                  return res;
                }
              ];
              export default function Component() {
                return <Outlet/>
              }
              export function ErrorBoundary({ error }) {
                return (
                  <>
                    <h1 data-error>A Error Boundary</h1>
                    <pre>{error.data}</pre>
                  </>
                );
              }
            `,
            "app/routes/a.b.tsx": js`
              import { Link, Outlet } from 'react-router'
              export const middleware = [
                async (_, next) => {
                  let res = await next();
                  res.headers.set('x-b', 'true');
                  return res;
                }
              ];
              export default function Component({ loaderData }) {
                return <Outlet/>;
              }
            `,
            "app/routes/a.b.c.tsx": js`
              import { data } from "react-router";
              export const middleware = [(_, next) => {
                throw data('C ERROR', { status: 418, statusText: "I'm a teapot" })
              }];
              // Force middleware to run on client side navs
              export function loader() {
                return null;
              }
              export default function Component({ loaderData }) {
                return <h1>C</h1>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let res = await fixture.requestDocument("/a/b/c");
      expect(res.status).toBe(418);
      expect(res.headers.get("x-a")).toBe("true");
      expect(res.headers.get("x-b")).toBe("true");
      let html = await res.text();
      expect(html).toContain("A Error Boundary");
      expect(html).toContain("C ERROR");

      let data = await fixture.requestSingleFetchData("/a/b/c.data");
      expect(data.status).toBe(418);
      expect(data.headers.get("x-a")).toBe("true");
      expect(data.headers.get("x-b")).toBe("true");
      expect((data.data as any)["routes/a.b.c"]).toEqual({
        error: new UNSAFE_ErrorResponseImpl(418, "I'm a teapot", "C ERROR"),
      });

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/a/b/c");
      await page.waitForSelector("[data-error]");
      expect(await page.locator("[data-error]").textContent()).toBe(
        "A Error Boundary",
      );
      expect(await page.locator("pre").textContent()).toBe("C ERROR");

      appFixture.close();
    });

    test("bubbles response up the chain when middleware throws data() after next", async ({
      page,
    }) => {
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true, minify: false },
                plugins: [reactRouter()],
              });
            `,
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'
              export default function Component({ loaderData }) {
                return <Link to="/a/b/c">/a/b/c</Link>;
              }
            `,
            "app/routes/a.tsx": js`
              import { Outlet } from 'react-router'
              export const middleware = [
                async (_, next) => {
                  let res = await next();
                  res.headers.set('x-a', 'true');
                  return res;
                }
              ];
              export function loader() {
                return "A LOADER";
              }
              export default function Component() {
                return <Outlet/>
              }
              export function ErrorBoundary({ error, loaderData }) {
                return (
                  <>
                    <h1 data-error>A Error Boundary</h1>
                    <pre>{error.data}</pre>
                    <p>{loaderData}</p>
                  </>
                );
              }
            `,
            "app/routes/a.b.tsx": js`
              import { Link, Outlet } from 'react-router'
              export const middleware = [
                async (_, next) => {
                  let res = await next();
                  res.headers.set('x-b', 'true');
                  return res;
                }
              ];
              export default function Component({ loaderData }) {
                return <Outlet/>;
              }
            `,
            "app/routes/a.b.c.tsx": js`
              import { data } from "react-router";
              export const middleware = [async (_, next) => {
                let res = await next();
                throw data('C ERROR', { status: 418, statusText: "I'm a teapot" })
              }];
              // Force middleware to run on client side navs
              export function loader() {
                return null;
              }
              export default function Component({ loaderData }) {
                return <h1>C</h1>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development,
      );

      let res = await fixture.requestDocument("/a/b/c");
      expect(res.status).toBe(418);
      expect(res.headers.get("x-a")).toBe("true");
      expect(res.headers.get("x-b")).toBe("true");
      let html = await res.text();
      expect(html).toContain("A Error Boundary");
      expect(html).toContain("C ERROR");
      expect(html).toContain("A LOADER");

      let data = await fixture.requestSingleFetchData("/a/b/c.data");
      expect(data.status).toBe(418);
      expect(data.headers.get("x-a")).toBe("true");
      expect(data.headers.get("x-b")).toBe("true");
      expect((data.data as any)["routes/a"]).toEqual({
        data: "A LOADER",
      });
      expect((data.data as any)["routes/a.b.c"]).toEqual({
        error: new UNSAFE_ErrorResponseImpl(418, "I'm a teapot", "C ERROR"),
      });

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/a/b/c");
      await page.waitForSelector("[data-error]");
      expect(await page.locator("[data-error]").textContent()).toBe(
        "A Error Boundary",
      );
      expect(await page.locator("pre").textContent()).toBe("C ERROR");
      expect(await page.locator("p").textContent()).toBe("A LOADER");

      appFixture.close();
    });

    test("still calls middleware for all matches on granular data requests", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true, minify: false },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const orderContext = createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            export default function Component({ loaderData }) {
              return <Link to="/a/b">Link</Link>;
            }
          `,
          "app/routes/a.tsx": js`
            import { Outlet } from 'react-router'
            import { orderContext } from '../context';
            export const middleware = [
              ({ context }) => { context.set(orderContext, ['a']); },
            ];

            export async function loader({ context }) {
              return context.get(orderContext).join(',');
            }

            // Force a granular call for this route
            export function clientLoader({ serverLoader }) {
              return serverLoader()
            }

            export default function Component({ loaderData }) {
              return (
                <>
                  <h2 data-a>A: {loaderData}</h2>
                  <Outlet />
                </>
              );
            }
          `,
          "app/routes/a.b.tsx": js`
            import { Outlet } from 'react-router'
            import { orderContext } from '../context';
            export const middleware = [
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'b']);
              },
            ];

            export async function loader({ context }) {
              return context.get(orderContext).join(',');
            }

            // Force a granular call for this route
            export function clientLoader({ serverLoader }) {
              return serverLoader()
            }

            export default function Component({ loaderData }) {
              return <h3 data-b>B: {loaderData}</h3>;
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a[href="/a/b"]');

      (await page.$('a[href="/a/b"]'))?.click();
      await page.waitForSelector("[data-b]");
      expect(await page.locator("[data-a]").textContent()).toBe("A: a,b");
      expect(await page.locator("[data-b]").textContent()).toBe("B: a,b");

      appFixture.close();
    });

    test("calls middleware for routes even without a loader (document)", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true, minify: false },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const orderContext = createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            export default function Component({ loaderData }) {
              return <Link to="/a/b/c">Link</Link>;
            }
          `,
          "app/routes/a.tsx": js`
            import { Outlet } from 'react-router'
            import { orderContext } from '../context';
            export const middleware = [
              ({ context }) => { context.set(orderContext, ['a']); }
            ];

            export function loader({ context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return <><h2>A: {loaderData}</h2><Outlet /></>;
            }
          `,
          "app/routes/a.b.tsx": js`
            import { Outlet } from 'react-router'
            import { orderContext } from '../context';
            export const middleware = [
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'b']);
              },
            ];

            export default function Component() {
              return <><h3>B</h3><Outlet /></>;
            }
          `,
          "app/routes/a.b.c.tsx": js`
            import { orderContext } from '../context';
            export function loader({ context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return <h4>C: {loaderData}</h4>;
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/a/b/c");
      expect(await page.innerText("h2")).toBe("A: a,b");
      expect(await page.innerText("h3")).toBe("B");
      expect(await page.innerText("h4")).toBe("C: a,b");

      appFixture.close();
    });

    test("calls middleware for routes even without a loader (data)", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true, minify: false },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const orderContext = createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            export default function Component({ loaderData }) {
              return <Link to="/a/b/c">Link</Link>;
            }
          `,
          "app/routes/a.tsx": js`
            import { Outlet } from 'react-router'
            import { orderContext } from '../context';
            export const middleware = [
              ({ context }) => { context.set(orderContext, ['a']); }
            ];

            export function loader({ context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return <><h2>A: {loaderData}</h2><Outlet /></>;
            }
          `,
          "app/routes/a.b.tsx": js`
            import { Outlet } from 'react-router'
            import { orderContext } from '../context';
            export const middleware = [
              ({ context }) => {
                context.set(orderContext, [...context.get(orderContext), 'b']);
              },
            ];

            export default function Component() {
              return <><h3>B</h3><Outlet /></>;
            }
          `,
          "app/routes/a.b.c.tsx": js`
            import { orderContext } from '../context';
            export function loader({ context }) {
              return context.get(orderContext).join(',');
            }

            export default function Component({ loaderData }) {
              return <h4>C: {loaderData}</h4>;
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      (await page.$('a[href="/a/b/c"]'))?.click();
      await page.waitForSelector("h4");
      expect(await page.innerText("h2")).toBe("A: a,b");
      expect(await page.innerText("h3")).toBe("B");
      expect(await page.innerText("h4")).toBe("C: a,b");

      appFixture.close();
    });

    test("calls middleware on resource routes", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({
            middleware: true,
          }),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true, minify: false },
              plugins: [reactRouter()],
            });
          `,
          "app/context.ts": js`
            import { createContext } from 'react-router'
            export const orderContext = createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import * as React from 'react'
            import { useFetcher } from 'react-router'
            export default function Component({ loaderData }) {
              let fetcher = useFetcher();
              let [data, setData] = React.useState();

              async function rawFetch() {
                let res = await fetch('/a/b?raw');
                let text = await res.text();
                setData(text);
              }

              return (
                <>
                  <button id="fetcher" onClick={() => fetcher.load('/a/b')}>
                    Load Fetcher
                  </button>
                  {fetcher.data ? <pre data-fetcher>{fetcher.data}</pre> : null}

                  <br/>

                  <button id="fetch" onClick={rawFetch}>
                    Load Raw Fetch
                  </button>
                  {data ? <pre data-fetch>{data}</pre> : null}
                </>
              );
            }
          `,
          "app/routes/a.tsx": js`
            import { orderContext } from '../context';
            export const middleware = [
              async ({ context }, next) => {
                context.set(orderContext, ['a']);
                let res = await next();
                res.headers.set('x-a', 'true');
                return res;
              },
            ];
          `,
          "app/routes/a.b.tsx": js`
            import { orderContext } from '../context';
            export const middleware = [
              async ({ context }, next) => {
                context.set(orderContext, [...context.get(orderContext), 'b']);
                let res = await next();
                res.headers.set('x-b', 'true');
                return res;
              },
            ];

            export async function loader({ request, context }) {
              let data = context.get(orderContext).join(',');
              let isRaw = new URL(request.url).searchParams.has('raw');
              return isRaw ? new Response(data) : data;
            }
          `,
        },
      });

      let appFixture = await createAppFixture(fixture);

      let fetcherHeaders: ReturnType<PlaywrightResponse["headers"]> | undefined;
      let fetchHeaders: ReturnType<PlaywrightResponse["headers"]> | undefined;
      page.on("request", async (r: PlaywrightRequest) => {
        if (r.url().includes("/a/b.data")) {
          let res = await r.response();
          fetcherHeaders = res?.headers();
        } else if (r.url().endsWith("/a/b?raw")) {
          let res = await r.response();
          fetchHeaders = res?.headers();
        }
      });

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      (await page.$("#fetcher"))?.click();
      await page.waitForSelector("[data-fetcher]");
      expect(await page.locator("[data-fetcher]").textContent()).toBe("a,b");
      expect(fetcherHeaders!["x-a"]).toBe("true");
      expect(fetcherHeaders!["x-b"]).toBe("true");

      (await page.$("#fetch"))?.click();
      await page.waitForSelector("[data-fetch]");
      expect(await page.locator("[data-fetch]").textContent()).toBe("a,b");
      expect(fetchHeaders!["x-a"]).toBe("true");
      expect(fetchHeaders!["x-b"]).toBe("true");

      appFixture.close();
    });

    test("handles errors on the way down on resource routes (document)", async () => {
      let errors: any[] = [];
      console.error = (...args) => errors.push(args);
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true, minify: false },
                plugins: [reactRouter()],
              });
            `,
            "app/entry.server.tsx": ENTRY_SERVER_WITH_HANDLE_ERROR,
            "app/routes/a.tsx": js`
              export const middleware = [
                async ({ context }, next) => {
                  throw new Error("broken!");
                },
              ];
            `,
            "app/routes/a.b.tsx": js`
              export async function loader({ request, context }) {
                return new Response("ok");
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let res = await fixture.requestResource("/a/b");
      expect(res.status).toBe(500);
      await expect(res.text()).resolves.toBe(
        "Unexpected Server Error\n\nError: broken!",
      );
      expect(errors).toEqual([
        ["handleError", "GET", "/a/b", new Error("broken!")],
      ]);
    });

    test("handles errors on the way down on resource routes (data)", async () => {
      let errors: any[] = [];
      console.error = (...args) => errors.push(args);
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true, minify: false },
                plugins: [reactRouter()],
              });
            `,
            "app/entry.server.tsx": ENTRY_SERVER_WITH_HANDLE_ERROR,
            "app/routes/a.tsx": js`
              export const middleware = [
                async ({ context }, next) => {
                  throw new Error("broken!");
                },
              ];
            `,
            "app/routes/a.b.tsx": js`
              export async function loader({ request, context }) {
                return new Response("ok");
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let res = await fixture.requestSingleFetchData("/a/b.data");
      expect(res.status).toBe(500);
      expect(res.data).toEqual({
        "routes/a": { error: new Error("broken!") },
      });
      expect(errors).toEqual([
        ["handleError", "GET", "/a/b.data", new Error("broken!")],
      ]);
    });

    test("handles errors on the way up on resource routes (document)", async () => {
      let errors: any[] = [];
      console.error = (...args) => errors.push(args);
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true, minify: false },
                plugins: [reactRouter()],
              });
            `,
            "app/entry.server.tsx": ENTRY_SERVER_WITH_HANDLE_ERROR,
            "app/routes/a.tsx": js`
              export const middleware = [
                async ({ context }, next) => {
                  let res = await next()
                  throw new Error("broken!");
                },
              ];
            `,
            "app/routes/a.b.tsx": js`
              export async function loader({ request, context }) {
                return new Response("ok");
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let res = await fixture.requestResource("/a/b");
      expect(res.status).toBe(500);
      await expect(res.text()).resolves.toBe(
        "Unexpected Server Error\n\nError: broken!",
      );
      expect(errors).toEqual([
        ["handleError", "GET", "/a/b", new Error("broken!")],
      ]);
    });

    test("handles errors on the way up on resource routes (data)", async () => {
      let errors: any[] = [];
      console.error = (...args) => errors.push(args);
      let fixture = await createFixture(
        {
          files: {
            "react-router.config.ts": reactRouterConfig({
              middleware: true,
            }),
            "vite.config.ts": js`
              import { defineConfig } from "vite";
              import { reactRouter } from "@react-router/dev/vite";

              export default defineConfig({
                build: { manifest: true, minify: false },
                plugins: [reactRouter()],
              });
            `,
            "app/entry.server.tsx": ENTRY_SERVER_WITH_HANDLE_ERROR,
            "app/routes/a.tsx": js`
              export const middleware = [
                async ({ context }, next) => {
                  let res = await next();
                  throw new Error("broken!");
                },
              ];
            `,
            "app/routes/a.b.tsx": js`
              export async function loader({ request, context }) {
                return "ok"
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development,
      );

      let res = await fixture.requestSingleFetchData("/a/b.data");
      expect(res.status).toBe(500);
      expect(res.data).toEqual({
        "routes/a": { error: new Error("broken!") },
        "routes/a.b": { data: "ok" },
      });
      expect(errors).toEqual([
        ["handleError", "GET", "/a/b.data", new Error("broken!")],
      ]);
    });
  });
});
