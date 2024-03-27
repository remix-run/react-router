import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("Revalidation", () => {
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    appFixture = await createAppFixture(
      await createFixture({
        files: {
          "app/root.tsx": js`
            import { Link, Outlet, Scripts, useNavigation } from "@remix-run/react";

            export default function Component() {
              let navigation = useNavigation();
              return (
                <html>
                  <head />
                  <body>
                    <nav>
                      {navigation.state === 'idle' ?
                        <p id="idle">Idle</p> :
                        <p id="busy">Busy</p>}
                      <ul>
                        <li><Link to="/">/</Link></li>
                        <li><Link to="/parent">/parent</Link></li>
                        <li><Link to="/parent/child">/parent/child</Link></li>
                        <li><Link to="/parent/child?revalidate=parent">/parent/child</Link></li>
                        <li><Link to="/parent/child?revalidate=child">/parent/child</Link></li>
                        <li><Link to="/parent/child?revalidate=parent,child">/parent/child</Link></li>
                      </ul>
                    </nav>
                    <Outlet />
                    <Scripts />
                  </body>
                </html>
              );
            }
          `,

          "app/routes/parent.tsx": js`
            import { json } from "@remix-run/node";
            import { Outlet, useLoaderData } from "@remix-run/react";

            export async function loader({ request }) {
              let header = request.headers.get('Cookie') || '';
              let cookie = header
                .split(';')
                .map(c => c.trim())
                .find(c => c.startsWith('parent='))
              let strValue = (cookie || 'parent=0').split("=")[1];
              let value = parseInt(strValue, 10) + 1;
              return json({ value }, {
                headers: {
                  "Set-Cookie": "parent=" + value,
                }
              })
            };

            export function shouldRevalidate({ nextUrl, formData }) {
              if (nextUrl.searchParams.get('revalidate')?.split(',')?.includes('parent')) {
                return true;
              }
              if (formData?.getAll('revalidate')?.includes('parent')) {
                return true;
              }
              return false
            }

            export default function Component() {
              let data = useLoaderData();
              return (
                <>
                  <p id="parent-data">{'Value:' + data.value}</p>
                  <Outlet />
                </>
              );
            }
          `,

          "app/routes/parent.child.tsx": js`
            import { json } from "@remix-run/node";
            import { Form, useLoaderData, useRevalidator } from "@remix-run/react";

            export async function action() {
              return json({ action: 'data' })
            }

            export async function loader({ request }) {
              let header = request.headers.get('Cookie') || '';
              let cookie = header
                .split(';')
                .map(c => c.trim())
                .find(c => c.startsWith('child='))
              let strValue = (cookie || 'child=0').split("=")[1];
              let value = parseInt(strValue, 10) + 1;
              return json({ value }, {
                headers: {
                  "Set-Cookie": "child=" + value,
                }
              })
            };

            export function shouldRevalidate({ nextUrl, formData }) {
              let revalidate = (nextUrl.searchParams.get('revalidate') || '').split(',')
              if (revalidate.includes('child')) {
                return true;
              }
              if (formData?.getAll('revalidate')?.includes('child')) {
                return true;
              }
              return false
            }

            export default function Component() {
              let data = useLoaderData();
              let revalidator = useRevalidator();
              return (
                <>
                  <p id="child-data">{'Value:' + data.value}</p>
                  <Form method="post" action=".">
                    <input type="hidden" name="revalidate" value="" />
                    <button type="submit" id="submit-neither">Submit and revalidate neither</button>
                  </Form>
                  <Form method="post" action=".">
                    <input type="hidden" name="revalidate" value="parent" />
                    <button type="submit" id="submit-parent">Submit and revalidate parent</button>
                  </Form>
                  <Form method="post" action=".">
                    <input type="hidden" name="revalidate" value="child" />
                    <button type="submit" id="submit-child">Submit and revalidate child</button>
                  </Form>
                  <Form method="post" action=".">
                    <input type="hidden" name="revalidate" value="parent" />
                    <input type="hidden" name="revalidate" value="child" />
                    <button type="submit" id="submit-both">Submit and revalidate both</button>
                  </Form>
                  {revalidator.state === 'idle' ?
                    <p id="revalidation-idle">Revalidation idle</p> :
                    <p id="revalidation-busy">Revalidation busy</p>}
                  <button id="revalidate" onClick={() => revalidator.revalidate()}>
                    Revalidate
                  </button>
                </>
              );
            }
          `,
        },
      })
    );
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("Revalidates according to shouldRevalidate (loading navigations)", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);

    // Should call parent (first load)
    await app.clickLink("/parent");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#parent-data")).toMatch("Value:1");

    // Should call child (first load) but not parent (no param)
    await app.clickLink("/parent/child");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#parent-data")).toMatch("Value:1");
    expect(await app.getHtml("#child-data")).toMatch("Value:1");

    // Should call neither
    await app.clickLink("/parent/child");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#parent-data")).toMatch("Value:1");
    expect(await app.getHtml("#child-data")).toMatch("Value:1");

    // Should call both
    await app.clickLink("/parent/child?revalidate=parent,child");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#parent-data")).toMatch("Value:2");
    expect(await app.getHtml("#child-data")).toMatch("Value:2");

    // Should call parent only
    await app.clickLink("/parent/child?revalidate=parent");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#parent-data")).toMatch("Value:3");
    expect(await app.getHtml("#child-data")).toMatch("Value:2");

    // Should call child only
    await app.clickLink("/parent/child?revalidate=child");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#parent-data")).toMatch("Value:3");
    expect(await app.getHtml("#child-data")).toMatch("Value:3");
  });

  test("Revalidates according to shouldRevalidate (submission navigations)", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);

    // Should call both (first load)
    await app.clickLink("/parent/child");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#parent-data")).toMatch("Value:1");
    expect(await app.getHtml("#child-data")).toMatch("Value:1");

    // Should call neither
    await app.clickElement("#submit-neither");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#parent-data")).toMatch("Value:1");
    expect(await app.getHtml("#child-data")).toMatch("Value:1");

    // Should call both
    await app.clickElement("#submit-both");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#parent-data")).toMatch("Value:2");
    expect(await app.getHtml("#child-data")).toMatch("Value:2");

    // Should call parent only
    await app.clickElement("#submit-parent");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#parent-data")).toMatch("Value:3");
    expect(await app.getHtml("#child-data")).toMatch("Value:2");

    // Should call child only
    await app.clickElement("#submit-child");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#parent-data")).toMatch("Value:3");
    expect(await app.getHtml("#child-data")).toMatch("Value:3");
  });

  test("Revalidates on demand with useRevalidator", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);

    // Should call both (first load)
    await app.clickLink("/parent/child");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#parent-data")).toMatch("Value:1");
    expect(await app.getHtml("#child-data")).toMatch("Value:1");

    // Should call neither on manual revalidate (no params)
    await app.clickElement("#revalidate");
    await page.waitForSelector("#revalidation-idle", { state: "visible" });
    expect(await app.getHtml("#parent-data")).toMatch("Value:1");
    expect(await app.getHtml("#child-data")).toMatch("Value:1");

    // Should call both
    await app.clickLink("/parent/child?revalidate=parent,child");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#parent-data")).toMatch("Value:2");
    expect(await app.getHtml("#child-data")).toMatch("Value:2");

    // Should call both on manual revalidate
    await app.clickElement("#revalidate");
    await page.waitForSelector("#revalidation-idle", { state: "visible" });
    expect(await app.getHtml("#parent-data")).toMatch("Value:3");
    expect(await app.getHtml("#child-data")).toMatch("Value:3");

    // Should call parent only
    await app.clickLink("/parent/child?revalidate=parent");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#parent-data")).toMatch("Value:4");
    expect(await app.getHtml("#child-data")).toMatch("Value:3");

    // Should call parent only on manual revalidate
    await app.clickElement("#revalidate");
    await page.waitForSelector("#revalidation-idle", { state: "visible" });
    expect(await app.getHtml("#parent-data")).toMatch("Value:5");
    expect(await app.getHtml("#child-data")).toMatch("Value:3");

    // Should call child only
    await app.clickLink("/parent/child?revalidate=child");
    await page.waitForSelector("#idle");
    expect(await app.getHtml("#parent-data")).toMatch("Value:5");
    expect(await app.getHtml("#child-data")).toMatch("Value:4");

    // Should call child only on manual revalidate
    await app.clickElement("#revalidate");
    await page.waitForSelector("#revalidation-idle", { state: "visible" });
    expect(await app.getHtml("#parent-data")).toMatch("Value:5");
    expect(await app.getHtml("#child-data")).toMatch("Value:5");
  });
});

// Duplicate suite of the tests above running with single fetch enabled
// TODO(v3): remove the above suite of tests and just keep these
test.describe("single fetch", () => {
  test.describe("Revalidation", () => {
    let appFixture: AppFixture;

    test.beforeAll(async () => {
      appFixture = await createAppFixture(
        await createFixture({
          config: {
            future: {
              unstable_singleFetch: true,
            },
          },
          files: {
            "app/root.tsx": js`
              import { Link, Outlet, Scripts, useNavigation } from "@remix-run/react";

              export default function Component() {
                let navigation = useNavigation();
                return (
                  <html>
                    <head />
                    <body>
                      <nav>
                        {navigation.state === 'idle' ?
                          <p id="idle">Idle</p> :
                          <p id="busy">Busy</p>}
                        <ul>
                          <li><Link to="/">/</Link></li>
                          <li><Link to="/parent">/parent</Link></li>
                          <li><Link to="/parent/child">/parent/child</Link></li>
                          <li><Link to="/parent/child?revalidate=parent">/parent/child?revalidate=parent</Link></li>
                          <li><Link to="/parent/child?revalidate=child">/parent/child?revalidate=child</Link></li>
                          <li><Link to="/parent/child?revalidate=parent,child">/parent/child?revalidate=parent,child</Link></li>
                        </ul>
                      </nav>
                      <Outlet />
                      <Scripts />
                    </body>
                  </html>
                );
              }
            `,

            "app/routes/parent.tsx": js`
              import { json } from "@remix-run/node";
              import { Outlet, useLoaderData } from "@remix-run/react";

              export async function loader({ request }) {
                let header = request.headers.get('Cookie') || '';
                let cookie = header
                  .split(';')
                  .map(c => c.trim())
                  .find(c => c.startsWith('parent='))
                let strValue = (cookie || 'parent=0').split("=")[1];
                let value = parseInt(strValue, 10) + 1;
                return json({ value }, {
                  headers: {
                    "Set-Cookie": "parent=" + value,
                  }
                })
              };

              export function shouldRevalidate({ nextUrl, formData }) {
                if (nextUrl.searchParams.get('revalidate')?.split(',')?.includes('parent')) {
                  return true;
                }
                if (formData?.getAll('revalidate')?.includes('parent')) {
                  return true;
                }
                return false
              }

              export default function Component() {
                let data = useLoaderData();
                return (
                  <>
                    <p id="parent-data">{'Value:' + data.value}</p>
                    <Outlet />
                  </>
                );
              }
            `,

            "app/routes/parent.child.tsx": js`
              import { json } from "@remix-run/node";
              import { Form, useLoaderData, useRevalidator } from "@remix-run/react";

              export async function action() {
                return json({ action: 'data' })
              }

              export async function loader({ request }) {
                let header = request.headers.get('Cookie') || '';
                let cookie = header
                  .split(';')
                  .map(c => c.trim())
                  .find(c => c.startsWith('child='))
                let strValue = (cookie || 'child=0').split("=")[1];
                let value = parseInt(strValue, 10) + 1;
                return json({ value }, {
                  headers: {
                    "Set-Cookie": "child=" + value,
                  }
                })
              };

              export function shouldRevalidate({ nextUrl, formData }) {
                let revalidate = (nextUrl.searchParams.get('revalidate') || '').split(',')
                if (revalidate.includes('child')) {
                  return true;
                }
                if (formData?.getAll('revalidate')?.includes('child')) {
                  return true;
                }
                return false
              }

              export default function Component() {
                let data = useLoaderData();
                let revalidator = useRevalidator();
                return (
                  <>
                    <p id="child-data">{'Value:' + data.value}</p>
                    <Form method="post" action=".">
                      <input type="hidden" name="revalidate" value="" />
                      <button type="submit" id="submit-neither">Submit and revalidate neither</button>
                    </Form>
                    <Form method="post" action=".">
                      <input type="hidden" name="revalidate" value="parent" />
                      <button type="submit" id="submit-parent">Submit and revalidate parent</button>
                    </Form>
                    <Form method="post" action=".">
                      <input type="hidden" name="revalidate" value="child" />
                      <button type="submit" id="submit-child">Submit and revalidate child</button>
                    </Form>
                    <Form method="post" action=".">
                      <input type="hidden" name="revalidate" value="parent" />
                      <input type="hidden" name="revalidate" value="child" />
                      <button type="submit" id="submit-both">Submit and revalidate both</button>
                    </Form>
                    {revalidator.state === 'idle' ?
                      <p id="revalidation-idle">Revalidation idle</p> :
                      <p id="revalidation-busy">Revalidation busy</p>}
                    <button id="revalidate" onClick={() => revalidator.revalidate()}>
                      Revalidate
                    </button>
                  </>
                );
              }
            `,
          },
        })
      );
    });

    test.afterAll(() => {
      appFixture.close();
    });

    test("Revalidates according to shouldRevalidate (loading navigations)", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);

      // Should call parent (first load)
      await app.clickLink("/parent");
      await page.waitForSelector("#idle");
      expect(await app.getHtml("#parent-data")).toMatch("Value:1");

      // Should call child (first load) but not parent (no param)
      await app.clickLink("/parent/child");
      await page.waitForSelector("#idle");
      expect(await app.getHtml("#parent-data")).toMatch("Value:1");
      expect(await app.getHtml("#child-data")).toMatch("Value:1");

      // Should call neither
      await app.clickLink("/parent/child");
      await page.waitForSelector("#idle");
      expect(await app.getHtml("#parent-data")).toMatch("Value:1");
      expect(await app.getHtml("#child-data")).toMatch("Value:1");

      // Should call both
      await app.clickLink("/parent/child?revalidate=parent,child");
      await page.waitForSelector("#idle");
      expect(await app.getHtml("#parent-data")).toMatch("Value:2");
      expect(await app.getHtml("#child-data")).toMatch("Value:2");

      // Should call parent only
      await app.clickLink("/parent/child?revalidate=parent");
      await page.waitForSelector("#idle");
      expect(await app.getHtml("#parent-data")).toMatch("Value:3");
      expect(await app.getHtml("#child-data")).toMatch("Value:2");

      // Should call child only
      await app.clickLink("/parent/child?revalidate=child");
      await page.waitForSelector("#idle");
      expect(await app.getHtml("#parent-data")).toMatch("Value:3");
      expect(await app.getHtml("#child-data")).toMatch("Value:3");
    });

    test("Revalidates according to shouldRevalidate (submission navigations)", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);

      // Should call both (first load)
      await app.clickLink("/parent/child");
      await page.waitForSelector("#idle");
      expect(await app.getHtml("#parent-data")).toMatch("Value:1");
      expect(await app.getHtml("#child-data")).toMatch("Value:1");

      // Should call neither
      await app.clickElement("#submit-neither");
      await page.waitForSelector("#idle");
      expect(await app.getHtml("#parent-data")).toMatch("Value:1");
      expect(await app.getHtml("#child-data")).toMatch("Value:1");

      // Should call both
      await app.clickElement("#submit-both");
      await page.waitForSelector("#idle");
      expect(await app.getHtml("#parent-data")).toMatch("Value:2");
      expect(await app.getHtml("#child-data")).toMatch("Value:2");

      // Should call parent only
      await app.clickElement("#submit-parent");
      await page.waitForSelector("#idle");
      expect(await app.getHtml("#parent-data")).toMatch("Value:3");
      expect(await app.getHtml("#child-data")).toMatch("Value:2");

      // Should call child only
      await app.clickElement("#submit-child");
      await page.waitForSelector("#idle");
      expect(await app.getHtml("#parent-data")).toMatch("Value:3");
      expect(await app.getHtml("#child-data")).toMatch("Value:3");
    });

    test("Revalidates on demand with useRevalidator", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);

      // Should call both (first load)
      await app.clickLink("/parent/child");
      await page.waitForSelector("#idle");
      expect(await app.getHtml("#parent-data")).toMatch("Value:1");
      expect(await app.getHtml("#child-data")).toMatch("Value:1");

      // Should call neither on manual revalidate (no params)
      await app.clickElement("#revalidate");
      await page.waitForSelector("#revalidation-idle", { state: "visible" });
      expect(await app.getHtml("#parent-data")).toMatch("Value:1");
      expect(await app.getHtml("#child-data")).toMatch("Value:1");

      // Should call both
      await app.clickLink("/parent/child?revalidate=parent,child");
      await page.waitForSelector("#idle");
      expect(await app.getHtml("#parent-data")).toMatch("Value:2");
      expect(await app.getHtml("#child-data")).toMatch("Value:2");

      // Should call both on manual revalidate
      await app.clickElement("#revalidate");
      await page.waitForSelector("#revalidation-idle", { state: "visible" });
      expect(await app.getHtml("#parent-data")).toMatch("Value:3");
      expect(await app.getHtml("#child-data")).toMatch("Value:3");

      // Should call parent only
      await app.clickLink("/parent/child?revalidate=parent");
      await page.waitForSelector("#idle");
      expect(await app.getHtml("#parent-data")).toMatch("Value:4");
      expect(await app.getHtml("#child-data")).toMatch("Value:3");

      // Should call parent only on manual revalidate
      await app.clickElement("#revalidate");
      await page.waitForSelector("#revalidation-idle", { state: "visible" });
      expect(await app.getHtml("#parent-data")).toMatch("Value:5");
      expect(await app.getHtml("#child-data")).toMatch("Value:3");

      // Should call child only
      await app.clickLink("/parent/child?revalidate=child");
      await page.waitForSelector("#idle");
      expect(await app.getHtml("#parent-data")).toMatch("Value:5");
      expect(await app.getHtml("#child-data")).toMatch("Value:4");

      // Should call child only on manual revalidate
      await app.clickElement("#revalidate");
      await page.waitForSelector("#revalidation-idle", { state: "visible" });
      expect(await app.getHtml("#parent-data")).toMatch("Value:5");
      expect(await app.getHtml("#child-data")).toMatch("Value:5");
    });
  });
});
