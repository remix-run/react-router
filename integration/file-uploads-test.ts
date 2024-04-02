import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as url from "node:url";
import { test, expect } from "@playwright/test";

import {
  createFixture,
  createAppFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("file-uploads", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      useRemixServe: true, // To support usage of process.cwd() in fileUploadHandler.ts
      files: {
        "app/fileUploadHandler.ts": js`
          import * as path from "node:path";
          import * as url from "node:url";
          import {
            unstable_composeUploadHandlers as composeUploadHandlers,
            unstable_createFileUploadHandler as createFileUploadHandler,
            unstable_createMemoryUploadHandler as createMemoryUploadHandler,
          } from "@remix-run/node";

          export let uploadHandler = composeUploadHandlers(
            createFileUploadHandler({
              directory: path.resolve(process.cwd(), "uploads"),
              maxPartSize: 10_000, // 10kb
              // you probably want to avoid conflicts in production
              // do not set to false or passthrough filename in real
              // applications.
              avoidFileConflicts: false,
              file: ({ filename }) => filename
            }),
            createMemoryUploadHandler(),
          );
        `,
        "app/routes/file-upload.tsx": js`
          import {
            unstable_parseMultipartFormData as parseMultipartFormData,
          } from "@remix-run/node";
          import { Form, useActionData } from "@remix-run/react";
          import { uploadHandler } from "~/fileUploadHandler";

          export let action = async ({ request }) => {
            try {
              let formData = await parseMultipartFormData(request, uploadHandler);

              if (formData.get("test") !== "hidden") {
                return { errorMessage: "hidden field not in form data" };
              }

              let file = formData.get("file");
              if (typeof file === "string" || !file) {
                return { errorMessage: "invalid file type" };
              }

              return { name: file.name, size: file.size };
            } catch (error) {
              return { errorMessage: error.message };
            }
          };

          export default function Upload() {
            let actionData = useActionData();
            return (
              <>
                <Form method="post" encType="multipart/form-data">
                  <label htmlFor="file">Choose a file:</label>
                  <input type="file" id="file" name="file" />
                  <input type="hidden" name="test" value="hidden" />
                  <button type="submit">Submit</button>
                </Form>
                {actionData ? <pre>{JSON.stringify(actionData, null, 2)}</pre> : null}
              </>
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

  test("handles files under upload size limit", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let uploadFile = path.join(
      fixture.projectDir,
      "toUpload",
      "underLimit.txt"
    );
    let uploadData = Array(1_000).fill("a").join(""); // 1kb
    await fs
      .mkdir(path.dirname(uploadFile), { recursive: true })
      .catch(() => {});
    await fs.writeFile(uploadFile, uploadData, "utf8");

    await app.goto("/file-upload");
    await app.uploadFile("#file", uploadFile);
    await app.clickSubmitButton("/file-upload");
    await page.waitForSelector("pre");
    expect(await app.getHtml("pre")).toBe(`<pre>
{
  "name": "underLimit.txt",
  "size": 1000
}</pre
>`);

    let written = await fs.readFile(
      url.pathToFileURL(path.join(process.cwd(), "uploads/underLimit.txt")),
      "utf8"
    );
    expect(written).toBe(uploadData);
  });

  test("rejects files over upload size limit", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    let uploadFile = path.join(fixture.projectDir, "toUpload", "overLimit.txt");
    let uploadData = Array(10_001).fill("a").join(""); // 10.000001KB
    await fs
      .mkdir(path.dirname(uploadFile), { recursive: true })
      .catch(() => {});
    await fs.writeFile(uploadFile, uploadData, "utf8");

    await app.goto("/file-upload");
    await app.uploadFile("#file", uploadFile);
    await app.clickSubmitButton("/file-upload");
    await page.waitForSelector("pre");
    expect(await app.getHtml("pre")).toBe(`<pre>
{
  "errorMessage": "Field \\"file\\" exceeded upload size of 10000 bytes."
}</pre
>`);
  });
});

// Duplicate suite of the tests above running with single fetch enabled
// TODO(v3): remove the above suite of tests and just keep these
test.describe("single fetch", () => {
  test.describe("file-uploads", () => {
    let fixture: Fixture;
    let appFixture: AppFixture;

    test.beforeAll(async () => {
      fixture = await createFixture({
        singleFetch: true,
        files: {
          "app/fileUploadHandler.ts": js`
            import * as path from "node:path";
            import * as url from "node:url";
            import {
              unstable_composeUploadHandlers as composeUploadHandlers,
              unstable_createFileUploadHandler as createFileUploadHandler,
              unstable_createMemoryUploadHandler as createMemoryUploadHandler,
            } from "@remix-run/node";

            export let uploadHandler = composeUploadHandlers(
              createFileUploadHandler({
                directory: path.resolve(process.cwd(), "uploads"),
                maxPartSize: 10_000, // 10kb
                // you probably want to avoid conflicts in production
                // do not set to false or passthrough filename in real
                // applications.
                avoidFileConflicts: false,
                file: ({ filename }) => filename
              }),
              createMemoryUploadHandler(),
            );
          `,
          "app/routes/file-upload.tsx": js`
            import {
              unstable_parseMultipartFormData as parseMultipartFormData,
            } from "@remix-run/node";
            import { Form, useActionData } from "@remix-run/react";
            import { uploadHandler } from "~/fileUploadHandler";

            export let action = async ({ request }) => {
              try {
                let formData = await parseMultipartFormData(request, uploadHandler);

                if (formData.get("test") !== "hidden") {
                  return { errorMessage: "hidden field not in form data" };
                }

                let file = formData.get("file");
                if (typeof file === "string" || !file) {
                  return { errorMessage: "invalid file type" };
                }

                return { name: file.name, size: file.size };
              } catch (error) {
                return { errorMessage: error.message };
              }
            };

            export default function Upload() {
              let actionData = useActionData();
              return (
                <>
                  <Form method="post" encType="multipart/form-data">
                    <label htmlFor="file">Choose a file:</label>
                    <input type="file" id="file" name="file" />
                    <input type="hidden" name="test" value="hidden" />
                    <button type="submit">Submit</button>
                  </Form>
                  {actionData ? <pre>{JSON.stringify(actionData, null, 2)}</pre> : null}
                </>
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

    test("handles files under upload size limit", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      let uploadFile = path.join(
        fixture.projectDir,
        "toUpload",
        "underLimit.txt"
      );
      let uploadData = Array(1_000).fill("a").join(""); // 1kb
      await fs
        .mkdir(path.dirname(uploadFile), { recursive: true })
        .catch(() => {});
      await fs.writeFile(uploadFile, uploadData, "utf8");

      await app.goto("/file-upload");
      await app.uploadFile("#file", uploadFile);
      await app.clickSubmitButton("/file-upload");
      await page.waitForSelector("pre");
      expect(await app.getHtml("pre")).toBe(`<pre>
{
  "name": "underLimit.txt",
  "size": 1000
}</pre
>`);

      let written = await fs.readFile(
        url.pathToFileURL(path.join(process.cwd(), "uploads/underLimit.txt")),
        "utf8"
      );
      expect(written).toBe(uploadData);
    });

    test("rejects files over upload size limit", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      let uploadFile = path.join(
        fixture.projectDir,
        "toUpload",
        "overLimit.txt"
      );
      let uploadData = Array(10_001).fill("a").join(""); // 10.000001KB
      await fs
        .mkdir(path.dirname(uploadFile), { recursive: true })
        .catch(() => {});
      await fs.writeFile(uploadFile, uploadData, "utf8");

      await app.goto("/file-upload");
      await app.uploadFile("#file", uploadFile);
      await app.clickSubmitButton("/file-upload");
      await page.waitForSelector("pre");
      expect(await app.getHtml("pre")).toBe(`<pre>
{
  "errorMessage": "Field \\"file\\" exceeded upload size of 10000 bytes."
}</pre
>`);
    });
  });
});
