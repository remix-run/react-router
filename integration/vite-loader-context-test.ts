import { test, expect } from "@playwright/test";
import getPort from "get-port";

import { createFixtureProject, js } from "./helpers/create-fixture.js";
import { basicTemplate, kill, node } from "./helpers/dev.js";

let projectDir: string;
let dev: { pid: number; port: number };

test.beforeAll(async () => {
  let port = await getPort();
  let hmrPort = await getPort();
  let files = basicTemplate({ port, hmrPort });
  projectDir = await createFixtureProject({
    compiler: "vite",
    files: {
      ...files,
      "server.mjs": files["server.mjs"].replace(
        "// load context",
        `getLoadContext: () => ({ value: "value" }),`
      ),
      "app/routes/_index.tsx": js`
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
    },
  });
  dev = await node(["./server.mjs"], { cwd: projectDir, port });
});

test.afterAll(async () => {
  await kill(dev.pid);
});

test("Vite custom Express server handles loader context", async ({ page }) => {
  let pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto(`http://localhost:${dev.port}/`, {
    waitUntil: "networkidle",
  });
  await expect(page.locator("#index [data-context]")).toHaveText(
    "Context: value"
  );
});
