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

const rootRoute = js`
  import { Outlet } from "react-router";

  export function Layout({ children }) {
    return <html><body>{children}</body></html>;
  }

  export default function Root() {
    return <Outlet />;
  }

  export function ErrorBoundary() {
    return <p>Action request rejected</p>;
  }
`;

const actionRoute = js`
  let actionCalls = 0;
  let middlewareCalls = 0;

  export const middleware = [async ({ request }, next) => {
    if (request.method === "POST") {
      middlewareCalls++;
    }
    return next();
  }];

  export function loader() {
    return { actionCalls, middlewareCalls };
  }

  export async function action() {
    actionCalls++;
    return null;
  }

  export default function Component({ loaderData }) {
    return (
      <p
        data-action-calls={loaderData.actionCalls}
        data-middleware-calls={loaderData.middlewareCalls}
      >
        Action calls: {loaderData.actionCalls}
      </p>
    );
  }
`;

async function expectMutationCalls(page: Page, count: string) {
  await page.waitForSelector("[data-action-calls]");
  expect(await page.locator("[data-action-calls]").textContent()).toContain(
    `Action calls: ${count}`,
  );
  expect(
    await page.locator("[data-action-calls]").getAttribute("data-action-calls"),
  ).toBe(count);
  expect(
    await page
      .locator("[data-middleware-calls]")
      .getAttribute("data-middleware-calls"),
  ).toBe(count);
}

test.describe("RSC request validation", () => {
  test.describe("RSC Framework", () => {
    let fixture: Fixture;
    let appFixture: AppFixture | undefined;

    test.beforeAll(async () => {
      fixture = await createFixture({
        templateName: "rsc-vite-framework",
        files: {
          "app/root.tsx": rootRoute,
          "app/routes/action.tsx": actionRoute,
        },
      });

      appFixture = await createAppFixture(fixture);
    });

    test.afterAll(() => {
      appFixture?.close();
    });

    test("returns 400 for invalid document POST requests", async ({
      page,
      request,
    }) => {
      let app = new PlaywrightFixture(appFixture!, page);

      await app.goto("/action");
      await expectMutationCalls(page, "0");
      validateRSCHtml(await page.content());

      let response = await request.post(`${appFixture!.serverUrl}/action`, {
        form: { intent: "mutate" },
        headers: {
          Origin: "https://other.example",
        },
      });
      expect(response.status()).toBe(400);
      expect(await response.text()).toBe("Bad Request");

      await app.goto("/action");
      await expectMutationCalls(page, "0");
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
                      id: "action",
                      path: "action",
                      lazy: () => import("./routes/action"),
                    },
                  ],
                },
              ] satisfies RSCRouteConfig;
            `,

            "src/routes/root.tsx": rootRoute,

            "src/routes/action.tsx": actionRoute,
          },
        });
      });

      test.afterAll(() => {
        stopAfterAll?.();
      });

      test("returns 400 for invalid document POST requests", async ({
        page,
        request,
      }) => {
        await page.goto(`http://localhost:${port}/action`);
        await expectMutationCalls(page, "0");
        validateRSCHtml(await page.content());

        let response = await request.post(`http://localhost:${port}/action`, {
          form: { intent: "mutate" },
          headers: {
            Origin: "https://other.example",
          },
        });
        expect(response.status()).toBe(400);
        expect(await response.text()).toBe("Bad Request");

        await page.goto(`http://localhost:${port}/action`);
        await expectMutationCalls(page, "0");
      });
    });
  });
});
