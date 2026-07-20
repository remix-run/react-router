import { expect, test } from "@playwright/test";
import getPort from "get-port";

import { build, createProject, reactRouterServe } from "./helpers/vite.js";

test("split route modules retain exported clientLoader dependencies", async ({
  page,
}) => {
  let port = await getPort();
  let cwd = await createProject({
    "react-router.config.ts": `
      import type { Config } from "@react-router/dev/config";

      export default {
        splitRouteModules: true,
      } satisfies Config;
    `,
    "app/routes/_index.tsx": `
      import { Link } from "react-router";

      export default function Index() {
        return <Link to="/dependency">Load route</Link>;
      }
    `,
    "app/routes/dependency.tsx": `
      import { useLoaderData } from "react-router";

      export function exportedHelper() {
        return "Loaded through exported helper";
      }

      export function clientLoader() {
        return exportedHelper();
      }

      export default function Dependency() {
        let data = useLoaderData<typeof clientLoader>();
        return <h1>{data}</h1>;
      }
    `,
  });

  let buildResult = build({ cwd });
  expect(buildResult.status).toBe(0);

  let stop = await reactRouterServe({ cwd, port });
  try {
    await page.goto(`http://localhost:${port}`);
    await page.getByRole("link", { name: "Load route" }).click();
    await expect(
      page.getByRole("heading", { name: "Loaded through exported helper" }),
    ).toBeVisible();
  } finally {
    stop();
  }
});
