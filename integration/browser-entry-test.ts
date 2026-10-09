import { test, expect } from "@playwright/test";

import {
  createFixture,
  js,
  createAppFixture,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test(
  "expect to be able to browse backward out of a remix app, then forward " +
    "twice in history and have pages render correctly",
  async ({ page, browserName }) => {
    test.skip(
      browserName === "firefox",
      "FireFox doesn't support browsing to an empty page (aka about:blank)",
    );

    let fixture = await createFixture({
      files: {
        "app/routes/_index.tsx": js`
          import { Link } from "react-router";

          export default function Index() {
            return (
              <div>
                <div id="pizza">pizza</div>
                <Link to="/burgers">burger link</Link>
              </div>
            )
          }
        `,

        "app/routes/burgers.tsx": js`
          export default function Index() {
            return <div id="cheeseburger">cheeseburger</div>;
          }
        `,
      },
    });

    // This creates an interactive app using puppeteer.
    let appFixture = await createAppFixture(fixture);

    let app = new PlaywrightFixture(appFixture, page);

    // Slow down the entry chunk on the second load so the bug surfaces
    let isSecondLoad = false;
    await page.route(/entry/, async (route) => {
      if (isSecondLoad) {
        await new Promise((r) => setTimeout(r, 1000));
      }
      route.continue();
    });

    // This sets up the Remix modules cache in memory, priming the error case.
    await app.goto("/");
    await app.clickLink("/burgers");
    await page.waitForSelector("#cheeseburger");
    expect(await page.content()).toContain("cheeseburger");
    await page.goBack();
    await page.waitForSelector("#pizza");
    expect(await app.getHtml()).toContain("pizza");

    // Takes the browser out of the Remix app
    await page.goBack();
    expect(page.url()).toContain("about:blank");

    // Forward to / and immediately again to /burgers.  This will trigger the
    // error since we'll load __routeModules for / but then try to hydrate /burgers
    isSecondLoad = true;
    await page.goForward();
    await page.goForward();
    await page.waitForSelector("#cheeseburger");

    // If we resolve the error, we should hard reload and eventually
    // successfully render /burgers
    await page.waitForSelector("#cheeseburger");
    expect(await app.getHtml()).toContain("cheeseburger");

    appFixture.close();
  },
);

test("allows users to pass a client side context to HydratedRouter", async ({
  page,
}) => {
  let fixture = await createFixture({
    files: {
      "app/entry.client.tsx": js`
        import { createContext, RouterContextProvider } from "react-router";
        import { HydratedRouter } from "react-router/dom";
        import { startTransition, StrictMode } from "react";
        import { hydrateRoot } from "react-dom/client";

        export const myContext = new createContext('foo');

        startTransition(() => {
          hydrateRoot(
            document,
            <StrictMode>
              <HydratedRouter
                getContext={() => {
                  return new RouterContextProvider([
                    [myContext, 'bar']
                  ]);
                }}
              />
            </StrictMode>
          );
        });
      `,
      "app/routes/_index.tsx": js`
        import { myContext } from "../entry.client";

        export function clientLoader({ context }) {
          return context.get(myContext);
        }
        export default function Index({ loaderData }) {
          return <h1>Hello, {loaderData}</h1>
        }
      `,
    },
  });

  let appFixture = await createAppFixture(fixture);
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/", true);
  expect(await app.getHtml()).toContain("Hello, bar");

  appFixture.close();
});

for (let customDiscovery of [false, true]) {
  test.describe(`custom route discovery: ${customDiscovery}`, () => {
    test("allows a custom fetch implementation to read current application state", async ({
      page,
    }) => {
      let fixture = await createFixture({
        files: {
          "react-router.config.ts": js`
        export default {
          routeDiscovery: { mode: "lazy" },
          future: { unstable_customRouteDiscovery: ${customDiscovery} },
        };
      `,
          "app/entry.client.tsx": js`
        import { HydratedRouter } from "react-router/dom";
        import { startTransition, StrictMode } from "react";
        import { hydrateRoot } from "react-dom/client";

        let header = "initial";
        window.__updateFetchHeader = () => {
          header = "updated";
        };

        startTransition(() => {
          hydrateRoot(
            document,
            <StrictMode>
              <HydratedRouter
                unstable_fetch={(request, context) => {
                  window.__customFetches ??= [];
                  window.__customFetches.push({
                    pathname: new URL(request.url).pathname,
                    context,
                  });
                  request.headers.set("X-Custom-Fetch", header);
                  return window.fetch(request);
                }}
              />
            </StrictMode>
          );
        });
      `,
          "app/routes/_index.tsx": js`
        import { Link } from "react-router";

        export default function Index() {
          return <Link to="/page" discover="none">Go to Page</Link>;
        }
      `,
          "app/routes/page.tsx": js`
        export function loader({ request }) {
          return request.headers.get("X-Custom-Fetch");
        }

        export default function Page({ loaderData }) {
          return <h1 data-custom-fetch>{loaderData}</h1>;
        }
      `,
        },
      });

      let appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);

      await app.goto("/", true);
      await page.evaluate(() => (window as any).__updateFetchHeader());
      await page.click('a[href="/page"]');
      await page.waitForSelector("[data-custom-fetch]");

      await expect(page.locator("[data-custom-fetch]")).toHaveText("updated");
      expect(
        await page.evaluate(() => (window as any).__customFetches),
      ).toEqual([
        {
          pathname: "/__manifest",
          context: { type: "manifest" },
        },
        {
          pathname: "/page.data",
          context: {
            type: "navigation",
            fetcherKey: null,
            navigationType: "PUSH",
          },
        },
      ]);

      appFixture.close();
    });

    for (let fullManifest of customDiscovery ? [false, true] : [false]) {
      test(`composes custom fetch with API-only mode and a configured server origin (full manifest: ${fullManifest})`, async ({
        page,
      }) => {
        let apiOrigin = "https://api.example.com";
        let fixture = await createFixture({
          files: {
            "react-router.config.ts": js`
        export default {
          ssr: "unstable_api-only",
          unstable_apiServerOrigin: "${apiOrigin}",
          routeDiscovery: { mode: "lazy", manifestPath: "/__manifest" },
          future: { unstable_customRouteDiscovery: ${customDiscovery} },
        };
      `,
            "app/entry.client.tsx": js`
        import { HydratedRouter } from "react-router/dom";
        import { startTransition } from "react";
        import { hydrateRoot } from "react-dom/client";

        startTransition(() => {
          hydrateRoot(document, <HydratedRouter unstable_fetch={async (request, context) => {
            let url = new URL(request.url);
            window.__customFetches ??= [];
            window.__customFetches.push({
              origin: url.origin,
              pathname: url.pathname,
              method: request.method,
              context,
            });
            request.headers.set("X-Custom-Fetch", "custom");
            // Chromium requires HTTP/2 for streaming uploads, so materialize
            // the test body before forwarding to the HTTP/1 fixture server.
            return window.fetch(
              window.location.origin + url.pathname + url.search,
              {
                method: request.method,
                headers: request.headers,
                signal: request.signal,
                body: request.body ? await request.arrayBuffer() : undefined,
              },
            );
          }} />);
        });
      `,
            "app/root.tsx": js`
        import { Outlet, Scripts, unstable_useRouteDiscovery } from "react-router";

        export function Layout({ children }) {
          return <html><head /><body>{children}<Scripts /></body></html>;
        }

        export function HydrateFallback() {
          return <p>Loading...</p>;
        }

        export default function Root() {
          ${customDiscovery ? "let discovery = unstable_useRouteDiscovery();" : ""}
          return <>
            ${customDiscovery ? "<button onClick={() => discovery.loadAllRoutes()}>{discovery.state}</button>" : ""}
            <Outlet />
          </>;
        }
      `,
            "app/routes/_index.tsx": js`
        import { Link } from "react-router";

        export function loader({ request }) {
          return request.headers.get("X-Custom-Fetch");
        }

        export default function Index({ loaderData }) {
          return <>
            <p data-initial>{loaderData}</p>
            <Link to="/page" discover="none">Page</Link>
          </>;
        }
      `,
            "app/routes/page.tsx": js`
        import { Form } from "react-router";

        export function loader({ request }) {
          return request.headers.get("X-Custom-Fetch");
        }

        export function action({ request }) {
          return request.headers.get("X-Custom-Fetch");
        }

        export default function Page({ loaderData, actionData }) {
          return <>
            <p data-loader>{loaderData}</p>
            <p data-action>{actionData}</p>
            <Form method="post"><button>Submit</button></Form>
          </>;
        }
      `,
          },
        });
        let appFixture = await createAppFixture(fixture);
        let app = new PlaywrightFixture(appFixture, page);

        try {
          await app.goto("/", true);
          await expect(page.locator("[data-initial]")).toHaveText("custom");
          if (fullManifest) {
            await page
              .getByRole("button", { name: "partial", exact: true })
              .click();
            await expect(
              page.getByRole("button", { name: "complete", exact: true }),
            ).toBeVisible();
          }
          await app.clickLink("/page");
          await expect(page.locator("[data-loader]")).toHaveText("custom");
          await page.getByRole("button", { name: "Submit" }).click();
          await expect(page.locator("[data-action]")).toHaveText("custom");

          let requests = await page.evaluate(
            () => (window as any).__customFetches,
          );
          expect(
            requests.map((request: { origin: string }) => request.origin),
          ).toEqual(requests.map(() => apiOrigin));
          expect(requests).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                context: {
                  type: "initialization",
                  fetcherKey: null,
                  navigationType: null,
                },
              }),
              ...(!fullManifest
                ? [
                    expect.objectContaining({
                      pathname: "/__manifest",
                      context: { type: "manifest" },
                    }),
                  ]
                : []),
              expect.objectContaining({
                pathname: "/page.data",
                method: "GET",
                context: {
                  type: "navigation",
                  fetcherKey: null,
                  navigationType: "PUSH",
                },
              }),
              expect.objectContaining({
                pathname: "/page.data",
                method: "POST",
                context: {
                  type: "navigation",
                  fetcherKey: null,
                  navigationType: "REPLACE",
                },
              }),
            ]),
          );
        } finally {
          await appFixture.close();
        }
      });
    }
  });
}

test("preserves custom fetch context for fetcher reloads after an initialization redirect", async ({
  page,
}) => {
  let fixture = await createFixture({
    files: {
      "react-router.config.ts": js`
        export default {
          ssr: "unstable_api-only",
          routeDiscovery: { mode: "initial" },
        };
      `,
      "app/entry.client.tsx": js`
        import { HydratedRouter } from "react-router/dom";
        import { startTransition } from "react";
        import { hydrateRoot } from "react-dom/client";

        window.__initialization = new Promise((resolve) => {
          window.__finishInitialization = resolve;
        });
        window.__customFetches = [];

        startTransition(() => {
          hydrateRoot(document, <HydratedRouter unstable_fetch={(request, context) => {
            window.__customFetches.push({
              pathname: new URL(request.url).pathname,
              context,
            });
            return window.fetch(request);
          }} />);
        });
      `,
      "app/root.tsx": js`
        import { Outlet, Scripts, useFetcher } from "react-router";

        export function Layout({ children }) {
          let fetcher = useFetcher({ key: "tracked" });
          return <html><head /><body>
            <p data-fetcher>{fetcher.data ?? "empty"}</p>
            {children}
            <Scripts />
          </body></html>;
        }

        export function HydrateFallback() {
          let fetcher = useFetcher({ key: "tracked" });
          return <>
            <button onClick={() => fetcher.load("/resource")}>Load fetcher</button>
            <button onClick={() => window.__finishInitialization()}>Finish initialization</button>
          </>;
        }

        export default function Root() {
          return <Outlet />;
        }
      `,
      "app/routes/_index.tsx": js`
        import { redirect } from "react-router";

        export async function clientLoader() {
          await window.__initialization;
          throw redirect("/target");
        }

        clientLoader.hydrate = true;

        export default function Index() {
          return null;
        }
      `,
      "app/routes/target.tsx": js`
        export function loader() {
          return "TARGET";
        }

        export default function Target({ loaderData }) {
          return <h1>{loaderData}</h1>;
        }
      `,
      "app/routes/resource.tsx": js`
        let count = 0;

        export function loader() {
          return ++count;
        }

        export function shouldRevalidate() {
          return true;
        }

        export default function Resource() {
          return null;
        }
      `,
    },
  });
  let appFixture = await createAppFixture(fixture);
  let app = new PlaywrightFixture(appFixture, page);

  try {
    await app.goto("/", true);
    await page.getByRole("button", { name: "Load fetcher" }).click();
    await expect(page.locator("[data-fetcher]")).toHaveText("1");

    await page.getByRole("button", { name: "Finish initialization" }).click();
    await expect(page.getByRole("heading", { name: "TARGET" })).toBeVisible();
    await expect(page.locator("[data-fetcher]")).toHaveText("2");

    let requests = await page.evaluate(() => (window as any).__customFetches);
    expect(requests).toHaveLength(3);
    expect(requests).toEqual(
      expect.arrayContaining([
        {
          pathname: "/resource.data",
          context: {
            type: "fetcher",
            fetcherKey: "tracked",
            navigationType: null,
          },
        },
        {
          pathname: "/target.data",
          context: {
            type: "initialization",
            fetcherKey: null,
            navigationType: null,
          },
        },
        {
          pathname: "/resource.data",
          context: {
            type: "initialization",
            fetcherKey: "tracked",
            navigationType: null,
          },
        },
      ]),
    );
  } finally {
    await appFixture.close();
  }
});

test("identifies initiating operations and fetcher targets", async ({
  page,
}) => {
  let fixture = await createFixture({
    files: {
      "app/entry.client.tsx": js`
        import { HydratedRouter } from "react-router/dom";
        import { startTransition, StrictMode } from "react";
        import { hydrateRoot } from "react-dom/client";

        startTransition(() => {
          hydrateRoot(
            document,
            <StrictMode>
              <HydratedRouter
                unstable_fetch={(request, context) => {
                  window.__customFetches ??= [];
                  window.__customFetches.push({
                    pathname: new URL(request.url).pathname,
                    method: request.method,
                    context,
                  });
                  return window.fetch(request);
                }}
              />
            </StrictMode>
          );
        });
      `,
      "app/root.tsx": js`
        import {
          Form,
          Links,
          Meta,
          Outlet,
          Scripts,
          ScrollRestoration,
          useFetcher,
          useNavigate,
          useRevalidator,
        } from "react-router";

        export function Layout({ children }) {
          return (
            <html>
              <head>
                <Meta />
                <Links />
              </head>
              <body>
                {children}
                <ScrollRestoration />
                <Scripts />
              </body>
            </html>
          );
        }

        export default function App() {
          let fetcher = useFetcher({ key: "tracked" });
          let navigate = useNavigate();
          let revalidator = useRevalidator();
          return (
            <>
              <button id="load-fetcher" onClick={() => fetcher.load("/resource")}>
                Load fetcher
              </button>
              <button id="revalidate" onClick={() => revalidator.revalidate()}>
                Revalidate
              </button>
              <p id="fetcher-data">{fetcher.data ?? "empty"}</p>
              <Form method="post" action="/next">
                <button id="navigate" type="submit">Navigate</button>
              </Form>
              <button id="replace" onClick={() => navigate("/next?replace", { replace: true })}>
                Replace
              </button>
              <button id="back" onClick={() => navigate(-1)}>Back</button>
              <Outlet />
            </>
          );
        }
      `,
      "app/routes/_index.tsx": js`
        export async function loader() {
          return null;
        }

        export default function Index() {
          return <h1>Index</h1>;
        }
      `,
      "app/routes/next.tsx": js`
        export async function action() {
          return null;
        }

        export async function loader() {
          return null;
        }

        export default function Next() {
          return <h1 id="next">Next</h1>;
        }
      `,
      "app/routes/resource.tsx": js`
        let count = 0;

        export function shouldRevalidate() {
          return true;
        }

        export async function loader() {
          return ++count;
        }
      `,
    },
  });

  let appFixture = await createAppFixture(fixture);
  let app = new PlaywrightFixture(appFixture, page);

  await app.goto("/", true);
  await page.click("#load-fetcher");
  await expect(page.locator("#fetcher-data")).toHaveText("1");
  expect(await page.evaluate(() => (window as any).__customFetches)).toEqual(
    expect.arrayContaining([
      {
        pathname: "/resource.data",
        method: "GET",
        context: {
          type: "fetcher",
          fetcherKey: "tracked",
          navigationType: null,
        },
      },
    ]),
  );

  await page.evaluate(() => ((window as any).__customFetches = []));
  await page.click("#navigate");
  await page.waitForSelector("#next");
  await expect(page.locator("#fetcher-data")).toHaveText("2");

  expect(await page.evaluate(() => (window as any).__customFetches)).toEqual(
    expect.arrayContaining([
      {
        pathname: "/next.data",
        method: "POST",
        context: {
          type: "navigation",
          fetcherKey: null,
          navigationType: "PUSH",
        },
      },
      {
        pathname: "/resource.data",
        method: "GET",
        context: {
          type: "navigation",
          fetcherKey: "tracked",
          navigationType: "PUSH",
        },
      },
    ]),
  );

  await page.evaluate(() => ((window as any).__customFetches = []));
  await page.click("#revalidate");
  await expect(page.locator("#fetcher-data")).toHaveText("3");

  expect(await page.evaluate(() => (window as any).__customFetches)).toEqual(
    expect.arrayContaining([
      {
        pathname: "/next.data",
        method: "GET",
        context: {
          type: "revalidation",
          fetcherKey: null,
          navigationType: null,
        },
      },
      {
        pathname: "/resource.data",
        method: "GET",
        context: {
          type: "revalidation",
          fetcherKey: "tracked",
          navigationType: null,
        },
      },
    ]),
  );

  await page.evaluate(() => ((window as any).__customFetches = []));
  await page.click("#replace");
  await expect(page).toHaveURL(/\/next\?replace$/);
  await expect(page.locator("#fetcher-data")).toHaveText("4");
  expect(await page.evaluate(() => (window as any).__customFetches)).toEqual(
    expect.arrayContaining([
      {
        pathname: "/next.data",
        method: "GET",
        context: {
          type: "navigation",
          fetcherKey: null,
          navigationType: "REPLACE",
        },
      },
      {
        pathname: "/resource.data",
        method: "GET",
        context: {
          type: "navigation",
          fetcherKey: "tracked",
          navigationType: "REPLACE",
        },
      },
    ]),
  );

  await page.evaluate(() => ((window as any).__customFetches = []));
  await page.click("#back");
  await expect(page.getByRole("heading", { name: "Index" })).toBeVisible();
  await expect(page.locator("#fetcher-data")).toHaveText("5");
  expect(await page.evaluate(() => (window as any).__customFetches)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        method: "GET",
        context: {
          type: "navigation",
          fetcherKey: null,
          navigationType: "POP",
        },
      }),
      {
        pathname: "/resource.data",
        method: "GET",
        context: {
          type: "navigation",
          fetcherKey: "tracked",
          navigationType: "POP",
        },
      },
    ]),
  );

  appFixture.close();
});

test("allows users to pass an onError function to HydratedRouter", async ({
  page,
  browserName,
}) => {
  let fixture = await createFixture({
    files: {
      "app/entry.client.tsx": js`
        import { HydratedRouter } from "react-router/dom";
        import { startTransition, StrictMode } from "react";
        import { hydrateRoot } from "react-dom/client";

        startTransition(() => {
          hydrateRoot(
            document,
            <StrictMode>
              <HydratedRouter
                onError={(error, errorInfo) => {
                  console.log(error.message, JSON.stringify(errorInfo))
                }}
              />
            </StrictMode>
          );
        });
      `,
      "app/routes/_index.tsx": js`
        import { Link } from "react-router";
        export default function Index() {
          return <Link to="/page">Go to Page</Link>;
        }
      `,
      "app/routes/page.tsx": js`
        export default function Page() {
          throw new Error("Render error");
        }
        export function ErrorBoundary({ error }) {
          return <h1 data-error>Error: {error.message}</h1>
        }
      `,
    },
  });

  let logs: string[] = [];
  page.on("console", (msg) => logs.push(msg.text()));

  let appFixture = await createAppFixture(fixture);
  let app = new PlaywrightFixture(appFixture, page);

  await app.goto("/", true);
  await page.click('a[href="/page"]');
  await page.waitForSelector("[data-error]");

  expect(await app.getHtml()).toContain("Error: Render error");
  expect(logs.length).toBe(2);
  // First one is react logging the error
  if (browserName === "firefox") {
    expect(logs[0]).toContain("Error");
  } else {
    expect(logs[0]).toContain("Error: Render error");
  }
  expect(logs[0]).not.toContain("componentStack");
  // Second one is ours
  expect(logs[1]).toContain("Render error");
  expect(logs[1]).toContain('"componentStack":');

  appFixture.close();
});

test("allows users to instrument the client side router via HydratedRouter", async ({
  page,
}) => {
  let fixture = await createFixture({
    files: {
      "app/entry.client.tsx": js`
        import { HydratedRouter } from "react-router/dom";
        import { startTransition, StrictMode } from "react";
        import { hydrateRoot } from "react-dom/client";

        startTransition(() => {
          hydrateRoot(
            document,
            <StrictMode>
              <HydratedRouter
                instrumentations={[{
                  router(router) {
                    router.instrument({
                      async navigate(impl, info) {
                        console.log("start navigate", JSON.stringify(Object.entries(info).sort()));
                        let result = await impl();
                        console.log("end navigate", JSON.stringify(Object.entries(info).sort()), JSON.stringify({
                          url: result.meta.url,
                          pattern: result.meta.pattern,
                          params: result.meta.params,
                        }));
                      },
                      async fetch(impl, info) {
                        console.log("start fetch", JSON.stringify(Object.entries(info).sort()));
                        await impl();
                        console.log("end fetch", JSON.stringify(Object.entries(info).sort()));
                      }
                    })
                  },
                  route(route) {
                    route.instrument({
                      async loader(impl, info) {
                        let path = new URL(info.request.url).pathname;
                        console.log("start loader", route.id, path);
                        await impl();
                        console.log("end loader", route.id, path);
                      },
                      async action(impl, info) {
                        let path = new URL(info.request.url).pathname;
                        console.log("start action", route.id, path);
                        await impl();
                        console.log("end action", route.id, path);
                      }
                    })
                  }
                }]}
              />
            </StrictMode>
          );
        });
      `,
      "app/routes/_index.tsx": js`
        import { Link } from "react-router";
        export default function Index() {
          return <Link to="/page">Go to Page</Link>;
        }
      `,
      "app/routes/page.tsx": js`
        import { useFetcher } from "react-router";
        export function loader() {
          return { data: "hello world" };
        }
        export function action() {
          return "OK";
        }
        export default function Page({ loaderData }) {
          let fetcher = useFetcher({ key: 'a' });
          return (
            <>
              <h1 data-page>{loaderData.data}</h1>;
              <button data-fetch onClick={() => fetcher.submit({ key: 'value' }, {
                method: 'post',
                action: "/page"
              })}>
                Fetch
              </button>
              {fetcher.data ? <pre data-fetcher-data>{fetcher.data}</pre> : null}
            </>
          );
        }
      `,
    },
  });

  let logs: string[] = [];
  page.on("console", (msg) => logs.push(msg.text()));

  let appFixture = await createAppFixture(fixture);
  let app = new PlaywrightFixture(appFixture, page);

  await app.goto("/", true);
  await page.click('a[href="/page"]');
  await page.waitForSelector("[data-page]");

  expect(await app.getHtml()).toContain("hello world");
  expect(logs).toEqual([
    'start navigate [["currentUrl","/"],["to","/page"]]',
    "start loader root /page",
    "start loader routes/page /page",
    "end loader root /page",
    "end loader routes/page /page",
    expect.stringMatching(
      /^end navigate \[\["currentUrl","\/"\],\["to","\/page"\]\] \{"url":"http:\/\/localhost:\d+\/page","pattern":"page","params":\{\}\}$/,
    ),
  ]);
  logs.splice(0);

  await page.click("[data-fetch]");
  await page.waitForSelector("[data-fetcher-data]");
  await expect(page.locator("[data-fetcher-data]")).toContainText("OK");
  expect(logs).toEqual([
    'start fetch [["body",{"key":"value"}],["currentUrl","/page"],["fetcherKey","a"],["formData",null],["formEncType","application/x-www-form-urlencoded"],["formMethod","post"],["href","/page"]]',
    "start action routes/page /page",
    "end action routes/page /page",
    "start loader root /page",
    "start loader routes/page /page",
    "end loader root /page",
    "end loader routes/page /page",
    'end fetch [["body",{"key":"value"}],["currentUrl","/page"],["fetcherKey","a"],["formData",null],["formEncType","application/x-www-form-urlencoded"],["formMethod","post"],["href","/page"]]',
  ]);

  appFixture.close();
});
