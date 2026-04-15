import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import { type TemplateName } from "./helpers/vite.js";

const templateNames = [
  "vite-5-template",
  "rsc-vite-framework",
] as const satisfies TemplateName[];

test.describe("react-router-serve", () => {
  for (const templateName of templateNames) {
    test.describe(`template: ${templateName}`, () => {
      let fixture: Fixture;
      let appFixture: AppFixture;

      test.beforeEach(async ({ context }) => {
        await context.route(/\.(data|rsc)$/, async (route) => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          route.continue();
        });
      });

      test.beforeAll(async () => {
        fixture = await createFixture({
          templateName,
          useReactRouterServe: true,
          files: {
            "app/routes/_index.tsx": js`
              import { useLoaderData, Link } from "react-router";

              export function loader() {
                return "pizza";
              }

              export default function Index() {
                let data = useLoaderData();
                return (
                  <div>
                    {data}
                    <Link to="/burgers">Other Route</Link>
                  </div>
                )
              }
            `,

            "app/routes/burgers.tsx": js`
              export default function Index() {
                return <div>cheeseburger</div>;
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

      test("should start and perform client side navigation", async ({
        page,
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        // You can test any request your app might get using `fixture`.
        let response = await fixture.requestDocument("/");
        expect(await response.text()).toMatch("pizza");

        // If you need to test interactivity use the `app`
        await app.goto("/");
        await app.clickLink("/burgers");
        await page.waitForSelector("text=cheeseburger");
      });
    });
  }

  test.describe("cross-platform build output", () => {
    let fixture: Fixture;
    let appFixture: AppFixture;

    test.beforeAll(async () => {
      fixture = await createFixture({
        templateName: "vite-5-template",
        useReactRouterServe: true,
        files: {
          "app/routes/_index.tsx": js`
            import { Link } from "react-router";

            export default function Index() {
              return <Link to="/burgers">Other Route</Link>;
            }
          `,

          "app/routes/burgers.tsx": js`
            export default function Burgers() {
              return <div>cheeseburger</div>;
            }
          `,
        },
      });

      let serverBuildPath = path.join(fixture.projectDir, "build/server/index.js");
      let serverBuild = await readFile(serverBuildPath, "utf8");

      // Simulate a Windows-produced build artifact copied to Linux by using
      // backslashes in assetsBuildDirectory.
      let windowsBuild = serverBuild.replace(
        /export const assetsBuildDirectory = "([^"]+)";/,
        (_, assetsBuildDirectory: string) => {
          let windowsPath = assetsBuildDirectory.replace(/\//g, "\\\\");
          return `export const assetsBuildDirectory = "${windowsPath}";`;
        },
      );

      await writeFile(serverBuildPath, windowsBuild, "utf8");
      appFixture = await createAppFixture(fixture);
    });

    test.afterAll(() => {
      appFixture.close();
    });

    test("serves /assets from Windows-style build metadata", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await app.clickLink("/burgers");
      await page.waitForSelector("text=cheeseburger");
    });
  });
});
