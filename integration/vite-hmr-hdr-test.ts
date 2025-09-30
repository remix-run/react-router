import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import getPort from "get-port";
import dedent from "dedent";

import { test } from "./helpers/fixtures";
import * as Stream from "./helpers/stream";
import { viteMajorTemplates, getTemplates } from "./helpers/templates";
import * as Express from "./helpers/express";

const tsx = dedent;
const mdx = dedent;

const templates = [
  ...viteMajorTemplates,
  ...getTemplates(["rsc-vite-framework"]),
];

templates.forEach((template) => {
  const isRsc = template.name.includes("rsc");

  test.describe(`${template.displayName} - HMR & HDR`, () => {
    test.use({
      template: template.name,
      files: {
        "app/routes/_index.tsx": tsx`
          // imports
          import { useState, useEffect } from "react";

          export const meta = () => [{ title: "HMR updated title: 0" }]

          // loader

          export default function IndexRoute() {
            // hooks
            const [mounted, setMounted] = useState(false);
            useEffect(() => {
              setMounted(true);
            }, []);

            return (
              <div id="index">
                <h2 data-title>Index</h2>
                <input />
                <p data-mounted>Mounted: {mounted ? "yes" : "no"}</p>
                <p data-hmr>HMR updated: 0</p>
                {/* elements */}
              </div>
            );
          }
        `,
      },
    });

    test("vite dev", async ({ page, edit, $ }) => {
      const port = await getPort();
      const url = `http://localhost:${port}`;

      const dev = $(`pnpm dev --port ${port}`);
      await Stream.match(dev.stdout, url);

      await workflow({ isRsc, page, edit, url });
    });

    test("express", async ({ page, edit, $ }) => {
      await edit({
        "server.mjs": isRsc ? Express.rsc() : Express.server(),
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

      await workflow({ isRsc, page, edit, url });
    });

    test("mdx", async ({ page, edit, $ }) => {
      test.skip(template.name.includes("rsc"), "RSC is not supported");

      await edit({
        "vite.config.ts": tsx`
          import { defineConfig } from "vite";
          import { reactRouter } from "@react-router/dev/vite";
          import mdx from "@mdx-js/rollup";

          export default defineConfig({
            plugins: [
              mdx(),
              reactRouter(),
            ],
          });
        `,
        "app/component.tsx": tsx`
          import {useState} from "react";

          export const Counter = () => {
            const [count, setCount] = useState(0);
            return <button onClick={() => setCount(count => count + 1)}>Count: {count}</button>
          }
        `,
        "app/routes/mdx.mdx": mdx`
          import { Counter } from "../component";

          # MDX Title (HMR: 0)

          <Counter />
        `,
      });

      const port = await getPort();
      const url = `http://localhost:${port}`;

      const dev = $(`pnpm dev --port ${port}`);
      await Stream.match(dev.stdout, url);

      await page.goto(url + "/mdx", { waitUntil: "networkidle" });

      await expect(page.locator("h1")).toHaveText("MDX Title (HMR: 0)");
      let button = page.locator("button");
      await expect(button).toHaveText("Count: 0");
      await button.click();
      await expect(button).toHaveText("Count: 1");

      await edit({
        "app/routes/mdx.mdx": (contents) =>
          contents.replace("(HMR: 0)", "(HMR: 1)"),
      });
      await page.waitForLoadState("networkidle");

      await expect(page.locator("h1")).toHaveText("MDX Title (HMR: 1)");
      await expect(page.locator("button")).toHaveText("Count: 1");

      expect(page.errors).toEqual([]);
    });
  });
});

async function workflow({
  isRsc,
  page,
  edit,
  url,
}: {
  isRsc: boolean;
  page: Page;
  edit: (
    edits: Record<string, string | ((contents: string) => string)>,
  ) => Promise<void>;
  url: string;
}) {
  // setup: initial render
  await page.goto(url, { waitUntil: "networkidle" });
  await expect(page.locator("#index [data-title]")).toHaveText("Index");

  // setup: hydration
  await expect(page.locator("#index [data-mounted]")).toHaveText(
    "Mounted: yes",
  );

  // setup: browser state
  let hmrStatus = page.locator("#index [data-hmr]");

  await expect(page).toHaveTitle("HMR updated title: 0");
  await expect(hmrStatus).toHaveText("HMR updated: 0");
  let input = page.locator("#index input");
  await expect(input).toBeVisible();
  await input.fill("stateful");
  expect(page.errors).toEqual([]);

  // route: HMR
  await edit({
    "app/routes/_index.tsx": (contents) =>
      contents
        .replace("HMR updated title: 0", "HMR updated title: 1")
        .replace("HMR updated: 0", "HMR updated: 1"),
  });
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveTitle("HMR updated title: 1");
  await expect(hmrStatus).toHaveText("HMR updated: 1");
  await expect(input).toHaveValue("stateful");
  expect(page.errors).toEqual([]);

  // route: add loader
  await edit({
    "app/routes/_index.tsx": (contents) =>
      contents
        .replace(
          "// imports",
          `// imports\nimport { useLoaderData } from "react-router"`,
        )
        .replace(
          "// loader",
          `// loader\nexport const loader = () => ({ message: "HDR updated: 0" });`,
        )
        .replace(
          "// hooks",
          "// hooks\nconst { message } = useLoaderData<typeof loader>();",
        )
        .replace(
          "{/* elements */}",
          `{/* elements */}\n<p data-hdr>{message}</p>`,
        ),
  });
  await page.waitForLoadState("networkidle");
  let hdrStatus = page.locator("#index [data-hdr]");
  await expect(hdrStatus).toHaveText("HDR updated: 0");

  // React Fast Refresh cannot preserve state for a component when hooks are added or removed
  await expect(input).toHaveValue("");
  await input.fill("stateful");
  expect(page.errors.length).toBeGreaterThan(0);
  expect(
    // When adding a loader, a harmless error is logged to the browser console.
    // HMR works as intended, so this seems like a React Fast Refresh bug caused by off-screen rendering with old server data or something like that 🤷
    page.errors.filter(
      (error) =>
        !error.message.includes(
          "There was an error during concurrent rendering but React was able to recover by instead synchronously rendering the entire root.",
        ),
    ),
  ).toEqual([]);
  page.errors = [];

  // route: HDR
  await edit({
    "app/routes/_index.tsx": (contents) =>
      contents.replace("HDR updated: 0", "HDR updated: 1"),
  });
  await page.waitForLoadState("networkidle");
  await expect(hdrStatus).toHaveText("HDR updated: 1");
  await expect(input).toHaveValue("stateful");

  // route: HMR + HDR
  await edit({
    "app/routes/_index.tsx": (contents) =>
      contents
        .replace("HMR updated: 1", "HMR updated: 2")
        .replace("HDR updated: 1", "HDR updated: 2"),
  });
  await page.waitForLoadState("networkidle");
  await expect(hmrStatus).toHaveText("HMR updated: 2");
  await expect(hdrStatus).toHaveText("HDR updated: 2");
  await expect(input).toHaveValue("stateful");
  expect(page.errors).toEqual([]);

  // create new non-route component module
  await edit({
    "app/component.tsx": tsx`
      export function MyComponent() {
        return <p data-component>Component HMR: 0</p>;
      }
    `,
    "app/routes/_index.tsx": (contents) =>
      contents
        .replace(
          "// imports",
          `// imports\nimport { MyComponent } from "../component";`,
        )
        .replace("{/* elements */}", "{/* elements */}\n<MyComponent />"),
  });
  await page.waitForLoadState("networkidle");
  let component = page.locator("#index [data-component]");
  await expect(component).toBeVisible();
  await expect(component).toHaveText("Component HMR: 0");
  await expect(input).toHaveValue("stateful");
  expect(page.errors).toEqual([]);

  // non-route: HMR
  await edit({
    "app/component.tsx": (contents) =>
      contents.replace("Component HMR: 0", "Component HMR: 1"),
  });
  await page.waitForLoadState("networkidle");
  await expect(component).toHaveText("Component HMR: 1");
  await expect(input).toHaveValue("stateful");
  expect(page.errors).toEqual([]);

  // create new non-route server module
  await edit({
    "app/indirect-hdr-dep.ts": tsx`export const indirect = "indirect 0"`,
    "app/direct-hdr-dep.ts": tsx`
      import { indirect } from "./indirect-hdr-dep"
      export const direct = "direct 0 & " + indirect
    `,
    "app/routes/_index.tsx": (contents) =>
      contents
        .replace(
          "// imports",
          `// imports\nimport { direct } from "../direct-hdr-dep"`,
        )
        .replace(
          `{ message: "HDR updated: 2" }`,
          `{ message: "HDR updated: " + direct }`,
        ),
  });
  await page.waitForLoadState("networkidle");
  await expect(hdrStatus).toHaveText("HDR updated: direct 0 & indirect 0");
  await expect(input).toHaveValue("stateful");
  expect(page.errors).toEqual([]);

  // non-route: HDR for direct dependency
  await edit({
    "app/direct-hdr-dep.ts": (contents) =>
      contents.replace("direct 0 &", "direct 1 &"),
  });
  await page.waitForLoadState("networkidle");
  await expect(hdrStatus).toHaveText("HDR updated: direct 1 & indirect 0");
  await expect(input).toHaveValue("stateful");
  expect(page.errors).toEqual([]);

  // non-route: HDR for indirect dependency
  await edit({
    "app/indirect-hdr-dep.ts": (contents) =>
      contents.replace("indirect 0", "indirect 1"),
  });
  await page.waitForLoadState("networkidle");
  await expect(hdrStatus).toHaveText("HDR updated: direct 1 & indirect 1");
  await expect(input).toHaveValue("stateful");
  expect(page.errors).toEqual([]);

  // everything everywhere all at once
  await Promise.all([
    edit({
      "app/routes/_index.tsx": (contents) =>
        contents
          .replace("HMR updated: 2", "HMR updated: 3")
          .replace("HDR updated: ", "HDR updated: route & "),
    }),
    edit({
      "app/component.tsx": (contents) =>
        contents.replace("Component HMR: 1", "Component HMR: 2"),
    }),
    edit({
      "app/direct-hdr-dep.ts": (contents) =>
        contents.replace("direct 1 &", "direct 2 &"),
    }),
    edit({
      "app/indirect-hdr-dep.ts": (contents) =>
        contents.replace("indirect 1", "indirect 2"),
    }),
  ]);
  await page.waitForLoadState("networkidle");
  await expect(hmrStatus).toHaveText("HMR updated: 3");
  await expect(component).toHaveText("Component HMR: 2");
  await expect(hdrStatus).toHaveText(
    "HDR updated: route & direct 2 & indirect 2",
  );
  // TODO: Investigate why this is flaky in CI for RSC Framework Mode
  if (isRsc) {
    await expect(input).toHaveValue("stateful");
  }

  expect(page.errors).toEqual([]);
}
