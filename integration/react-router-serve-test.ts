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
  "vite-7-template",
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

  test.describe("well-known URIs", () => {
    for (const templateName of templateNames) {
      test.describe(`template: ${templateName}`, () => {
        let fixture: Fixture;
        let appFixture: AppFixture;

        test.beforeAll(async () => {
          fixture = await createFixture({
            templateName,
            useReactRouterServe: true,
            files: {
              "public/.well-known/security.txt":
                "Contact: mailto:security@example.com",
              "public/.hidden.txt": "should not be served",
            },
          });
          appFixture = await createAppFixture(fixture);
        });

        test.afterAll(() => {
          appFixture.close();
        });

        test("serves files under /.well-known", async () => {
          let response = await fetch(
            `${appFixture.serverUrl}/.well-known/security.txt`,
          );
          expect(response.status).toBe(200);
          expect(await response.text()).toContain(
            "Contact: mailto:security@example.com",
          );
        });

        test("keeps other dotfiles hidden", async () => {
          let response = await fetch(`${appFixture.serverUrl}/.hidden.txt`);
          expect(response.status).toBe(404);
          expect(await response.text()).not.toContain("should not be served");
        });
      });
    }
  });
});
