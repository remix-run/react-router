import { expect } from "@playwright/test";
import dedent from "dedent";
import getPort from "get-port";

import { test } from "./helpers/fixtures";
import * as Stream from "./helpers/stream";
import { viteMajorTemplates } from "./helpers/templates";

const tsx = dedent;

for (const template of viteMajorTemplates) {
  for (const component of ["Plain", "WithHooks"]) {
    test.describe(`${template.displayName} - worker importing ${component}`, () => {
      test.use({
        template: template.name,
        files: {
          "app/Plain.tsx": tsx`
            export default function Plain() {
              return <p>Plain component</p>;
            }
          `,
          "app/WithHooks.tsx": tsx`
            import { useState } from "react";

            export default function WithHooks() {
              const [count, setCount] = useState(0);
              return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
            }
          `,
          "app/component.worker.ts": tsx`
            import Component from "./${component}";

            self.onmessage = (event) => {
              self.postMessage(event.data + ":" + typeof Component);
            };
          `,
          "app/routes/_index.tsx": tsx`
            import { useEffect, useState } from "react";
            import Plain from "../Plain";
            import WithHooks from "../WithHooks";

            export default function Index() {
              const [message, setMessage] = useState("Waiting for worker");

              useEffect(() => {
                const worker = new Worker(new URL("../component.worker.ts", import.meta.url), {
                  type: "module",
                });
                worker.onmessage = (event) => setMessage(event.data);
                worker.onerror = (event) => setMessage(event.message);
                worker.postMessage("pong");
                return () => worker.terminate();
              }, []);

              return (
                <>
                  <p data-worker>{message}</p>
                  <Plain />
                  <WithHooks />
                </>
              );
            }
          `,
        },
      });

      test("imports the component and preserves browser Fast Refresh", async ({
        page,
        edit,
        $,
      }) => {
        const port = await getPort();
        const url = `http://localhost:${port}`;
        const dev = $(`pnpm dev --port ${port}`);
        await Stream.match(dev.stdout, url);

        await page.goto(url);
        await expect(page.locator("[data-worker]")).toHaveText("pong:function");
        await expect(
          page.getByText("Plain component", { exact: true }),
        ).toBeVisible();
        await page
          .getByRole("button", { name: "Count: 0", exact: true })
          .click();
        await expect(page.getByRole("button")).toHaveText("Count: 1");

        await edit({
          "app/WithHooks.tsx": (contents) =>
            contents.replace("Count: ", "Updated count: "),
        });

        await expect(page.getByRole("button")).toHaveText("Updated count: 1");
        await expect(page.locator("[data-worker]")).toHaveText("pong:function");
        expect(page.errors).toEqual([]);
      });
    });
  }
}
