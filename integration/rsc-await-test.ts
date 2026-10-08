import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { validateRSCHtml } from "./rsc/utils.js";

test.describe("RSC Framework: <Await> in client route components", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      templateName: "rsc-vite-framework",
      files: {
        "app/routes/await-resolve.tsx": js`
          import { Suspense } from "react";
          import { Await } from "react-router";

          export function loader() {
            return {
              slow: new Promise((r) => setTimeout(() => r("RESOLVED_VALUE"), 100)),
            };
          }

          export default function AwaitResolve({ loaderData }) {
            return (
              <Suspense fallback={<p id="fallback">loading</p>}>
                <Await resolve={loaderData.slow}>
                  {(value) => <p id="resolved">{value}</p>}
                </Await>
              </Suspense>
            );
          }
        `,
        "app/routes/await-reject.tsx": js`
          import { Suspense } from "react";
          import { Await } from "react-router";

          export function loader() {
            let slow = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("REJECTED")), 100)
            );
            slow.catch(() => {});
            return { slow };
          }

          export default function AwaitReject({ loaderData }) {
            return (
              <Suspense fallback={<p id="fallback">loading</p>}>
                <Await
                  resolve={loaderData.slow}
                  errorElement={<p id="error">ERROR_ELEMENT</p>}
                >
                  {(value) => <p id="resolved">{value}</p>}
                </Await>
              </Suspense>
            );
          }
        `,
      },
    });
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture?.close();
  });

  test("server renders resolved loader promises and hydrates without errors", async ({
    page,
  }) => {
    let response = await fixture.requestDocument("/await-resolve");
    let html = await response.text();
    // `<!--$!-->` marks a Suspense boundary that errored during SSR and was
    // handed off to the client to render
    expect(html).not.toContain("<!--$!-->");
    expect(html).toContain('<p id="resolved">RESOLVED_VALUE</p>');

    let errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/await-resolve");
    await expect(page.locator("#resolved")).toHaveText("RESOLVED_VALUE");
    validateRSCHtml(await page.content());
    expect(errors).toEqual([]);
  });

  test("server renders the errorElement for rejected loader promises", async () => {
    let response = await fixture.requestDocument("/await-reject");
    let html = await response.text();

    expect(html).not.toContain("<!--$!-->");
    expect(html).toContain('<p id="error">ERROR_ELEMENT</p>');
  });
});
