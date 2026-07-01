import { expect } from "@playwright/test";
import dedent from "dedent";
import getPort from "get-port";

import {
  type Files,
  test,
  viteConfig,
  createProject,
  build,
} from "./helpers/vite.js";

const tsx = dedent;
const css = dedent;

function defineFiles({
  reversePlugins = false,
}: { reversePlugins?: boolean } = {}): Files {
  const files: Files = async ({ port }) => {
    const inspectorPort = await getPort();

    return {
      "vite.config.ts": tsx`
    import { defineConfig } from "vite";
    import { cloudflare } from "@cloudflare/vite-plugin";
    import { reactRouter } from "@react-router/dev/vite";

    export default defineConfig({
      ${await viteConfig.server({ port })}
      plugins: [
        cloudflare({
          inspectorPort: ${inspectorPort},
          viteEnvironment: { name: "ssr" },
        }),
        reactRouter(),
      ]${reversePlugins ? ".reverse()" : ""},
    });
  `,
      "app/routes/env.tsx": tsx`
    import type { Route } from "./+types/env";
    import { cloudflareContext } from "../cloudflare";
    export function loader({ context }: Route.LoaderArgs) {
      return { message: context.get(cloudflareContext).env.VALUE_FROM_CLOUDFLARE };
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
    };
  };
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

  test("does not force node export conditions", async ({ dev, page }) => {
    const baseFiles = defineFiles();
    const files: Files = async (args) => ({
      ...(await baseFiles(args)),
      "app/routes/conditional-export.tsx": tsx`
        import { runtime } from "conditional-runtime";

        export function loader() {
          return { runtime };
        }

        export default function ConditionalExportsRoute({
          loaderData,
        }: {
          loaderData: { runtime: string };
        }) {
          return <div data-runtime>{loaderData.runtime}</div>;
        }
      `,
      "node_modules/conditional-runtime/package.json": JSON.stringify({
        name: "conditional-runtime",
        type: "module",
        exports: {
          ".": {
            node: "./node.js",
            default: "./worker.js",
          },
        },
      }),
      "node_modules/conditional-runtime/node.js": tsx`
        import "node:http";
        export const runtime = "node";
      `,
      "node_modules/conditional-runtime/worker.js": tsx`
        export const runtime = "worker";
      `,
    });
    const { port } = await dev(files, "vite-plugin-cloudflare-template");

    await page.goto(`http://localhost:${port}/conditional-export`, {
      waitUntil: "networkidle",
    });

    expect(page.errors).toEqual([]);
    await expect(page.locator("[data-runtime]")).toHaveText("worker");
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

  test("builds project with default server entry", async () => {
    const files = defineFiles();
    const cwd = await createProject(
      await files({ port: 0 }),
      "vite-plugin-cloudflare-template",
    );
    const buildResult = build({ cwd });

    expect(buildResult.status).toBe(0);
  });
});
