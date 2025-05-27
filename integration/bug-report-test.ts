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
      "app/routes/_layout.tsx": js`
        import { Outlet } from "react-router";

        function dummyApiCall() {
          return new Promise((resolve, reject) => {
            setTimeout(resolve, 1000)
          })
        }

        // [WORKAROUND 1]: If the layout does not define a loader (by commenting this out), the process does not crash
        export async function loader() {
          await dummyApiCall();
          return {}
        }

        export default function Layout() {
          return (
            <div>
              Layout
              <Outlet/>
            </div>
          )
        }
      `,

      "app/routes/_layout._index.tsx": js`
        import { Suspense } from "react";
        import { Await, useLoaderData } from "react-router";

        function dummyApiCall() {
          return new Promise<any>((_, reject) => {
            // [WORKAROUND 2]: If the index's loader takes longer to resolve (e.g. 1500) than the layout's the process does not crash
            setTimeout(reject, 500)
          })
        }

        export function loader() {
          return { promise: dummyApiCall() }
        }

        export default function Home() {
          const { promise } = useLoaderData<typeof loader>()

          return <Suspense fallback={<div>Loading</div>}>
            <Await resolve={promise} errorElement={<HomeError />}>{() => <HomeSuccess />}</Await>
          </Suspense>
        }

        function HomeSuccess() {
          return <div>This is not expected because the promise was rejected</div>
        }

        function HomeError() {
          return <div>Error, but the good kind!</div>
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

test("route renders suspense error when route loader rejects before layout loader completes", async ({ page }) => {
  let response = await fixture.requestDocument("/");
  expect(await response.text()).toMatch("Error, but the good kind");
  // await app.poke(20);
});

////////////////////////////////////////////////////////////////////////////////
// 💿 Finally, push your changes to your fork of React Router
// and open a pull request!
////////////////////////////////////////////////////////////////////////////////
