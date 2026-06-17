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

test.beforeEach(async ({ context }) => {
  await context.route(/\.data$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    route.continue();
  });
});

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes/_index.tsx": js`
        import { useLoaderData, Form } from "react-router";

        export function loader() {
          return "pizza";
        }

        export async function action({ request }) {
          let formData = await request.formData();
          return { ok: true };
        }

        export default function Index() {
          let data = useLoaderData();
          return (
            <div>
              {data}
              <Form method="post">
                <input name="key" defaultValue="value" />
                <button type="submit">Submit</button>
              </Form>
            </div>
          )
        }
      `,
    },
  });

  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

////////////////////////////////////////////////////////////////////////////////
// Regression introduced in 7.18.0 by PR #15185.
//
// throwIfPotentialCSRFAttack now derives the host from new URL(request.url).host
// instead of parseHostHeader() which read X-Forwarded-Host / Host headers.
// parseHostHeader no longer exists in 7.18.0.
//
// The fixture builds every Request from the base URL "test://test", so
// new URL(request.url).host === "test" for all fixture requests.
//
// A POST with Origin: https://example.com and X-Forwarded-Host: example.com
// should pass the CSRF check — the headers agree it's the same origin.
// But 7.18.0 compares "example.com" !== "test" and rejects with 400 Bad Request.
//
// 7.17.0: parseHostHeader reads X-Forwarded-Host "example.com"
//         === Origin "example.com" → 200 ✓
// 7.18.0: new URL(request.url).host === "test"
//         !== Origin "example.com" → 400 Bad Request ✗
//
// This test is expected to FAIL on 7.18.0 and PASS on 7.17.0.
////////////////////////////////////////////////////////////////////////////////

test("action accepts POST when Origin matches X-Forwarded-Host (reverse proxy scenario)", async () => {
  let response = await fixture.requestDocument("/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: "https://example.com",
      "X-Forwarded-Host": "example.com",
    },
    body: new URLSearchParams({ key: "value" }),
  });

  // 7.17.0: passes  → 200
  // 7.18.0: rejects → 400 Bad Request
  expect(response.status).toBe(200);
});
