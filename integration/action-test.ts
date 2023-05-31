import { test, expect } from "@playwright/test";

import { createFixture, createAppFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { PlaywrightFixture, selectHtml } from "./helpers/playwright-fixture";

test.describe("actions", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  let FIELD_NAME = "message";
  let WAITING_VALUE = "Waiting...";
  let SUBMITTED_VALUE = "Submission";
  let THROWS_REDIRECT = "redirect-throw";
  let REDIRECT_TARGET = "page";
  let PAGE_TEXT = "PAGE_TEXT";

  test.beforeAll(async () => {
    fixture = await createFixture({
      config: {
        future: {
          v2_routeConvention: true,
          v2_errorBoundary: true,
          v2_normalizeFormMethod: true,
        },
      },
      files: {
        "app/routes/urlencoded.jsx": js`
          import { Form, useActionData } from "@remix-run/react";

          export let action = async ({ request }) => {
            let formData = await request.formData();
            return formData.get("${FIELD_NAME}");
          };

          export default function Actions() {
            let data = useActionData()

            return (
              <Form method="post" id="form">
                <p id="text">
                  {data ? <span id="action-text">{data}</span> : "${WAITING_VALUE}"}
                </p>
                <p>
                  <input type="text" defaultValue="${SUBMITTED_VALUE}" name="${FIELD_NAME}" />
                  <button type="submit" id="submit">Go</button>
                </p>
              </Form>
            );
          }
        `,

        "app/routes/request-text.jsx": js`
          import { Form, useActionData } from "@remix-run/react";

          export let action = async ({ request }) => {
            let text = await request.text();
            return text;
          };

          export default function Actions() {
            let data = useActionData()

            return (
              <Form method="post" id="form">
                <p id="text">
                  {data ? <span id="action-text">{data}</span> : "${WAITING_VALUE}"}
                </p>
                <p>
                  <input name="a" defaultValue="1" />
                  <input name="b" defaultValue="2" />
                  <button type="submit" id="submit">Go</button>
                </p>
              </Form>
            );
          }
        `,

        [`app/routes/${THROWS_REDIRECT}.jsx`]: js`
          import { redirect } from "@remix-run/node";
          import { Form } from "@remix-run/react";

          export function action() {
            throw redirect("/${REDIRECT_TARGET}")
          }

          export default function () {
            return (
              <Form method="post">
                <button type="submit">Go</button>
              </Form>
            )
          }
        `,

        [`app/routes/${REDIRECT_TARGET}.jsx`]: js`
          export default function () {
            return <div id="${REDIRECT_TARGET}">${PAGE_TEXT}</div>
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  let logs: string[] = [];

  test.beforeEach(({ page }) => {
    page.on("console", (msg) => {
      let text = msg.text();
      if (!/DEPRECATED.*imagesizes.*imagesrcset/.test(text)) {
        logs.push(text);
      }
    });
  });

  test.afterEach(() => {
    expect(logs).toHaveLength(0);
  });

  test("is not called on document GET requests", async () => {
    let res = await fixture.requestDocument("/urlencoded");
    let html = selectHtml(await res.text(), "#text");
    expect(html).toMatch(WAITING_VALUE);
  });

  test("is called on document POST requests", async () => {
    let FIELD_VALUE = "cheeseburger";

    let params = new URLSearchParams();
    params.append(FIELD_NAME, FIELD_VALUE);

    let res = await fixture.postDocument("/urlencoded", params);

    let html = selectHtml(await res.text(), "#text");
    expect(html).toMatch(FIELD_VALUE);
  });

  test("is called on script transition POST requests", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(`/urlencoded`);
    await page.waitForSelector(`#text:has-text("${WAITING_VALUE}")`);

    await page.click("button[type=submit]");
    await page.waitForSelector("#action-text");
    await page.waitForSelector(`#text:has-text("${SUBMITTED_VALUE}")`);
  });

  test("properly encodes form data for request.text() usage", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(`/request-text`);
    await page.waitForSelector(`#text:has-text("${WAITING_VALUE}")`);

    await page.click("button[type=submit]");
    await page.waitForSelector("#action-text");
    expect(await app.getHtml("#action-text")).toBe(
      '<span id="action-text">a=1&amp;b=2</span>'
    );
  });

  test("redirects a thrown response on document requests", async () => {
    let params = new URLSearchParams();
    let res = await fixture.postDocument(`/${THROWS_REDIRECT}`, params);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe(`/${REDIRECT_TARGET}`);
  });

  test("redirects a thrown response on script transitions", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(`/${THROWS_REDIRECT}`);
    let responses = app.collectDataResponses();
    await app.clickSubmitButton(`/${THROWS_REDIRECT}`);

    await page.waitForSelector(`#${REDIRECT_TARGET}`);

    expect(responses.length).toBe(1);
    expect(responses[0].status()).toBe(204);

    expect(new URL(page.url()).pathname).toBe(`/${REDIRECT_TARGET}`);
    expect(await app.getHtml()).toMatch(PAGE_TEXT);
  });
});
