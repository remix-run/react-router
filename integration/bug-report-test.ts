import { expect, test } from "@playwright/test";

import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeEach(async ({ context }) => {
  await context.route(/\.data$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    route.continue();
  });
});

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes/_index.tsx": js`
      import { useSearchParams } from "react-router";

      export default function Test() {
        const [_, setSearch] = useSearchParams();
        const handleClick = () => {

          // Two separate calls to setSearch that update different params
          // This should work since we are using the updater function form of setSearch

          setSearch((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.set("count1", "1");
            return newParams;
          });

          setSearch((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.set("count2", "1");
            return newParams;
          });
        };
        return <button className="btn" onClick={handleClick}>Click me</button>;
      }

      `,
    },
  });

  // This creates an interactive app using playwright.
  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

test("should update both counts", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  let response = await fixture.requestDocument("/");
  expect(await response.text()).toContain("Click me");

  await app.goto("/");
  await app.clickElement(".btn");
  await page.waitForTimeout(100); // wait for updates
  const urlParams = new URLSearchParams(page.url().split("?")[1]);
  expect(urlParams.get("count1")).toBe("1");
  expect(urlParams.get("count2")).toBe("1");
});
