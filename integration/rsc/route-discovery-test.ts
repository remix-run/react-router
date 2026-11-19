import { test, expect } from "@playwright/test";
import getPort from "get-port";

import { implementations, js, setupRscTest } from "./utils";

for (let implementation of implementations) {
  test(`RSC (${implementation.name}) bounds route discovery for documents and data`, async ({
    page,
  }) => {
    let pathname = `/${Array.from({ length: 70 }, (_, i) => i % 10).join("/")}`;
    let port = await getPort();
    let stop = await setupRscTest({
      implementation,
      port,
      files: {
        "src/routes.ts": js`
          export const routes = [{
            id: "root",
            path: "",
            lazy: () => import("./routes/root"),
            children: [
              { id: "other", path: "other", lazy: () => import("./routes/other") },
              { id: "splat", path: "*", lazy: () => import("./routes/sample") },
            ],
          }];
        `,
        "src/routes/sample.tsx": js`
          import { Link } from "react-router";
          export default function Sample() {
            return <>
              <h1>Sample</h1>
              <Link to=${JSON.stringify(pathname)} discover="none">Sample</Link>
              <Link to="/other" discover="none">Other</Link>
            </>;
          }
        `,
        "src/routes/other.tsx": js`
          export default function Other() {
            return <h1>Other</h1>;
          }
        `,
      },
    });

    try {
      let manifestRequests: string[] = [];
      page.on("request", (request) => {
        if (new URL(request.url()).pathname.endsWith(".manifest")) {
          manifestRequests.push(request.url());
        }
      });

      let response = await page.goto(`http://localhost:${port}${pathname}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { name: "Sample" })).toBeVisible();
      await page.waitForFunction(() => (window as any).__routerInitialized);
      let otherResponse = page.waitForResponse(
        (response) => new URL(response.url()).pathname === "/other.rsc",
      );
      await page.getByRole("link", { name: "Other" }).click();
      expect((await otherResponse).status()).toBe(200);
      await expect(page.getByRole("heading", { name: "Other" })).toBeVisible();
      expect(manifestRequests).toEqual([]);

      // Start with the splat already discovered so navigation can request data.
      await page.goto(`http://localhost:${port}/sample`);
      await page.waitForFunction(() => (window as any).__routerInitialized);
      let dataResponse = page.waitForResponse(
        (response) => new URL(response.url()).pathname === `${pathname}.rsc`,
      );
      await page.getByRole("link", { name: "Sample" }).click();
      let data = await dataResponse;
      expect(data.status()).toBe(200);
      let payload = await data.text();
      expect(payload).toContain('"routeDiscovery":{"mode":"initial"}');
      expect(payload).toContain('"id":"other"');
      await expect(page.getByRole("heading", { name: "Sample" })).toBeVisible();
      await page.getByRole("link", { name: "Other" }).click();
      await expect(page.getByRole("heading", { name: "Other" })).toBeVisible();
    } finally {
      stop();
    }
  });
}
