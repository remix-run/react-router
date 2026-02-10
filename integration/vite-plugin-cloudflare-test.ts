import { expect } from "@playwright/test";
import dedent from "dedent";

import { type Files, test, viteConfig } from "./helpers/vite.js";

const tsx = dedent;
const css = dedent;

function defineFiles({
  reversePlugins = false,
}: { reversePlugins?: boolean } = {}): Files {
  const files: Files = async ({ port }) => ({
    "vite.config.ts": tsx`
    import { defineConfig } from "vite";
    import { cloudflare } from "@cloudflare/vite-plugin";
    import { reactRouter } from "@react-router/dev/vite";

    export default defineConfig({
      ${await viteConfig.server({ port })}
      plugins: [
        cloudflare({ viteEnvironment: { name: "ssr" } }),
        reactRouter(),
      ]${reversePlugins ? ".reverse()" : ""},
    });
  `,
    "app/routes/env.tsx": tsx`
    import { env } from "cloudflare:workers";
    import type { Route } from "./+types/env";
    export function loader() {
      return { message: env.VALUE_FROM_CLOUDFLARE };
    }
    export default function EnvRoute({ loaderData }: Route.RouteComponentProps) {
      return <div data-loader-message>{loaderData.message}</div>;
    }
  `,
    "app/routes/css-side-effect/route.tsx": tsx`
    import "./styles.css";
    
    export default function CssSideEffectRoute() {
      return <div className="css-side-effect" data-css-side-effect>CSS Side Effect</div>;
    }
  `,
    "app/routes/css-side-effect/styles.css": css`
      .css-side-effect {
        padding: 20px;
      }
    `,
  });
  return files;
}

test.describe("vite-plugin-cloudflare", () => {
  test("handles Cloudflare env", async ({ dev, page }) => {
    const files = defineFiles();
    const { port } = await dev(files, "vite-plugin-cloudflare-template");

    await page.goto(`http://localhost:${port}/env`, {
      waitUntil: "networkidle",
    });

    // Ensure no errors on page load
    expect(page.errors).toEqual([]);

    await expect(page.locator("[data-loader-message]")).toHaveText(
      "Hello from Cloudflare",
    );
  });

  test("handles Cloudflare env with plugin order reversed", async ({
    dev,
    page,
  }) => {
    const files = defineFiles({ reversePlugins: true });
    const { port } = await dev(files, "vite-plugin-cloudflare-template");

    await page.goto(`http://localhost:${port}/env`, {
      waitUntil: "networkidle",
    });

    // Ensure no errors on page load
    expect(page.errors).toEqual([]);

    await expect(page.locator("[data-loader-message]")).toHaveText(
      "Hello from Cloudflare",
    );
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("handles CSS side effects during SSR in dev", async ({
      dev,
      page,
    }) => {
      const files = defineFiles();
      const { port } = await dev(files, "vite-plugin-cloudflare-template");

      await page.goto(`http://localhost:${port}/css-side-effect`, {
        waitUntil: "networkidle",
      });

      await expect(page.locator("[data-css-side-effect]")).toHaveCSS(
        "padding",
        "20px",
      );
    });
  });

  test("handles CSS side effects during SSR in dev with plugin order reversed", async ({
    dev,
    page,
  }) => {
    const files = defineFiles({ reversePlugins: true });
    const { port } = await dev(files, "vite-plugin-cloudflare-template");

    await page.goto(`http://localhost:${port}/css-side-effect`, {
      waitUntil: "networkidle",
    });

    await expect(page.locator("[data-css-side-effect]")).toHaveCSS(
      "padding",
      "20px",
    );
  });
});
