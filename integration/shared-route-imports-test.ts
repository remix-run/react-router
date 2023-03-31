import { test } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";
import { createAppFixture, createFixture, js } from "./helpers/create-fixture";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeAll(async () => {
  fixture = await createFixture({
    future: { v2_routeConvention: true },
    files: {
      "app/routes/parent.jsx": js`
        import { createContext, useContext } from "react";
        import { Outlet } from "@remix-run/react";

        const ParentContext = createContext("❌");

        export function useParentContext() {
          return useContext(ParentContext);
        }

        export default function Index() {
          return (
            <ParentContext.Provider value="✅">
              <Outlet />
            </ParentContext.Provider>
          )
        }
      `,

      "app/routes/parent.child.jsx": js`
        import { useParentContext } from "./parent";

        export default function Index() {
          return <p>{useParentContext()}</p>;
        }
      `,
    },
  });

  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

test("[description of what you expect it to do]", async ({ page }) => {
  let app = new PlaywrightFixture(appFixture, page);
  // If you need to test interactivity use the `app`
  await app.goto("/parent/child", true);

  await page.waitForSelector("p:has-text('✅')");
});

////////////////////////////////////////////////////////////////////////////////
// 💿 Finally, push your changes to your fork of Remix and open a pull request!
////////////////////////////////////////////////////////////////////////////////
