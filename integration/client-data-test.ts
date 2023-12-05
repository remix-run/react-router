import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

function getFiles({
  parentClientLoader,
  parentClientLoaderHydrate,
  parentAdditions,
  childClientLoader,
  childClientLoaderHydrate,
  childAdditions,
}: {
  parentClientLoader: boolean;
  parentClientLoaderHydrate: boolean;
  parentAdditions?: string;
  childClientLoader: boolean;
  childClientLoaderHydrate: boolean;
  childAdditions?: string;
}) {
  return {
    "app/root.tsx": js`
      import { Outlet, Scripts } from '@remix-run/react'

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
      import { Link } from '@remix-run/react'
      export default function Component() {
        return <Link to="/parent/child">Go to /parent/child</Link>
      }
    `,
    "app/routes/parent.tsx": js`
      import { json } from '@remix-run/node'
      import { Outlet, useLoaderData } from '@remix-run/react'
      export function loader() {
        return json({ message: 'Parent Server Loader'});
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
      import { json } from '@remix-run/node'
      import { Form, Outlet, useActionData, useLoaderData } from '@remix-run/react'
      export function loader() {
        return json({ message: 'Child Server Loader'});
      }
      export function action() {
        return json({ message: 'Child Server Action'});
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

test.describe("Client Data", () => {
  let appFixture: AppFixture;

  test.afterAll(() => {
    appFixture.close();
  });

  test.describe("clientLoader - critical route module", () => {
    test("no client loaders or fallbacks", async ({ page }) => {
      appFixture = await createAppFixture(
        await createFixture({
          files: getFiles({
            parentClientLoader: false,
            parentClientLoaderHydrate: false,
            childClientLoader: false,
            childClientLoaderHydrate: false,
          }),
        })
      );
      let app = new PlaywrightFixture(appFixture, page);

      // Full SSR - normal Remix behavior due to lack of clientLoader
      await app.goto("/parent/child");
      let html = await app.getHtml("main");
      expect(html).toMatch("Parent Server Loader");
      expect(html).toMatch("Child Server Loader");
    });

    test("parent.clientLoader/child.clientLoader", async ({ page }) => {
      appFixture = await createAppFixture(
        await createFixture({
          files: getFiles({
            parentClientLoader: true,
            parentClientLoaderHydrate: false,
            childClientLoader: true,
            childClientLoaderHydrate: false,
          }),
        })
      );
      let app = new PlaywrightFixture(appFixture, page);

      // Full SSR - normal Remix behavior due to lack of HydrateFallback components
      await app.goto("/parent/child");
      let html = await app.getHtml("main");
      expect(html).toMatch("Parent Server Loader");
      expect(html).toMatch("Child Server Loader");
    });

    test("parent.clientLoader.hydrate/child.clientLoader", async ({ page }) => {
      appFixture = await createAppFixture(
        await createFixture({
          files: getFiles({
            parentClientLoader: true,
            parentClientLoaderHydrate: true,
            childClientLoader: true,
            childClientLoaderHydrate: false,
          }),
        })
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

    test("parent.clientLoader/child.clientLoader.hydrate", async ({ page }) => {
      appFixture = await createAppFixture(
        await createFixture({
          files: getFiles({
            parentClientLoader: true,
            parentClientLoaderHydrate: false,
            childClientLoader: true,
            childClientLoaderHydrate: true,
          }),
        })
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
          files: getFiles({
            parentClientLoader: true,
            parentClientLoaderHydrate: true,
            childClientLoader: true,
            childClientLoaderHydrate: true,
          }),
        })
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
        files: getFiles({
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

      // Ensure we SSR the fallbacks
      let doc = await fixture.requestDocument("/parent/child");
      let html = await doc.text();
      expect(html).toMatch("Parent Fallback");

      appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/parent/child");
      await page.waitForSelector("#child-data");
      html = await app.getHtml("main");
      expect(html).toMatch("Parent Client Loader");
      expect(html).toMatch("Child Client Loader");
    });

    test("handles deferred data through client loaders", async ({ page }) => {
      let fixture = await createFixture({
        files: {
          ...getFiles({
            parentClientLoader: false,
            parentClientLoaderHydrate: false,
            childClientLoader: false,
            childClientLoaderHydrate: false,
          }),
          // Blow away parent.child.tsx with our own deferred version
          "app/routes/parent.child.tsx": js`
            import * as React from 'react';
            import { defer, json } from '@remix-run/node'
            import { Await, useLoaderData } from '@remix-run/react'
            export function loader() {
              return defer({
                message: 'Child Server Loader',
                lazy: new Promise(r => setTimeout(() => r("Child Deferred Data"), 1000)),
              });
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

      // Ensure initial document request contains the child fallback _and_ the
      // subsequent streamed/resolved deferred data
      let doc = await fixture.requestDocument("/parent/child");
      let html = await doc.text();
      expect(html).toMatch("Parent Server Loader");
      expect(html).toMatch("Child Fallback");
      expect(html).toMatch("Child Deferred Data");

      appFixture = await createAppFixture(fixture);
      let app = new PlaywrightFixture(appFixture, page);

      await app.goto("/parent/child");
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
        files: getFiles({
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

    test("clientLoader.hydrate is automatically implied when no server loader exists", async ({
      page,
    }) => {
      appFixture = await createAppFixture(
        await createFixture({
          files: {
            ...getFiles({
              parentClientLoader: false,
              parentClientLoaderHydrate: false,
              childClientLoader: false,
              childClientLoaderHydrate: false,
            }),
            // Blow away parent.child.tsx with our own version without a server loader
            "app/routes/parent.child.tsx": js`
              import * as React from 'react';
              import { useLoaderData } from '@remix-run/react';
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
        })
      );
      let app = new PlaywrightFixture(appFixture, page);

      await app.goto("/parent/child");
      let html = await app.getHtml("main");
      expect(html).toMatch("Child Fallback");
      await page.waitForSelector("#child-data");
      html = await app.getHtml("main");
      expect(html).toMatch("Loader Data (clientLoader only)");
    });
  });

  test.describe("clientLoader - lazy route module", () => {
    test("no client loaders or fallbacks", async ({ page }) => {
      appFixture = await createAppFixture(
        await createFixture({
          files: getFiles({
            parentClientLoader: false,
            parentClientLoaderHydrate: false,
            childClientLoader: false,
            childClientLoaderHydrate: false,
          }),
        })
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
          files: getFiles({
            parentClientLoader: true,
            parentClientLoaderHydrate: false,
            childClientLoader: false,
            childClientLoaderHydrate: false,
          }),
        })
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
          files: getFiles({
            parentClientLoader: false,
            parentClientLoaderHydrate: false,
            childClientLoader: true,
            childClientLoaderHydrate: false,
          }),
        })
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
          files: getFiles({
            parentClientLoader: true,
            parentClientLoaderHydrate: false,
            childClientLoader: true,
            childClientLoaderHydrate: false,
          }),
        })
      );
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/parent/child");
      await page.waitForSelector("#child-data");

      let html = await app.getHtml("main");
      expect(html).toMatch("Parent Server Loader (mutated by client)");
      expect(html).toMatch("Child Server Loader (mutated by client");
    });
  });

  test.describe("clientAction - critical route module", () => {
    test("child.clientAction", async ({ page }) => {
      appFixture = await createAppFixture(
        await createFixture({
          files: getFiles({
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
        })
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
          files: getFiles({
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
        })
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
        ':has-text("Parent Server Loader (mutated by client)")'
      );
      html = await app.getHtml("main");
      expect(html).toMatch("Parent Server Loader (mutated by client)");
      expect(html).toMatch("Child Server Loader");
      expect(html).toMatch("Child Server Action (mutated by client)");
    });

    test("child.clientAction/child.clientLoader", async ({ page }) => {
      appFixture = await createAppFixture(
        await createFixture({
          files: getFiles({
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
        })
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
        ':has-text("Child Server Loader (mutated by client)")'
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
          files: getFiles({
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
        })
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
        ':has-text("Child Server Loader (mutated by client)")'
      );
      html = await app.getHtml("main");
      expect(html).toMatch("Parent Server Loader (mutated by client)");
      expect(html).toMatch("Child Server Loader (mutated by client)");
      expect(html).toMatch("Child Server Action (mutated by client)");
    });
  });

  test.describe("clientAction - lazy route module", () => {
    test("child.clientAction", async ({ page }) => {
      appFixture = await createAppFixture(
        await createFixture({
          files: getFiles({
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
        })
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
          files: getFiles({
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
        })
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
        ':has-text("Parent Server Loader (mutated by client)")'
      );
      html = await app.getHtml("main");
      expect(html).toMatch("Parent Server Loader (mutated by client)");
      expect(html).toMatch("Child Server Loader");
      expect(html).toMatch("Child Server Action (mutated by client)");
    });

    test("child.clientAction/child.clientLoader", async ({ page }) => {
      appFixture = await createAppFixture(
        await createFixture({
          files: getFiles({
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
        })
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
        ':has-text("Child Server Loader (mutated by client)")'
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
          files: getFiles({
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
        })
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
        ':has-text("Child Server Loader (mutated by client)")'
      );
      html = await app.getHtml("main");
      expect(html).toMatch("Parent Server Loader (mutated by client)");
      expect(html).toMatch("Child Server Loader (mutated by client)");
      expect(html).toMatch("Child Server Action (mutated by client)");
    });
  });
});
