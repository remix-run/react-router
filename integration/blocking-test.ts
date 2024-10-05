import { test, expect } from "@playwright/test";

import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import {
  createFixture,
  js,
  createAppFixture,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

test.afterAll(() => appFixture.close());

test("handles synchronous proceeding correctly", async ({ page }) => {
  fixture = await createFixture({
    files: {
      "app/routes/_index.tsx": js`
        import { Link } from "react-router";
        export default function Component() {
          return (
            <div>
              <h1 id="index">Index</h1>
              <Link to="/a">/a</Link>
            </div>
          )
        }
      `,
      "app/routes/a.tsx": js`
        import { Link } from "react-router";
        export default function Component() {
          return (
            <div>
              <h1 id="a">A</h1>
              <Link to="/b">/b</Link>
            </div>
          )
        }
      `,
      "app/routes/b.tsx": js`
      import * as React from "react";
      import { Form, useAction, useBlocker } from "react-router";
        export default function Component() {
          return (
            <div>
              <h1 id="b">B</h1>
              <ImportantForm />
            </div>
          )
        }
        function ImportantForm() {
          let [value, setValue] = React.useState("");
          let shouldBlock = React.useCallback<BlockerFunction>(
            ({ currentLocation, nextLocation }) =>
              value !== "" && currentLocation.pathname !== nextLocation.pathname,
            [value]
          );
          let blocker = useBlocker(shouldBlock);
          // Reset the blocker if the user cleans the form
          React.useEffect(() => {
            if (blocker.state === "blocked") {
              blocker.proceed();
            }
          }, [blocker]);
          return (
            <>
              <p>
                Is the form dirty?{" "}
                {value !== "" ? (
                  <span style={{ color: "red" }}>Yes</span>
                ) : (
                  <span style={{ color: "green" }}>No</span>
                )}
              </p>
              <Form method="post">
                <label>
                  Enter some important data:
                  <input
                    name="data"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </label>
                <button type="submit">Save</button>
              </Form>
            </>
          );
        }
      `,
    },
  });

  // This creates an interactive app using puppeteer.
  appFixture = await createAppFixture(fixture);

  let app = new PlaywrightFixture(appFixture, page);

  await app.goto("/");
  await app.clickLink("/a");
  await page.waitForSelector("#a");
  await app.clickLink("/b");
  await page.waitForSelector("#b");
  await page.getByLabel("Enter some important data:").fill("Hello Remix!");

  // Going back should:
  // - block
  // - immediately call blocker.proceed() once we enter the blocked state
  // - and land back one history entry (/a)
  await page.goBack();
  await page.waitForSelector("#a");
  expect(await app.getHtml()).toContain("A");
});
