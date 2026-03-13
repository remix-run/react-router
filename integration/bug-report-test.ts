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
// Bug: isHydrationRequest closure not cleared when hydration navigation is
// aborted, causing serverLoader() to return stale SSR data.
//
// When routes use clientLoader.hydrate = true, React Router sets
// isHydrationRequest = true per route. During hydration, serverLoader()
// returns initialData (SSR data) when isHydrationRequest is true AND the
// route has initial data. The flag is cleared in a finally block after the
// loader executes.
//
// The bug: when the hydration POP is aborted by a new navigation, loaders
// that haven't completed yet never reach their finally block, so
// isHydrationRequest stays true. If the new navigation matches the SAME
// route (e.g., same path with different search params), isHydrationRequest
// is still true AND hasInitialData is true, so serverLoader() returns
// stale SSR data instead of fetching.
//
// IMPORTANT: React Router runs all matched route loaders in PARALLEL.
// During hydration, serverLoader() returns initialData synchronously,
// so a loader that just does `await serverLoader()` completes almost
// instantly — clearing isHydrationRequest before we can abort. To
// reproduce, the clientLoader must do async work BEFORE calling
// serverLoader(), keeping the loader pending long enough for the abort
// to happen while isHydrationRequest is still true.
//
// We use a "firstCall" flag so only the hydration invocation is slow.
// The subsequent PUSH invocation runs fast but still sees
// isHydrationRequest=true (the hydration call hasn't reached finally).
//
// To run:
//    pnpm test:integration bug-report --project chromium
////////////////////////////////////////////////////////////////////////////////

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/root.tsx": js`
        import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

        export default function Root() {
          return (
            <html lang="en">
              <head>
                <Meta />
                <Links />
              </head>
              <body>
                <Outlet />
                <ScrollRestoration />
                <Scripts />
              </body>
            </html>
          );
        }
      `,

      // Search route that reads ?q= from the URL.
      // SSR'd at /search?q=initial, then navigated to /search?q=updated.
      // Since it's the SAME route, it has initialData AND isHydrationRequest=true.
      "app/routes/search.tsx": js`
        import { useLoaderData, Link } from "react-router";

        export function loader({ request }) {
          let url = new URL(request.url);
          let q = url.searchParams.get("q") || "empty";
          return { query: q };
        }

        // Track call count so only the hydration invocation blocks.
        let callCount = 0;

        export async function clientLoader({ serverLoader, request }) {
          callCount++;
          let currentCall = callCount;
          let url = new URL(request.url);
          let q = url.searchParams.get("q") || "empty";

          if (currentCall === 1) {
            // Block hydration loader. Without this, serverLoader() returns
            // initialData synchronously during hydration, the loader completes
            // instantly, and isHydrationRequest is cleared in the finally block
            // before we can trigger a navigation to expose the bug.
            await new Promise((resolve) => setTimeout(resolve, 30000));
          }
          // On second call (PUSH navigation): no delay.
          // But isHydrationRequest is still true because the first call
          // (hydration) is stuck in its 30s delay and hasn't reached finally.
          // So serverLoader() returns stale initialData instead of fetching.
          let serverData = await serverLoader();
          return {
            ...serverData,
            // clientLoader-specific fields prove the clientLoader ran and
            // show what it saw — even when serverLoader() returns stale data.
            clientLoaderRan: true,
            clientLoaderCallCount: currentCall,
            clientLoaderQuery: q,
          };
        }
        clientLoader.hydrate = true;

        export default function Search() {
          let data = useLoaderData();
          return (
            <div>
              <h1 data-testid="page">Search</h1>
              <p data-testid="query">{data.query}</p>
              <p data-testid="client-loader-ran">{String(data.clientLoaderRan ?? false)}</p>
              <p data-testid="client-loader-call-count">{String(data.clientLoaderCallCount ?? 0)}</p>
              <p data-testid="client-loader-query">{String(data.clientLoaderQuery ?? "none")}</p>
              <Link to="/search?q=updated">Update query</Link>
            </div>
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

////////////////////////////////////////////////////////////////////////////////
// When a navigation to the same route (different search params) aborts
// pending hydration, serverLoader() should fetch fresh data — not return
// the stale SSR initialData.
////////////////////////////////////////////////////////////////////////////////

test("serverLoader() fetches fresh data when same-route navigation aborts hydration", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);

  // Centralized locators for reuse and readability
  let serverQuery = page.locator('[data-testid="query"]');
  let clientLoaderRan = page.locator('[data-testid="client-loader-ran"]');
  let clientLoaderCallCount = page.locator('[data-testid="client-loader-call-count"]');
  let clientLoaderQuery = page.locator('[data-testid="client-loader-query"]');

  // SSR the search page with ?q=initial.
  // After "load", scripts have executed and React has hydrated the DOM.
  // useLayoutEffect has fired → router.initialize() → hydration POP started.
  // Both clientLoaders are now blocked in their 30s delays (first call).
  // The SSR HTML is visible and links are clickable (React hydrated the DOM),
  // but router.state.initialized is false (hydration POP hasn't completed).
  await app.goto("/search?q=initial");

  // Verify SSR state: the server-rendered HTML shows the server loader data,
  // but clientLoader hasn't completed yet (it's blocked in its 30s delay),
  // so the clientLoader-specific fields show their fallback defaults.
  await expect(
    serverQuery,
    "SSR should render the server loader's query param"
  ).toHaveText("initial");
  await expect(
    clientLoaderRan,
    "clientLoader has not completed yet during SSR — should show fallback"
  ).toHaveText("false");
  await expect(
    clientLoaderCallCount,
    "clientLoader has not completed yet during SSR — call count should be 0"
  ).toHaveText("0");
  await expect(
    clientLoaderQuery,
    "clientLoader has not completed yet during SSR — query should show fallback"
  ).toHaveText("none");

  // Click the link to change search params while hydration is pending.
  // This triggers router.navigate("/search?q=updated") → startNavigation(PUSH)
  // which aborts the pending hydration POP.
  //
  // The PUSH calls both loaders again (second invocation):
  //   - Root loader: isFirstCall=false → no delay → serverLoader()
  //   - Search loader: isFirstCall=false → no delay → serverLoader()
  //
  // The search route's isHydrationRequest is STILL TRUE because the first
  // invocation (hydration) is stuck in its 30s setTimeout and hasn't reached
  // the finally block that clears it.
  //
  // Use { wait: false } — the PUSH may complete with no network request
  // (bug: serverLoader returns initialData from memory).
  await app.clickLink("/search?q=updated", { wait: false });

  // Wait for the URL to update and React to re-render
  await page.waitForURL(/q=updated/);

  // Verify clientLoader ran successfully — these fields are added by clientLoader
  // and prove it executed, regardless of what serverLoader() returned.
  await expect(
    clientLoaderRan,
    "clientLoader should have executed for the PUSH navigation"
  ).toHaveText("true");

  // 1st call = hydration (aborted), 2nd call = PUSH navigation
  await expect(
    clientLoaderCallCount,
    "clientLoader should be on its 2nd invocation (1st was the aborted hydration)"
  ).toHaveText("2");

  // clientLoader reads the request URL directly — it always sees "updated"
  // because this IS the PUSH navigation to ?q=updated.
  await expect(
    clientLoaderQuery,
    "clientLoader should see q=updated from the PUSH navigation request URL"
  ).toHaveText("updated");

  // The critical assertion: serverLoader() data should show "updated" from
  // the new URL, NOT "initial" from stale SSR data.
  //
  // BUG: isHydrationRequest=true + hasInitialData=true
  //   → serverLoader() returns initialData ({ query: "initial" })
  //   → clientLoader returns { query: "initial", clientLoaderQuery: "updated" }
  //   → The clientLoader ran correctly, but serverLoader() returned stale data!
  //
  // FIXED: isHydrationRequest=false (cleared when hydration aborted)
  //   → serverLoader() calls fetchServerLoader() → returns { query: "updated" }
  //   → clientLoader returns { query: "updated", clientLoaderQuery: "updated" }
  await expect(
    serverQuery,
    "serverLoader() should return fresh data (q=updated), not stale SSR hydration data (q=initial)"
  ).toHaveText("updated");
});
