import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { createAppFixture, createFixture, js } from "./helpers/create-fixture";

let fixture: Fixture;
let appFixture: AppFixture;

////////////////////////////////////////////////////////////////////////////////
// 💿 👋 Hola! It's me, Dora the Remix Disc, I'm here to help you write a great
// bug report pull request.
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
// First, make sure to install dependencies and build Remix. From the root of
// the project, run this:
//
//    ```
//    yarn && yarn build
//    ```
//
// Now try running this test:
//
//    ```
//    yarn bug-report-test
//    ```
//
// You can add `--watch` to the end to have it re-run on file changes:
//
//    ```
//    yarn bug-report-test --watch
//    ```
////////////////////////////////////////////////////////////////////////////////

test.beforeAll(async () => {
  fixture = await createFixture({
    ////////////////////////////////////////////////////////////////////////////
    // 💿 Next, add files to this object, just like files in a real app,
    // `createFixture` will make an app and run your tests against it.
    ////////////////////////////////////////////////////////////////////////////
    files: {
      "app/routes/index.jsx": js`
        import { redirect } from "@remix-run/node";
        import { Form } from "@remix-run/react";
        
        export const action = async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
        
          return redirect("/test");
        };
        
        export default function Index() {
          return (
            <div>
              <h1>Scroll down to test</h1>
        
              <Form method="post" action="/?index" style={{ marginTop: "150vh" }}>
                <h1>Test here</h1>
                <button type="submit">test</button>
              </Form>
            </div>
          );
        }      
      `,

      "app/routes/test.jsx": js`
        export default function Index() {
          return (
            <div>
              <h1>This is the top</h1>
              <h1 style={{ marginTop: "150vh" }}>This is the bottom</h1>
            </div>
          )
        }
      `,
    },
  });

  // This creates an interactive app using puppeteer.
  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

////////////////////////////////////////////////////////////////////////////////
// 💿 Almost done, now write your failing test case(s) down here Make sure to
// add a good description for what you expect Remix to do 👇🏽
////////////////////////////////////////////////////////////////////////////////

test("page scroll should be at the top on the new page", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  // You can test any request your app might get using `fixture`.
  let response = await fixture.requestDocument("/");
  expect(await response.text()).toMatch("Scroll down to test");

  // If you need to test interactivity use the `app`
  await app.goto("/");
  // scroll to the bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await app.clickSubmitButton("/?index");

  expect(await app.getHtml()).toMatch("This is the bottom");

  let newScrollY = await page.evaluate(() => window.scrollY);
  expect(newScrollY).toBe(0);

  // If you're not sure what's going on, you can "poke" the app, it'll
  // automatically open up in your browser for 20 seconds, so be quick!
  // await app.poke(20);

  // Go check out the other tests to see what else you can do.
});

////////////////////////////////////////////////////////////////////////////////
// 💿 Finally, push your changes to your fork of Remix and open a pull request!
////////////////////////////////////////////////////////////////////////////////
