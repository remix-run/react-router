import { expect, test } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test("useLinkClickHandler navigates from a form with a control named matches", async ({
  page,
}) => {
  let fixture = await createFixture({
    templateName: "vite-8-template",
    files: {
      "app/routes/_index.tsx": js`
        import { useEffect, useState } from "react";
        import { useLinkClickHandler } from "react-router";

        export default function Index() {
          let [hydrated, setHydrated] = useState(false);
          let handleClick = useLinkClickHandler<HTMLFormElement>("/next");
          useEffect(() => setHydrated(true), []);

          return (
            <form onClick={handleClick}>
              <input type="hidden" name="matches" />
              <button type="button" disabled={!hydrated}>Continue</button>
            </form>
          );
        }
      `,
      "app/routes/next.tsx": js`
        export default function Next() {
          return <h1>Next page</h1>;
        }
      `,
    },
  });
  let appFixture = await createAppFixture(fixture);

  try {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(
      page.getByRole("heading", { name: "Next page" }),
    ).toBeVisible();
  } finally {
    appFixture.close();
  }
});
