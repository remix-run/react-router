import * as path from "node:path";
import { expect } from "@playwright/test";
import stripAnsi from "strip-ansi";
import dedent from "dedent";

import type { Files } from "./helpers/vite.js";
import {
  test,
  createProject,
  grep,
  viteBuild,
  viteConfig,
} from "./helpers/vite.js";

let serverOnlyModule = `
  export const serverOnly = "SERVER_ONLY";
  export default serverOnly;
`;

let tsconfig = (aliases: Record<string, string[]>) => `
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
    "app/routes/remove-server-exports-and-dce.tsx": `
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

        "  Remix automatically removes server-code from these exports:",
        "    `loader`, `action`, `headers`",

        `  But other route exports in 'app/routes/_index.tsx' depend on '${specifier}'.`,

        "  See https://remix.run/docs/en/main/future/vite#splitting-up-client-and-server-code",
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
        "app/routes/_index.tsx": `
          import { serverOnly } from "~/reexport-server-only"
          export default () => <h1>{serverOnly}</h1>;
        `,
      });
      let result = viteBuild({ cwd });
      let stderr = stripAnsi(result.stderr.toString("utf8"));

      [
        `Server-only module referenced by client`,

        `    '${specifier}' imported by 'app/reexport-server-only.ts'`,

        "  See https://remix.run/docs/en/main/future/vite#splitting-up-client-and-server-code",
      ].forEach(expect(stderr).toMatch);
    });
  }
});

test.describe("Vite / server-only escape hatch", async () => {
  let files: Files = async ({ port }) => ({
    "vite.config.ts": dedent`
      import { vitePlugin as remix } from "@remix-run/dev";
      import envOnly from "vite-env-only";
      import tsconfigPaths from "vite-tsconfig-paths";

      export default {
        ${await viteConfig.server({ port })}
        plugins: [remix(), envOnly(), tsconfigPaths()],
      }
    `,
    "app/utils.server.ts": serverOnlyModule,
    "app/.server/utils.ts": serverOnlyModule,
    "app/routes/_index.tsx": `
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

  test("vite dev", async ({ page, viteDev }) => {
    let { port } = await viteDev(files);

    await page.goto(`http://localhost:${port}/`, {
      waitUntil: "networkidle",
    });
    await expect(page.locator("[data-title]")).toHaveText("This should work");
    expect(page.errors).toEqual([]);
  });

  test("vite build + remix-serve", async ({ page, viteRemixServe }) => {
    let { port, cwd } = await viteRemixServe(files);

    let lines = grep(path.join(cwd, "build/client"), /SERVER_ONLY/);
    expect(lines).toHaveLength(0);

    await page.goto(`http://localhost:${port}/`, {
      waitUntil: "networkidle",
    });
    await expect(page.locator("[data-title]")).toHaveText("This should work");
    expect(page.errors).toEqual([]);
  });
});
