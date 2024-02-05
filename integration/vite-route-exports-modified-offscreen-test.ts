import { test, expect } from "@playwright/test";
import getPort from "get-port";

import {
  createProject,
  createEditor,
  viteDev,
  viteConfig,
} from "./helpers/vite.js";

const files = {
  "app/routes/_index.tsx": String.raw`
    import { useState, useEffect } from "react";
    import { Link } from "@remix-run/react";

    export default function IndexRoute() {
      const [mounted, setMounted] = useState(false);
      useEffect(() => {
        setMounted(true);
      }, []);

      return (
        <div>
          <p data-mounted>Mounted: {mounted ? "yes" : "no"}</p>
          <Link to="/other">/other</Link>
        </div>
      );
    }
  `,
  "app/routes/other.tsx": String.raw`
    import { useLoaderData } from "@remix-run/react";

    export const loader = () => "hello";

    export default function Route() {
      const loaderData = useLoaderData();
      return (
        <div data-loader-data>loaderData = {JSON.stringify(loaderData)}</div>
      );
    }
  `,
};

test.describe(async () => {
  let port: number;
  let cwd: string;
  let stop: () => void;

  test.beforeAll(async () => {
    port = await getPort();
    cwd = await createProject({
      "vite.config.js": await viteConfig.basic({ port }),
      ...files,
    });
    stop = await viteDev({ cwd, port });
  });
  test.afterAll(() => stop());

  test("Vite / dev / route exports modified offscreen", async ({
    page,
    context,
    browserName,
  }) => {
    let pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));
    let edit = createEditor(cwd);

    await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-mounted]")).toHaveText("Mounted: yes");
    expect(pageErrors).toEqual([]);

    let originalContents: string;

    // Removing loader export in other page should invalidate manifest
    await edit("app/routes/other.tsx", (contents) => {
      originalContents = contents;
      return contents.replace(/export const loader.*/, "");
    });

    // After browser reload, client should be aware that there's no loader on the other route
    if (browserName === "webkit") {
      // Force new page instance for webkit.
      // Otherwise browser doesn't seem to fetch new manifest probably due to caching.
      page = await context.newPage();
    }
    await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-mounted]")).toHaveText("Mounted: yes");
    await page.getByRole("link", { name: "/other" }).click();
    await expect(page.locator("[data-loader-data]")).toHaveText(
      "loaderData = null"
    );
    expect(pageErrors).toEqual([]);

    // Revert route to original state to check HMR works and to ensure the
    // original file contents were valid
    await edit("app/routes/other.tsx", () => originalContents);
    await expect(page.locator("[data-loader-data]")).toHaveText(
      'loaderData = "hello"'
    );
    expect(pageErrors).toEqual([]);
  });
});
