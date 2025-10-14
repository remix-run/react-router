import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  css,
  js,
} from "./helpers/create-fixture.js";

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
      "app/routes.ts": js`
        import { type RouteConfig, index, route } from "@react-router/dev/routes";

        export default [
          index("routes/home.tsx"),
          route("company", "routes/layout.tsx", [
            route("books", "routes/books/route.tsx"),
            route("publishers", "routes/publishers/route.tsx"),
          ]),
        ] satisfies RouteConfig;
      `,

      "app/components/Icon.module.css": css`
        .icon {
          width: 20px;
          height: 20px;
          background-color: green;
        }
      `,

      "app/components/Icon.tsx": js`
        import styles from "./Icon.module.css";

        export const Icon = () => {
          return <div data-testid="icon" className={styles.icon} />;
        }
      `,

      "app/components/LazyIcon.tsx": js`
        import { lazy, Suspense } from "react";

        const Icon = lazy(() =>
          import("../components/Icon").then((m) => ({ default: m.Icon }))
        );

        const LazyIcon = ({ show }: { show: boolean }) => {
          if (!show) return null;

          return (
            <Suspense fallback={<div>Loading...</div>}>
              <Icon />
            </Suspense>
          );
        };

        export { LazyIcon };
      `,

      "app/routes/home.tsx": js`
        import { redirect } from "react-router";

        export const loader = () => {
          return redirect("/company/books");
        };
      `,

      "app/routes/layout.tsx": js`
        import { Link, Outlet } from "react-router";

        import { LazyIcon } from "../components/LazyIcon";
        import { useState, useEffect } from "react";

        export default function Layout() {
          const [hydrated, setHydrated] = useState(false);
          const [show, setShow] = useState(false);

          useEffect(() => {
            setShow(true);
          },[])

          return (
            <div style={{ border: "1px solid blue" }}>
              <h1>Layout</h1>
              <nav>
                <Link to="/company/books">Books</Link>
                <Link to="/company/publishers">Publishers</Link>
              </nav>
              <div>
                <LazyIcon show={show} />
              </div>
              <div style={{ border: "1px solid red" }}>
                <Outlet />
              </div>
            </div>
          );
        }
      `,

      "app/routes/books/route.tsx": js`
        import { Icon } from "../../components/Icon";

        export default function BooksRoute() {
          return (
            <>
              <h1>Books</h1>
              <div>
                <Icon />
              </div>
            </>
          );
        }

      `,

      "app/routes/publishers/route.tsx": js`
        export default function PublishersRoute() {
          return <h1>Publishers</h1>;
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

test("should preserve the CSS from the lazy loaded component even when it's in the route css manifest", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");

  expect(await page.getByTestId("icon").all()).toHaveLength(1);

  // check the head for a link to the css that includes the word `Icon`
  const links1 = await page.$$("link");
  let found1 = false;
  for (const link of links1) {
    const href = await link.getAttribute("href");
    if (href?.includes("Icon") && href.includes("css")) {
      found1 = true;
    }
  }

  expect(found1).toBe(true);

  // wait for the loading to be gone before checking the lazy loaded component has resolved
  await expect(page.getByText("Loading...")).toHaveCount(0);
  expect(await page.getByTestId("icon").all()).toHaveLength(2);

  await app.poke(60);

  await app.clickLink("/company/publishers");

  expect(await page.getByTestId("icon").all()).toHaveLength(1);

  const links2 = await page.$$("link");
  let found2 = false;
  for (const link of links2) {
    const href = await link.getAttribute("href");
    if (href?.includes("Icon") && href.includes("css")) {
      found2 = true;
    }
  }

  expect(found2).toBe(true);
});
