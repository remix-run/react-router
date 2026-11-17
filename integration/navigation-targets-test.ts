import { test, expect } from "@playwright/test";
import {
  createFixture,
  createAppFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

for (let templateName of ["vite-6-template", "rsc-vite-framework"] as const) {
  test.describe(`navigation targets: ${templateName}`, () => {
    let app: AppFixture;
    test.beforeAll(async () => {
      let fixture = await createFixture({
        templateName,
        files: {
          "app/routes/_index.tsx": js`
            "use client";
            import * as React from "react";
            import { useFetcher } from "react-router";
            export default function Index() {
              let fetcher = useFetcher();
              let [target, setTarget] = React.useState("/target");
              let [error, setError] = React.useState("");
              async function run(submit) {
                setError("");
                try {
                  if (submit) {
                    await fetcher.submit({ message: "local form data" }, { method: "post", action: target });
                  } else {
                    await fetcher.load(target);
                  }
                } catch (error) {
                  setError((submit ? "Submit" : "Load") + ": " + error.message);
                }
              }
              return <>
                <input aria-label="Target" value={target} onChange={e => setTarget(e.target.value)} />
                <button onClick={() => run(false)}>Load</button>
                <button onClick={() => run(true)}>Submit</button>
                <p id="error">{error}</p>
                <pre id="data">{JSON.stringify(fetcher.data)}</pre>
              </>;
            }
          `,
          "app/routes/target.tsx": js`
            export function loader() { return { value: "local loader" }; }
            export async function action({ request }) {
              return { value: (await request.formData()).get("message") };
            }
            export default function Target({ loaderData, actionData }) {
              return <h1>{actionData?.value || loaderData?.value}</h1>;
            }
          `,
          "app/routes/paths.tsx": js`
            import { Link, Form, href, generatePath } from "react-router";
            export default function Paths() {
              return <>
                <Link id="href" reloadDocument to={href("/:lang?/*", { "*": "/target" })}>href</Link>
                <Link id="generate" reloadDocument to={generatePath("/*", { "*": "/target" })}>generatePath</Link>
                <Link id="generate-mixed" reloadDocument to={generatePath("/*", { "*": "\\target" })}>Mixed separators</Link>
                <Link id="generate-query" reloadDocument to={generatePath("/*", { "*": "target?value=a%20b#top" })}>Query and hash</Link>
                <Form reloadDocument method="post" action={href("/:first/:second", { first: "", second: "target" })}>
                  <input name="message" defaultValue="native form data" />
                  <button>Native submit</button>
                </Form>
              </>;
            }
          `,
          "app/routes/native.tsx": js`
            import { Link, Form } from "react-router";
            export function loader({ request }) {
              let url = new URL(request.url);
              return { to: url.searchParams.get("to"), kind: url.searchParams.get("kind") };
            }
            export default function Native({ loaderData }) {
              return loaderData.kind === "form"
                ? <Form reloadDocument action={loaderData.to} method="post"><button>Submit</button></Form>
                : <Link reloadDocument to={loaderData.to}>Native link</Link>;
            }
          `,
          "app/routes/redirect.tsx": js`
            import { redirect } from "react-router";
            export function loader({ request }) {
              let url = new URL(request.url);
              let to = url.searchParams.get("to");
              return url.searchParams.has("raw")
                ? new Response(null, { status: 302, headers: { Location: to } })
                : redirect(to);
            }
            export default function Redirect() { return <h1>Redirect</h1>; }
          `,
        },
      });
      app = await createAppFixture(fixture);
    });
    test.afterAll(() => app.close());

    test("resolves generated link and form paths without JavaScript", async ({
      browser,
    }) => {
      let context = await browser.newContext({ javaScriptEnabled: false });
      try {
        let page = await context.newPage();
        let fixture = new PlaywrightFixture(app, page);
        for (let id of [
          "href",
          "generate",
          "generate-mixed",
          "generate-query",
        ]) {
          await fixture.goto("/paths");
          expect(
            await page
              .locator(`#${id}`)
              .evaluate((a: HTMLAnchorElement) => a.origin),
          ).toBe(app.serverUrl);
          await page.locator(`#${id}`).click();
          await expect(page.locator("h1")).toHaveText("local loader");
          expect(new URL(page.url()).origin).toBe(app.serverUrl);
          if (id === "generate-query") {
            expect(new URL(page.url()).search).toBe("?value=a%20b");
            expect(new URL(page.url()).hash).toBe("#top");
          }
        }
        await fixture.goto("/paths");
        await page.getByRole("button", { name: "Native submit" }).click();
        await expect(page.locator("h1")).toHaveText("native form data");
        expect(new URL(page.url()).origin).toBe(app.serverUrl);
      } finally {
        await context.close();
      }
    });

    test("validates native link and form URLs without JavaScript", async ({
      browser,
    }) => {
      let context = await browser.newContext({ javaScriptEnabled: false });
      try {
        let page = await context.newPage();
        let fixture = new PlaywrightFixture(app, page);
        for (let [kind, to] of [
          ["link", "/\\destination.invalid/target"],
          ["form", "/\t/destination.invalid/target"],
        ]) {
          await fixture.goto("/native?" + new URLSearchParams({ kind, to }));
          await expect(page.locator("a, form")).toHaveCount(0);
        }
        let to = "http://destination.invalid/target";
        await page.route(to, (route) =>
          route.fulfill({ body: "Explicit external destination" }),
        );
        await fixture.goto(
          "/native?" + new URLSearchParams({ kind: "link", to }),
        );
        await page.getByRole("link", { name: "Native link" }).click();
        await expect(page.locator("body")).toHaveText(
          "Explicit external destination",
        );
      } finally {
        await context.close();
      }
    });

    test("validates redirect responses and preserves supported URL formats", async ({
      request,
    }) => {
      for (let raw of [false, true]) {
        let query = new URLSearchParams({
          to: "/\\destination.invalid/target",
          ...(raw ? { raw: "1" } : {}),
        });
        let response = await request.get(app.serverUrl + "/redirect?" + query, {
          maxRedirects: 0,
        });
        expect(response.status()).toBe(500);
        expect(response.headers().location).toBeUndefined();
      }
      let to = "//destination.invalid/target";
      let response = await request.get(
        app.serverUrl + "/redirect?" + new URLSearchParams({ to }),
        { maxRedirects: 0 },
      );
      expect(response.status()).toBe(302);
      expect(response.headers().location).toBe(to);
    });

    test("applies fetcher path validation to loads and submissions", async ({
      page,
    }) => {
      let externalRequests: string[] = [];
      await page.route("http://destination.invalid/**", (route) => {
        externalRequests.push(route.request().url());
        return route.fulfill({
          headers: { "Access-Control-Allow-Origin": "*" },
          body: "External response",
        });
      });
      let fixture = new PlaywrightFixture(app, page);
      await fixture.goto("/", true);
      await page.getByLabel("Target").fill("/\t/destination.invalid/target");
      for (let name of ["Load", "Submit"]) {
        await page.getByRole("button", { name, exact: true }).click();
        await expect(page.locator("#error")).toHaveText(
          name + ": External navigation is not allowed",
        );
      }
      expect(externalRequests).toEqual([]);
      await page.getByLabel("Target").fill("/target");
      await page.getByRole("button", { name: "Load", exact: true }).click();
      await expect(page.locator("#data")).toHaveText(
        '{"value":"local loader"}',
      );
      await page.getByRole("button", { name: "Submit", exact: true }).click();
      await expect(page.locator("#data")).toHaveText(
        '{"value":"local form data"}',
      );
      await expect(page.locator("#error")).toBeEmpty();
    });
  });
}
