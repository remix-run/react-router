import { test, expect } from "@playwright/test";
import path from "path";

import { createFixture, createAppFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { PlaywrightFixture, selectHtml } from "./helpers/playwright-fixture";

test.describe("actions", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  let FIELD_NAME = "message";
  let WAITING_VALUE = "Waiting...";
  let ACTION_DATA_VALUE = "heyooo, data from the action:";
  let SUBMITTED_VALUE = "Submission";
  let THROWS_REDIRECT = "redirect-throw";
  let REDIRECT_TARGET = "page";
  let HAS_FILE_ACTIONS = "file-actions";
  let MAX_FILE_UPLOAD_SIZE = 1234;
  let PAGE_TEXT = "PAGE_TEXT";

  test.beforeAll(async () => {
    fixture = await createFixture({
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
            return <div>${PAGE_TEXT}</div>
          }
        `,

        [`app/routes/${HAS_FILE_ACTIONS}.jsx`]: js`
          import {
            json,
            unstable_parseMultipartFormData as parseMultipartFormData,
            unstable_createFileUploadHandler as createFileUploadHandler,
          } from "@remix-run/node";
          import { Form, useActionData } from "@remix-run/react";

          export async function action({ request }) {
            const uploadHandler = createFileUploadHandler({
              directory: ".tmp/uploads",
              maxFileSize: ${MAX_FILE_UPLOAD_SIZE},
              // You probably do *not* want to do this in prod.
              // We passthrough the name and allow conflicts for test fixutres.
              avoidFileConflicts: false,
              file: ({ filename }) => filename,
            });

            let files = [];
            let formData = await parseMultipartFormData(request, uploadHandler);

            let file = formData.get("file");
            if (file && typeof file !== "string") {
              files.push({ name: file.name, size: file.size });
            }

            return json(
              {
                files,
                message: "${ACTION_DATA_VALUE} " + formData.get("field1"),
              },
              {
                headers: {
                  "x-test": "works",
                },
              }
            );
          };

          export function headers({ actionHeaders }) {
            return {
              "x-test": actionHeaders.get("x-test"),
            };
          };

          export function ErrorBoundary({ error }) {
            return (
              <div id="actions-error-boundary">
                <h1 id="actions-error-heading">Actions Error Boundary</h1>
                <p id="actions-error-text">{error.message}</p>
              </div>
            );
          }

          export default function Actions() {
            let { files, message } = useActionData() || {};

            return (
              <Form method="post" id="form" encType="multipart/form-data">
                <p id="action-text">
                  {message ? <span id="action-data">{message}</span> : "${WAITING_VALUE}"}
                </p>
                {files ? (
                  <ul>
                    {files.map((file) => (
                      <li key={JSON.stringify(file)}>
                        <pre>
                          <code>{JSON.stringify(file, null, 2)}</code>
                        </pre>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p>
                  <label htmlFor="file">Choose a file:</label>
                  <input type="file" id="file" name="file" />
                </p>
                <p>
                  <input type="text" defaultValue="stuff" name="field1" />
                  <button type="submit" id="submit">
                    Go
                  </button>
                </p>
              </Form>
            );
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(async () => {
    await appFixture.close();
  });

  let logs: string[] = [];

  test.beforeEach(({ page }) => {
    page.on("console", (msg) => {
      logs.push(msg.text());
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
    let html = await app.getHtml("#text");
    expect(html).toMatch(WAITING_VALUE);

    await page.click("button[type=submit]");
    await page.waitForSelector("#action-text");
    html = await app.getHtml("#text");
    expect(html).toMatch(SUBMITTED_VALUE);
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
    expect(responses.length).toBe(1);
    expect(responses[0].status()).toBe(204);

    expect(new URL(page.url()).pathname).toBe(`/${REDIRECT_TARGET}`);
    expect(await app.getHtml()).toMatch(PAGE_TEXT);
  });

  test("can upload file with JavaScript", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(`/${HAS_FILE_ACTIONS}`);

    let html = await app.getHtml("#action-text");
    expect(html).toMatch(WAITING_VALUE);

    await app.uploadFile(
      "#file",
      path.resolve(__dirname, "assets/toupload.txt")
    );

    await page.click("button[type=submit]");
    await page.waitForSelector("#action-data");

    html = await app.getHtml("#action-text");
    expect(html).toMatch(ACTION_DATA_VALUE + " stuff");
  });

  // TODO: figure out what the heck is wrong with this test...
  // For some reason the error message is "Unexpected Server Error" in the test
  // but if you try the app in the browser it works as expected.
  test.skip("rejects too big of an upload with JavaScript", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(`/${HAS_FILE_ACTIONS}`);

    let html = await app.getHtml("#action-text");
    expect(html).toMatch(WAITING_VALUE);

    await app.uploadFile(
      "#file",
      path.resolve(__dirname, "assets/touploadtoobig.txt")
    );

    await page.click("button[type=submit]");
    await page.waitForSelector("#actions-error-boundary");

    let text = await app.getHtml("#actions-error-text");
    expect(text).toMatch(
      `Field "file" exceeded upload size of ${MAX_FILE_UPLOAD_SIZE} bytes`
    );

    let logs: string[] = [];
    page.on("console", (msg) => {
      logs.push(msg.text());
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatch(/exceeded upload size/i);
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("can upload file", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto(`/${HAS_FILE_ACTIONS}`);

      let html = await app.getHtml("#action-text");
      expect(html).toMatch(WAITING_VALUE);

      await app.uploadFile(
        "#file",
        path.resolve(__dirname, "assets/toupload.txt")
      );

      let [response] = await Promise.all([
        page.waitForNavigation(),
        page.click("#submit"),
      ]);

      expect(response!.status()).toBe(200);
      expect(response!.headers()["x-test"]).toBe("works");

      html = await app.getHtml("#action-text");
      expect(html).toMatch(ACTION_DATA_VALUE + " stuff");
    });

    // TODO: figure out what the heck is wrong with this test...
    // "Failed to load resource: the server responded with a status of 500 (Internal Server Error)"
    test.skip("rejects too big of an upload", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      let logs: string[] = [];
      page.on("console", (msg) => {
        logs.push(msg.text());
      });

      await app.goto(`/${HAS_FILE_ACTIONS}`);

      let html = await app.getHtml("#action-text");
      expect(html).toMatch(WAITING_VALUE);

      await app.uploadFile(
        "#file",
        path.resolve(__dirname, "assets/touploadtoobig.txt")
      );

      let [response] = await Promise.all([
        page.waitForNavigation(),
        page.click("#submit"),
      ]);
      expect(response!.status()).toBe(500);
      let text = await app.getHtml("#actions-error-text");
      let errorMessage = `Field "file" exceeded upload size of ${MAX_FILE_UPLOAD_SIZE} bytes`;
      expect(text).toMatch(errorMessage);

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatch(/error running.*action.*routes\/file-actions/i);
    });
  });
});
