import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes/_index.tsx": js`
        import { json } from "@remix-run/node";
        import { Form, useLoaderData, useActionData } from "@remix-run/react";

        async function requestToJson(request) {
          let body = null;

          if (request.body) {
            let fd = await request.formData();
            body = Object.fromEntries(fd.entries());
          }

          return json({
            method: request.method,
            url: request.url,
            headers: Object.fromEntries(request.headers.entries()),
            body,
          });
        }
        export async function loader({ request }) {
          return requestToJson(request);
        }
        export function action({ request }) {
          return requestToJson(request);
        }
        export default function Index() {
          let loaderData = useLoaderData();
          let actionData = useActionData();
          return (
            <div>
              <button id="set-cookie" onClick={() => {
                document.cookie = 'cookie=nomnom; path=/';
              }}>
                Set Cookie
              </button>
              <Form method="get" reloadDocument>
                <button type="submit" id="submit-get-ssr" name="type" value="ssr">
                  SSR GET
                </button>
              </Form>
              <Form method="get">
                <button type="submit" id="submit-get-csr" name="type" value="csr">
                  CSR GET
                </button>
              </Form>
              <Form method="post" reloadDocument>
                <button type="submit" id="submit-post-ssr" name="type" value="ssr">
                  SSR POST
                </button>
              </Form>
              <Form method="post">
                <button type="submit" id="submit-post-csr" name="type" value="csr">
                  CSR POST
                </button>
              </Form>
              <pre id="loader-data">{JSON.stringify(loaderData)}</pre>
              {actionData ?
                <pre id="action-data">{JSON.stringify(actionData)}</pre> :
                null}
            </div>
          )
        }
      `,
    },
  });

  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => appFixture.close());

test("loader request on SSR GET requests", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");
  await app.clickElement("#set-cookie");

  let loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
  expect(loaderData.method).toEqual("GET");
  expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
  expect(loaderData.headers.cookie).toEqual(undefined);
  expect(loaderData.body).toEqual(null);

  await app.clickElement("#submit-get-ssr");

  loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
  expect(loaderData.method).toEqual("GET");
  expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/\?type=ssr$/);
  expect(loaderData.headers.cookie).toEqual("cookie=nomnom");
  expect(loaderData.body).toEqual(null);
});

test("loader request on CSR GET requests", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");
  await app.clickElement("#set-cookie");

  let loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
  expect(loaderData.method).toEqual("GET");
  expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
  expect(loaderData.headers.cookie).toEqual(undefined);
  expect(loaderData.body).toEqual(null);

  await app.clickElement("#submit-get-csr");

  loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
  expect(loaderData.method).toEqual("GET");
  expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/\?type=csr$/);
  expect(loaderData.headers.cookie).toEqual("cookie=nomnom");
  expect(loaderData.body).toEqual(null);
});

test("action + loader requests SSR POST requests", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");
  await app.clickElement("#set-cookie");

  let loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
  expect(loaderData.method).toEqual("GET");
  expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
  expect(loaderData.headers.cookie).toEqual(undefined);
  expect(loaderData.body).toEqual(null);

  await app.clickElement("#submit-post-ssr");

  let actionData = JSON.parse(await page.locator("#action-data").innerHTML());
  expect(actionData.method).toEqual("POST");
  expect(actionData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
  expect(actionData.headers.cookie).toEqual("cookie=nomnom");
  expect(actionData.body).toEqual({ type: "ssr" });

  loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
  expect(loaderData.method).toEqual("GET");
  expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
  expect(loaderData.headers.cookie).toEqual("cookie=nomnom");
  expect(loaderData.body).toEqual(null);
});

test("action + loader requests on CSR POST requests", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");
  await app.clickElement("#set-cookie");

  let loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
  expect(loaderData.method).toEqual("GET");
  expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
  expect(loaderData.headers.cookie).toEqual(undefined);
  expect(loaderData.body).toEqual(null);

  await app.clickElement("#submit-post-csr");

  let actionData = JSON.parse(await page.locator("#action-data").innerHTML());
  expect(actionData.method).toEqual("POST");
  expect(actionData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
  expect(actionData.headers.cookie).toEqual("cookie=nomnom");
  expect(actionData.body).toEqual({ type: "csr" });

  loaderData = JSON.parse(await page.locator("#loader-data").innerHTML());
  expect(loaderData.method).toEqual("GET");
  expect(loaderData.url).toMatch(/^http:\/\/localhost:\d+\/$/);
  expect(loaderData.headers.cookie).toEqual("cookie=nomnom");
  expect(loaderData.body).toEqual(null);
});
