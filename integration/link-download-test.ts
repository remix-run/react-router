import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

for (let templateName of ["vite-8-template", "rsc-vite-framework"] as const) {
  test(`${templateName} leaves downloads to the browser and preserves custom navigation`, async ({
    page,
  }) => {
    let contents = "id,name\n1,Example\n";
    let fixture = await createFixture({
      templateName,
      files: {
        "public/report.csv": contents,
        "app/routes/_index.tsx": js`
          "use client";

          import { useEffect, useState } from "react";
          import { Link, useLinkClickHandler } from "react-router";

          export default function Index() {
            let [hydrated, setHydrated] = useState(false);
            let navigate = useLinkClickHandler<HTMLFormElement>("/next");
            useEffect(() => setHydrated(true), []);

            return (
              <main data-hydrated={hydrated}>
                <Link to="/report.csv" download>Download report</Link>
                <Link to="/report.csv" download="custom.csv">Download renamed report</Link>
                <form onClick={navigate}>
                  <input type="hidden" name="matches" />
                  <button type="button">Continue</button>
                </form>
              </main>
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
      await expect(page.locator("main")).toHaveAttribute(
        "data-hydrated",
        "true",
      );

      for (let [label, filename] of [
        ["Download report", "report.csv"],
        ["Download renamed report", "custom.csv"],
      ]) {
        let [download] = await Promise.all([
          page.waitForEvent("download"),
          page.getByRole("link", { name: label, exact: true }).click(),
        ]);

        expect(download.suggestedFilename()).toBe(filename);
        expect(await readFile(await download.path(), "utf8")).toBe(contents);
        await expect(page).toHaveURL(new URL("/", appFixture.serverUrl).href);
      }

      await page.getByRole("button", { name: "Continue" }).click();
      await expect(
        page.getByRole("heading", { name: "Next page" }),
      ).toBeVisible();
    } finally {
      appFixture.close();
    }
  });
}
