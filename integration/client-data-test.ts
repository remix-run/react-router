import { test, expect } from "@playwright/test";

import { UNSAFE_ServerMode as ServerMode } from "react-router";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import { type TemplateName, reactRouterConfig } from "./helpers/vite.js";

const templateNames = [
  "vite-5-template",
  "rsc-vite-framework",
] as const satisfies TemplateName[];

test.describe("Client Data", () => {
  for (const templateName of templateNames) {
    function getFiles({
      splitRouteModules,
      parentClientLoader,
      parentClientLoaderHydrate,
      parentAdditions,
      childClientLoader,
      childClientLoaderHydrate,
      childAdditions,
    }: {
      splitRouteModules: boolean;
      parentClientLoader: boolean;
      parentClientLoaderHydrate: boolean;
      parentAdditions?: string;
      childClientLoader: boolean;
      childClientLoaderHydrate: boolean;
      childAdditions?: string;
    }) {
      return {
        "react-router.config.ts": reactRouterConfig({
          splitRouteModules,
          viteEnvironmentApi: templateName.includes("rsc"),
        }),
        "app/root.tsx": js`
          import { Outlet, Scripts } from "react-router"
    
          export default function Root() {
            return (
              <html>
                <head></head>
                <body>
                  <main>
                    <Outlet />
                  </main>
                  <Scripts />
                </body>
              </html>
            );
          }
        `,
        "app/routes/_index.tsx": js`
          import { Link } from "react-router"
          export default function Component() {
            return <Link to="/parent/child">Go to /parent/child</Link>
          }
        `,
        "app/routes/parent.tsx": js`
          import { Outlet, useLoaderData } from "react-router"
          export function loader() {
            return { message: 'Parent Server Loader' };
          }
          ${
            parentClientLoader
              ? js`
                  export async function clientLoader({ serverLoader }) {
                    // Need a small delay to ensure we capture the server-rendered
                    // fallbacks for assertions
                    await new Promise(r => setTimeout(r, 100))
                    let data = await serverLoader();
                    return { message: data.message + " (mutated by client)" };
                  }
                `
              : ""
          }
          ${
            parentClientLoaderHydrate
              ? js`
                  clientLoader.hydrate = true;
                  export function HydrateFallback() {
                    return <p>Parent Fallback</p>
                  }
                `
              : ""
          }
          ${parentAdditions || ""}
          export default function Component() {
            let data = useLoaderData();
            return (
              <>
                <p id="parent-data">{data.message}</p>
                <Outlet/>
              </>
            );
          }
        `,
        "app/routes/parent.child.tsx": js`
          import { Form, Outlet, useActionData, useLoaderData } from "react-router"
          export function loader() {
            return { message: 'Child Server Loader' };
          }
          export function action() {
            return { message: 'Child Server Action' };
          }
          ${
            childClientLoader
              ? js`
                  export async function clientLoader({ serverLoader }) {
                    // Need a small delay to ensure we capture the server-rendered
                    // fallbacks for assertions
                    await new Promise(r => setTimeout(r, 100))
                    let data = await serverLoader();
                    return { message: data.message + " (mutated by client)" };
                  }
                `
              : ""
          }
          ${
            childClientLoaderHydrate
              ? js`
                  clientLoader.hydrate = true;
                  export function HydrateFallback() {
                    return <p>Child Fallback</p>
                  }
                `
              : ""
          }
          ${childAdditions || ""}
          export default function Component() {
            let data = useLoaderData();
            let actionData = useActionData();
            return (
              <>
                <p id="child-data">{data.message}</p>
                <Form method="post">
                  <button type="submit">Submit</button>
                  {actionData ? <p id="child-action-data">{actionData.message}</p> : null}
                </Form>
              </>
            );
          }
        `,
      };
    }

    let appFixture: AppFixture;

    test.afterEach(async () => {
      appFixture?.close();
    });

    test.describe(`template: ${templateName}`, () => {
      [true, false].forEach((splitRouteModules) => {
        test.describe(`splitRouteModules: ${splitRouteModules}`, () => {
          test.skip(
            templateName.includes("rsc") && splitRouteModules,
            "RSC Framework Mode doesn't support splitRouteModules",
          );

          test.skip(
            ({ browserName }) =>
              Boolean(process.env.CI) &&
              splitRouteModules &&
              (browserName === "webkit" || process.platform === "win32"),
            "Webkit/Windows tests only run on a single worker in CI and splitRouteModules is not OS/browser-specific",
          );

          test.describe("clientLoader - critical route module", () => {
            test("no client loaders or fallbacks", async ({ page }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: false,
                    parentClientLoaderHydrate: false,
                    childClientLoader: false,
                    childClientLoaderHydrate: false,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);

              // Full SSR - normal loader behavior due to lack of clientLoader
              await app.goto("/parent/child");
              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader");
            });

            test("parent.clientLoader/child.clientLoader", async ({ page }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: true,
                    parentClientLoaderHydrate: false,
                    childClientLoader: true,
                    childClientLoaderHydrate: false,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);

              // Full SSR - normal loader behavior due to lack of HydrateFallback components
              await app.goto("/parent/child");
              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader");
            });

            test("parent.clientLoader.hydrate/child.clientLoader", async ({
              page,
            }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: true,
                    parentClientLoaderHydrate: true,
                    childClientLoader: true,
                    childClientLoaderHydrate: false,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);

              await app.goto("/parent/child");
              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Fallback");
              expect(html).not.toMatch("Parent Server Loader");
              expect(html).not.toMatch("Child Server Loader");

              await page.waitForSelector("#child-data");
              html = await app.getHtml("main");
              expect(html).not.toMatch("Parent Fallback");
              expect(html).toMatch("Parent Server Loader (mutated by client)");
              expect(html).toMatch("Child Server Loader");
            });

            test("parent.clientLoader/child.clientLoader.hydrate", async ({
              page,
            }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: true,
                    parentClientLoaderHydrate: false,
                    childClientLoader: true,
                    childClientLoaderHydrate: true,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);

              await app.goto("/parent/child");
              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Fallback");
              expect(html).not.toMatch("Child Server Loader");

              await page.waitForSelector("#child-data");
              html = await app.getHtml("main");
              expect(html).not.toMatch("Child Fallback");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader (mutated by client)");
            });

            test("parent.clientLoader.hydrate/child.clientLoader.hydrate", async ({
              page,
            }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: true,
                    parentClientLoaderHydrate: true,
                    childClientLoader: true,
                    childClientLoaderHydrate: true,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);

              await app.goto("/parent/child");
              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Fallback");
              expect(html).not.toMatch("Parent Server Loader");
              expect(html).not.toMatch("Child Fallback");
              expect(html).not.toMatch("Child Server Loader");

              await page.waitForSelector("#child-data");
              html = await app.getHtml("main");
              expect(html).not.toMatch("Parent Fallback");
              expect(html).not.toMatch("Child Fallback");
              expect(html).toMatch("Parent Server Loader (mutated by client)");
              expect(html).toMatch("Child Server Loader (mutated by client)");
            });

            test("handles synchronous client loaders", async ({ page }) => {
              let fixture = await createFixture({
                templateName,
                files: getFiles({
                  splitRouteModules,
                  parentClientLoader: false,
                  parentClientLoaderHydrate: false,
                  childClientLoader: false,
                  childClientLoaderHydrate: false,
                  parentAdditions: js`
                    export function clientLoader() {
                      return { message: "Parent Client Loader" };
                    }
                    clientLoader.hydrate=true
                    export function HydrateFallback() {
                      return <p>Parent Fallback</p>
                    }
                  `,
                  childAdditions: js`
                    export function clientLoader() {
                      return { message: "Child Client Loader" };
                    }
                    clientLoader.hydrate=true
                `,
                }),
              });

              appFixture = await createAppFixture(fixture);
              let app = new PlaywrightFixture(appFixture, page);

              // Ensure we SSR the fallbacks
              let response = await app.goto("/parent/child");
              let html = await response?.text();
              expect(html).toMatch("Parent Fallback");

              await page.waitForSelector("#child-data");
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Client Loader");
              expect(html).toMatch("Child Client Loader");
            });

            test("handles deferred data through client loaders", async ({
              page,
            }) => {
              let fixture = await createFixture({
                templateName,
                files: {
                  ...getFiles({
                    splitRouteModules,
                    parentClientLoader: false,
                    parentClientLoaderHydrate: false,
                    childClientLoader: false,
                    childClientLoaderHydrate: false,
                  }),
                  "app/routes/parent.child.tsx": js`
                    import * as React from 'react';
                    import { Await, useLoaderData } from "react-router"
                    export function loader() {
                      return {
                        message: 'Child Server Loader',
                        lazy: new Promise(r => setTimeout(() => r("Child Deferred Data"), 1000)),
                      };
                    }
                    export async function clientLoader({ serverLoader }) {
                      let data = await serverLoader();
                      return {
                        ...data,
                        message: data.message + " (mutated by client)",
                      };
                    }
                    clientLoader.hydrate = true;
                    export function HydrateFallback() {
                      return <p>Child Fallback</p>
                    }
                    export default function Component() {
                      let data = useLoaderData();
                      return (
                        <>
                          <p id="child-data">{data.message}</p>
                          <React.Suspense fallback={<p>Loading Deferred Data...</p>}>
                            <Await resolve={data.lazy}>
                              {(value) => <p id="child-deferred-data">{value}</p>}
                            </Await>
                          </React.Suspense>
                        </>
                      );
                    }
                  `,
                },
              });

              appFixture = await createAppFixture(fixture);
              let app = new PlaywrightFixture(appFixture, page);

              // Ensure initial document request contains the child fallback _and_ the
              // subsequent streamed/resolved deferred data
              let response = await app.goto("/parent/child");
              let html = await response?.text();
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Fallback");
              expect(html).toMatch("Child Deferred Data");

              await page.waitForSelector("#child-deferred-data");
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              // app.goto() doesn't resolve until the document finishes loading so by
              // then the HTML has updated via the streamed suspense updates
              expect(html).toMatch("Child Server Loader (mutated by client)");
              expect(html).toMatch("Child Deferred Data");
            });

            test("allows hydration execution without rendering a fallback", async ({
              page,
            }) => {
              let fixture = await createFixture({
                templateName,
                files: getFiles({
                  splitRouteModules,
                  parentClientLoader: false,
                  parentClientLoaderHydrate: false,
                  childClientLoader: false,
                  childClientLoaderHydrate: false,
                  childAdditions: js`
                    export async function clientLoader() {
                      await new Promise(r => setTimeout(r, 100));
                      return { message: "Child Client Loader" };
                    }
                    clientLoader.hydrate=true
                `,
                }),
              });

              appFixture = await createAppFixture(fixture);
              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/parent/child");
              let html = await app.getHtml("main");
              expect(html).toMatch("Child Server Loader");
              await page.waitForSelector(':has-text("Child Client Loader")');
              html = await app.getHtml("main");
              expect(html).toMatch("Child Client Loader");
            });

            test("HydrateFallback is not rendered if clientLoader.hydrate is not set (w/server loader)", async ({
              page,
            }) => {
              let fixture = await createFixture({
                templateName,
                files: {
                  ...getFiles({
                    splitRouteModules,
                    parentClientLoader: false,
                    parentClientLoaderHydrate: false,
                    childClientLoader: false,
                    childClientLoaderHydrate: false,
                  }),
                  "app/routes/parent.child.tsx": js`
                    import * as React from 'react';
                    import { useLoaderData } from "react-router";
                    export function loader() {
                      return { message: "Child Server Loader Data" };
                    }
                    export async function clientLoader({ serverLoader }) {
                      await new Promise(r => setTimeout(r, 100));
                      return { message: "Child Client Loader Data" };
                    }
                    export function HydrateFallback() {
                      return <p>SHOULD NOT SEE ME</p>
                    }
                    export default function Component() {
                      let data = useLoaderData();
                      return <p id="child-data">{data.message}</p>;
                    }
                  `,
                },
              });
              appFixture = await createAppFixture(fixture);

              let app = new PlaywrightFixture(appFixture, page);

              // Ensure initial document request contains the child fallback _and_ the
              // subsequent streamed/resolved deferred data
              let response = await app.goto("/parent/child");
              let html = await response?.text();
              expect(html).toMatch("Child Server Loader Data");
              expect(html).not.toMatch("SHOULD NOT SEE ME");

              await page.waitForSelector("#child-data");
              html = await app.getHtml("main");
              expect(html).toMatch("Child Server Loader Data");
            });

            test("clientLoader.hydrate is automatically implied when no server loader exists (w HydrateFallback)", async ({
              page,
            }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: {
                    ...getFiles({
                      splitRouteModules,
                      parentClientLoader: false,
                      parentClientLoaderHydrate: false,
                      childClientLoader: false,
                      childClientLoaderHydrate: false,
                    }),
                    "app/routes/parent.child.tsx": js`
                      import * as React from 'react';
                      import { useLoaderData } from "react-router";
                      // Even without setting hydrate=true, this should run on hydration
                      export async function clientLoader({ serverLoader }) {
                        await new Promise(r => setTimeout(r, 100));
                        return {
                          message: "Loader Data (clientLoader only)",
                        };
                      }
                      export function HydrateFallback() {
                        return <p>Child Fallback</p>
                      }
                      export default function Component() {
                        let data = useLoaderData();
                        return <p id="child-data">{data.message}</p>;
                      }
                    `,
                  },
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);

              await app.goto("/parent/child");
              let html = await app.getHtml("main");
              expect(html).toMatch("Child Fallback");
              await page.waitForSelector("#child-data");
              html = await app.getHtml("main");
              expect(html).toMatch("Loader Data (clientLoader only)");
            });

            test("clientLoader.hydrate is automatically implied when no server loader exists (w/o HydrateFallback)", async ({
              page,
            }) => {
              test.skip(
                templateName.includes("rsc"),
                "RSC Framework Mode doesn't need to provide a default root HydrateFallback since it doesn't need to ensure <Scripts /> is rendered, and you already get a console warning",
              );

              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: {
                    ...getFiles({
                      splitRouteModules,
                      parentClientLoader: false,
                      parentClientLoaderHydrate: false,
                      childClientLoader: false,
                      childClientLoaderHydrate: false,
                    }),
                    "app/routes/parent.child.tsx": js`
                      import * as React from 'react';
                      import { useLoaderData } from "react-router";
                      // Even without setting hydrate=true, this should run on hydration
                      export async function clientLoader({ serverLoader }) {
                        await new Promise(r => setTimeout(r, 100));
                        return {
                          message: "Loader Data (clientLoader only)",
                        };
                      }
                      export default function Component() {
                        let data = useLoaderData();
                        return <p id="child-data">{data.message}</p>;
                      }
                    `,
                  },
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);

              await app.goto("/parent/child");
              let html = await app.getHtml();
              expect(html).toMatch(
                "💿 Hey developer 👋. You can provide a way better UX than this",
              );
              expect(html).not.toMatch("child-data");
              await page.waitForSelector("#child-data");
              html = await app.getHtml("main");
              expect(html).toMatch("Loader Data (clientLoader only)");
            });

            test("throws a 400 if you call serverLoader without a server loader", async ({
              page,
            }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: {
                    ...getFiles({
                      splitRouteModules,
                      parentClientLoader: false,
                      parentClientLoaderHydrate: false,
                      childClientLoader: false,
                      childClientLoaderHydrate: false,
                    }),
                    "app/routes/parent.child.tsx": js`
                      import * as React from 'react';
                      import { useLoaderData, useRouteError } from "react-router";
                      export async function clientLoader({ serverLoader }) {
                        return await serverLoader();
                      }
                      export default function Component() {
                        return <p>Child</p>;
                      }
                      export function HydrateFallback() {
                        return <p>Loading...</p>;
                      }
                      export function ErrorBoundary() {
                        let error = useRouteError();
                        return <p id="child-error">{error.status} {error.data}</p>;
                      }
                    `,
                  },
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);

              await app.goto("/parent/child");
              await page.waitForSelector("#child-error");
              let html = await app.getHtml("#child-error");
              expect(html.replace(/\n/g, " ").replace(/ +/g, " ")).toMatch(
                "400 Error: You are trying to call serverLoader() on a route that does " +
                  'not have a server loader (routeId: "routes/parent.child")',
              );
            });

            test("initial hydration data check functions properly", async ({
              page,
            }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: {
                    ...getFiles({
                      splitRouteModules,
                      parentClientLoader: false,
                      parentClientLoaderHydrate: false,
                      childClientLoader: false,
                      childClientLoaderHydrate: false,
                    }),
                    "app/routes/parent.child.tsx": js`
                      import * as React from 'react';
                      import { useLoaderData, useRevalidator } from "react-router";
                      let isFirstCall = true;
                      export async function loader({ serverLoader }) {
                        if (isFirstCall) {
                          isFirstCall = false
                          return { message: "Child Server Loader Data (1)" };
                        }
                        return { message: "Child Server Loader Data (2+)" };
                      }
                      export async function clientLoader({ serverLoader }) {
                        await new Promise(r => setTimeout(r, 100));
                        let serverData = await serverLoader();
                        return {
                          message: serverData.message + " (mutated by client)",
                        };
                      }
                      clientLoader.hydrate=true;
                      export default function Component() {
                        let data = useLoaderData();
                        let revalidator = useRevalidator();
                        return (
                          <>
                            <p id="child-data">{data.message}</p>
                            <button onClick={() => revalidator.revalidate()}>Revalidate</button>
                          </>
                        );
                      }
                      export function HydrateFallback() {
                        return <p>Loading...</p>
                      }
                    `,
                  },
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);

              await app.goto("/parent/child");
              await page.waitForSelector("#child-data");
              let html = await app.getHtml();
              expect(html).toMatch(
                "Child Server Loader Data (1) (mutated by client)",
              );
              app.clickElement("button");
              await page.waitForSelector(
                ':has-text("Child Server Loader Data (2+)")',
              );
              html = await app.getHtml("main");
              expect(html).toMatch(
                "Child Server Loader Data (2+) (mutated by client)",
              );
            });

            test("initial hydration data check functions properly even if serverLoader isn't called on hydration", async ({
              page,
            }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: {
                    ...getFiles({
                      splitRouteModules,
                      parentClientLoader: false,
                      parentClientLoaderHydrate: false,
                      childClientLoader: false,
                      childClientLoaderHydrate: false,
                    }),
                    "app/routes/parent.child.tsx": js`
                      import * as React from 'react';
                      import { useLoaderData, useRevalidator } from "react-router";
                      let isFirstCall = true;
                      export async function loader({ serverLoader }) {
                        if (isFirstCall) {
                          isFirstCall = false
                          return { message: "Child Server Loader Data (1)" };
                        }
                        return { message: "Child Server Loader Data (2+)" };
                      }
                      let isFirstClientCall = true;
                      export async function clientLoader({ serverLoader }) {
                        await new Promise(r => setTimeout(r, 100));
                        if (isFirstClientCall) {
                          isFirstClientCall = false;
                          // First time through - don't even call serverLoader
                          return {
                            message: "Child Client Loader Data",
                          };
                        }
                        // Only call the serverLoader on subsequent calls and this
                        // should *not* return us the initialData any longer
                        let serverData = await serverLoader();
                        return {
                          message: serverData.message + " (mutated by client)",
                        };
                      }
                      clientLoader.hydrate=true;
                      export default function Component() {
                        let data = useLoaderData();
                        let revalidator = useRevalidator();
                        return (
                          <>
                            <p id="child-data">{data.message}</p>
                            <button onClick={() => revalidator.revalidate()}>Revalidate</button>
                          </>
                        );
                      }
                      export function HydrateFallback() {
                        return <p>Loading...</p>
                      }
                    `,
                  },
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);

              await app.goto("/parent/child");
              await page.waitForSelector("#child-data");
              let html = await app.getHtml();
              expect(html).toMatch("Child Client Loader Data");
              app.clickElement("button");
              await page.waitForSelector(
                ':has-text("Child Server Loader Data (2+)")',
              );
              html = await app.getHtml("main");
              expect(html).toMatch(
                "Child Server Loader Data (2+) (mutated by client)",
              );
            });

            test("server loader errors are re-thrown from serverLoader()", async ({
              page,
            }) => {
              let _consoleError = console.error;
              console.error = () => {};
              appFixture = await createAppFixture(
                await createFixture(
                  {
                    templateName,
                    files: {
                      ...getFiles({
                        splitRouteModules,
                        parentClientLoader: false,
                        parentClientLoaderHydrate: false,
                        childClientLoader: false,
                        childClientLoaderHydrate: false,
                      }),
                      "app/routes/parent.child.tsx": js`
                        import { useRouteError } from "react-router";

                        export function loader() {
                          throw new Error("Broken!")
                        }

                        export async function clientLoader({ serverLoader }) {
                          return await serverLoader();
                        }
                        clientLoader.hydrate = true;

                        export default function Index() {
                          return <h1>Should not see me</h1>;
                        }

                        export function ErrorBoundary() {
                          let error = useRouteError();
                          return <p id="child-error">{error.message}</p>;
                        }
                      `,
                    },
                  },
                  ServerMode.Development, // Avoid error sanitization
                ),
                ServerMode.Development, // Avoid error sanitization
              );
              let app = new PlaywrightFixture(appFixture, page);

              await app.goto("/parent/child");
              let html = await app.getHtml("main");
              expect(html).toMatch("Broken!");
              // Ensure we hydrate and remain on the boundary
              await new Promise((r) => setTimeout(r, 100));
              html = await app.getHtml("main");
              expect(html).toMatch("Broken!");
              expect(html).not.toMatch("Should not see me");
              console.error = _consoleError;
            });

            test("bubbled server loader errors are persisted for hydrating routes", async ({
              page,
            }) => {
              let _consoleError = console.error;
              console.error = () => {};
              appFixture = await createAppFixture(
                await createFixture(
                  {
                    templateName,
                    files: {
                      ...getFiles({
                        splitRouteModules,
                        parentClientLoader: false,
                        parentClientLoaderHydrate: false,
                        childClientLoader: false,
                        childClientLoaderHydrate: false,
                      }),
                      "app/routes/parent.tsx": js`
                        import { Outlet, useLoaderData, useRouteLoaderData, useRouteError } from 'react-router'
                        export function loader() {
                          return { message: 'Parent Server Loader' };
                        }
                        export async function clientLoader({ serverLoader }) {
                          console.log('running parent client loader')
                          // Need a small delay to ensure we capture the server-rendered
                          // fallbacks for assertions
                          await new Promise(r => setTimeout(r, 100));
                          let data = await serverLoader();
                          return { message: data.message + " (mutated by client)" };
                        }
                        clientLoader.hydrate = true;
                        export default function Component() {
                          let data = useLoaderData();
                          return (
                            <>
                              <p id="parent-data">{data.message}</p>
                              <Outlet/>
                            </>
                          );
                        }
                        export function ErrorBoundary() {
                          let data = useRouteLoaderData("routes/parent")
                          let error = useRouteError();
                          return (
                            <>
                              <h1>Parent Error</h1>
                              <p id="parent-data">{data?.message}</p>
                              <p id="parent-error">{error?.message}</p>
                            </>
                          );
                        }
                      `,
                      "app/routes/parent.child.tsx": js`
                        import { useRouteError, useLoaderData } from 'react-router'
                        export function loader() {
                          throw new Error('Child Server Error');
                        }
                        export function clientLoader() {
                          console.log('running child client loader')
                          return "Should not see me";
                        }
                        clientLoader.hydrate = true;
                        export default function Component() {
                          let data = useLoaderData()
                          return (
                            <>
                              <p>Should not see me</p>
                              <p>{data}</p>;
                            </>
                          );
                        }
                      `,
                    },
                  },
                  ServerMode.Development, // Avoid error sanitization
                ),
                ServerMode.Development, // Avoid error sanitization
              );
              let app = new PlaywrightFixture(appFixture, page);
              let logs: string[] = [];
              page.on("console", (msg) => {
                let text = msg.text();
                if (
                  // Chrome logs the 500 as a console error, so skip that since it's not
                  // what we are asserting against here
                  /500 \(Internal Server Error\)/.test(text) ||
                  // Ignore any dev tools messages. This may only happen locally when dev
                  // tools is installed and not in CI but either way we don't care
                  /Download the React DevTools/.test(text) ||
                  (templateName.includes("rsc") &&
                    /The <Scripts \/> element is a no-op when using RSC and can be safely removed./.test(
                      text,
                    ))
                ) {
                  return;
                }
                logs.push(text);
              });
              await app.goto("/parent/child", false);
              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader</p>");
              expect(html).toMatch("Child Server Error");
              expect(html).not.toMatch("Should not see me");
              // Ensure we hydrate and remain on the boundary
              await page.waitForSelector(
                ":has-text('Parent Server Loader (mutated by client)')",
              );
              html = await app.getHtml("main");
              expect(html).toMatch(
                "Parent Server Loader (mutated by client)</p>",
              );
              expect(html).toMatch("Child Server Error");
              expect(html).not.toMatch("Should not see me");
              expect(logs).toEqual(["running parent client loader"]);
              console.error = _consoleError;
            });

            test("hydrating clientLoader redirects trigger new data requests to the server", async ({
              page,
            }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: {
                    "react-router.config.ts": reactRouterConfig({
                      splitRouteModules,
                      viteEnvironmentApi: templateName.includes("rsc"),
                    }),
                    "app/root.tsx": js`
                      import { Outlet, Scripts } from "react-router"

                      let count = 1;
                      export function loader() {
                        return count++;
                      }

                      export default function Root({ loaderData }) {
                        return (
                          <html>
                            <head></head>
                            <body>
                              <main>
                                <p id="root-data">{loaderData}</p>
                                <Outlet />
                              </main>
                              <Scripts />
                            </body>
                          </html>
                        );
                      }
                    `,
                    "app/routes/parent.tsx": js`
                      import { Outlet } from 'react-router'
                      let count = 1;
                      export function loader() {
                        return count++;
                      }
                      export default function Component({ loaderData }) {
                        return (
                          <>
                            <p id="parent-data">{loaderData}</p>
                            <Outlet/>
                          </>
                        );
                      }
                      export function shouldRevalidate() {
                        return false;
                      }
                    `,
                    "app/routes/parent.a.tsx": js`
                      import { redirect } from 'react-router'
                      export function clientLoader() {
                        return redirect('/parent/b');
                      }
                      clientLoader.hydrate = true;
                      export default function Component({ loaderData }) {
                        return <p>Should not see me</p>;
                      }
                    `,
                    "app/routes/parent.b.tsx": js`
                      export default function Component({ loaderData }) {
                        return <p id="b">Hi!</p>;
                      }
                    `,
                  },
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);

              await app.goto("/parent/a");
              await page.waitForSelector("#b");
              // Root re-runs
              await expect(page.locator("#root-data")).toHaveText("2");
              // But parent opted out of revalidation
              await expect(page.locator("#parent-data")).toHaveText("1");
              await expect(page.locator("#b")).toHaveText("Hi!");
            });
          });

          test.describe("clientLoader - lazy route module", () => {
            test("no client loaders or fallbacks", async ({ page }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: false,
                    parentClientLoaderHydrate: false,
                    childClientLoader: false,
                    childClientLoaderHydrate: false,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/");
              await app.clickLink("/parent/child");
              await page.waitForSelector("#child-data");

              // Normal Remix behavior due to lack of clientLoader
              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader");
            });

            test("parent.clientLoader", async ({ page }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: true,
                    parentClientLoaderHydrate: false,
                    childClientLoader: false,
                    childClientLoaderHydrate: false,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/");
              await app.clickLink("/parent/child");
              await page.waitForSelector("#child-data");

              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader (mutated by client)");
              expect(html).toMatch("Child Server Loader");
            });

            test("child.clientLoader", async ({ page }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: false,
                    parentClientLoaderHydrate: false,
                    childClientLoader: true,
                    childClientLoaderHydrate: false,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/");
              await app.clickLink("/parent/child");
              await page.waitForSelector("#child-data");

              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader (mutated by client)");
            });

            test("parent.clientLoader/child.clientLoader", async ({ page }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: true,
                    parentClientLoaderHydrate: false,
                    childClientLoader: true,
                    childClientLoaderHydrate: false,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/");
              await app.clickLink("/parent/child");
              await page.waitForSelector("#child-data");

              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader (mutated by client)");
              expect(html).toMatch("Child Server Loader (mutated by client");
            });

            test("throws a 400 if you call serverLoader without a server loader", async ({
              page,
            }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: {
                    ...getFiles({
                      splitRouteModules,
                      parentClientLoader: false,
                      parentClientLoaderHydrate: false,
                      childClientLoader: false,
                      childClientLoaderHydrate: false,
                    }),
                    "app/routes/parent.child.tsx": js`
                      import * as React from 'react';
                      import { useLoaderData, useRouteError } from "react-router";
                      export async function clientLoader({ serverLoader }) {
                        return await serverLoader();
                      }
                      export default function Component() {
                        return <p>Child</p>;
                      }
                      export function HydrateFallback() {
                        return <p>Loading...</p>;
                      }
                      export function ErrorBoundary() {
                        let error = useRouteError();
                        return <p id="child-error">{error.status} {error.data}</p>;
                      }
                    `,
                  },
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);

              await app.goto("/");
              await app.clickLink("/parent/child");
              await page.waitForSelector("#child-error");
              let html = await app.getHtml("#child-error");
              expect(html.replace(/\n/g, " ").replace(/ +/g, " ")).toMatch(
                "400 Error: You are trying to call serverLoader() on a route that does " +
                  'not have a server loader (routeId: "routes/parent.child")',
              );
            });
            test("does not prefetch server loader if a client loader is present", async ({
              page,
              browserName,
            }) => {
              test.skip(
                templateName.includes("rsc"),
                "This test is specific to non-RSC Framework Mode",
              );

              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: {
                    ...getFiles({
                      splitRouteModules,
                      parentClientLoader: true,
                      parentClientLoaderHydrate: false,
                      childClientLoader: false,
                      childClientLoaderHydrate: false,
                    }),
                    "app/routes/_index.tsx": js`
                      import { Link } from 'react-router'
                      export default function Component() {
                        return (
                          <>
                            <Link prefetch="render" to="/parent">Go to /parent</Link>
                            <Link prefetch="render" to="/parent/child">Go to /parent/child</Link>
                          </>
                        );
                      }
                  `,
                  },
                }),
              );

              let dataUrls: string[] = [];
              page.on("request", (request) => {
                let url = request.url();
                if (url.includes(".data") || url.includes(".rsc")) {
                  dataUrls.push(url);
                }
              });

              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/", true);

              if (browserName === "webkit") {
                // No prefetch support :/
                expect(dataUrls).toEqual([]);
              } else {
                // Only prefetch child server loader since parent has a `clientLoader`
                expect(dataUrls).toEqual([
                  expect.stringMatching(
                    /parent\/child\.data\?_routes=routes%2Fparent\.child/,
                  ),
                ]);
              }
            });
          });

          test.describe("clientAction - critical route module", () => {
            test("child.clientAction", async ({ page }) => {
              appFixture = await createAppFixture(
                await createFixture(
                  {
                    templateName,
                    files: getFiles({
                      splitRouteModules,
                      parentClientLoader: false,
                      parentClientLoaderHydrate: false,
                      childClientLoader: false,
                      childClientLoaderHydrate: false,
                      childAdditions: js`
                      export async function clientAction({ serverAction }) {
                        let data = await serverAction();
                        return {
                          message: data.message + " (mutated by client)"
                        }
                      }
                    `,
                    }),
                  },
                  ServerMode.Development,
                ),
                ServerMode.Development,
              );
              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/parent/child");
              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader");
              expect(html).not.toMatch("Child Server Action");

              app.clickSubmitButton("/parent/child");
              await page.waitForSelector("#child-action-data");
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader");
              expect(html).toMatch("Child Server Action (mutated by client)");
            });

            test("child.clientAction/parent.childLoader", async ({ page }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: true,
                    parentClientLoaderHydrate: false,
                    childClientLoader: false,
                    childClientLoaderHydrate: false,
                    childAdditions: js`
                      export async function clientAction({ serverAction }) {
                        let data = await serverAction();
                        return {
                          message: data.message + " (mutated by client)"
                        }
                      }
                    `,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/parent/child");
              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader");
              expect(html).not.toMatch("Child Server Action");

              app.clickSubmitButton("/parent/child");
              await page.waitForSelector("#child-action-data");
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader"); // still revalidating
              expect(html).toMatch("Child Server Loader");
              expect(html).toMatch("Child Server Action (mutated by client)");

              await page.waitForSelector(
                ':has-text("Parent Server Loader (mutated by client)")',
              );
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader (mutated by client)");
              expect(html).toMatch("Child Server Loader");
              expect(html).toMatch("Child Server Action (mutated by client)");
            });

            test("child.clientAction/child.clientLoader", async ({ page }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: false,
                    parentClientLoaderHydrate: false,
                    childClientLoader: true,
                    childClientLoaderHydrate: false,
                    childAdditions: js`
                      export async function clientAction({ serverAction }) {
                        let data = await serverAction();
                        return {
                          message: data.message + " (mutated by client)"
                        }
                      }
                    `,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/parent/child");
              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader");
              expect(html).not.toMatch("Child Server Action");

              app.clickSubmitButton("/parent/child");
              await page.waitForSelector("#child-action-data");
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader"); // still revalidating
              expect(html).toMatch("Child Server Loader");
              expect(html).toMatch("Child Server Action (mutated by client)");

              await page.waitForSelector(
                ':has-text("Child Server Loader (mutated by client)")',
              );
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader (mutated by client)");
              expect(html).toMatch("Child Server Action (mutated by client)");
            });

            test("child.clientAction/parent.childLoader/child.clientLoader", async ({
              page,
            }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: true,
                    parentClientLoaderHydrate: false,
                    childClientLoader: true,
                    childClientLoaderHydrate: false,
                    childAdditions: js`
                      export async function clientAction({ serverAction }) {
                        let data = await serverAction();
                        return {
                          message: data.message + " (mutated by client)"
                        }
                      }
                    `,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/parent/child");
              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader");
              expect(html).not.toMatch("Child Server Action");

              app.clickSubmitButton("/parent/child");
              await page.waitForSelector("#child-action-data");
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader"); // still revalidating
              expect(html).toMatch("Child Server Loader"); // still revalidating
              expect(html).toMatch("Child Server Action (mutated by client)");

              await page.waitForSelector(
                ':has-text("Child Server Loader (mutated by client)")',
              );
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader (mutated by client)");
              expect(html).toMatch("Child Server Loader (mutated by client)");
              expect(html).toMatch("Child Server Action (mutated by client)");
            });

            test("throws a 400 if you call serverAction without a server action", async ({
              page,
            }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: {
                    ...getFiles({
                      splitRouteModules,
                      parentClientLoader: false,
                      parentClientLoaderHydrate: false,
                      childClientLoader: false,
                      childClientLoaderHydrate: false,
                    }),
                    "app/routes/parent.child.tsx": js`
                      import * as React from 'react';
                      import { Form, useRouteError } from "react-router";
                      export async function clientAction({ serverAction }) {
                        return await serverAction();
                      }
                      export default function Component() {
                        return (
                          <Form method="post">
                            <button type="submit">Submit</button>
                          </Form>
                        );
                      }
                      export function ErrorBoundary() {
                        let error = useRouteError();
                        return <p id="child-error">{error.status} {error.data}</p>;
                      }
                    `,
                  },
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/parent/child");
              app.clickSubmitButton("/parent/child");
              await page.waitForSelector("#child-error");
              let html = await app.getHtml("#child-error");
              expect(html.replace(/\n/g, " ").replace(/ +/g, " ")).toMatch(
                "400 Error: You are trying to call serverAction() on a route that does " +
                  'not have a server action (routeId: "routes/parent.child")',
              );
            });
          });

          test.describe("clientAction - lazy route module", () => {
            test("child.clientAction", async ({ page }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: false,
                    parentClientLoaderHydrate: false,
                    childClientLoader: false,
                    childClientLoaderHydrate: false,
                    childAdditions: js`
                      export async function clientAction({ serverAction }) {
                        let data = await serverAction();
                        return {
                          message: data.message + " (mutated by client)"
                        }
                      }
                    `,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/");
              await app.clickLink("/parent/child");
              await page.waitForSelector("#child-data");
              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader");
              expect(html).not.toMatch("Child Server Action");

              app.clickSubmitButton("/parent/child");
              await page.waitForSelector("#child-action-data");
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader");
              expect(html).toMatch("Child Server Action (mutated by client)");
            });

            test("child.clientAction/parent.childLoader", async ({ page }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: true,
                    parentClientLoaderHydrate: false,
                    childClientLoader: false,
                    childClientLoaderHydrate: false,
                    childAdditions: js`
                      export async function clientAction({ serverAction }) {
                        let data = await serverAction();
                        return {
                          message: data.message + " (mutated by client)"
                        }
                      }
                    `,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/");
              await app.clickLink("/parent/child");
              await page.waitForSelector("#child-data");
              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader");
              expect(html).not.toMatch("Child Server Action");

              app.clickSubmitButton("/parent/child");
              await page.waitForSelector("#child-action-data");
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader"); // still revalidating
              expect(html).toMatch("Child Server Loader");
              expect(html).toMatch("Child Server Action (mutated by client)");

              await page.waitForSelector(
                ':has-text("Parent Server Loader (mutated by client)")',
              );
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader (mutated by client)");
              expect(html).toMatch("Child Server Loader");
              expect(html).toMatch("Child Server Action (mutated by client)");
            });

            test("child.clientAction/child.clientLoader", async ({ page }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: false,
                    parentClientLoaderHydrate: false,
                    childClientLoader: true,
                    childClientLoaderHydrate: false,
                    childAdditions: js`
                      export async function clientAction({ serverAction }) {
                        let data = await serverAction();
                        return {
                          message: data.message + " (mutated by client)"
                        }
                      }
                    `,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/");
              await app.clickLink("/parent/child");
              await page.waitForSelector("#child-data");
              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader");
              expect(html).not.toMatch("Child Server Action");

              app.clickSubmitButton("/parent/child");
              await page.waitForSelector("#child-action-data");
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader"); // still revalidating
              expect(html).toMatch("Child Server Loader");
              expect(html).toMatch("Child Server Action (mutated by client)");

              await page.waitForSelector(
                ':has-text("Child Server Loader (mutated by client)")',
              );
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader (mutated by client)");
              expect(html).toMatch("Child Server Action (mutated by client)");
            });

            test("child.clientAction/parent.childLoader/child.clientLoader", async ({
              page,
            }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: getFiles({
                    splitRouteModules,
                    parentClientLoader: true,
                    parentClientLoaderHydrate: false,
                    childClientLoader: true,
                    childClientLoaderHydrate: false,
                    childAdditions: js`
                      export async function clientAction({ serverAction }) {
                        let data = await serverAction();
                        return {
                          message: data.message + " (mutated by client)"
                        }
                      }
                    `,
                  }),
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/");
              await app.clickLink("/parent/child");
              await page.waitForSelector("#child-data");
              let html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader");
              expect(html).toMatch("Child Server Loader");
              expect(html).not.toMatch("Child Server Action");

              app.clickSubmitButton("/parent/child");
              await page.waitForSelector("#child-action-data");
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader"); // still revalidating
              expect(html).toMatch("Child Server Loader"); // still revalidating
              expect(html).toMatch("Child Server Action (mutated by client)");

              await page.waitForSelector(
                ':has-text("Child Server Loader (mutated by client)")',
              );
              html = await app.getHtml("main");
              expect(html).toMatch("Parent Server Loader (mutated by client)");
              expect(html).toMatch("Child Server Loader (mutated by client)");
              expect(html).toMatch("Child Server Action (mutated by client)");
            });

            test("throws a 400 if you call serverAction without a server action", async ({
              page,
            }) => {
              appFixture = await createAppFixture(
                await createFixture({
                  templateName,
                  files: {
                    ...getFiles({
                      splitRouteModules,
                      parentClientLoader: false,
                      parentClientLoaderHydrate: false,
                      childClientLoader: false,
                      childClientLoaderHydrate: false,
                    }),
                    "app/routes/parent.child.tsx": js`
                      import * as React from 'react';
                      import { Form, useRouteError } from "react-router";
                      export async function clientAction({ serverAction }) {
                        return await serverAction();
                      }
                      export default function Component() {
                        return (
                          <Form method="post">
                            <button type="submit">Submit</button>
                          </Form>
                        );
                      }
                      export function ErrorBoundary() {
                        let error = useRouteError();
                        return <p id="child-error">{error.status} {error.data}</p>;
                      }
                    `,
                  },
                }),
              );
              let app = new PlaywrightFixture(appFixture, page);
              await app.goto("/");
              await app.goto("/parent/child");
              await page.waitForSelector("form");
              app.clickSubmitButton("/parent/child");
              await page.waitForSelector("#child-error");
              let html = await app.getHtml("#child-error");
              expect(html.replace(/\n/g, " ").replace(/ +/g, " ")).toMatch(
                "400 Error: You are trying to call serverAction() on a route that does " +
                  'not have a server action (routeId: "routes/parent.child")',
              );
            });
          });
        });
      });
    });
  }
});
