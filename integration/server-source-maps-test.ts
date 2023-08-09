import { test, expect } from "@playwright/test";
import path from "node:path";
import fsp from "node:fs/promises";

import { createFixture, js } from "./helpers/create-fixture.js";
import type { Fixture } from "./helpers/create-fixture.js";

let fixture: Fixture;

test.beforeAll(async () => {
  fixture = await createFixture({
    sourcemap: true,
    files: {
      "app/routes/_index.tsx": js`
        import { json } from "@remix-run/node";
        import { useLoaderData } from "@remix-run/react";

        export function loader() {
          try {
            throw new Error("💩");
          } catch {
            return json(err.stack);
          }
        }

        export default function Index() {
          let data = useLoaderData();
          return (
            <pre>
              {data}
            </pre>
          )
        }
      `,
    },
  });
});

test("re-writes stack traces to point to the correct file", async () => {
  let buildIndex = await fsp.readFile(
    path.join(fixture.projectDir, "build/index.js"),
    "utf-8"
  );
  expect(buildIndex).toMatch("//# sourceMappingURL=index.js.map");
  let buildIndexSourcemap = await fsp.readFile(
    path.join(fixture.projectDir, "build/index.js.map"),
    "utf-8"
  );
  expect(buildIndexSourcemap).not.toMatch("route:");
});
