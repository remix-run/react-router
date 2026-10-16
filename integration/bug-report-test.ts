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

test.describe("fetcher revalidation during a redirected navigation", () => {
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    let fixture = await createFixture({
      files: {
        "app/root.tsx": js`
          import {
            Form, Outlet, Scripts, useFetcher, useFetchers, useNavigation
          } from "react-router";

          export function loader() {
            return "root";
          }

          export function Layout({ children }) {
            let navigation = useNavigation();
            let fetchers = useFetchers();
            let background = fetchers.find((fetcher) => fetcher.key === "background");
            return (
              <html lang="en">
                <head><meta charSet="utf-8" /></head>
                <body>
                  <output data-testid="navigation">{navigation.state}</output>
                  <output data-testid="background">{background?.state ?? "idle"}</output>
                  {children}
                  <Scripts />
                </body>
              </html>
            );
          }

          export function HydrateFallback() {
            return <p>Loading route data</p>;
          }

          export default function Root() {
            let fetcher = useFetcher({ key: "background" });
            return (
              <>
                <fetcher.Form method="post" action="/mutate">
                  <button>Mutate</button>
                </fetcher.Form>
                <Form method="post" action="/save">
                  <button>Save</button>
                </Form>
                <Outlet />
              </>
            );
          }
        `,
        "app/routes/layout.tsx": js`
          import { Outlet, useLoaderData } from "react-router";

          export function loader() {
            return "Layout data";
          }

          export function shouldRevalidate() {
            return false;
          }

          export default function Layout() {
            return <main><p>{useLoaderData()}</p><Outlet /></main>;
          }
        `,
        "app/routes/layout.$id.tsx": js`
          import { useLoaderData } from "react-router";

          export function loader({ params }) {
            return params.id;
          }

          export default function Child() {
            return <p>Child {useLoaderData()}</p>;
          }
        `,
        "app/routes/save.tsx": js`
          import { redirect } from "react-router";

          export function action() {
            return redirect("/layout/next");
          }
        `,
        "app/routes/mutate.tsx": js`
          export function action() {
            return { ok: true };
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => appFixture?.close());

  test("preserves skipped layout data when a background reload finishes before navigation", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/layout/start", true);
    await expect(page.getByText("Child start", { exact: true })).toBeVisible();

    let mutation = deferredRoute();
    let save = deferredRoute();
    let backgroundLoad = deferredRoute();
    let navigationLoad = deferredRoute();
    await page.route("**/*.data*", (route) => {
      let { pathname } = new URL(route.request().url());
      let method = route.request().method();
      if (pathname === "/mutate.data" && method === "POST") {
        mutation.resolve(route);
      } else if (pathname === "/save.data" && method === "POST") {
        save.resolve(route);
      } else if (pathname === "/save.data" && method === "GET") {
        backgroundLoad.resolve(route);
      } else if (pathname === "/layout/next.data" && method === "GET") {
        navigationLoad.resolve(route);
      } else {
        return route.continue();
      }
    });

    await page.getByRole("button", { name: "Mutate", exact: true }).click();
    let mutationRequest = await mutation.promise;
    await page.getByRole("button", { name: "Save", exact: true }).click();
    let saveRequest = await save.promise;
    await expect(page.getByTestId("navigation")).toHaveText("submitting");

    await mutationRequest.fulfill({ response: await mutationRequest.fetch() });
    let backgroundRequest = await backgroundLoad.promise;
    await saveRequest.fulfill({ response: await saveRequest.fetch() });
    let navigationRequest = await navigationLoad.promise;
    await expect(page.getByTestId("navigation")).toHaveText("loading");

    // The redirect has selected layout data for reuse before the background merge runs.
    expect(
      new URL(navigationRequest.request().url()).searchParams
        .get("_routes")
        ?.split(",")
        .sort(),
    ).toEqual(["root", "routes/layout.$id"]);
    await backgroundRequest.fulfill({
      response: await backgroundRequest.fetch(),
    });
    await expect(page.getByTestId("background")).toHaveText("idle");
    await navigationRequest.fulfill({
      response: await navigationRequest.fetch(),
    });

    await expect(page.getByTestId("navigation")).toHaveText("idle");
    await expect(page).toHaveURL(appFixture.serverUrl + "/layout/next");
    await expect(page.getByText("Layout data", { exact: true })).toBeVisible();
    await expect(page.getByText("Child next", { exact: true })).toBeVisible();
  });
});
