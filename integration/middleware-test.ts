import type {
  Request as PlaywrightRequest,
  Response as PlaywrightResponse,
} from "@playwright/test";
import { test, expect } from "@playwright/test";
import { UNSAFE_ServerMode } from "react-router";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import { reactRouterConfig } from "./helpers/vite.js";

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
            import { unstable_createContext } from 'react-router'
            export const orderContext = unstable_createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            import { orderContext } from '../context'

            export const unstable_clientMiddleware = [
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

            export const unstable_clientMiddleware = [
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
        "Index: a,b"
      );

      (await page.$('a[href="/about"]'))?.click();
      await page.waitForSelector('[data-route]:has-text("About")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "About: c,d"
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
            import { unstable_createContext } from 'react-router'
            export const orderContext = unstable_createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            import { orderContext } from '../context'

            export const unstable_clientMiddleware = [
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

            export const unstable_clientMiddleware = [
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
        "Index: a,b"
      );

      (await page.$('a[href="/about"]'))?.click();
      await page.waitForSelector('[data-route]:has-text("About")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "About: c,d"
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
            import { unstable_createContext } from 'react-router'
            export const orderContext = unstable_createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Form } from 'react-router'
            import { orderContext } from '../context';

            export const unstable_clientMiddleware = [
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
        "Index: a,b - empty"
      );

      (await page.getByRole("button"))?.click();
      await new Promise((r) => setTimeout(r, 1000));
      await page.waitForSelector('[data-route]:has-text("- a,b")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "Index: a,b - a,b"
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
            export const unstable_clientMiddleware = [
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
            export const unstable_clientMiddleware = [
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
              export const unstable_clientMiddleware = [
                async ({ request, context }, next) => {
                  throw new Error('broken!');
                }
              ]
              export default function Component() {
                return <h1>Should not see me</h1>
              }
              export function ErrorBoundary({ error }) {
                return <h1>{error.message}</h1>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a:has-text("Link")');

      (await page.getByRole("link"))?.click();
      await page.waitForSelector('h1:has-text("broken!")');

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
              export const unstable_clientMiddleware = [
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
                    <h1>{error.message}</h1>
                    <pre>{loaderData ?? 'empty'}</pre>
                  </>
                );
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a:has-text("Link")');

      (await page.getByRole("link"))?.click();
      await page.waitForSelector('h1:has-text("broken!")');
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
            import { unstable_createContext } from 'react-router'
            export const orderContext = unstable_createContext([]);
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
            export const unstable_clientMiddleware = [
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
            export const unstable_clientMiddleware = [
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
            import { unstable_createContext } from 'react-router'
            export const orderContext = unstable_createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            import { orderContext } from "../context";;

            export const unstable_clientMiddleware = [
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
            export const unstable_clientMiddleware = [
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
        "Index: a,b"
      );

      (await page.$('a[href="/about"]'))?.click();
      await page.waitForSelector('[data-route]:has-text("About")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "About: c,d"
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
            import { unstable_createContext } from 'react-router'
            export const orderContext = unstable_createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            import { orderContext } from "../context";;

            export const unstable_clientMiddleware = [
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
            export const unstable_clientMiddleware = [
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
        "Index: a,b"
      );

      (await page.$('a[href="/about"]'))?.click();
      await page.waitForSelector('[data-route]:has-text("About")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "About: c,d"
      );

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
            import { unstable_createContext } from 'react-router'
            export const orderContext = unstable_createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Form } from 'react-router'
            import { orderContext } from "../context";;

            export const unstable_clientMiddleware = [
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
        "Index: a,b - empty"
      );

      (await page.getByRole("button"))?.click();
      await new Promise((r) => setTimeout(r, 1000));
      await page.waitForSelector('[data-route]:has-text("- a,b")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "Index: a,b - a,b"
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
            export const unstable_clientMiddleware = [
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
            export const unstable_clientMiddleware = [
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
              import { useRouteError } from 'react-router'
              export const unstable_clientMiddleware = [
                async ({ request, context }, next) => {
                  throw new Error('broken!')
                }
              ]
              export default function Component() {
                return <h1>Should not see me</h1>
              }
              export function ErrorBoundary() {
                return <h1>{useRouteError().message}</h1>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a:has-text("Link")');

      (await page.getByRole("link"))?.click();
      await page.waitForSelector('h1:has-text("broken!")');

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
              export const unstable_clientMiddleware = [
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
                    <h1>{error.message}</h1>
                    <pre>{loaderData ?? 'empty'}</pre>
                  </>
                );
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a:has-text("Link")');

      (await page.getByRole("link"))?.click();
      await page.waitForSelector('h1:has-text("broken!")');
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
            import { unstable_createContext } from 'react-router'
            export const orderContext = unstable_createContext([]);
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
            export const unstable_clientMiddleware = [
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
            export const unstable_clientMiddleware = [
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
            import { unstable_createContext } from 'react-router'
            export const countContext = unstable_createContext({
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
            export const unstable_clientMiddleware = [
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
            export const unstable_clientMiddleware = [
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
          "/parent/child.data?_routes=routes%2Fparent.child"
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
            import { unstable_createContext } from 'react-router'
            export const countContext = unstable_createContext({
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
            export const unstable_clientMiddleware = [
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
            export const unstable_clientMiddleware = [
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
            export const unstable_clientMiddleware = [
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
        JSON.parse((await page.locator("[data-index]").textContent())!)
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
          /\/parent\/child\.data\?_routes=routes%2Fparent\.child$/
        ),
        // index gets it's own due to clientLoader
        expect.stringMatching(
          /\/parent\/child\.data\?_routes=routes%2Fparent\.child\._index$/
        ),
      ]);

      // But client middlewares only ran once for the action and once for the revalidation
      expect(await page.locator("[data-parent]").textContent()).toBe("PARENT");
      expect(await page.locator("[data-child]").textContent()).toBe("CHILD");
      expect(
        JSON.parse((await page.locator("[data-index]").textContent())!)
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
            import { unstable_createContext } from 'react-router'
            export const orderContext = unstable_createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Link } from 'react-router'
            import { orderContext } from "../context";;

            export const unstable_middleware = [
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
            export const unstable_middleware = [
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
        "Index: a,b"
      );

      (await page.$('a[href="/about"]'))?.click();
      await page.waitForSelector('[data-route]:has-text("About")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "About: c,d"
      );

      appFixture.close();
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
            import { unstable_createContext } from 'react-router'
            export const orderContext = unstable_createContext([]);
          `,
          "app/routes/_index.tsx": js`
            import { Form } from 'react-router'
            import { orderContext } from "../context";;

            export const unstable_middleware = [
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
        "Index: a,b - empty"
      );

      (await page.getByRole("button"))?.click();
      await new Promise((r) => setTimeout(r, 1000));
      await page.waitForSelector('[data-route]:has-text("- a,b")');
      expect(await page.locator("[data-route]").textContent()).toBe(
        "Index: a,b - a,b"
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
            export const unstable_middleware = [
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
            export const unstable_middleware = [
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

      let appFixture = await createAppFixture(fixture);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.waitForSelector('a:has-text("Link")');

      (await page.getByRole("link"))?.click();
      await page.waitForSelector('h1:has-text("Target")');

      appFixture.close();
    });

    test("handles errors thrown on the way down (document)", async ({
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
              export const unstable_middleware = [
                async ({ request, context }, next) => {
                  throw new Error('broken!');
                }
              ]
              export default function Component() {
                return <h1>Should not see me</h1>
              }
              export function ErrorBoundary({ error }) {
                return <h1>{error.message}</h1>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/broken");
      expect(await page.innerText("h1")).toBe("broken!");

      appFixture.close();
    });

    test("handles errors thrown on the way down (data)", async ({ page }) => {
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
              export const unstable_middleware = [
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
                return <h1>{error.message}</h1>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      (await page.$('a[href="/broken"]'))?.click();
      await page.waitForSelector("h1");
      expect(await page.innerText("h1")).toBe("broken!");

      appFixture.close();
    });

    test("handles errors thrown on the way up (document)", async ({ page }) => {
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
            "app/routes/_index.tsx": js`
              import { Link } from 'react-router'

              export default function Component() {
                return <Link to="/broken">Link</Link>;
              }
            `,
            "app/routes/broken.tsx": js`
              export const unstable_middleware = [
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
                    <h1>{error.message}</h1>
                    <pre>{loaderData ?? 'empty'}</pre>
                  </>
                );
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/broken");
      expect(await page.innerText("h1")).toBe("broken!");
      expect(await page.innerText("pre")).toBe("empty");

      appFixture.close();
    });

    test("handles errors thrown on the way up (data)", async ({ page }) => {
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
              export const unstable_middleware = [
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
                    <h1>{error.message}</h1>
                    <pre>{loaderData ?? 'empty'}</pre>
                  </>
                );
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      (await page.$('a[href="/broken"]'))?.click();
      await page.waitForSelector("h1");
      expect(await page.innerText("h1")).toBe("broken!");
      expect(await page.innerText("pre")).toBe("empty");

      appFixture.close();
    });

    test("bubbles errors up on document requests", async ({ page }) => {
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
                return <Link to="/a/b">Link</Link>
              }
            `,
            "app/routes/a.tsx": js`
              import { Outlet } from 'react-router'

              export const unstable_middleware = [
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
              export const unstable_middleware = [
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
        UNSAFE_ServerMode.Development
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/a/b");
      expect(await page.locator("h1").textContent()).toBe("A Error Boundary");
      expect(await page.locator("pre").textContent()).toBe("broken!");

      appFixture.close();
    });

    test("bubbles errors up on data requests", async ({ page }) => {
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
                return <Link to="/a/b">Link</Link>
              }
            `,
            "app/routes/a.tsx": js`
              import { Outlet } from 'react-router'

              export const unstable_middleware = [
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
              export const unstable_middleware = [
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
        UNSAFE_ServerMode.Development
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      (await page.$('a[href="/a/b"]'))?.click();
      await page.waitForSelector("pre");
      expect(await page.locator("h1").textContent()).toBe("A Error Boundary");
      expect(await page.locator("pre").textContent()).toBe("broken!");

      appFixture.close();
    });

    test("bubbles errors on the way down up to at least the highest route with a loader", async ({
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
              export const unstable_middleware = [() => { throw new Error("broken!") }]
              export default function Component() {
                return <Outlet/>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/a/b/c/d");
      expect(await page.locator("h1").textContent()).toBe("A Error Boundary");
      expect(await page.locator("pre").textContent()).toBe("broken!");

      await app.goto("/");
      await app.clickLink("/a/b/c/d");
      expect(await page.locator("h1").textContent()).toBe("A Error Boundary");
      expect(await page.locator("pre").textContent()).toBe("broken!");

      appFixture.close();
    });

    test("bubbles errors on the way down up to the deepest error boundary when loaders aren't revalidating", async ({
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
              export const unstable_middleware = [() => { throw new Error("broken!") }]
              export const loader = () => null;
              export default function Component() {
                return <Outlet/>
              }
            `,
          },
        },
        UNSAFE_ServerMode.Development
      );

      let appFixture = await createAppFixture(
        fixture,
        UNSAFE_ServerMode.Development
      );

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/a/b");
      await page.waitForSelector("[data-ab]");
      expect(await page.locator("[data-ab]").textContent()).toBe("AB: DATA");

      await app.clickLink("/a/b/c/d");
      await page.waitForSelector("[data-error-c]");
      expect(await page.locator("h1").textContent()).toBe("C Error Boundary");
      expect(await page.locator("pre").textContent()).toBe("broken!");

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
            import { unstable_createContext } from 'react-router'
            export const orderContext = unstable_createContext([]);
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
            export const unstable_middleware = [
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
            export const unstable_middleware = [
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
            import { unstable_createContext } from 'react-router'
            export const orderContext = unstable_createContext([]);
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
            export const unstable_middleware = [
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
            export const unstable_middleware = [
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
            import { unstable_createContext } from 'react-router'
            export const orderContext = unstable_createContext([]);
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
            export const unstable_middleware = [
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
            export const unstable_middleware = [
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
            import { unstable_createContext } from 'react-router'
            export const orderContext = unstable_createContext([]);
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
            export const unstable_middleware = [
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
            export const unstable_middleware = [
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
  });
});
