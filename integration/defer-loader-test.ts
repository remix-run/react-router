import { test, expect } from "@playwright/test";

import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { PlaywrightFixture } from "./helpers/playwright-fixture";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeAll(async () => {
  fixture = await createFixture({
    config: {
      future: { v2_routeConvention: true },
    },
    files: {
      "app/routes/_index.jsx": js`
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

      "app/routes/redirect.jsx": js`
        import { defer } from "@remix-run/node";
        export function loader() {
          return defer({food: "pizza"}, { status: 301, headers: { Location: "/?redirected" } });
        }
        export default function Redirect() {return null;}
      `,

      "app/routes/direct-promise-access.jsx": js`
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

test("deferred response can redirect on document request", async ({ page }) => {
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
