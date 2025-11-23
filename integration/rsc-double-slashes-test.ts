import {
  test,
  expect,
} from "@playwright/test";
import getPort from "get-port";

import { implementations, js, setupRscTest, validateRSCHtml } from "./rsc/utils";

implementations.forEach((implementation) => {
  test.describe(`RSC Double Slashes Fix (${implementation.name})`, () => {
    test.describe("Production", () => {
      let port: number;
      let stopAfterAll: () => void;

      test.afterAll(() => {
        stopAfterAll?.();
      });

      test.beforeAll(async () => {
        port = await getPort();
        stopAfterAll = await setupRscTest({
          implementation,
          port,
          files: {
            "src/routes.ts": js`
              import type { unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

              export const routes = [
                {
                  id: "root",
                  path: "",
                  lazy: () => import("./routes/root"),
                  children: [
                    {
                      id: "double-slash-test",
                      path: "en/test2/test",
                      lazy: () => import("./routes/double-slash-test/home"),
                    },
                  ],
                },
              ] satisfies RSCRouteConfig;
            `,

            "src/routes/double-slash-test/home.tsx": js`
              export function loader() {
                return { message: "Double slash test successful" };
              }

              export default function HomeRoute({ loaderData }) {
                return (
                  <div>
                    <h2 data-test-result>Double Slash Test</h2>
                    <p data-test-message>{loaderData.message}</p>
                  </div>
                );
              }
            `,
          },
        });
      });

      test("should handle URLs with double slashes correctly", async ({ page }) => {
        // Test the problematic URL pattern from the issue
        await page.goto(`http://localhost:${port}//en//test2/test`);

        // Should successfully load the page despite double slashes
        await page.waitForSelector("[data-test-result]");
        expect(await page.locator("[data-test-result]").textContent()).toBe(
          "Double Slash Test",
        );
        expect(await page.locator("[data-test-message]").textContent()).toBe(
          "Double slash test successful",
        );

        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });

      test("should normalize URLs and not cause manifest loading errors", async ({ page }) => {
        // Monitor network requests to ensure no ERR_NAME_NOT_RESOLVED errors
        const failedRequests: string[] = [];
        
        page.on('requestfailed', (request) => {
          failedRequests.push(request.url());
        });

        // Navigate to a URL with double slashes
        await page.goto(`http://localhost:${port}//en//test2/test`);
        
        // Wait for the page to load
        await page.waitForSelector("[data-test-result]");
        
        // Check that no manifest requests failed with name resolution errors
        const manifestFailures = failedRequests.filter(url => 
          url.includes('.manifest') && url.includes('//')
        );
        
        expect(manifestFailures).toHaveLength(0);
        
        // Ensure this is using RSC
        validateRSCHtml(await page.content());
      });
    });
  });
});