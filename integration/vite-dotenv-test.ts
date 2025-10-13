import { test, expect } from "@playwright/test";
import getPort from "get-port";

import {
  type TemplateName,
  createProject,
  customDev,
  EXPRESS_SERVER,
  viteConfig,
} from "./helpers/vite.js";

const templateNames = [
  "vite-6-template",
  "rsc-vite-framework",
] as const satisfies TemplateName[];

let getFiles = async ({
  templateName,
  envDir,
  port,
}: {
  templateName: TemplateName;
  envDir?: string;
  port: number;
}) => {
  let envPath = `${envDir ? `${envDir}/` : ""}.env`;

  return {
    "vite.config.js": await viteConfig.basic({ templateName, port, envDir }),
    "server.mjs": EXPRESS_SERVER({ port, templateName }),
    [envPath]: `
      ENV_VAR_FROM_DOTENV_FILE=Content from ${envPath} file
      VITE_PORTAL=testing
    `,
    "app/routes.ts": `
      import { type RouteConfig, route } from "@react-router/dev/routes";
      import { flatRoutes } from "@react-router/fs-routes";
      const routes = [];
      if (import.meta.env.VITE_PORTAL === "testing") {
        routes.push(route("testing", "testing.tsx"));
      }
      export default [
        ...await flatRoutes(),
        ...routes,
      ] satisfies RouteConfig;
    `,
    "app/testing.tsx": String.raw`
      export default function TestingRoute() {
        return <div data-testing-route>Testing Route</div>
      }
    `,
    "app/routes/dotenv.tsx": String.raw`
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
  };
};

for (const envDir of [undefined, "custom-env-dir"]) {
  let envPath = `${envDir ? `${envDir}/` : ""}.env`;
  test.describe(`Vite ${envPath}`, () => {
    for (const templateName of templateNames) {
      test.describe(`template: ${templateName}`, () => {
        test.describe("defaults", async () => {
          let port: number;
          let cwd: string;
          let stop: () => void;

          test.beforeAll(async () => {
            port = await getPort();
            cwd = await createProject(
              await getFiles({ envDir, port, templateName }),
              templateName,
            );
            stop = await customDev({ cwd, port });
          });
          test.afterAll(() => stop());

          test("express", async ({ page }) => {
            let pageErrors: unknown[] = [];
            page.on("pageerror", (error) => pageErrors.push(error));

            await page.goto(`http://localhost:${port}/dotenv`, {
              waitUntil: "networkidle",
            });
            expect(pageErrors).toEqual([]);

            let loaderContent = page.locator(
              "[data-dotenv-route-loader-content]",
            );
            await expect(loaderContent).toHaveText(
              `Content from ${envPath} file`,
            );

            let clientContent = page.locator(
              "[data-dotenv-route-client-content]",
            );
            await expect(clientContent).toHaveText(
              "process.env.ENV_VAR_FROM_DOTENV_FILE not available on the client, which is a good thing",
            );

            expect(pageErrors).toEqual([]);
          });

          test("routes.ts has VITE_* env var", async ({ page }) => {
            let pageErrors: unknown[] = [];
            page.on("pageerror", (error) => pageErrors.push(error));

            await page.goto(`http://localhost:${port}/testing`, {
              waitUntil: "networkidle",
            });
            expect(pageErrors).toEqual([]);

            let testingDiv = page.locator("[data-testing-route]");
            await expect(testingDiv).toHaveText("Testing Route");

            expect(pageErrors).toEqual([]);
          });
        });
      });
    }
  });
}
