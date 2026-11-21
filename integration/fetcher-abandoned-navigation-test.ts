import { expect, test } from "@playwright/test";
import type { Route } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

function deferredRoute() {
  let resolve!: (route: Route) => void;
  let promise = new Promise<Route>((res) => (resolve = res));
  return { promise, resolve };
}

test.describe("fetcher reload of an abandoned navigation", () => {
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    let fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import {
            Link, Outlet, Scripts, useFetcher, useFetchers,
            useNavigation, useRevalidator, useSearchParams
          } from "react-router";

          export function Layout({ children }) {
            let navigation = useNavigation();
            let fetchers = useFetchers();
            let mutation = fetchers.find((fetcher) => fetcher.key === "mutation");
            return (
              <html lang="en">
                <head><meta charSet="utf-8" /></head>
                <body>
                  <output data-testid="navigation">{navigation.state}</output>
                  <output data-testid="mutation">{mutation?.state ?? "idle"}</output>
                  {children}
                  <Scripts />
                </body>
              </html>
            );
          }

          export function HydrateFallback() {
            return <p>Loading route data</p>;
          }

          export function ErrorBoundary() {
            return <p role="alert">Route error</p>;
          }

          export default function Root() {
            let fetcher = useFetcher({ key: "mutation" });
            let revalidator = useRevalidator();
            let [search] = useSearchParams();
            return (
              <>
                <fetcher.Form method="post" action="/mutate">
                  <button>Mutate</button>
                </fetcher.Form>
                <Link to={"/previous?outcome=" + search.get("outcome")}>Previous</Link>
                <Link to="/next">Next</Link>
                <button onClick={() => revalidator.revalidate()}>Revalidate</button>
                <Outlet />
              </>
            );
          }
        `,
        "app/routes/current.tsx": js`
          import { useLoaderData } from "react-router";

          export function loader() {
            return "Current data";
          }

          export default function Current() {
            let data = useLoaderData();
            return <main><p>{data}</p><label>Draft<input /></label></main>;
          }
        `,
        "app/routes/previous.tsx": js`
          import { redirect } from "react-router";

          export function loader({ request }) {
            let outcome = new URL(request.url).searchParams.get("outcome");
            if (outcome === "error") throw new Response("Denied", { status: 403 });
            if (outcome === "redirect") return redirect("/redirect");
            return "Previous data";
          }

          export default function Previous() {
            return <p>Previous page</p>;
          }
        `,
        "app/routes/next.tsx": js`
          export function loader() {
            return "Next data";
          }

          export default function Next() {
            return <h1>Next page</h1>;
          }
        `,
        "app/routes/redirect.tsx": js`
          export default function Redirected() {
            return <h1>Stale redirect</h1>;
          }
        `,
        "app/routes/mutate.tsx": js`
          export function action() {
            return { saved: true };
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => appFixture?.close());

  ["data", "error", "redirect"]
    .flatMap((outcome) =>
      ["navigation", "revalidation"].map((interruption) => ({
        outcome,
        interruption,
      })),
    )
    .forEach(({ outcome, interruption }) => {
      test(`preserves the current form when ${interruption} abandons a reload returning ${outcome}`, async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/current?outcome=" + outcome, true);
        await page.getByLabel("Draft").fill("Unsaved draft");

        let mutation = deferredRoute();
        let previous = deferredRoute();
        let reload = deferredRoute();
        let next = deferredRoute();
        let previousRequests = 0;
        await page.route("**/*.data*", (route) => {
          let { pathname } = new URL(route.request().url());
          if (pathname === "/mutate.data") {
            mutation.resolve(route);
          } else if (pathname === "/previous.data") {
            let requests = [previous, reload, next];
            requests[previousRequests++].resolve(route);
          } else if (pathname === "/next.data") {
            next.resolve(route);
          } else {
            return route.continue();
          }
        });

        await page.getByRole("button", { name: "Mutate", exact: true }).click();
        let mutationRequest = await mutation.promise;
        await page.getByRole("link", { name: "Previous", exact: true }).click();
        await previous.promise;
        await mutationRequest.fulfill({
          response: await mutationRequest.fetch(),
        });
        let reloadRequest = await reload.promise;
        if (interruption === "revalidation") {
          await page
            .getByRole("button", { name: "Revalidate", exact: true })
            .click();
        } else {
          await page.getByRole("link", { name: "Next", exact: true }).click();
        }
        let nextRequest = await next.promise;

        // The old reload settles while its replacement remains pending.
        await reloadRequest.fulfill({ response: await reloadRequest.fetch() });
        await expect(page.getByTestId("mutation")).toHaveText("idle");
        await expect(page.getByTestId("navigation")).toHaveText("loading");
        await expect(page.getByLabel("Draft")).toHaveValue("Unsaved draft");
        await expect(
          page.getByText("Current data", { exact: true }),
        ).toBeVisible();
        await expect(page.getByRole("alert")).toHaveCount(0);
        await expect(page).toHaveURL(
          appFixture.serverUrl + "/current?outcome=" + outcome,
        );

        await nextRequest.fulfill({ response: await nextRequest.fetch() });
        await expect(page.getByTestId("navigation")).toHaveText("idle");
        if (interruption === "navigation") {
          await expect(page).toHaveURL(appFixture.serverUrl + "/next");
          await expect(
            page.getByRole("heading", { name: "Next page" }),
          ).toBeVisible();
        } else if (outcome === "error") {
          await expect(page).toHaveURL(
            appFixture.serverUrl + "/previous?outcome=error",
          );
          await expect(page.getByRole("alert")).toHaveText("Route error");
        } else if (outcome === "redirect") {
          await expect(page).toHaveURL(appFixture.serverUrl + "/redirect");
          await expect(
            page.getByRole("heading", { name: "Stale redirect" }),
          ).toBeVisible();
        } else {
          await expect(page).toHaveURL(
            appFixture.serverUrl + "/previous?outcome=data",
          );
          await expect(
            page.getByText("Previous page", { exact: true }),
          ).toBeVisible();
        }
      });
    });
});
