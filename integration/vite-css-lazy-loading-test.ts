import { type Page, test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import {
  type Fixture,
  type AppFixture,
  createAppFixture,
  createFixture,
  css,
  js,
} from "./helpers/create-fixture.js";

const ANY_CSS_LINK_SELECTOR = "link[rel='stylesheet'][href*='css-component']";
// Links with a trailing hash are only ever managed by React Router, not
// Vite's dynamic CSS injection logic
const ROUTE_CSS_LINK_SELECTOR = `${ANY_CSS_LINK_SELECTOR}[href$='#']`;

function getCssComponentColor(page: Page) {
  return page
    .locator("[data-css-component]")
    .first()
    .evaluate((el) => window.getComputedStyle(el).color);
}

test.describe("Vite CSS lazy loading", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/components/css-component.module.css": css`
          .test {
            color: rgb(0, 128, 0);
            font-family: sans-serif;
            font-weight: bold;
          }
        `,

        "app/components/css-component.tsx": js`
          import styles from "./css-component.module.css";
          export default function CssComponent() {
            return <p data-css-component className={styles.test}>This text should be green.</p>;
          }
        `,

        "app/components/load-lazy-css-component.tsx": js`
          import { lazy, useState } from "react";
          export const LazyCssComponent = lazy(() => import("./css-component"));
          export function LoadLazyCssComponent() {
            const [show, setShow] = useState(false);
            return (
              <>
                <button data-load-lazy-css-component onClick={() => setShow(true)}>Load Lazy CSS Component</button>
                {show && <LazyCssComponent />}
              </>
            );
          }
        `,

        "app/routes/_layout.tsx": js`
          import { Link, Outlet } from "react-router";
          import { LoadLazyCssComponent } from "../components/load-lazy-css-component";
          export default function Layout() {
            return (
              <>
                <nav>
                  <ul>
                    <li>
                      <Link to="/">Home</Link>
                    </li>
                    <li>
                      <Link to="/parent-child/with-css-component">Parent + Child / Route with CSS Component</Link>
                    </li>
                    <li>
                      <Link to="/parent-child/without-css-component">Parent + Child / Route Without CSS Component</Link>
                    </li>
                    <li>
                      <Link to="/siblings/with-css-component">Siblings / Route with CSS Component</Link>
                    </li>
                    <li>
                      <Link to="/siblings/with-lazy-css-component">Siblings / Route with Lazy CSS Component</Link>
                    </li>
                  </ul>
                </nav>
                <Outlet />
              </>
            );
          }
        `,

        "app/routes/_layout._index.tsx": js`
          export default function Index() {
            return <h2 data-route-home>Home</h2>;
          }
        `,

        "app/routes/_layout.parent-child.tsx": js`
          import { Outlet } from "react-router";
          import { LoadLazyCssComponent } from "../components/load-lazy-css-component";
          export default function ParentChild() {
            return (
              <>
                <h2 data-route-parent>Parent + Child</h2>
                <LoadLazyCssComponent />
                <Outlet />
              </>
            );
          }
        `,

        "app/routes/_layout.parent-child.with-css-component.tsx": js`
          import CssComponent from "../components/css-component";
          export default function RouteWithCssComponent() {
            return (
              <>
                <h2 data-child-route-with-css-component>Route with CSS Component</h2>
                <CssComponent />
              </>
            );
          }
        `,

        "app/routes/_layout.parent-child.without-css-component.tsx": js`
          export default function RouteWithoutCssComponent() {
            return <h2 data-child-route-without-css-component>Route Without CSS Component</h2>;
          }
        `,

        "app/routes/_layout.siblings.tsx": js`
          import { Outlet } from "react-router";
          export default function Siblings() {
            return (
              <>
                <h2 data-sibling-route>Siblings</h2>
                <Outlet />
              </>
            );
          }
        `,

        "app/routes/_layout.siblings.with-css-component.tsx": js`
          import CssComponent from "../components/css-component";
          export default function SiblingsWithCssComponent() {
            return (
              <>
                <h2 data-sibling-route-with-css-component>Route with CSS Component</h2>
                <CssComponent />
              </>
            );
          }
        `,

        "app/routes/_layout.siblings.with-lazy-css-component.tsx": js`
          import { LazyCssComponent } from "../components/load-lazy-css-component";
          export default function SiblingsWithLazyCssComponent() {
            return (
              <>
                <h2 data-sibling-route-with-lazy-css-component>Route with Lazy CSS Component</h2>
                <LazyCssComponent />
              </>
            );
          }
        `,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("retains CSS from dynamic imports in a parent route on navigation if the same CSS is a static dependency of a child route", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/parent-child/with-css-component");
    await page.waitForSelector("[data-child-route-with-css-component]");
    expect(await page.locator("[data-css-component]").count()).toBe(1);
    expect(await page.locator(ANY_CSS_LINK_SELECTOR).count()).toBe(1);
    expect(await page.locator(ROUTE_CSS_LINK_SELECTOR).count()).toBe(1);
    expect(await getCssComponentColor(page)).toBe("rgb(0, 128, 0)");

    await page.locator("[data-load-lazy-css-component]").click();
    await page.waitForSelector("[data-css-component]");
    expect(await page.locator(ANY_CSS_LINK_SELECTOR).count()).toBe(2);
    expect(await page.locator(ROUTE_CSS_LINK_SELECTOR).count()).toBe(1);
    expect(await getCssComponentColor(page)).toBe("rgb(0, 128, 0)");

    await app.clickLink("/parent-child/without-css-component");
    await page.waitForSelector("[data-child-route-without-css-component]");
    expect(await page.locator("[data-css-component]").count()).toBe(1);
    expect(await page.locator(ANY_CSS_LINK_SELECTOR).count()).toBe(1);
    expect(await page.locator(ROUTE_CSS_LINK_SELECTOR).count()).toBe(0);
    expect(await getCssComponentColor(page)).toBe("rgb(0, 128, 0)");
  });

  test("supports CSS lazy loading when navigating to a sibling route if the current route has a static dependency on the same CSS", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/siblings/with-css-component");
    await page.waitForSelector("[data-sibling-route-with-css-component]");
    expect(await page.locator("[data-css-component]").count()).toBe(1);
    expect(await page.locator(ANY_CSS_LINK_SELECTOR).count()).toBe(1);
    expect(await page.locator(ROUTE_CSS_LINK_SELECTOR).count()).toBe(1);
    expect(await getCssComponentColor(page)).toBe("rgb(0, 128, 0)");

    await app.clickLink("/siblings/with-lazy-css-component");
    await page.waitForSelector("[data-sibling-route-with-lazy-css-component]");
    expect(await page.locator("[data-css-component]").count()).toBe(1);
    expect(await page.locator(ANY_CSS_LINK_SELECTOR).count()).toBe(1);
    expect(await page.locator(ROUTE_CSS_LINK_SELECTOR).count()).toBe(0);
    expect(await getCssComponentColor(page)).toBe("rgb(0, 128, 0)");
  });
});
