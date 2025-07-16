import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

////////////////////////////////////////////////////////////////////////////////
// 👋 Hola! I'm here to help you write a great bug report pull request.
//
// You don't need to fix the bug, this is just to report one.
//
// The pull request you are submitting is supposed to fail when created, to let
// the team see the erroneous behavior, and understand what's going wrong.
//
// If you happen to have a fix as well, it will have to be applied in a subsequent
// commit to this pull request, and your now-succeeding test will have to be moved
// to the appropriate file.
//
// First, make sure to install dependencies and build React Router. From the root of
// the project, run this:
//
//    ```
//    pnpm install && pnpm build
//    ```
//
// If you have never installed playwright on your system before, you may also need
// to install a browser engine:
//
//    ```
//    pnpm exec playwright install chromium
//    ```
//
// Now try running this test:
//
//    ```
//    pnpm test:integration bug-report --project chromium
//    ```
//
// You can add `--watch` to the end to have it re-run on file changes:
//
//    ```
//    pnpm test:integration bug-report --project chromium --watch
//    ```
////////////////////////////////////////////////////////////////////////////////

test.beforeEach(async ({ context }) => {
  await context.route(/\.data$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    route.continue();
  });
});

test.beforeAll(async () => {
  fixture = await createFixture({
    ////////////////////////////////////////////////////////////////////////////
    // 💿 Next, add files to this object, just like files in a real app,
    // `createFixture` will make an app and run your tests against it.
    ////////////////////////////////////////////////////////////////////////////
    files: {
      "app/routes/use-params.$id.tsx": js`
        import { useParams } from "react-router";

        export default function ItemPage() {
          let params = useParams();
          return <div data-testid="item-id">Item ID: {params.id}</div>;
        }
      `,

      "app/routes/match-path.$id.tsx": js`
        import { matchPath, useLocation } from "react-router";

        export default function ItemPage() {
          const location = useLocation()
          const match = matchPath({ path: '/match-path/:id' }, location.pathname)
          return <div data-testid="item-id">Item ID: {match.params.id}</div>;
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

////////////////////////////////////////////////////////////////////////////////
// 💿 Almost done, now write your failing test case(s) down here Make sure to
// add a good description for what you expect React Router to do 👇🏽
////////////////////////////////////////////////////////////////////////////////

test("useParams should not decode param containing double-encoded forward slash", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  const encodedId = encodeURIComponent(encodeURIComponent("beforeslash/afterslash@"));
  await app.goto(`/use-params/${encodedId}`);
  let el = page.locator("[data-testid='item-id']");
  await expect(el).toHaveText(`Item ID: ${encodedId}`);
});

test("matchPath should not decode param containing double-encoded forward slash", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  const encodedId = encodeURIComponent(encodeURIComponent("beforeslash/afterslash@"));
  await app.goto(`/match-path/${encodedId}`);
  let el = page.locator("[data-testid='item-id']");
  await expect(el).toHaveText(`Item ID: ${encodedId}`);
});

////////////////////////////////////////////////////////////////////////////////
// 💿 Finally, push your changes to your fork of React Router
// and open a pull request!
////////////////////////////////////////////////////////////////////////////////
