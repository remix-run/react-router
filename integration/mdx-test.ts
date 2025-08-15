import { test, expect } from "@playwright/test";

import {
  createFixture,
  createAppFixture,
  js,
} from "./helpers/create-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import {
  type TemplateName,
  reactRouterConfig,
  viteConfig,
} from "./helpers/vite.js";

const templateNames = [
  "vite-5-template",
  "rsc-vite-framework",
] as const satisfies TemplateName[];

test.describe("MDX", () => {
  for (const templateName of templateNames) {
    test.describe(`template: ${templateName}`, () => {
      let fixture: Fixture;
      let appFixture: AppFixture;

      test.beforeAll(async () => {
        fixture = await createFixture({
          templateName,
          files: {
            "vite.config.js": await viteConfig.basic({
              templateName,
              mdx: true,
            }),
            "react-router.config.ts": reactRouterConfig({
              viteEnvironmentApi: templateName.includes("rsc"),
            }),
            "app/root.tsx": js`
              import { Outlet, Scripts } from "react-router"
        
              export default function Root() {
                return (
                  <html>
                    <head></head>
                    <body>
                      <main>
                        <Outlet />
                      </main>
                      <Scripts />
                    </body>
                  </html>
                );
              }
            `,
            "app/routes/_index.tsx": js`
              import { Link } from "react-router"
              export default function Component() {
                return <Link to="/mdx">Go to MDX route</Link>
              }
            `,
            "app/routes/mdx.mdx": js`
              import { MdxComponent } from "../components/mdx-components";

              export const loader = () => {
                return {
                  content: "MDX route content from loader",
                }
              }

              ## MDX Route

              <MdxComponent />
            `,
            // This needs to be a separate file to support RSC since
            // `useLoaderData` is not available in RSC environments, and
            // components defined within an MDX file must be exported. This
            // means they're not removed in the RSC build.
            "app/components/mdx-components.tsx": js`
              import { useState, useEffect } from "react";
              import { useLoaderData } from "react-router";

              export function MdxComponent() {
                const { content } = useLoaderData();
                const [mounted, setMounted] = useState(false);
                useEffect(() => {
                  setMounted(true);
                }, []);

                return (
                  <>
                    <h3>Loader data</h3>
                    <div data-loader-data>{content}</div>
                    <h3>Mounted</h3>
                    <div data-mounted>{mounted ? "true" : "false"}</div>
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

      test("handles MDX routes", async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/mdx");

        let loaderData = page.locator("[data-loader-data]");
        await expect(loaderData).toHaveText("MDX route content from loader");

        let mounted = page.locator("[data-mounted]");
        await expect(mounted).toHaveText("true");
      });
    });
  }
});
