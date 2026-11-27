import { test, expect } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { TemplateName } from "./helpers/templates.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

const templateNames = [
  "vite-7-template",
  "rsc-vite-framework",
] as const satisfies TemplateName[];

test.describe("route IDs", () => {
  for (const templateName of templateNames) {
    test.describe(templateName, () => {
      test("route data hooks can access route loader data by route ID", async ({
        page,
      }) => {
        let fixture = await createFixture({
          templateName,
          files: {
            "app/routes.ts": js`
              import { type RouteConfig, index, route } from "@react-router/dev/routes";

              export default [
                index("routes/home.tsx"),
                route("nested", "routes/nested/page.tsx"),
              ] satisfies RouteConfig;
            `,
            "app/routes/home.tsx": js`
              import {
                Link,
                unstable_useRoute,
                useMatches,
                useRouteLoaderData,
              } from "react-router";

              export function loader() {
                return { name: "home" };
              }

              export default function Home() {
                let data = useRouteLoaderData("routes/home");
                let route = unstable_useRoute("routes/home");
                let ids = useMatches().map((match) => match.id);
                return (
                  <div>
                    <p id="route-loader-data">{data?.name ?? "missing"}</p>
                    <p id="use-route">{route?.loaderData?.name ?? "missing"}</p>
                    <p id="ids">{ids.join(",")}</p>
                    <Link to="/nested">Nested</Link>
                  </div>
                );
              }
            `,
            "app/routes/nested/page.tsx": js`
              import { useRouteLoaderData } from "react-router";

              export function loader() {
                return { name: "nested" };
              }

              export default function Nested() {
                let data = useRouteLoaderData("routes/nested/page");
                return <p id="nested">{data?.name ?? "missing"}</p>;
              }
            `,
          },
        });
        let appFixture = await createAppFixture(fixture);
        let app = new PlaywrightFixture(appFixture, page);

        await app.goto("/", true);
        await expect(page.locator("#ids")).toHaveText("root,routes/home");
        await expect(page.locator("#route-loader-data")).toHaveText("home");
        await expect(page.locator("#use-route")).toHaveText("home");

        await app.clickLink("/nested");
        await expect(page.locator("#nested")).toHaveText("nested");

        appFixture.close();
      });
    });
  }
});
