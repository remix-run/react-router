import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import { reactRouterConfig } from "./helpers/vite.js";

const files = {
  "react-router.config.ts": reactRouterConfig({
    ssr: true,
    v8_middleware: false,
  }),
  "app/root.tsx": js`
    import { Links, Meta, Outlet, Scripts, redirect } from "react-router";

    export function loader({ params }) {
      if (!params.child) {
        throw redirect("/parent/1");
      }
      return null;
    }

    export default function Root() {
      return (
        <html lang="en">
          <head>
            <Meta />
            <Links />
          </head>
          <body>
            <Outlet />
            <Scripts />
          </body>
        </html>
      );
    }
  `,

  "app/routes/parent.tsx": js`
    import { Outlet, useLoaderData } from "react-router";

    export const shouldRevalidate = () => {
      console.log("[PARENT] shouldRevalidate called - returning false");
      return false;
    };

    let loaderCallCount = 0;

    export function loader() {
      loaderCallCount++;
      console.log("[PARENT_LOADER] Called: " + loaderCallCount + " times");
      return {
        data: "parent data",
        callCount: loaderCallCount,
        timestamp: Date.now(),
      };
    }

    export default function Parent() {
      const parentData = useLoaderData();
      if (!parentData) throw new Error("no parent data");

      return (
        <div style={{ padding: "20px" }}>
          <h1>Parent</h1>
          <div id="parent-loader-count" data-count={parentData.callCount}>
            Parent Loader Count: {parentData.callCount}
          </div>
          <div id="parent-timestamp" data-timestamp={parentData.timestamp}>
            Parent Timestamp: {parentData.timestamp}
          </div>
          <Outlet />
        </div>
      );
    }
  `,

  "app/routes/parent.$child.tsx": js`
    import { href, Link, useParams, useLoaderData } from "react-router";

    export const shouldRevalidate = () => {
      console.log("[CHILD] shouldRevalidate called - returning true");
      return true;
    };

    let loaderCallCount = 0;

    export function loader({ params }) {
      loaderCallCount++;
      console.log("[CHILD_LOADER] Child " + params.child + " - Called: " + loaderCallCount + " times");
      return {
        data: "child data",
        callCount: loaderCallCount,
        childNumber: params.child,
      };
    }

    export default function Child() {
      const childData = useLoaderData();
      if (!childData) throw new Error("no child data");

      const params = useParams();
      const nextChild = Number(params.child) + 1;

      return (
        <div style={{ padding: "20px" }}>
          <h1>Child: {params.child}</h1>
          <div id="child-loader-count" data-count={childData.callCount}>
            Child Loader Count: {childData.callCount}
          </div>
          <Link
            id="next-child-link"
            style={{
              border: "1px solid #CCC",
              marginTop: "20px",
              display: "inline-block",
              padding: "4px 8px",
            }}
            to={href("/parent/:child", {
              child: nextChild.toString(),
            })}
          >
            Go to next child
          </Link>
        </div>
      );
    }
  `,
};

test.describe("shouldRevalidate with middleware", () => {
  test("v8_middleware false - parent loader called once", async ({ page }) => {
    let fixture = await createFixture({
      files,
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    await app.goto("/parent/1");
    await app.clickLink("/parent/2");
    await app.clickLink("/parent/3");
    await app.clickLink("/parent/4");

    const initialParentCount = await page
      .locator("#parent-loader-count")
      .getAttribute("data-count");
    expect(initialParentCount).toBe("1");

    const secondParentCount = await page
      .locator("#parent-loader-count")
      .getAttribute("data-count");

    expect(secondParentCount).toBe("1");

    const thirdParentCount = await page
      .locator("#parent-loader-count")
      .getAttribute("data-count");

    expect(thirdParentCount).toBe("1");
  });

  test("v8_middleware true - server execution tracking", async ({ page }) => {
    const filesWithMiddleware = {
      ...files,
      "react-router.config.ts": reactRouterConfig({
        ssr: true,
        v8_middleware: true,
      }),
    };

    let fixture = await createFixture({
      files: filesWithMiddleware,
    });
    let appFixture = await createAppFixture(fixture);
    let app = new PlaywrightFixture(appFixture, page);

    const parentLoaderRegex = /\[PARENT_LOADER\] Called: (\d+) times/;
    let maxParentLoaderCount = 0;

    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.join(" ");
      const match = message.match(parentLoaderRegex);
      if (match) {
        maxParentLoaderCount = Math.max(
          maxParentLoaderCount,
          parseInt(match[1]),
        );
      }
      originalLog(...args);
    };

    await app.goto("/parent/1");
    await app.clickLink("/parent/2");
    await app.clickLink("/parent/3");
    await app.clickLink("/parent/4");

    expect(maxParentLoaderCount).toBe(1);
  });
});
