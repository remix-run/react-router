import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("`useSubmit()` returned function", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/_index.tsx": js`
          import { useLoaderData, useSubmit } from "@remix-run/react";

          export function loader({ request }) {
            let url = new URL(request.url);
            return url.searchParams.toString()
          }

          export default function Index() {
            let submit = useSubmit();
            let handleClick = event => {
              event.preventDefault()
              submit(event.nativeEvent.submitter || event.currentTarget)
            }
            let data = useLoaderData();
            return (
              <form>
                <input type="text" name="tasks" defaultValue="first" />
                <input type="text" name="tasks" defaultValue="second" />

                <button onClick={handleClick} name="tasks" value="third">
                  Prepare Third Task
                </button>

                <pre>{data}</pre>
              </form>
            )
          }
        `,
        "app/routes/action.tsx": js`
          import { json } from "@remix-run/node";
          import { useActionData, useSubmit } from "@remix-run/react";

          export async function action({ request }) {
            let contentType = request.headers.get('Content-Type');
            if (contentType.includes('application/json')) {
              return json({ value: await request.json() });
            }
            if (contentType.includes('text/plain')) {
              return json({ value: await request.text() });
            }
            let fd = await request.formData();
            return json({ value: new URLSearchParams(fd.entries()).toString() })
          }

          export default function Component() {
            let submit = useSubmit();
            let data = useActionData();
            return (
              <>
                <button id="submit-json" onClick={() => submit(
                  { key: 'value' },
                  { method: 'post', encType: 'application/json' },
                )}>
                  Submit JSON
                </button>
                <button id="submit-text" onClick={() => submit(
                  "raw text",
                  { method: 'post', encType: 'text/plain' },
                )}>
                  Submit Text
                </button>
                <button id="submit-formData" onClick={() => submit(
                  { key: 'value' },
                  { method: 'post' },
                )}>
                  Submit FrmData
                </button>
                {data ? <p id="action-data">data: {JSON.stringify(data)}</p> : null}
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

  test("submits the submitter's value appended to the form data", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await app.clickElement("text=Prepare Third Task");
    await page.waitForLoadState("load");
    expect(await app.getHtml("pre")).toBe(
      `<pre>tasks=first&amp;tasks=second&amp;tasks=third</pre>`
    );
  });

  test("submits json data", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/action", true);
    await app.clickElement("#submit-json");
    await page.waitForSelector("#action-data");
    expect(await app.getHtml()).toMatch('data: {"value":{"key":"value"}}');
  });

  test("submits text data", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/action", true);
    await app.clickElement("#submit-text");
    await page.waitForSelector("#action-data");
    expect(await app.getHtml()).toMatch('data: {"value":"raw text"}');
  });

  test("submits form data", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/action", true);
    await app.clickElement("#submit-formData");
    await page.waitForSelector("#action-data");
    expect(await app.getHtml()).toMatch('data: {"value":"key=value"}');
  });
});
