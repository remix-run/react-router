import { expect, type Page } from "@playwright/test";

import {
  createAppFixture,
  createFixture,
  css,
  js,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import {
  createEditor,
  type Files,
  reactRouterConfig,
  test,
  viteConfig,
} from "./helpers/vite.js";

const appFiles = {
  "react-router.config.ts": reactRouterConfig({
    crossOrigin: "anonymous",
    routeDiscovery: { mode: "initial" },
  }),
  "app/root.tsx": js`
    import { Link, Links, Outlet, Scripts } from "react-router";
    import rootStyles from "./root.css?url";

    export function links() {
      return [{ rel: "stylesheet", href: rootStyles }];
    }

    export default function Root() {
      return (
        <html>
          <head><Links /></head>
          <body>
            <Link to="/about" prefetch="intent">About</Link>
            <p data-hmr>HMR 0</p>
            <Outlet />
            <Scripts />
          </body>
        </html>
      );
    }
  `,
  "app/root.css": css`
    body {
      color: black;
    }
  `,
  "app/routes/_index.tsx": js`
    export default function Index() {
      return <h1>Home</h1>;
    }
  `,
  "app/routes/about.tsx": js`
    import aboutStyles from "../about.css?url";

    export function links() {
      return [
        { rel: "stylesheet", href: aboutStyles },
        { rel: "stylesheet", href: "/hmr.css" },
      ];
    }

    export async function clientLoader() {
      return null;
    }

    export default function About() {
      return <h1>About</h1>;
    }
  `,
  "app/about.css": css`
    h1 {
      color: blue;
    }
  `,
  "public/hmr.css": css`
    h1 {
      color: red;
    }
  `,
};

async function expectConfiguredCrossOrigin(
  page: Page,
  options: { hasModulePreloads: boolean },
) {
  await expect
    .poll(() => page.evaluate(() => window.__reactRouterManifest?.crossOrigin))
    .toBe("anonymous");

  await expect(page.locator("link[rel='stylesheet']").first()).toHaveAttribute(
    "crossorigin",
    "anonymous",
  );
  await expect(page.locator("script[type='module']")).toHaveAttribute(
    "crossorigin",
    "anonymous",
  );
  if (options.hasModulePreloads) {
    await expect(
      page.locator("link[rel='modulepreload']").first(),
    ).toHaveAttribute("crossorigin", "anonymous");
  }

  await page.getByRole("link", { name: "About" }).hover();
  await expect(
    page.locator("link[rel='prefetch'][as='style']").first(),
  ).toHaveAttribute("crossorigin", "anonymous");
}

test.describe("crossOrigin config", () => {
  test("flows through the production manifest and asset tags", async ({
    page,
  }) => {
    let fixture = await createFixture({ files: appFiles });
    let appFixture = await createAppFixture(fixture);

    try {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await expectConfiguredCrossOrigin(page, { hasModulePreloads: true });
    } finally {
      appFixture.close();
    }
  });

  test("flows through the development manifest and asset tags", async ({
    page,
    dev,
  }) => {
    let files: Files = async ({ port }) => ({
      ...appFiles,
      "vite.config.ts": await viteConfig.basic({ port }),
    });
    let { cwd, port } = await dev(files);

    let releaseCssRequest = () => {};
    let cssRequestBlocked = new Promise<void>((resolve) => {
      releaseCssRequest = resolve;
    });
    await page.route("**/hmr.css", async (route) => {
      await cssRequestBlocked;
      await route.fulfill({
        contentType: "text/css",
        body: "h1 { color: red; }",
      });
    });

    await page.goto(`http://localhost:${port}/`);
    try {
      await expectConfiguredCrossOrigin(page, { hasModulePreloads: false });

      let edit = createEditor(cwd);
      await edit("app/root.tsx", (contents) =>
        contents.replace("HMR 0", "HMR 1"),
      );
      await expect(page.locator("[data-hmr]")).toHaveText("HMR 1");

      await page.getByRole("link", { name: "About" }).click();
      await expect(
        page.locator("link[rel='preload'][as='style'][href='/hmr.css']"),
      ).toHaveAttribute("crossorigin", "anonymous");
    } finally {
      releaseCssRequest();
    }

    await expect(page.getByRole("heading", { name: "About" })).toBeVisible();
  });
});
