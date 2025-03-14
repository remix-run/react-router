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
    spaMode: true,
    files: {
      "app/routes/_index.tsx": js`
        import { redirect } from "react-router";

        export function clientLoader() {
          return redirect("/somewhere")
        }

        export default function Index() {
          return (
            <div data-testid="index-component">index</div>
          )
        }
      `,

      "app/routes/somewhere.tsx": js`
        export async function clientLoader() {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return {text: "somewhere"}
        }

        export default function Somewhere({loaderData}) {
          return <div data-testid="somewhere-component">{loaderData.text}</div>;
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

test("SPA: Expect not to render the Component if clientLoader has redirected", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  // // You can test any request your app might get using `fixture`.
  // let response = await fixture.requestDocument("/");
  // expect(await response.text()).toMatch("pizza");

  // If you need to test interactivity use the `app`
  await app.goto("/");
  await expect(page.getByTestId("index-component")).not.toBeDefined();
  await expect(page.getByTestId("somewhere-component")).toBeDefined();

  // If you're not sure what's going on, you can "poke" the app, it'll
  // automatically open up in your browser for 20 seconds, so be quick!
  // await app.poke(20);

  // Go check out the other tests to see what else you can do.
});

////////////////////////////////////////////////////////////////////////////////
// 💿 Finally, push your changes to your fork of React Router
// and open a pull request!
////////////////////////////////////////////////////////////////////////////////
