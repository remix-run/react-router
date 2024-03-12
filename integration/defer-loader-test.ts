import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

test.describe("deferred loaders", () => {
  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/_index.tsx": js`
        import { useLoaderData, Link } from "@remix-run/react";
        export default function Index() {
          return (
            <div>
              <Link to="/redirect">Redirect</Link>
              <Link to="/direct-promise-access">Direct Promise Access</Link>
            </div>
          )
        }
      `,

        "app/routes/redirect.tsx": js`
        import { defer } from "@remix-run/node";
        export function loader() {
          return defer({food: "pizza"}, { status: 301, headers: { Location: "/?redirected" } });
        }
        export default function Redirect() {return null;}
      `,

        "app/routes/direct-promise-access.tsx": js`
        import * as React from "react";
        import { defer } from "@remix-run/node";
        import { useLoaderData, Link, Await } from "@remix-run/react";
        export function loader() {
          return defer({
            bar: new Promise(async (resolve, reject) => {
              resolve("hamburger");
            }),
          });
        }
        let count = 0;
        export default function Index() {
          let {bar} = useLoaderData();
          React.useEffect(() => {
            let aborted = false;
            bar.then((data) => {
              if (aborted) return;
              document.getElementById("content").innerHTML = data + " " + (++count);
              document.getElementById("content").setAttribute("data-done", "");
            });
            return () => {
              aborted = true;
            };
          }, [bar]);
          return (
            <div id="content">
              Waiting for client hydration....
            </div>
          )
        }
      `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(async () => appFixture.close());

  test("deferred response can redirect on document request", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/redirect");
    await page.waitForURL(/\?redirected/);
  });

  test("deferred response can redirect on transition", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickLink("/redirect");
    await page.waitForURL(/\?redirected/);
  });

  test("can directly access result from deferred promise on document request", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/direct-promise-access");
    let element = await page.waitForSelector("[data-done]");
    expect(await element.innerText()).toMatch("hamburger 1");
  });
});

// Duplicate suite of the tests above running with single fetch enabled
// TODO(v3): remove the above suite of tests and just keep these
test.describe("single fetch", () => {
  test.describe("deferred loaders", () => {
    test.beforeAll(async () => {
      fixture = await createFixture({
        config: {
          future: {
            unstable_singleFetch: true,
          },
        },
        files: {
          "app/routes/_index.tsx": js`
            import { useLoaderData, Link } from "@remix-run/react";
            export default function Index() {
              return (
                <div>
                  <Link to="/redirect">Redirect</Link>
                  <Link to="/direct-promise-access">Direct Promise Access</Link>
                </div>
              )
            }
          `,

          "app/routes/redirect.tsx": js`
            import { defer } from "@remix-run/node";
            export function loader() {
              return defer({food: "pizza"}, { status: 301, headers: { Location: "/?redirected" } });
            }
            export default function Redirect() {return null;}
          `,

          "app/routes/direct-promise-access.tsx": js`
            import * as React from "react";
            import { defer } from "@remix-run/node";
            import { useLoaderData, Link, Await } from "@remix-run/react";
            export function loader() {
              return defer({
                bar: new Promise(async (resolve, reject) => {
                  resolve("hamburger");
                }),
              });
            }
            let count = 0;
            export default function Index() {
              let {bar} = useLoaderData();
              React.useEffect(() => {
                let aborted = false;
                bar.then((data) => {
                  if (aborted) return;
                  document.getElementById("content").innerHTML = data + " " + (++count);
                  document.getElementById("content").setAttribute("data-done", "");
                });
                return () => {
                  aborted = true;
                };
              }, [bar]);
              return (
                <div id="content">
                  Waiting for client hydration....
                </div>
              )
            }
          `,
        },
      });

      appFixture = await createAppFixture(fixture);
    });

    test.afterAll(async () => appFixture.close());

    test("deferred response can redirect on document request", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/redirect");
      await page.waitForURL(/\?redirected/);
    });

    test("deferred response can redirect on transition", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/redirect");
      await page.waitForURL(/\?redirected/);
    });

    test("can directly access result from deferred promise on document request", async ({
      page,
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/direct-promise-access");
      let element = await page.waitForSelector("[data-done]");
      expect(await element.innerText()).toMatch("hamburger 1");
    });
  });
});
