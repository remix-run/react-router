import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import { reactRouterConfig } from "./helpers/vite.js";

test.describe("Middleware", () => {
  test.describe("SPA Mode", () => {
    test("calls clientMiddleware before/after loaders", async ({ page }) => {
      let fixture = await createFixture({
        spaMode: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false,
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
              ({ context }) => { context.order = ['a']; },
              ({ context }) => { context.order.push('b'); }
            ];

            export async function clientLoader({ request, context }) {
              return context.order.join(',');
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
            export const clientMiddleware = [
              ({ context }) => {
                context.order = []; // reset order from hydration
                context.order.push('c');
              },
              ({ context }) => { context.order.push('d'); }
            ];

            export async function clientLoader({ context }) {
              return context.order.join(',');
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
            import { Form } from 'react-router'

            export const clientMiddleware = [
              ({ context }) => { context.order = ['a']; },
              ({ context }) => { context.order.push('b'); }
            ];

            export async function clientAction({ request, context }) {
              return context.order.join(',');
            }

            export async function clientLoader({ request, context }) {
              return context.order.join(',');
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
      let fixture = await createFixture({
        spaMode: true,
        files: {
          "react-router.config.ts": reactRouterConfig({
            ssr: false,
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
              return <Link to="/private/page">Link</Link>;
            }
          `,
          "app/routes/private.tsx": js`
            import { Link, redirect } from 'react-router'
            export const clientMiddleware = [
              async ({ request, context }, next) => {
                throw new Response(null, { status: 401 });
              }
            ]
            export default function Component() {
              return <Outlet/>
            }
            export function ErrorBoundary() {
              return <h1>Access Denied</h1>
            }
          `,
          "app/routes/private.page.tsx": js`
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
      await page.waitForSelector('h1:has-text("Access Denied")');

      appFixture.close();
    });
  });

  test.describe("Client Middleware", () => {
    test("calls clientMiddleware before/after loaders", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({}),
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
              ({ context }) => { context.order = ['a']; },
              ({ context }) => { context.order.push('b'); }
            ];

            export async function clientLoader({ request, context }) {
              return context.order.join(',');
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
            export const clientMiddleware = [
              ({ context }) => {
                context.order = []; // reset order from hydration
                context.order.push('c');
              },
              ({ context }) => { context.order.push('d'); }
            ];

            export async function clientLoader({ context }) {
              return context.order.join(',');
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
          "react-router.config.ts": reactRouterConfig({}),
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true },
              plugins: [reactRouter()],
            });
          `,
          "app/routes/_index.tsx": js`
            import { Form } from 'react-router'

            export const clientMiddleware = [
              ({ context }) => { context.order = ['a']; },
              ({ context }) => { context.order.push('b'); }
            ];

            export async function clientAction({ request, context }) {
              return context.order.join(',');
            }

            export async function clientLoader({ request, context }) {
              return context.order.join(',');
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
            ssr: true,
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
          "react-router.config.ts": reactRouterConfig({}),
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
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": reactRouterConfig({}),
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
              return <Link to="/private/page">Link</Link>;
            }
          `,
          "app/routes/private.tsx": js`
            import { Link, redirect } from 'react-router'
            export const clientMiddleware = [
              async ({ request, context }, next) => {
                throw new Response(null, { status: 401 });
              }
            ]
            export default function Component() {
              return <Outlet/>
            }
            export function ErrorBoundary() {
              return <h1>Access Denied</h1>
            }
          `,
          "app/routes/private.page.tsx": js`
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
      await page.waitForSelector('h1:has-text("Access Denied")');

      appFixture.close();
    });
  });

  test.describe("Server Middleware", () => {
    test("calls middleware before/after loaders", async ({ page }) => {
      let fixture = await createFixture({
        files: {
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

            export const middleware = [
              ({ context }) => { context.order = ['a']; },
              ({ context }) => { context.order.push('b'); }
            ];

            export async function loader({ request, context }) {
              return context.order.join(',');
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
            export const middleware = [
              ({ context }) => {
                context.order = [];
                context.order.push('c');
              },
              ({ context }) => { context.order.push('d'); }
            ];

            export async function loader({ context }) {
              return context.order.join(',');
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
          "vite.config.ts": js`
            import { defineConfig } from "vite";
            import { reactRouter } from "@react-router/dev/vite";

            export default defineConfig({
              build: { manifest: true },
              plugins: [reactRouter()],
            });
          `,
          "app/routes/_index.tsx": js`
            import { Form } from 'react-router'

            export const middleware = [
              ({ context }) => { context.order = ['a']; },
              ({ context }) => { context.order.push('b'); }
            ];

            export async function action({ request, context }) {
              return context.order.join(',');
            }

            export async function loader({ request, context }) {
              return context.order.join(',');
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

    test.only("handles redirects thrown on the way up", async ({ page }) => {
      let fixture = await createFixture({
        files: {
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
      await new Promise((r) => setTimeout(r, 1000));
      console.log(await app.getHtml());
      await page.waitForSelector('h1:has-text("Target")');

      appFixture.close();
    });

    test("handles errors thrown on the way down", async ({ page }) => {
      let fixture = await createFixture({
        files: {
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
              return <Link to="/private/page">Link</Link>;
            }
          `,
          "app/routes/private.tsx": js`
            import { Link, redirect } from 'react-router'
            export const middleware = [
              async ({ request, context }, next) => {
                throw new Response(null, { status: 401 });
              }
            ]
            export default function Component() {
              return <Outlet/>
            }
            export function ErrorBoundary() {
              return <h1>Access Denied</h1>
            }
          `,
          "app/routes/private.page.tsx": js`
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
      await page.waitForSelector('h1:has-text("Access Denied")');

      appFixture.close();
    });
  });
});
