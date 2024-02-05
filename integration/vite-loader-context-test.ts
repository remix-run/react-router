import { test, expect } from "@playwright/test";
import getPort from "get-port";

import {
  createProject,
  customDev,
  EXPRESS_SERVER,
  viteConfig,
} from "./helpers/vite.js";

let port: number;
let cwd: string;
let stop: () => void;

test.beforeAll(async () => {
  port = await getPort();
  cwd = await createProject({
    "vite.config.js": await viteConfig.basic({ port }),
    "server.mjs": EXPRESS_SERVER({ port, loadContext: { value: "value" } }),
    "app/routes/_index.tsx": String.raw`
      import { json } from "@remix-run/node";
      import { useLoaderData } from "@remix-run/react";

      export const loader = ({ context }) => {
        return json({ context })
      }

      export default function IndexRoute() {
        let { context } = useLoaderData<typeof loader>();
        return (
          <div id="index">
            <p data-context>Context: {context.value}</p>
          </div>
        );
      }
    `,
  });
  stop = await customDev({ cwd, port });
});
test.afterAll(() => stop());

test("Vite / Load context / express", async ({ page }) => {
  let pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto(`http://localhost:${port}/`, {
    waitUntil: "networkidle",
  });
  await expect(page.locator("#index [data-context]")).toHaveText(
    "Context: value"
  );
  expect(pageErrors).toEqual([]);
});
