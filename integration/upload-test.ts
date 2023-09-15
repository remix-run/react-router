import * as path from "node:path";
import * as url from "node:url";
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

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

test.beforeAll(async () => {
  fixture = await createFixture({
    config: {
      browserNodeBuiltinsPolyfill: {
        modules: {
          url: true,
        },
      },
    },
    files: {
      "app/routes/file-upload-handler.tsx": js`
        import * as path from "node:path";
        import * as url from "node:url";
        import {
          json,
          unstable_composeUploadHandlers as composeUploadHandlers,
          unstable_createFileUploadHandler as createFileUploadHandler,
          unstable_createMemoryUploadHandler as createMemoryUploadHandler,
          unstable_parseMultipartFormData as parseMultipartFormData,
          MaxPartSizeExceededError,
        } from "@remix-run/node";
        import { Form, useActionData } from "@remix-run/react";

        const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
        export let action = async ({ request }) => {
          let uploadHandler = composeUploadHandlers(
            createFileUploadHandler({
              directory: path.resolve(__dirname, "..", "uploads"),
              maxPartSize: 13,
              avoidFileConflicts: false,
              file: ({ filename }) => filename,
            }),
            createMemoryUploadHandler(),
          );

          try {
            let formData = await parseMultipartFormData(request, uploadHandler);

            if (formData.get("test") !== "hidden") {
              return { message: "hidden field not in form data" };
            }

            let file = formData.get("file");
            let size = typeof file !== "string" && file ? file.size : 0;

            return json({ message: "SUCCESS", size });
          } catch (error) {
            if (error instanceof MaxPartSizeExceededError) {
              return json(
                { message: "FILE_TOO_LARGE", size: error.maxBytes },
                { status: 413, headers: { "Connection": "close" } }
              );
            }
            return json({ message: "ERROR" }, 500);
          }
        };

        export default function FileUpload() {
          let { message, size } = useActionData() || {};
          return (
            <main>
              <Form method="post" encType="multipart/form-data">
                <input type="hidden" name="test" value="hidden" />
                <label htmlFor="file">File Uploader</label>
                <br />
                <input type="file" id="file" name="file" />
                <br />
                <button id="submit" type="submit">Submit</button>
                {message && <p id="message">{message}</p>}
                {size && <p id="size">{size}</p>}
              </Form>
            </main>
          );
        }
      `,

      "app/routes/memory-upload-handler.tsx": js`
        import {
          json,
          unstable_createMemoryUploadHandler as createMemoryUploadHandler,
          unstable_parseMultipartFormData as parseMultipartFormData,
          MaxPartSizeExceededError,
        } from "@remix-run/node";
        import { Form, useActionData } from "@remix-run/react";

        export let action = async ({ request }) => {
          let uploadHandler = createMemoryUploadHandler({
            maxPartSize: 13,
          });

          try {
            let formData = await parseMultipartFormData(request, uploadHandler);

            if (formData.get("test") !== "hidden") {
              return { message: "hidden field not in form data" };
            }

            let file = formData.get("file");
            let size = typeof file !== "string" && file ? file.size : 0;

            return json({ message: "SUCCESS", size });
          } catch (error) {
            if (error instanceof MaxPartSizeExceededError) {
              return json(
                { message: "FILE_TOO_LARGE", size: error.maxBytes },
                { status: 413, headers: { "Connection": "close" } }
              );
            }
            return json({ message: "ERROR" }, 500);
          }
        };

        export default function MemoryUpload() {
          let { message, size } = useActionData() || {};
          return (
            <main>
              <Form method="post" encType="multipart/form-data">
                <input type="hidden" name="test" value="hidden" />
                <label htmlFor="file">File Uploader</label>
                <br />
                <input type="file" id="file" name="file" />
                <br />
                <button id="submit" type="submit">Submit</button>
                {message && <p id="message">{message}</p>}
                {size && <p id="size">{size}</p>}
              </Form>
            </main>
          );
        }
      `,

      "app/routes/passthrough-upload-handler.tsx": js`
        import {
          json,
          unstable_parseMultipartFormData as parseMultipartFormData,
        } from "@remix-run/node";
        import { Form, useActionData } from "@remix-run/react";

        export let action = async ({ request }) => {
          try {
            let formData = await parseMultipartFormData(request, () => undefined);

            return json(
              { message: "SUCCESS", size: 0 },
            );
          } catch (error) {
            return json(
              { message: "ERROR" },
              { status: 500, headers: { "Connection": "close" } }
            );
          }
        };

        export default function PassthroughUpload() {
          let { message, size } = useActionData() || {};
          return (
            <main>
              <Form method="post" encType="multipart/form-data">
                <input type="hidden" name="test" value="hidden" />
                <label htmlFor="file">File Uploader</label>
                <br />
                <input type="file" id="file" name="file" />
                <br />
                <button id="submit" type="submit">Submit</button>
                {message && <p id="message">{message}</p>}
                {size && <p id="size">{size}</p>}
              </Form>
            </main>
          );
        }
      `,
    },
  });

  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

test("can upload a file with createFileUploadHandler", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/file-upload-handler");
  await app.uploadFile("#file", path.resolve(__dirname, "assets/toupload.txt"));
  await app.clickSubmitButton("/file-upload-handler");
  await page.waitForSelector("#message");

  expect(await app.getHtml("#message")).toMatch(">SUCCESS<");
  expect(await app.getHtml("#size")).toMatch(">13<");
});

test("can catch MaxPartSizeExceededError when file is too big with createFileUploadHandler", async ({
  page,
}) => {
  test.slow();
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/file-upload-handler");
  await app.uploadFile(
    "#file",
    path.resolve(__dirname, "assets/touploadtoobig.txt")
  );
  await app.clickSubmitButton("/file-upload-handler");
  await page.waitForSelector("#message");

  expect(await app.getHtml("#message")).toMatch(">FILE_TOO_LARGE<");
  expect(await app.getHtml("#size")).toMatch(">13<");
});

test("can upload a file with createMemoryUploadHandler", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/memory-upload-handler");
  await app.uploadFile("#file", path.resolve(__dirname, "assets/toupload.txt"));
  await app.clickSubmitButton("/memory-upload-handler");
  await page.waitForSelector("#message");

  expect(await app.getHtml("#message")).toMatch(">SUCCESS<");
  expect(await app.getHtml("#size")).toMatch(">13<");
});

test("can upload a file with a passthrough handler", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/passthrough-upload-handler");
  await app.uploadFile("#file", path.resolve(__dirname, "assets/toupload.txt"));
  await app.clickSubmitButton("/passthrough-upload-handler");
  await page.waitForSelector("#message");

  expect(await app.getHtml("#message")).toMatch(">SUCCESS<");
});

test("can catch MaxPartSizeExceededError when file is too big with createMemoryUploadHandler", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/memory-upload-handler");
  await app.uploadFile(
    "#file",
    path.resolve(__dirname, "assets/touploadtoobig.txt")
  );
  await app.clickSubmitButton("/memory-upload-handler");
  await page.waitForSelector("#message");

  expect(await app.getHtml("#message")).toMatch(">FILE_TOO_LARGE<");
  expect(await app.getHtml("#size")).toMatch(">13<");
});

test.describe("without javascript", () => {
  test.use({ javaScriptEnabled: false });

  test("can upload a file with createFileUploadHandler", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/file-upload-handler");
    await app.uploadFile(
      "#file",
      path.resolve(__dirname, "assets/toupload.txt")
    );
    await page.click("#submit");
    await page.waitForSelector("#message");

    expect(await app.getHtml("#message")).toMatch(">SUCCESS<");
    expect(await app.getHtml("#size")).toMatch(">13<");
  });

  test("can catch MaxPartSizeExceededError when file is too big with createFileUploadHandler", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/file-upload-handler");
    await app.uploadFile(
      "#file",
      path.resolve(__dirname, "assets/touploadtoobig.txt")
    );
    await page.click("#submit");
    await page.waitForSelector("#message");

    expect(await app.getHtml("#message")).toMatch(">FILE_TOO_LARGE<");
    expect(await app.getHtml("#size")).toMatch(">13<");
  });

  test("can upload a file with createMemoryUploadHandler", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/memory-upload-handler");
    await app.uploadFile(
      "#file",
      path.resolve(__dirname, "assets/toupload.txt")
    );
    await page.click("#submit");
    await page.waitForSelector("#message");

    expect(await app.getHtml("#message")).toMatch(">SUCCESS<");
    expect(await app.getHtml("#size")).toMatch(">13<");
  });

  test("can upload a file with passthrough handler", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/passthrough-upload-handler");
    await app.uploadFile(
      "#file",
      path.resolve(__dirname, "assets/toupload.txt")
    );
    await page.click("#submit");
    await page.waitForSelector("#message");

    expect(await app.getHtml("#message")).toMatch(">SUCCESS<");
  });

  test("can catch MaxPartSizeExceededError when file is too big with createMemoryUploadHandler", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/memory-upload-handler");
    await app.uploadFile(
      "#file",
      path.resolve(__dirname, "assets/touploadtoobig.txt")
    );
    await page.click("#submit");
    await page.waitForSelector("#message");

    expect(await app.getHtml("#message")).toMatch(">FILE_TOO_LARGE<");
    expect(await app.getHtml("#size")).toMatch(">13<");
  });
});
