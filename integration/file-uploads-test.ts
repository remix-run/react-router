import * as fs from "fs/promises";
import * as path from "path";

import { createFixture, createAppFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

describe("file-uploads", () => {
  let fixture: Fixture;
  let app: AppFixture;

  beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/fileUploadHandler.js": js`
          import * as path from "path";
          import { unstable_createFileUploadHandler as createFileUploadHandler } from "remix";

          export let uploadHandler = createFileUploadHandler({
            directory: path.resolve(__dirname, "..", "uploads"),
            maxFileSize: 3000000, // 3MB
            // you probably want to avoid conflicts in production
            // do not set to false or passthrough filename in real
            // applications.
            avoidFileConflicts: false,
            file: ({ filename }) => filename
          });
        `,
        "app/routes/file-upload.jsx": js`
          import { Form, unstable_parseMultipartFormData as parseMultipartFormData, useActionData } from "remix";
          import { uploadHandler } from "~/fileUploadHandler";

          export let action = async ({ request }) => {
            try {
              let formData = await parseMultipartFormData(request, uploadHandler);

              let file = formData.get("file");

              if (typeof file === "string" || !file) {
                throw new Error("invalid file type");
              }

              return { name: file.name, size: file.size };
            } catch (error) {
              return { errorMessage: error.message };
            }
          };

          export default function Upload() {
            return (
              <>
                <Form method="post" encType="multipart/form-data">
                  <label htmlFor="file">Choose a file:</label>
                  <input type="file" id="file" name="file" />
                  <button type="submit">Submit</button>
                </Form>
                <pre>{JSON.stringify(useActionData(), null, 2)}</pre>
              </>
            );
          }
        `
      }
    });

    app = await createAppFixture(fixture);
  });

  afterAll(async () => {
    await app.close();
  });

  it("handles files under upload size limit", async () => {
    let uploadFile = path.join(
      fixture.projectDir,
      "toUpload",
      "underLimit.txt"
    );
    let uploadData = Array(1000000).fill("a").join(""); // 1MB
    await fs
      .mkdir(path.dirname(uploadFile), { recursive: true })
      .catch(() => {});
    await fs.writeFile(uploadFile, uploadData, "utf8");

    await app.goto("/file-upload");
    await app.uploadFile("#file", uploadFile);
    await app.clickSubmitButton("/file-upload");
    expect(await app.getHtml("pre")).toMatchInlineSnapshot(`
      "<pre>
      {
        \\"name\\": \\"underLimit.txt\\",
        \\"size\\": 1000000
      }</pre
      >"
    `);

    let written = await fs.readFile(
      path.join(fixture.projectDir, "uploads/underLimit.txt"),
      "utf8"
    );
    expect(written).toBe(uploadData);
  });

  it("rejects files over upload size limit", async () => {
    let uploadFile = path.join(fixture.projectDir, "toUpload", "overLimit.txt");
    let uploadData = Array(3000001).fill("a").join(""); // 3.000001MB
    await fs
      .mkdir(path.dirname(uploadFile), { recursive: true })
      .catch(() => {});
    await fs.writeFile(uploadFile, uploadData, "utf8");

    await app.goto("/file-upload");
    await app.uploadFile("#file", uploadFile);
    await app.clickSubmitButton("/file-upload");
    expect(await app.getHtml("pre")).toMatchInlineSnapshot(`
      "<pre>
      {
        \\"errorMessage\\": \\"Field \\\\\\"file\\\\\\" exceeded upload size of 3000000 bytes.\\"
      }</pre
      >"
    `);
  });
});
