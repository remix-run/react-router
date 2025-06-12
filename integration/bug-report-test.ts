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
      "app/routes.ts": js`
        import { type RouteConfig } from "@react-router/dev/routes";  
        import { flatRoutes } from "@react-router/fs-routes";

        export default flatRoutes() satisfies RouteConfig;
      `,

      "app/routes/_index.tsx": js`
        import { href } from "react-router";
        import type { Route } from "./+types/_index";

        export function loader() {
          return { id: "a123" };
        }

        export default function Home({ loaderData }: Route.ComponentProps) {
          return (
            <div>
              <ul>
                <li>
                  <a href={href("/text/:id.txt", { id: loaderData.id })} id="with-href">
                    View text file for id {loaderData.id} with href()
                  </a>
                </li>
                <li>
                  <a href={${"`"}/text/\${loaderData.id}.txt${"`"}} id="with-template-string">
                    View text file for id {loaderData.id} with template string
                  </a>
                </li>
              </ul>
            </div>
          );
        }
      `,

      "app/routes/text.$id[.txt].ts": js`
        import type { Route } from "./+types/text.$id[.txt]";

        export async function loader({ params }: Route.LoaderArgs) {
          const text = "The text file content for id: " + params.id;
          return new Response(text, {
            status: 200,
            headers: {
              "Content-Type": "text/plain",
            },
          });
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

test("link from template string is correct", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");
  await app.clickElement("a#with-template-string");
  await page.waitForURL("**/text/**");
  let content = await page.content();
  await expect(content).toContain("The text file content for id:");
});

test("link from href is correct", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");
  await app.clickElement("a#with-href");
  await page.waitForURL("**/text/**");
  let content = await page.content();
  await expect(content).toContain("The text file content for id:");
});

////////////////////////////////////////////////////////////////////////////////
// 💿 Finally, push your changes to your fork of React Router
// and open a pull request!
////////////////////////////////////////////////////////////////////////////////
