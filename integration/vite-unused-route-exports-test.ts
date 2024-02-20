import * as path from "node:path";
import { test, expect } from "@playwright/test";

import { createProject, grep, viteBuild } from "./helpers/vite.js";

test("Vite / dead-code elimination for unused route exports", async () => {
  let cwd = await createProject({
    "app/routes/custom-route-exports.tsx": String.raw`
      const unusedMessage = "ROUTE_EXPORT_THAT_ISNT_USED";
      const usedMessage = "ROUTE_EXPORT_THAT_IS_USED";

      export const unusedRouteExport = unusedMessage;
      export const usedRouteExport = usedMessage;

      export default function CustomExportsRoute() {
        return <h1>Custom route exports</h1>
      }
    `,
    "app/routes/use-route-export.tsx": String.raw`
      import { usedRouteExport } from "./custom-route-exports";

      export default function CustomExportsRoute() {
        return <h1>{usedRouteExport}</h1>
      }
    `,
  });
  let { status } = viteBuild({ cwd });
  expect(status).toBe(0);

  expect(
    grep(path.join(cwd, "build/client"), /ROUTE_EXPORT_THAT_ISNT_USED/).length
  ).toBe(0);

  expect(
    grep(path.join(cwd, "build/client"), /ROUTE_EXPORT_THAT_IS_USED/).length
  ).toBeGreaterThanOrEqual(1);
});
