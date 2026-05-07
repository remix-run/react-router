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

// Link hrefs with a trailing hash are only ever managed by React Router, to
// ensure they're forcibly unique from the Vite-injected links
const FORCIBLY_UNIQUE_HREF_SELECTOR = "[href$='#']";
const CSS_LINK_SELECTOR = "link[rel='stylesheet']";
const ANY_FORCIBLY_UNIQUE_CSS_LINK_SELECTOR = `link[rel='stylesheet']${FORCIBLY_UNIQUE_HREF_SELECTOR}`;
const CSS_COMPONENT_LINK_SELECTOR =
  "link[rel='stylesheet'][href*='css-component']";
const CSS_COMPONENT_FORCIBLY_UNIQUE_LINK_SELECTOR = `link[rel='stylesheet'][href*='css-component']${FORCIBLY_UNIQUE_HREF_SELECTOR}`;

function getColor(page: Page, selector: string) {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => window.getComputedStyle(el).color);
}

test.describe("Vite CSS lazy loading", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/components/css-component.css": css`
          .css-component {
            color: rgb(0, 128, 0);
            font-family: sans-serif;
            font-weight: bold;
          }
        `,

        "app/components/css-component.tsx": js`
          import "./css-component.css";
          export default function CssComponent() {
            return <p data-css-component className="css-component">This text should be green.</p>;
          }
        `,

        "app/components/static-only-css-component.css": css`
          .static-only-css-component {
            color: rgb(128, 128, 0);
            font-family: sans-serif;
            font-weight: bold;
          }
        `,

        "app/components/static-only-css-component.tsx": js`
          import "./static-only-css-component.css";
          export default function StaticOnlyCssComponent() {
            return <p data-static-only-css-component className="static-only-css-component">This text should be olive.</p>;
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
                    <li>
                      <Link to="/with-static-only-css-component">Route with Static Only CSS Component</Link>
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

        "app/routes/_layout.with-static-only-css-component.tsx": js`
          import StaticOnlyCssComponent from "../components/static-only-css-component";
          export default function WithStaticOnlyCssComponent() {
            return (
              <>
                <h2 data-route-with-static-only-css-component>Route with Static Only CSS Component</h2>
                <StaticOnlyCssComponent />
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
    expect(await page.locator(CSS_COMPONENT_LINK_SELECTOR).count()).toBe(1);
    expect(
      await page.locator(CSS_COMPONENT_FORCIBLY_UNIQUE_LINK_SELECTOR).count(),
    ).toBe(1);
    expect(await getColor(page, "[data-css-component]")).toBe("rgb(0, 128, 0)");

    await page.locator("[data-load-lazy-css-component]").click();
    await page.waitForSelector("[data-css-component]");
    expect(await page.locator(CSS_COMPONENT_LINK_SELECTOR).count()).toBe(2);
    expect(
      await page.locator(CSS_COMPONENT_FORCIBLY_UNIQUE_LINK_SELECTOR).count(),
    ).toBe(1);
    expect(await getColor(page, "[data-css-component]")).toBe("rgb(0, 128, 0)");

    await app.clickLink("/parent-child/without-css-component");
    await page.waitForSelector("[data-child-route-without-css-component]");
    expect(await page.locator("[data-css-component]").count()).toBe(1);
    expect(await page.locator(CSS_COMPONENT_LINK_SELECTOR).count()).toBe(1);
    expect(
      await page.locator(CSS_COMPONENT_FORCIBLY_UNIQUE_LINK_SELECTOR).count(),
    ).toBe(0);
    expect(await getColor(page, "[data-css-component]")).toBe("rgb(0, 128, 0)");
  });

  test("supports CSS lazy loading when navigating to a sibling route if the current route has a static dependency on the same CSS", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/siblings/with-css-component");
    await page.waitForSelector("[data-sibling-route-with-css-component]");
    expect(await page.locator("[data-css-component]").count()).toBe(1);
    expect(await page.locator(CSS_COMPONENT_LINK_SELECTOR).count()).toBe(1);
    expect(
      await page.locator(CSS_COMPONENT_FORCIBLY_UNIQUE_LINK_SELECTOR).count(),
    ).toBe(1);
    expect(await getColor(page, "[data-css-component]")).toBe("rgb(0, 128, 0)");

    await app.clickLink("/siblings/with-lazy-css-component");
    await page.waitForSelector("[data-sibling-route-with-lazy-css-component]");
    expect(await page.locator("[data-css-component]").count()).toBe(1);
    expect(await page.locator(CSS_COMPONENT_LINK_SELECTOR).count()).toBe(1);
    expect(
      await page.locator(CSS_COMPONENT_FORCIBLY_UNIQUE_LINK_SELECTOR).count(),
    ).toBe(0);
    expect(await getColor(page, "[data-css-component]")).toBe("rgb(0, 128, 0)");
  });

  test("does not add a hash to the CSS link if the CSS is only ever statically imported", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/with-static-only-css-component");
    await page.waitForSelector("[data-route-with-static-only-css-component]");
    expect(await page.locator(CSS_LINK_SELECTOR).count()).toBe(1);
    expect(
      await page.locator(ANY_FORCIBLY_UNIQUE_CSS_LINK_SELECTOR).count(),
    ).toBe(0);
    expect(await getColor(page, "[data-static-only-css-component]")).toBe(
      "rgb(128, 128, 0)",
    );
  });
});
