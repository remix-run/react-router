import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("route module load failures", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/_index.tsx": js`
          import { Form, Link } from "react-router";

          export default function Index() {
            return (
              <div>
                <h1>Home</h1>
                <Link to="/todos?filter=open">Todos</Link>
                <Form method="post" action="/todos">
                  <button type="submit">Submit</button>
                </Form>
              </div>
            );
          }
        `,
        "app/routes/todos.tsx": js`
          export function loader() {
            return null;
          }
          export function action() {
            return null;
          }
          export default function Todos() {
            return <h1 id="todos">Todos</h1>;
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("reloads the navigation target when a route module fails to load during a GET navigation", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    // Fail the first request for the route chunk, then let it through
    let blocked = 0;
    await page.route(/\/assets\/todos-[^/]+\.js$/, (route) =>
      blocked++ === 0 ? route.abort("connectionreset") : route.continue(),
    );
    let documentRequests: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "document") {
        let url = new URL(request.url());
        documentRequests.push(url.pathname + url.search);
      }
    });

    await app.goto("/", true);
    documentRequests = [];
    await page.click('a[href="/todos?filter=open"]');

    await page.waitForSelector("#todos");
    expect(documentRequests).toEqual(["/todos?filter=open"]);
    let url = new URL(page.url());
    expect(url.pathname + url.search).toBe("/todos?filter=open");
  });

  test("reloads the current page when a route module fails to load during a submission", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await page.route(/\/assets\/todos-[^/]+\.js$/, (route) =>
      route.abort("connectionreset"),
    );
    let documentRequests: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "document") {
        documentRequests.push(new URL(request.url()).pathname);
      }
    });

    await app.goto("/", true);
    documentRequests = [];
    await page.click('button[type="submit"]');

    // A submission can't be replayed, so we reload the current page
    await expect.poll(() => documentRequests).toEqual(["/"]);
  });
});
