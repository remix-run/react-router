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

  test.describe("compression", () => {
    let fixture: Fixture;

    test.beforeAll(async () => {
      fixture = await createFixture({
        templateName: "vite-7-template",
        useReactRouterServe: true,
        files: {
          "app/routes/_index.tsx": js`
            import { useLoaderData } from "react-router";

            // Large enough to clear the compression middleware's default
            // 1kb threshold
            export function loader() {
              return "x".repeat(4096);
            }

            export default function Index() {
              let data = useLoaderData();
              return <div>{data}</div>;
            }
          `,
        },
      });
    });

    test("compresses responses by default", async () => {
      let appFixture = await createAppFixture(fixture);
      try {
        let response = await fetch(appFixture.serverUrl);
        expect(response.headers.get("content-encoding")).toMatch(
          /\b(gzip|deflate|br|zstd)\b/,
        );
        expect(await response.text()).toContain("x".repeat(4096));
      } finally {
        appFixture.close();
      }
    });

    test("does not compress responses when DISABLE_COMPRESSION is set", async () => {
      let appFixture = await createAppFixture(fixture, undefined, {
        env: { DISABLE_COMPRESSION: "true" },
      });
      try {
        let response = await fetch(appFixture.serverUrl);
        expect(response.headers.get("content-encoding")).toBeNull();
        expect(await response.text()).toContain("x".repeat(4096));
      } finally {
        appFixture.close();
      }
    });
  });
});
