import { mkdir, realpath, rm, symlink } from "node:fs/promises";
import { globSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import getPort from "get-port";
import dedent from "dedent";
import { expect } from "@playwright/test";
import { test } from "./helpers/fixtures";
import { build } from "./helpers/vite";
import * as Stream from "./helpers/stream";
import { viteMajorTemplates } from "./helpers/templates";

for (const template of viteMajorTemplates) {
  const major = template.name.includes("8") ? 8 : 7;
  test.describe(`${template.displayName} minimum - consumer React plugin`, () => {
    test.use({ template: template.name });

    test("supports SSR, HMR, HDR and production route chunks", async ({
      page,
      edit,
      cwd,
      $,
    }) => {
      // Only replace dependencies inside this test's copied fixture. The pinned
      // workspaces resolve the React plugin's Vite peer to the minimum too.
      const dependencies = fileURLToPath(
        new URL(`./helpers/vite-${major}-minimum/`, import.meta.url),
      );
      for (const name of ["vite", "@vitejs/plugin-react"]) {
        const target = path.join(cwd, "node_modules", name);
        const packagePath = await realpath(
          path.join(dependencies, "node_modules", name),
        );
        await rm(target, { recursive: true, force: true });
        await mkdir(path.dirname(target), { recursive: true });
        await symlink(packagePath, target, "junction");
      }
      const source = dedent`
        import { useState } from "react";
        import { secret } from "../secret.server";
        enum Heading { Value = "Component 0" }
        export const loader = () => ({ message: "loader 0", secret });
        export const clientLoader = async ({ serverLoader }) => serverLoader();
        clientLoader.hydrate = true;
        export function HydrateFallback() { return <p>Loading...</p>; }
        export default function Route({ loaderData }) {
          const [count, setCount] = useState(0);
          return <>
            <h1>{Heading.Value}</h1>
            <p data-loader>{loaderData.message}</p>
            <button onClick={() => setCount(count + 1)}>Count {count}</button>
            <input defaultValue="initial" />
          </>;
        }
      `;
      await edit({
        "app/secret.server.ts":
          'export const secret = "MINIMUM_VITE_SERVER_ONLY_MARKER";',
        "react-router.config.ts": `export default {splitRouteModules:true,future:{unstable_externalReactPlugin:true}};`,
        "vite.config.ts": dedent`
          import { defineConfig, version } from "vite";
          import { reactRouter } from "@react-router/dev/vite";
          import react from "@vitejs/plugin-react";
          if (version !== "${major}.0.0") throw new Error("Expected minimum Vite version");
          export default defineConfig({build:{sourcemap:true,manifest:true},plugins:[reactRouter(),react()]});
        `,
        "app/routes/_index.tsx": source,
      });
      const port = await getPort();
      const url = `http://localhost:${port}`;
      const dev = $(`pnpm dev --port ${port}`, {
        env: { npm_config_verify_deps_before_run: "false" },
      });
      await Stream.match(dev.stdout, url);
      const document = await page.request.get(url);
      expect(await document.text()).toContain("loader 0");
      await page.goto(url, { waitUntil: "networkidle" });
      await page.locator("button").click();
      await page.locator("input").fill("minimum version state");
      await edit({
        "app/routes/_index.tsx": source
          .replace("loader 0", "loader 1")
          .replace("Component 0", "Component 1"),
      });
      await expect(page.locator("h1")).toHaveText("Component 1");
      await expect(page.locator("[data-loader]")).toHaveText("loader 1");
      await expect(page.locator("button")).toHaveText("Count 1");
      await expect(page.locator("input")).toHaveValue("minimum version state");
      const output = await (
        await page.request.get(url + "/app/routes/_index.tsx")
      ).text();
      expect(output.split("//# sourceMappingURL=")[0]).not.toContain(
        "MINIMUM_VITE_SERVER_ONLY_MARKER",
      );
      expect(page.errors).toEqual([]);

      const result = build({ cwd });
      expect(result.status).toBe(0);
      expect(result.stderr.toString()).not.toContain("SOURCEMAP_BROKEN");
      const manifest = JSON.parse(
        readFileSync(
          path.join(cwd, "build/client/.vite/manifest.json"),
          "utf8",
        ),
      );
      expect(
        Object.keys(manifest).some((id) => id.includes("clientLoader")),
      ).toBe(true);
      for (const file of globSync(path.join(cwd, "build/client/**/*.js"))) {
        const code = readFileSync(file, "utf8");
        expect(code).not.toContain("MINIMUM_VITE_SERVER_ONLY_MARKER");
        expect(code).not.toContain("validateRefreshBoundaryAndEnqueueUpdate");
      }
      expect(
        globSync(path.join(cwd, "build/client/**/*.js.map")).length,
      ).toBeGreaterThan(0);
    });
  });
}
