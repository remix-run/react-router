import fs from "node:fs/promises";
import path from "node:path";
import { expect } from "@playwright/test";

import type { Files, TemplateName } from "./helpers/vite.js";
import {
  test,
  createEditor,
  viteConfig,
  reactRouterConfig,
} from "./helpers/vite.js";

const templateName = "rsc-vite-framework" as const satisfies TemplateName;

test.describe("Vite HMR & HDR (RSC)", () => {
  test("vite dev", async ({ page, dev }) => {
    let files: Files = async ({ port }) => ({
      "vite.config.js": await viteConfig.basic({ port, templateName }),
      "react-router.config.ts": reactRouterConfig({
        viteEnvironmentApi: templateName.includes("rsc"),
      }),
      "app/routes/hmr/route.tsx": `
        // imports
        import { Mounted } from "./route.client";

        // loader

        export function ServerComponent() {
          return (
            <div id="index">
              <h2 data-title>Index</h2>
              <input />
              <Mounted />
              <p data-hmr>HMR updated: 0</p>
              {/* elements */}
            </div>
          );
        }
      `,
      "app/routes/hmr/route.client.tsx": `
        "use client";
        
        import { useState, useEffect } from "react";

        export function Mounted() {
          const [mounted, setMounted] = useState(false);
          useEffect(() => {
            setMounted(true);
          }, []);

          return <p data-mounted>Mounted: {mounted ? "yes" : "no"}</p>;
        }
      `,
    });
    let { cwd, port } = await dev(files, templateName);
    let edit = createEditor(cwd);

    // setup: initial render
    await page.goto(`http://localhost:${port}/hmr`, {
      waitUntil: "networkidle",
    });
    await expect(page.locator("#index [data-title]")).toHaveText("Index");

    // setup: hydration
    await expect(page.locator("#index [data-mounted]")).toHaveText(
      "Mounted: yes",
    );

    // setup: browser state
    let hmrStatus = page.locator("#index [data-hmr]");

    await expect(hmrStatus).toHaveText("HMR updated: 0");
    let input = page.locator("#index input");
    await expect(input).toBeVisible();
    await input.type("stateful");
    expect(page.errors).toEqual([]);

    // route: HMR
    await edit("app/routes/hmr/route.tsx", (contents) =>
      contents.replace("HMR updated: 0", "HMR updated: 1"),
    );
    await page.waitForLoadState("networkidle");

    await expect(hmrStatus).toHaveText("HMR updated: 1");
    await expect(input).toHaveValue("stateful");
    expect(page.errors).toEqual([]);

    // route: add loader
    await edit("app/routes/hmr/route.tsx", (contents) =>
      contents
        .replace(
          "// loader",
          `// loader\nexport const loader = () => ({ message: "HDR updated: 0" });`,
        )
        .replace(
          "export function ServerComponent() {",
          `export function ServerComponent({ loaderData }: { loaderData: { message: string } }) {`,
        )
        .replace(
          "{/* elements */}",
          `{/* elements */}\n<p data-hdr>{loaderData.message}</p>`,
        ),
    );
    await page.waitForLoadState("networkidle");
    let hdrStatus = page.locator("#index [data-hdr]");
    await expect(hdrStatus).toHaveText("HDR updated: 0");
    await expect(input).toHaveValue("stateful");
    expect(page.errors).toEqual([]);

    // route: HDR
    await edit("app/routes/hmr/route.tsx", (contents) =>
      contents.replace("HDR updated: 0", "HDR updated: 1"),
    );
    await page.waitForLoadState("networkidle");
    await expect(hdrStatus).toHaveText("HDR updated: 1");
    await expect(input).toHaveValue("stateful");
    expect(page.errors).toEqual([]);

    // route: HMR + HDR
    await edit("app/routes/hmr/route.tsx", (contents) =>
      contents
        .replace("HMR updated: 1", "HMR updated: 2")
        .replace("HDR updated: 1", "HDR updated: 2"),
    );
    await page.waitForLoadState("networkidle");
    await expect(hmrStatus).toHaveText("HMR updated: 2");
    await expect(hdrStatus).toHaveText("HDR updated: 2");
    await expect(input).toHaveValue("stateful");
    expect(page.errors).toEqual([]);

    // create new non-route imported server component
    await fs.writeFile(
      path.join(cwd, "app/imported-server-component.tsx"),
      `
        import { ImportedServerComponentClientMounted } from "./imported-server-component-client";

        export function ImportedServerComponent() {
          return (
            <div>
              <p data-imported-server-component>Imported Server Component HMR: 0</p>
              <ImportedServerComponentClientMounted />
            </div>
          );
        }
     `,
      "utf8",
    );
    await fs.writeFile(
      path.join(cwd, "app/imported-server-component-client.tsx"),
      `
        "use client";
        
        import { useState, useEffect } from "react";

        export function ImportedServerComponentClientMounted() {
          const [mounted, setMounted] = useState(false);
          useEffect(() => {
            setMounted(true);
          }, []);

          return (
            <p data-imported-server-component-client-mounted>
              Imported Server Component Client Mounted: {mounted ? "yes" : "no"}
            </p>
          );
        }
      `,
      "utf8",
    );
    await edit("app/routes/hmr/route.tsx", (contents) =>
      contents
        .replace(
          "// imports",
          `// imports\nimport { ImportedServerComponent } from "../../imported-server-component";`,
        )
        .replace(
          "{/* elements */}",
          "{/* elements */}\n<ImportedServerComponent />",
        ),
    );
    await page.waitForLoadState("networkidle");
    let serverComponent = page.locator(
      "#index [data-imported-server-component]",
    );
    let importedServerComponentClientMounted = page.locator(
      "#index [data-imported-server-component-client-mounted]",
    );
    await expect(serverComponent).toBeVisible();
    await expect(serverComponent).toHaveText(
      "Imported Server Component HMR: 0",
    );
    await expect(importedServerComponentClientMounted).toBeVisible();
    await expect(importedServerComponentClientMounted).toHaveText(
      "Imported Server Component Client Mounted: yes",
    );
    await expect(input).toHaveValue("stateful");
    expect(page.errors).toEqual([]);

    // non-route imported server component: HMR
    await edit("app/imported-server-component.tsx", (contents) =>
      contents.replace(
        "Imported Server Component HMR: 0",
        "Imported Server Component HMR: 1",
      ),
    );
    await page.waitForLoadState("networkidle");
    await expect(serverComponent).toHaveText(
      "Imported Server Component HMR: 1",
    );
    await expect(input).toHaveValue("stateful");
    expect(page.errors).toEqual([]);

    // create new non-route imported client component
    await fs.writeFile(
      path.join(cwd, "app/imported-client-component.tsx"),
      `
        "use client";
        
        import { useState } from "react";

        export function ImportedClientComponent() {
          const [count, setCount] = useState(0);
          return (
            <div>
              <p data-imported-client-component>Imported Client Component HMR: 0</p>
              <button data-imported-client-component-button onClick={() => setCount(count + 1)}>
                Count: {count}
              </button>
            </div>
          );
        }
      `,
      "utf8",
    );
    await edit("app/routes/hmr/route.tsx", (contents) =>
      contents
        .replace(
          "// imports",
          `// imports\nimport { ImportedClientComponent } from "../../imported-client-component";`,
        )
        .replace(
          "{/* elements */}",
          "{/* elements */}\n<ImportedClientComponent />",
        ),
    );
    await page.waitForLoadState("networkidle");
    let clientComponent = page.locator(
      "#index [data-imported-client-component]",
    );
    let clientButton = page.locator(
      "#index [data-imported-client-component-button]",
    );
    await expect(clientComponent).toBeVisible();
    await expect(clientComponent).toHaveText(
      "Imported Client Component HMR: 0",
    );
    await expect(clientButton).toHaveText("Count: 0");
    await expect(input).toHaveValue("stateful");
    expect(page.errors).toEqual([]);

    // non-route imported client component: HMR
    await edit("app/imported-client-component.tsx", (contents) =>
      contents.replace(
        "Imported Client Component HMR: 0",
        "Imported Client Component HMR: 1",
      ),
    );
    await page.waitForLoadState("networkidle");
    await expect(clientComponent).toHaveText(
      "Imported Client Component HMR: 1",
    );
    await expect(clientButton).toHaveText("Count: 0");
    await expect(input).toHaveValue("stateful");
    expect(page.errors).toEqual([]);

    // non-route imported client component: state preservation
    await clientButton.click();
    await expect(clientButton).toHaveText("Count: 1");
    await edit("app/imported-client-component.tsx", (contents) =>
      contents.replace(
        "Imported Client Component HMR: 1",
        "Imported Client Component HMR: 2",
      ),
    );
    await page.waitForLoadState("networkidle");
    await expect(clientComponent).toHaveText(
      "Imported Client Component HMR: 2",
    );
    await expect(clientButton).toHaveText("Count: 1");
    await expect(input).toHaveValue("stateful");
    expect(page.errors).toEqual([]);

    // create new non-route server module
    await fs.writeFile(
      path.join(cwd, "app/indirect-hdr-dep.ts"),
      `export const indirect = "indirect 0"`,
      "utf8",
    );
    await fs.writeFile(
      path.join(cwd, "app/direct-hdr-dep.ts"),
      `
        import { indirect } from "./indirect-hdr-dep"
        export const direct = "direct 0 & " + indirect
      `,
      "utf8",
    );
    await edit("app/routes/hmr/route.tsx", (contents) =>
      contents
        .replace(
          "// imports",
          `// imports\nimport { direct } from "../../direct-hdr-dep"`,
        )
        .replace(
          `{ message: "HDR updated: 2" }`,
          `{ message: "HDR updated: " + direct }`,
        )
        .replace(`HDR updated: 2`, `HDR updated: direct 0 & indirect 0`),
    );
    await page.waitForLoadState("networkidle");
    await expect(hdrStatus).toHaveText("HDR updated: direct 0 & indirect 0");
    await expect(input).toHaveValue("stateful");
    expect(page.errors).toEqual([]);

    // non-route: HDR for direct dependency
    await edit("app/direct-hdr-dep.ts", (contents) =>
      contents.replace("direct 0 &", "direct 1 &"),
    );
    await page.waitForLoadState("networkidle");
    await expect(hdrStatus).toHaveText("HDR updated: direct 1 & indirect 0");
    await expect(input).toHaveValue("stateful");
    expect(page.errors).toEqual([]);

    // non-route: HDR for indirect dependency
    await edit("app/indirect-hdr-dep.ts", (contents) =>
      contents.replace("indirect 0", "indirect 1"),
    );
    await page.waitForLoadState("networkidle");
    await expect(hdrStatus).toHaveText("HDR updated: direct 1 & indirect 1");
    await expect(input).toHaveValue("stateful");
    expect(page.errors).toEqual([]);

    // everything everywhere all at once
    await Promise.all([
      edit("app/routes/hmr/route.tsx", (contents) =>
        contents
          .replace("HMR updated: 2", "HMR updated: 3")
          .replace("HDR updated: ", "HDR updated: route & "),
      ),
      edit("app/imported-server-component.tsx", (contents) =>
        contents.replace(
          "Imported Server Component HMR: 1",
          "Imported Server Component HMR: 2",
        ),
      ),
      edit("app/imported-client-component.tsx", (contents) =>
        contents.replace(
          "Imported Client Component HMR: 2",
          "Imported Client Component HMR: 3",
        ),
      ),
      edit("app/direct-hdr-dep.ts", (contents) =>
        contents.replace("direct 1 &", "direct 2 &"),
      ),
      edit("app/indirect-hdr-dep.ts", (contents) =>
        contents.replace("indirect 1", "indirect 2"),
      ),
    ]);
    await page.waitForLoadState("networkidle");
    await expect(hmrStatus).toHaveText("HMR updated: 3");
    await expect(serverComponent).toHaveText(
      "Imported Server Component HMR: 2",
    );
    await expect(clientComponent).toHaveText(
      "Imported Client Component HMR: 3",
    );
    await expect(clientButton).toHaveText("Count: 1");
    await expect(hdrStatus).toHaveText(
      "HDR updated: route & direct 2 & indirect 2",
    );
    await expect(input).toHaveValue("stateful");
    expect(page.errors).toEqual([]);

    // switch from server-first to client route
    await edit("app/routes/hmr/route.tsx", (contents) =>
      contents
        .replace(
          "export function ServerComponent",
          "export default function ClientComponent",
        )
        .replace("HMR updated: 3", "Client Route HMR: 0"),
    );
    await page.waitForLoadState("networkidle");
    await expect(hmrStatus).toHaveText("Client Route HMR: 0");
    // state is not preserved when switching from server to client route
    await input.clear();
    await input.type("client stateful");
    expect(page.errors).toEqual([]);
    await edit("app/routes/hmr/route.tsx", (contents) =>
      contents.replace("Client Route HMR: 0", "Client Route HMR: 1"),
    );
    await page.waitForLoadState("networkidle");
    await expect(hmrStatus).toHaveText("Client Route HMR: 1");
    await expect(input).toHaveValue("client stateful");
    expect(page.errors).toEqual([]);

    // switch from client route back to server-first route
    await edit("app/routes/hmr/route.tsx", (contents) =>
      contents
        .replace(
          "export default function ClientComponent",
          "export function ServerComponent",
        )
        .replace("Client Route HMR: 1", "Server Route HMR: 0"),
    );
    await page.waitForLoadState("networkidle");
    await expect(hmrStatus).toHaveText("Server Route HMR: 0");
    // State is not preserved when switching from client to server route
    await input.clear();
    await input.type("server stateful");
    expect(page.errors).toEqual([]);
    await edit("app/routes/hmr/route.tsx", (contents) =>
      contents.replace("Server Route HMR: 0", "Server Route HMR: 1"),
    );
    await page.waitForLoadState("networkidle");
    await expect(hmrStatus).toHaveText("Server Route HMR: 1");
    await expect(input).toHaveValue("server stateful");
    expect(page.errors).toEqual([]);
  });
});
