import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { createAppFixture, createFixture, js } from "./helpers/create-fixture";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes/index.jsx": js`
        import { json } from "@remix-run/node";
        import { useActionData, useLoaderData, Form } from "@remix-run/react";

        export async function action ({ request }) {
          console.log('action request.signal', request.signal)
          // New event loop causes express request to close
          await new Promise(r => setTimeout(r, 0));
          return json({ aborted: request.signal.aborted });
        }

        export function loader({ request }) {
          console.log('loader request.signal', request.signal)
          return json({ aborted: request.signal.aborted });
        }

        export default function Index() {
          let actionData = useActionData();
          let data = useLoaderData();
          return (
            <div>
              <p className="action">{actionData ? String(actionData.aborted) : "empty"}</p>
              <p className="loader">{String(data.aborted)}</p>
              <Form method="post">
                <button type="submit">Submit</button>
              </Form>
            </div>
          )
        }
      `,
    },
  });

  // This creates an interactive app using puppeteer.
  appFixture = await createAppFixture(fixture);
});

test.afterAll(async () => appFixture.close());

test("should not abort the request in a new event loop", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");
  expect(await app.getHtml(".action")).toMatch("empty");
  expect(await app.getHtml(".loader")).toMatch("false");

  await app.clickElement('button[type="submit"]');
  expect(await app.getHtml(".action")).toMatch("false");
  expect(await app.getHtml(".loader")).toMatch("false");
});
