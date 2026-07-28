import { test, expect, type Page } from "@playwright/test";
import getPort from "get-port";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { implementations, setupRscTest, validateRSCHtml } from "./rsc/utils.js";

const csrfActionRoute = js`
  let actionCalls = 0;

  export function loader() {
    return { actionCalls };
  }

  export async function action() {
    actionCalls++;
    return null;
  }

  export default function Component({ loaderData }) {
    return (
      <p data-action-calls={loaderData.actionCalls}>
        Action calls: {loaderData.actionCalls}
      </p>
    );
  }
`;

async function expectActionCalls(page: Page, count: string) {
  await page.waitForSelector("[data-action-calls]");
  expect(await page.locator("[data-action-calls]").textContent()).toContain(
    `Action calls: ${count}`,
  );
  expect(
    await page.locator("[data-action-calls]").getAttribute("data-action-calls"),
  ).toBe(count);
}

test.describe("RSC CSRF action protection", () => {
  test.describe("RSC Framework", () => {
    let fixture: Fixture;
    let appFixture: AppFixture | undefined;

    test.beforeAll(async () => {
      fixture = await createFixture({
        templateName: "rsc-vite-framework",
        files: {
          "app/routes/csrf-action.tsx": csrfActionRoute,
        },
      });

      appFixture = await createAppFixture(fixture);
    });

    test.afterAll(() => {
      appFixture?.close();
    });

    test("does not call actions on cross-origin document POST requests", async ({
      page,
      request,
    }) => {
      let app = new PlaywrightFixture(appFixture!, page);

      await app.goto("/csrf-action");
      await expectActionCalls(page, "0");
      validateRSCHtml(await page.content());

      let response = await request.post(
        `${appFixture!.serverUrl}/csrf-action`,
        {
          form: { intent: "mutate" },
          headers: {
            Origin: "https://attacker.example",
          },
        },
      );
      expect(response.status()).toBe(400);

      await app.goto("/csrf-action");
      await expectActionCalls(page, "0");
    });
  });

  implementations.forEach((implementation) => {
    test.describe(`RSC Data (${implementation.name})`, () => {
      let port: number;
      let stopAfterAll: () => void;

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
                      id: "csrf-action",
                      path: "csrf-action",
                      lazy: () => import("./routes/csrf-action"),
                    },
                  ],
                },
              ] satisfies RSCRouteConfig;
            `,

            "src/routes/root.tsx": js`
              import { Outlet } from "react-router";

              export function Layout({ children }: { children: React.ReactNode }) {
                return (
                  <html>
                    <body>{children}</body>
                  </html>
                );
              }

              export default function RootRoute() {
                return <Outlet />;
              }
            `,

            "src/routes/csrf-action.tsx": csrfActionRoute,
          },
        });
      });

      test.afterAll(() => {
        stopAfterAll?.();
      });

      test("does not call actions on cross-origin document POST requests", async ({
        page,
        request,
      }) => {
        await page.goto(`http://localhost:${port}/csrf-action`);
        await expectActionCalls(page, "0");
        validateRSCHtml(await page.content());

        let response = await request.post(
          `http://localhost:${port}/csrf-action`,
          {
            form: { intent: "mutate" },
            headers: {
              Origin: "https://attacker.example",
            },
          },
        );
        expect(response.status()).toBe(400);

        await page.goto(`http://localhost:${port}/csrf-action`);
        await expectActionCalls(page, "0");
      });
    });
  });
});
