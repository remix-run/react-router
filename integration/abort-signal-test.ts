import { test } from "@playwright/test";

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
        import { useActionData, useLoaderData, Form } from "@remix-run/react";

        export async function action ({ request }) {
          // New event loop causes express request to close
          await new Promise(r => setTimeout(r, 0));
          return json({ aborted: request.signal.aborted });
        }

        export function loader({ request }) {
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

  // This creates an interactive app using playwright.
  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

test("should not abort the request in a new event loop", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");
  await page.waitForSelector(`.action:has-text("empty")`);
  await page.waitForSelector(`.loader:has-text("false")`);

  await app.clickElement('button[type="submit"]');

  await page.waitForSelector(`.action:has-text("false")`);
  await page.waitForSelector(`.loader:has-text("false")`);
});
