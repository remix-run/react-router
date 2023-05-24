import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { createAppFixture, createFixture, js } from "./helpers/create-fixture";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/root.tsx": js`
        import { Link, Outlet, Scripts, useMatches } from "@remix-run/react";

        export default function App() {
          let matches = 'Number of matches: ' + useMatches().length;
          return (
            <html lang="en">
              <body>
                <nav>
                  <Link to="/nested">/nested</Link>
                  <br />
                  <Link to="/nested/foo">/nested/foo</Link>
                  <br />
                </nav>
                <p>{matches}</p>
                <Outlet />
                <Scripts />
              </body>
            </html>
          );
        }
      `,
      "app/routes/nested/index.jsx": js`
        export default function Index() {
          return <h1>Index</h1>;
        }
      `,
      "app/routes/nested/__pathless.jsx": js`
        import { Outlet } from "@remix-run/react";

        export default function Layout() {
          return (
            <>
              <div>Pathless Layout</div>
              <Outlet />
            </>
          );
        }
      `,
      "app/routes/nested/__pathless/foo.jsx": js`
        export default function Foo() {
          return <h1>Foo</h1>;
        }
      `,
      "app/routes/nested/__pathless2.jsx": js`
        import { Outlet } from "@remix-run/react";

        export default function Layout() {
          return (
            <>
              <div>Pathless 2 Layout</div>
              <Outlet />
            </>
          );
        }
      `,
      "app/routes/nested/__pathless2/bar.jsx": js`
        export default function Bar() {
          return <h1>Bar</h1>;
        }
      `,
    },
  });

  appFixture = await createAppFixture(fixture);
});

test.afterAll(async () => appFixture.close());

test.describe("with JavaScript", () => {
  runTests();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  runTests();
});

/**
 * Routes for this test look like this, for reference for the matches assertions:
 *
 * <Routes>
 *   <Route file="root.jsx">
 *     <Route path="nested" file="routes/nested/__pathless.jsx">
 *       <Route path="foo" file="routes/nested/__pathless/foo.jsx" />
 *     </Route>
 *     <Route path="nested" index file="routes/nested/index.jsx" />
 *     <Route index file="routes/index.jsx" />
 *   </Route>
 * </Routes>
 */

function runTests() {
  test("displays index page and not pathless layout page", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/nested");
    expect(await app.getHtml()).toMatch("Index");
    expect(await app.getHtml()).not.toMatch("Pathless Layout");
    expect(await app.getHtml()).toMatch("Number of matches: 2");
  });

  test("displays page inside of pathless layout", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/nested/foo");
    expect(await app.getHtml()).not.toMatch("Index");
    expect(await app.getHtml()).toMatch("Pathless Layout");
    expect(await app.getHtml()).toMatch("Foo");
    expect(await app.getHtml()).toMatch("Number of matches: 3");
  });

  // This also asserts that we support multiple sibling pathless route layouts
  test("displays page inside of second pathless layout", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/nested/bar");
    expect(await app.getHtml()).not.toMatch("Index");
    expect(await app.getHtml()).toMatch("Pathless 2 Layout");
    expect(await app.getHtml()).toMatch("Bar");
    expect(await app.getHtml()).toMatch("Number of matches: 3");
  });
}
