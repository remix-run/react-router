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
          import { useLoaderData, Link } from "react-router";
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
          import { data } from 'react-router';
          export function loader() {
            return data(
              { food: "pizza" },
              {
                status: 301,
                headers: {
                  Location: "/?redirected"
                }
              }
            );
          }
          export default function Redirect() {
            return null;
          }
        `,

        "app/routes/direct-promise-access.tsx": js`
          import * as React from "react";
          import { useLoaderData, Link, Await } from "react-router";
          export function loader() {
            return {
              bar: new Promise(async (resolve, reject) => {
                resolve("hamburger");
              }),
            };
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
