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

////////////////////////////////////////////////////////////////////////////////
// Bug Report: Manifest version mismatch reload loses query parameters
//
// When React Router detects a manifest version mismatch during navigation
// (e.g., after a deployment), it performs a hard refresh using only the path,
// stripping query parameters and hash from the URL.
//
// Root cause: In fog-of-war.ts line 87, navigation passes just `path` instead
// of the full URL with query params:
//   fetcherKey ? window.location.href : path
//
// This causes data loss for users with tracking params, auth tokens, or
// application state in query strings when they navigate during/after a deploy.
////////////////////////////////////////////////////////////////////////////////

test.afterAll(() => {
  appFixture?.close();
});

test("manifest version mismatch reload should preserve query parameters and hash", async ({
  page,
}) => {
  fixture = await createFixture({
    files: {
      "app/routes/_index.tsx": js`
        import { Link, useSearchParams } from "react-router";

        export default function Index() {
          const [searchParams] = useSearchParams();
          return (
            <div>
              <h1>Home</h1>
              <p data-token>Token: {searchParams.get("token") || "none"}</p>
              <p data-ref>Ref: {searchParams.get("ref") || "none"}</p>
              <Link to="/other?token=abc123&ref=campaign#section1">Go to Other</Link>
            </div>
          );
        }
      `,

      "app/routes/other.tsx": js`
        import { useSearchParams, useLocation } from "react-router";

        export default function Other() {
          const [searchParams] = useSearchParams();
          const location = useLocation();
          return (
            <div>
              <h1>Other Page</h1>
              <p data-token>Token: {searchParams.get("token") || "none"}</p>
              <p data-ref>Ref: {searchParams.get("ref") || "none"}</p>
              <p data-hash>Hash: {location.hash || "none"}</p>
              <p data-search>Search: {location.search || "none"}</p>
            </div>
          );
        }
      `,
    },
  });

  // Intercept manifest requests and simulate a version mismatch by returning
  // 204 with X-Remix-Reload-Document header (this triggers the hard reload)
  await page.route(/\/__manifest/, async (route) => {
    const url = route.request().url();
    // Only trigger mismatch for the /other route discovery
    if (url.includes(encodeURIComponent("/other"))) {
      await route.fulfill({
        status: 204,
        headers: {
          "X-Remix-Reload-Document": "true",
        },
      });
    } else {
      await route.continue();
    }
  });

  // Track the URL that the browser navigates to on reload
  let reloadUrl: string | null = null;
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.url().includes("/other")) {
      reloadUrl = request.url();
    }
  });

  appFixture = await createAppFixture(fixture);
  let app = new PlaywrightFixture(appFixture, page);

  // Start on home page
  await app.goto("/");
  await page.waitForSelector("h1");

  // Click link to /other with query params and hash
  // This should trigger manifest fetch -> version mismatch -> hard reload
  await app.clickLink("/other?token=abc123&ref=campaign#section1");

  // Wait for the page to reload and render
  await page.waitForSelector('[data-token]', { timeout: 5000 });

  // EXPECTED: Query parameters and hash should be preserved after reload
  // ACTUAL BUG: They are stripped because fog-of-war.ts uses just `path`
  await expect(page.locator("[data-token]")).toHaveText("Token: abc123");
  await expect(page.locator("[data-ref]")).toHaveText("Ref: campaign");
  await expect(page.locator("[data-hash]")).toHaveText("Hash: #section1");
  await expect(page.locator("[data-search]")).toContain("?token=abc123");

  // Also verify the URL in the browser
  const currentUrl = page.url();
  expect(currentUrl).toContain("token=abc123");
  expect(currentUrl).toContain("ref=campaign");
  expect(currentUrl).toContain("#section1");
});

////////////////////////////////////////////////////////////////////////////////
// 💿 Finally, push your changes to your fork of React Router
// and open a pull request!
////////////////////////////////////////////////////////////////////////////////
