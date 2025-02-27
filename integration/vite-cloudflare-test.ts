import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import type { Files } from "./helpers/vite.js";
import { reactRouterConfig, test, viteConfig } from "./helpers/vite.js";

function getFiles({
  viteEnvironmentApi,
}: {
  viteEnvironmentApi: boolean;
}): Files {
  return async ({ port }) => ({
    "react-router.config.ts": reactRouterConfig({ viteEnvironmentApi }),
    "vite.config.ts": `
      import { reactRouter } from "@react-router/dev/vite";
      import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
      import { getLoadContext } from "./load-context";

      export default {
        ${await viteConfig.server({ port })}
        plugins: [
          cloudflareDevProxy({ getLoadContext }),
          reactRouter(),
        ],
      }
    `,
    "load-context.ts": `
      import { type AppLoadContext } from "@react-router/cloudflare";
      import { type PlatformProxy } from "wrangler";

      type Env = {
        MY_KV: KVNamespace;
      }
      type Cloudflare = Omit<PlatformProxy<Env>, 'dispose'>;
  
      declare module "@react-router/cloudflare" {
        interface AppLoadContext {
          cloudflare: Cloudflare;
          env2: Cloudflare["env"];
          extra: string;
        }
      }

      type GetLoadContext = (args: {
        request: Request;
        context: { cloudflare: Cloudflare };
      }) => AppLoadContext;

      export const getLoadContext: GetLoadContext = ({ context }) => {
        return {
          ...context,
          env2: context.cloudflare.env,
          extra: "stuff",
        };
      };
    `,
    "functions/[[page]].ts": `
      import { createPagesFunctionHandler } from "@react-router/cloudflare";

      // @ts-ignore - the server build file is generated by \`react-router build\`
      import * as build from "../build/server";
      import { getLoadContext } from "../load-context";

      export const onRequest = createPagesFunctionHandler({
        build,
        getLoadContext,
      });
    `,
    "wrangler.toml": `
      kv_namespaces = [
        { id = "abc123", binding="MY_KV" }
      ]
    `,
    "app/routes/_index.tsx": `
      import {
        type LoaderFunctionArgs,
        type ActionFunctionArgs,
        Form,
        useLoaderData,
      } from "react-router";

      const key = "__my-key__";

      export async function loader({ context }: LoaderFunctionArgs) {
        const { MY_KV } = context.cloudflare.env;
        const value = await MY_KV.get(key);
        return { value, extra: context.extra };
      }

      export async function action({ request, context }: ActionFunctionArgs) {
        const { MY_KV } = context.env2;

        if (request.method === "POST") {
          const formData = await request.formData();
          const value = formData.get("value") as string;
          await MY_KV.put(key, value);
          return null;
        }

        if (request.method === "DELETE") {
          await MY_KV.delete(key);
          return null;
        }

        throw new Error(\`Method not supported: "\${request.method}"\`);
      }

      export default function Index() {
        const { value, extra } = useLoaderData<typeof loader>();
        return (
          <div>
            <h1>Welcome to React Router + Cloudflare</h1>
            <p data-extra>Extra: {extra}</p>
            {value ? (
              <>
                <p data-text>Value: {value}</p>
                <Form method="DELETE">
                  <button>Delete</button>
                </Form>
              </>
            ) : (
              <>
                <p data-text>No value</p>
                <Form method="POST">
                  <label htmlFor="value">Set value:</label>
                  <input type="text" name="value" id="value" required />
                  <br />
                  <button>Save</button>
                </Form>
              </>
            )}
          </div>
        );
      }
    `,
  });
}

test.describe("Cloudflare Dev Proxy", () => {
  [false, true].forEach((viteEnvironmentApi) => {
    test.describe(`viteEnvironmentApi enabled: ${viteEnvironmentApi}`, () => {
      const files = getFiles({ viteEnvironmentApi });

      test("vite dev", async ({ page, dev }) => {
        let { port } = await dev(files, "cloudflare-dev-proxy-template");
        await workflow({ page, port });
      });

      test("wrangler pages dev", async ({ page, wranglerPagesDev }) => {
        let { port } = await wranglerPagesDev(files);
        await workflow({ page, port });
      });
    });
  });
});

async function workflow({ page, port }: { page: Page; port: number }) {
  await page.goto(`http://localhost:${port}/`, {
    waitUntil: "networkidle",
  });
  await expect(page.locator("[data-extra]")).toHaveText("Extra: stuff");
  await expect(page.locator("[data-text]")).toHaveText("No value");

  await page.getByLabel("Set value:").fill("my-value");
  await page.getByRole("button").click();
  await expect(page.locator("[data-text]")).toHaveText("Value: my-value");
  expect(page.errors).toEqual([]);
}
