import { test, expect } from "@playwright/test";
import getPort from "get-port";

import {
  createProject,
  customDev,
  EXPRESS_SERVER,
  viteConfig,
} from "./helpers/vite.js";

let getFiles = async ({ envDir, port }: { envDir?: string; port: number }) => {
  let envPath = `${envDir ? `${envDir}/` : ""}.env`;

  return {
    "vite.config.js": await viteConfig.basic({ port, envDir }),
    "server.mjs": EXPRESS_SERVER({ port }),
    [envPath]: `
      ENV_VAR_FROM_DOTENV_FILE=Content from ${envPath} file
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

test.describe("Vite .env", () => {
  test.describe("defaults", async () => {
    let port: number;
    let cwd: string;
    let stop: () => void;

    test.beforeAll(async () => {
      port = await getPort();
      cwd = await createProject(await getFiles({ port }));
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

      let loaderContent = page.locator("[data-dotenv-route-loader-content]");
      await expect(loaderContent).toHaveText("Content from .env file");

      let clientContent = page.locator("[data-dotenv-route-client-content]");
      await expect(clientContent).toHaveText(
        "process.env.ENV_VAR_FROM_DOTENV_FILE not available on the client, which is a good thing"
      );

      expect(pageErrors).toEqual([]);
    });
  });

  test.describe("custom env dir", async () => {
    let port: number;
    let cwd: string;
    let stop: () => void;

    test.beforeAll(async () => {
      const envDir = "custom-env-dir";
      port = await getPort();
      cwd = await createProject(await getFiles({ envDir, port }));
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

      let loaderContent = page.locator("[data-dotenv-route-loader-content]");
      await expect(loaderContent).toHaveText(
        "Content from custom-env-dir/.env file"
      );

      let clientContent = page.locator("[data-dotenv-route-client-content]");
      await expect(clientContent).toHaveText(
        "process.env.ENV_VAR_FROM_DOTENV_FILE not available on the client, which is a good thing"
      );

      expect(pageErrors).toEqual([]);
    });
  });
});
