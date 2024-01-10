import * as path from "node:path";
import { test, expect } from "@playwright/test";
import stripAnsi from "strip-ansi";
import getPort from "get-port";

import {
  VITE_CONFIG,
  createProject,
  grep,
  using,
  viteBuild,
  viteDev,
  viteRemixServe,
} from "./helpers/vite.js";

let serverOnlyModule = String.raw`
  export const serverOnly = "SERVER_ONLY";
  export default serverOnly;
`;

let tsconfig = (aliases: Record<string, string[]>) => String.raw`
  {
    "include": ["env.d.ts", "**/*.ts", "**/*.tsx"],
    "compilerOptions": {
      "lib": ["DOM", "DOM.Iterable", "ES2022"],
      "isolatedModules": true,
      "esModuleInterop": true,
      "jsx": "react-jsx",
      "module": "ESNext",
      "moduleResolution": "Bundler",
      "resolveJsonModule": true,
      "target": "ES2022",
      "strict": true,
      "allowJs": true,
      "forceConsistentCasingInFileNames": true,
      "baseUrl": ".",
      "paths": ${JSON.stringify(aliases)},
      "noEmit": true
    }
  }
`;

test("Vite / dead-code elimination for server exports", async () => {
  let cwd = await createProject({
    "app/utils.server.ts": serverOnlyModule,
    "app/.server/utils.ts": serverOnlyModule,
    "app/routes/remove-server-exports-and-dce.tsx": String.raw`
      import fs from "node:fs";
      import { json } from "@remix-run/node";
      import { useLoaderData } from "@remix-run/react";

      import { serverOnly as serverOnlyFile } from "../utils.server";
      import { serverOnly as serverOnlyDir } from "../.server/utils";

      export const loader = () => {
        let contents = fs.readFileSync("server_only.txt");
        return json({ serverOnlyFile, serverOnlyDir, contents })
      }

      export const action = () => {
        let contents = fs.readFileSync("server_only.txt");
        console.log({ serverOnlyFile, serverOnlyDir, contents });
        return null;
      }

      export default function() {
        let { data } = useLoaderData<typeof loader>();
        return <pre>{JSON.stringify(data)}</pre>;
      }
    `,
  });
  let { status } = viteBuild({ cwd });
  expect(status).toBe(0);

  let lines = grep(
    path.join(cwd, "build/client"),
    /SERVER_ONLY|SERVER_ONLY|node:fs/
  );
  expect(lines).toHaveLength(0);
});

test.describe("Vite / route / server-only module referenced by client", () => {
  let matrix = [
    { type: "file", path: "app/utils.server.ts", specifier: `~/utils.server` },
    { type: "dir", path: "app/.server/utils.ts", specifier: `~/.server/utils` },

    {
      type: "file alias",
      path: "app/utils.server.ts",
      specifier: `#dot-server-file`,
    },
    {
      type: "dir alias",
      path: "app/.server/utils.ts",
      specifier: `#dot-server-dir/utils`,
    },
  ];

  let cases = matrix.flatMap(({ type, path, specifier }) => [
    {
      name: `default import / .server ${type}`,
      path,
      specifier,
      route: `
        import serverOnly from "${specifier}";
        export default () => <h1>{serverOnly}</h1>;
      `,
    },
    {
      name: `named import / .server ${type}`,
      path,
      specifier,
      route: `
        import { serverOnly } from "${specifier}"
        export default () => <h1>{serverOnly}</h1>;
      `,
    },
    {
      name: `namespace import / .server ${type}`,
      path,
      specifier,
      route: `
        import * as utils from "${specifier}"
        export default () => <h1>{utils.serverOnly}</h1>;
      `,
    },
  ]);

  for (let { name, path, specifier, route } of cases) {
    test(name, async () => {
      let cwd = await createProject({
        "tsconfig.json": tsconfig({
          "~/*": ["app/*"],
          "#dot-server-file": ["app/utils.server.ts"],
          "#dot-server-dir/*": ["app/.server/*"],
        }),
        [path]: serverOnlyModule,
        "app/routes/_index.tsx": route,
      });
      let result = viteBuild({ cwd });
      let stderr = result.stderr.toString("utf8");
      [
        "Server-only module referenced by client",

        `    '${specifier}' imported by route 'app/routes/_index.tsx'`,

        "  The only route exports that can reference server-only modules are:",
        "    `loader`, `action`, `headers`",

        `  But other route exports in 'app/routes/_index.tsx' depend on '${specifier}'.`,

        "  For more see https://remix.run/docs/en/main/discussion/server-vs-client",
      ].forEach(expect(stderr).toMatch);
    });
  }
});

test.describe("Vite / non-route / server-only module referenced by client", () => {
  let matrix = [
    { type: "file", path: "app/utils.server.ts", specifier: `~/utils.server` },
    { type: "dir", path: "app/.server/utils.ts", specifier: `~/.server/utils` },
  ];

  let cases = matrix.flatMap(({ type, path, specifier }) => [
    {
      name: `default import / .server ${type}`,
      path,
      specifier,
      nonroute: `
        import serverOnly from "${specifier}";
        export const getServerOnly = () => serverOnly;
      `,
    },
    {
      name: `named import / .server ${type}`,
      path,
      specifier,
      nonroute: `
        import { serverOnly } from "${specifier}";
        export const getServerOnly = () => serverOnly;
      `,
    },
    {
      name: `namespace import / .server ${type}`,
      path,
      specifier,
      nonroute: `
        import * as utils from "${specifier}";
        export const getServerOnly = () => utils.serverOnly;
      `,
    },
  ]);

  for (let { name, path, specifier, nonroute } of cases) {
    test(name, async () => {
      let cwd = await createProject({
        [path]: serverOnlyModule,
        "app/reexport-server-only.ts": nonroute,
        "app/routes/_index.tsx": String.raw`
          import { serverOnly } from "~/reexport-server-only"
          export default () => <h1>{serverOnly}</h1>;
        `,
      });
      let result = viteBuild({ cwd });
      let stderr = stripAnsi(result.stderr.toString("utf8"));

      [
        `Server-only module referenced by client`,

        `    '${specifier}' imported by 'app/reexport-server-only.ts'`,

        "  * If all code in 'app/reexport-server-only.ts' is server-only:",

        "    Rename it to 'app/reexport-server-only.server.ts'",

        "  * Otherwise:",

        `    - Keep client-safe code in 'app/reexport-server-only.ts'`,
        `    - And move server-only code to a \`.server\` file`,
        `      e.g. 'app/reexport-server-only.server.ts'`,

        "  If you have lots of `.server` files, try using",
        "  a `.server` directory e.g. 'app/.server'",

        "For more, see https://remix.run/docs/en/main/future/vite#server-code-not-tree-shaken-in-development",
      ].forEach(expect(stderr).toMatch);
    });
  }
});

test.describe("Vite / server-only escape hatch", async () => {
  let port: number;
  let cwd: string;

  test.beforeAll(async () => {
    port = await getPort();
    cwd = await createProject({
      "vite.config.ts": await VITE_CONFIG({
        port,
        vitePlugins:
          '(await import("vite-env-only")).default(), (await import("vite-tsconfig-paths")).default()',
      }),
      "app/utils.server.ts": serverOnlyModule,
      "app/.server/utils.ts": serverOnlyModule,
      "app/routes/_index.tsx": String.raw`
      import { serverOnly$ } from "vite-env-only";

      import { serverOnly as serverOnlyFile } from "~/utils.server";
      import serverOnlyDir from "~/.server/utils";

      export const handle = {
        escapeHatch: serverOnly$(async () => {
          return { serverOnlyFile, serverOnlyDir };
        })
      }

      export default () => <h1 data-title>This should work</h1>;
    `,
    });
  });

  test("vite build + remix-serve", async ({ page }) => {
    let { status } = viteBuild({ cwd });
    expect(status).toBe(0);

    let lines = grep(path.join(cwd, "build/client"), /SERVER_ONLY/);
    expect(lines).toHaveLength(0);

    await using(await viteRemixServe({ cwd, port }), async () => {
      let pageErrors: Error[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      await page.goto(`http://localhost:${port}/`, {
        waitUntil: "networkidle",
      });
      await expect(page.locator("[data-title]")).toHaveText("This should work");
      expect(pageErrors).toEqual([]);
    });
  });

  test("vite dev", async ({ page }) => {
    await using(await viteDev({ cwd, port }), async () => {
      let pageErrors: Error[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      await page.goto(`http://localhost:${port}/`, {
        waitUntil: "networkidle",
      });
      await expect(page.locator("[data-title]")).toHaveText("This should work");
      expect(pageErrors).toEqual([]);
    });
  });
});
