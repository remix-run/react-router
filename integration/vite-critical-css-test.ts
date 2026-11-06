import { test, expect } from "@playwright/test";
import getPort from "get-port";

import {
  createProject,
  dev,
  reactRouterConfig,
  viteConfig,
  viteMajorTemplates,
} from "./helpers/vite.js";

const js = String.raw;
const css = String.raw;

const PADDING = "20px";

const files = {
  "app/root.tsx": js`
    import { Links, Meta, Outlet, Scripts } from "react-router";

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
  "app/routes/_index/styles.css": css`
    .streamed-content {
      padding: ${PADDING};
    }
  `,
  "app/routes/_index/route.tsx": js`
    import { Suspense } from "react";
    import { Await, useLoaderData } from "react-router";
    import "./styles.css";

    export function loader() {
      return {
        streamed: new Promise((resolve) =>
          setTimeout(() => resolve("Streamed content"), 1000)
        ),
      };
    }

    export default function IndexRoute() {
      let { streamed } = useLoaderData();
      return (
        <Suspense fallback={<p id="fallback">Loading...</p>}>
          <Await resolve={streamed}>
            {(value) => (
              <p id="streamed-content" className="streamed-content">
                {value}
              </p>
            )}
          </Await>
        </Suspense>
      );
    }
  `,
};

test.describe("Vite critical CSS", () => {
  viteMajorTemplates.forEach(({ templateName, templateDisplayName }) => {
    test.describe(templateDisplayName, () => {
      test.describe("vite dev", () => {
        let port: number;
        let cwd: string;
        let stop: () => void;

        test.beforeAll(async () => {
          port = await getPort();
          cwd = await createProject(
            {
              "react-router.config.ts": reactRouterConfig(),
              "vite.config.ts": await viteConfig.basic({ port, templateName }),
              ...files,
            },
            templateName,
          );
          stop = await dev({ cwd, port });
        });
        test.afterAll(() => stop());

        test("clears critical CSS without interrupting hydration of streamed Suspense boundaries", async ({
          page,
        }) => {
          let pageErrors: Error[] = [];
          page.on("pageerror", (error) => pageErrors.push(error));

          // Critical CSS is present in the initial server HTML
          let response = await page.request.get(`http://localhost:${port}/`);
          expect(await response.text()).toContain(
            "data-react-router-critical-css",
          );

          await page.goto(`http://localhost:${port}/`, {
            waitUntil: "networkidle",
          });

          // The streamed Suspense boundary resolved and is styled
          await expect(page.locator("#streamed-content")).toHaveText(
            "Streamed content",
          );
          await expect(page.locator("#streamed-content")).toHaveCSS(
            "padding",
            PADDING,
          );

          // The dev-only critical CSS was removed after hydration to avoid
          // duplicate styles
          await expect(
            page.locator("[data-react-router-critical-css]"),
          ).toHaveCount(0);

          // Hydration completed without discarding the streamed server HTML.
          // On React 18 this surfaces as "This Suspense boundary received an
          // update before it finished hydrating" via reportError.
          expect(pageErrors).toEqual([]);
        });
      });
    });
  });
});
