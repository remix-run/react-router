import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
  json,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "node_modules/has-side-effects/package.json": json({
        name: "has-side-effects",
        version: "1.0.0",
        main: "index.js",
      }),

      "node_modules/has-side-effects/index.js": js`
        let message;
        (() => { message = process.env.___SOMETHING___ || "hello, world"; })();
        module.exports = () => message;
      `,

      "app/routes/_index.tsx": js`
        import { json } from "@remix-run/node";
        import { useLoaderData, Link } from "@remix-run/react";
        import sideEffectModules from "has-side-effects";

        export let loader = () => json(sideEffectModules());

        export default function Index() {
          let data = useLoaderData();

          return (
            <div>
              {data}
              <Link to="/burgers">Other Route</Link>
            </div>
          )
        }
      `,
    },
  });

  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

test.skip("should log relevant error message", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");
  expect(await app.getHtml()).toMatch(
    "https://remix.run/pages/gotchas#server-code-in-client-bundles"
  );
});
