import { test, expect } from "@playwright/test";
import getPort from "get-port";

import { createFixtureProject, js } from "./helpers/create-fixture.js";
import { basicTemplate, kill, node } from "./helpers/dev.js";

test.describe("Vite custom Express server", () => {
  let projectDir: string;
  let dev: { pid: number; port: number };

  test.beforeAll(async () => {
    let port = await getPort();
    let hmrPort = await getPort();
    projectDir = await createFixtureProject({
      compiler: "vite",
      files: {
        ...basicTemplate({ port, hmrPort }),
        ".env": `
          ENV_VAR_FROM_DOTENV_FILE=Content from .env file
        `,
        "app/routes/dotenv.tsx": js`
          import { useState, useEffect } from "react";
          import { json } from "@remix-run/node";
          import { useLoaderData } from "@remix-run/react";

          export const loader = () => {
            return json({
              loaderContent: process.env.ENV_VAR_FROM_DOTENV_FILE,
            })
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
    dev = await node(projectDir, ["./server.mjs"], { port });
  });

  test.afterAll(async () => {
    await kill(dev.pid);
  });

  test("loads .env file", async ({ page }) => {
    let pageErrors: unknown[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto(`http://localhost:${dev.port}/dotenv`, {
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
