import { expect, test } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/entry.server.tsx": js`
        import * as React from "react";
        import { RemixServer } from "@remix-run/react";
        import { renderToString } from "react-dom/server";

        export default function handleRequest(
          request,
          responseStatusCode,
          responseHeaders,
          remixContext
        ) {
          let markup = renderToString(
            <RemixServer context={remixContext} url={request.url} />
          );
          responseHeaders.set("Content-Type", "text/html");
          responseHeaders.set("x-custom-header", "custom-value");
          return new Response('<!doctype html>' + markup, {
            headers: responseHeaders,
            status: responseStatusCode,
          });
        }
      `,
      "app/routes/_index.tsx": js`
        export default function Index() {
          return <h1>Hello World</h1>
        }
      `,
    },
  });

  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

test("allows user specified entry.server", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  let responses = app.collectResponses((url) => url.pathname === "/");
  await app.goto("/");
  let header = await responses[0].headerValues("x-custom-header");
  expect(header).toEqual(["custom-value"]);
});
