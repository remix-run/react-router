import { expect } from "@playwright/test";
import tsx from "dedent";
import getPort from "get-port";

import * as Express from "./helpers/express";
import { test } from "./helpers/fixtures";
import * as Stream from "./helpers/stream";
import { viteMajorTemplates, getTemplates } from "./helpers/templates";

const templates = [
  ...viteMajorTemplates,
  ...getTemplates(["rsc-vite-framework"]),
];

test.use({
  files: {
    "app/routes/dotenv.tsx": tsx`
      import { useState, useEffect } from "react";
      import { useLoaderData } from "react-router";

      export const loader = () => {
        return {
          loaderContent: process.env.ENV_VAR_FROM_DOTENV_FILE,
        }
      }

      export default function DotenvRoute() {
        const { loaderContent } = useLoaderData();

        const [clientContent, setClientContent] = useState('');
        useEffect(() => {
          try {
            setClientContent("process.env.ENV_VAR_FROM_DOTENV_FILE shouldn't be available on the client, found: " + process.env.ENV_VAR_FROM_DOTENV_FILE);
          } catch (err) {
            setClientContent("process.env.ENV_VAR_FROM_DOTENV_FILE not available on the client, which is a good thing");
          }
        }, []);

        return <>
          <div data-dotenv-route-loader-content>{loaderContent}</div>
          <div data-dotenv-route-client-content>{clientContent}</div>
        </>
      }
    `,
  },
});

const envs = [
  { name: "default", path: ".env" },
  { name: "custom env dir", path: "custom-env-dir/.env" },
];

test.describe("Vite .env", () => {
  templates.forEach((template) => {
    test.describe(`template: ${template.displayName}`, () => {
      const isRsc = template.name.startsWith("rsc-");
      test.use({ template: template.name });
      envs.forEach((env) => {
        test(env.name, async ({ edit, $, page }) => {
          await edit({
            "server.mjs": isRsc ? Express.rsc() : Express.server(),
            ".env": `
              VITE_ENV_ROUTE=dotenv
              ENV_VAR_FROM_DOTENV_FILE=Content from ${env.path} file
            `,
            "app/routes.ts": (contents) => {
              if (template.name === "vite-5-template") return contents;
              return tsx`
                import { type RouteConfig, route } from "@react-router/dev/routes";

                const routes: RouteConfig = [];
                if (import.meta.env.VITE_ENV_ROUTE === "dotenv") {
                  routes.push(route("dotenv", "routes/dotenv.tsx"));
                }

                export default routes
              `;
            },
          });
          await $("pnpm build");

          const port = await getPort();
          const url = `http://localhost:${port}`;

          const server = $("node server.mjs", {
            env: {
              PORT: String(port),
              HMR_PORT: String(await getPort()),
            },
          });
          await Stream.match(server.stdout, url);

          await page.goto(`${url}/dotenv`, { waitUntil: "networkidle" });
          expect(page.errors).toEqual([]);

          let loaderContent = page.locator(
            "[data-dotenv-route-loader-content]",
          );
          await expect(loaderContent).toHaveText(
            `Content from ${env.path} file`,
          );

          let clientContent = page.locator(
            "[data-dotenv-route-client-content]",
          );
          await expect(clientContent).toHaveText(
            "process.env.ENV_VAR_FROM_DOTENV_FILE not available on the client, which is a good thing",
          );

          expect(page.errors).toEqual([]);
        });
      });
    });
  });
});
