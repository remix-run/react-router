import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { validateRSCHtml } from "./rsc/utils.js";

for (let component of ["client", "server"]) {
  ["resolve", "promise"].forEach((prop) => {
    test.describe(`RSC Framework: <Await ${prop}> in ${component} route components`, () => {
      let fixture: Fixture;
      let appFixture: AppFixture;

      test.beforeAll(async () => {
        fixture = await createFixture({
          templateName: "rsc-vite-framework",
          files: {
            "app/await-client.tsx": js`
          "use client";
          import { useEffect, useState } from "react";
          import { useAsyncError, useAsyncValue } from "react-router";

          function Hydrated() {
            let [hydrated, setHydrated] = useState(false);
            useEffect(() => setHydrated(true), []);
            return <span id="hydrated">{hydrated ? "hydrated" : "pending"}</span>;
          }

          export function Value({ value }) {
            return <>
              <p id="resolved">{value}</p>
              <p id="async-value">{useAsyncValue()}</p>
              <Hydrated />
            </>;
          }

          export function ErrorValue() {
            let error = useAsyncError();
            return <>
              <p id="error">{error instanceof Error ? "ERROR_ELEMENT" : "MISSING_ERROR"}</p>
              <Hydrated />
            </>;
          }
        `,
            "app/routes/await-resolve.tsx": js`
          import { Suspense } from "react";
          import { Await } from "react-router";
          import { Value } from "../await-client";

          export function loader() {
            return {
              slow: new Promise((r) => setTimeout(() => r("RESOLVED_VALUE"), 100)),
            };
          }

          export ${component === "server" ? "" : "default "}function ${component === "server" ? "ServerComponent" : "AwaitResolve"}({ loaderData }) {
            return (
              <Suspense fallback={<p id="fallback">loading</p>}>
                <Await ${prop}={loaderData.slow}>
                  {(value) => <Value value={value} />}
                </Await>
              </Suspense>
            );
          }
        `,
            "app/routes/await-reject.tsx": js`
          import { Suspense } from "react";
          import { Await } from "react-router";
          import { ErrorValue } from "../await-client";

          export function loader() {
            let slow = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("REJECTED")), 100)
            );
            slow.catch(() => {});
            return { slow };
          }

          export ${component === "server" ? "" : "default "}function ${component === "server" ? "ServerComponent" : "AwaitReject"}({ loaderData }) {
            return (
              <Suspense fallback={<p id="fallback">loading</p>}>
                <Await
                  ${prop}={loaderData.slow}
                  errorElement={<ErrorValue />}
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
        expect(html).toContain('<p id="async-value">RESOLVED_VALUE</p>');

        let errors: string[] = [];
        page.on("console", (msg) => {
          if (msg.type() === "error") errors.push(msg.text());
        });
        page.on("pageerror", (error) => errors.push(error.message));

        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/await-resolve");
        await expect(page.locator("#resolved")).toHaveText("RESOLVED_VALUE");
        await expect(page.locator("#async-value")).toHaveText("RESOLVED_VALUE");
        await expect(page.locator("#hydrated")).toHaveText("hydrated");
        validateRSCHtml(await page.content());
        expect(errors).toEqual([]);
      });

      test("server renders the errorElement for rejected loader promises", async ({
        page,
      }) => {
        let response = await fixture.requestDocument("/await-reject");
        let html = await response.text();

        expect(html).not.toContain("<!--$!-->");
        expect(html).toContain('<p id="error">ERROR_ELEMENT</p>');

        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/await-reject");
        await expect(page.locator("#error")).toHaveText("ERROR_ELEMENT");
        await expect(page.locator("#hydrated")).toHaveText("hydrated");
        validateRSCHtml(await page.content());
      });
    });
  });
}
