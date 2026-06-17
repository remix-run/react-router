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

// Regression test for:
// PR #15185 changed throwIfPotentialCSRFAttack to derive the host from
// new URL(request.url).host instead of reading X-Forwarded-Host / Host
// headers via parseHostHeader(). This breaks all form actions when the
// app is running behind a reverse proxy or CDN (e.g. AWS CloudFront),
// where request.url resolves to an internal origin URL while the browser's
// Origin header contains the public-facing domain.
//
// 7.17.0 (works): reads X-Forwarded-Host header set by the proxy
// 7.18.0 (broken): reads request.url host, which is the internal URL

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes/_index.tsx": js`
        import { Form, useActionData } from "react-router";

        export async function action({ request }) {
          return { ok: true };
        }

        export default function Index() {
          const data = useActionData();
          return (
            <Form method="post">
              <button type="submit" id="submit">Submit</button>
              {data?.ok && <p id="result">success</p>}
            </Form>
          );
        }
      `,
    },
  });

  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => appFixture.close());

test("form action succeeds when X-Forwarded-Host differs from request.url host (reverse proxy / CDN scenario)", async ({
  page,
}) => {
  // Simulate what a CDN/reverse proxy does:
  // The public domain is "example.com" but internally request.url resolves
  // to a different host (e.g. a Lambda URL or internal NLB endpoint).
  // The proxy sets X-Forwarded-Host: example.com to signal the original host.
  let app = new PlaywrightFixture(appFixture, page);

  await app.goto("/");

  // Intercept the action request and inject headers as a proxy would:
  // Origin and X-Forwarded-Host match (example.com) but request.url host
  // is "localhost" (the internal origin), causing the mismatch in 7.18.0.
  await page.route("**/*.data", (route) => {
    route.continue({
      headers: {
        ...route.request().headers(),
        "x-forwarded-host": "example.com",
        origin: "https://example.com",
      },
    });
  });

  await page.click("#submit");

  // Should succeed — X-Forwarded-Host matches Origin header.
  // In 7.18.0 this fails with 400 Bad Request because request.url host
  // is "localhost" (internal), not "example.com".
  await page.waitForSelector("#result");
  expect(await page.textContent("#result")).toBe("success");
});
