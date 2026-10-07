import fs from "node:fs";
import path from "node:path";
import { expect } from "@playwright/test";
import dedent from "dedent";

import type { TemplateName } from "./helpers/vite.js";
import {
  build,
  createProject,
  reactRouterConfig,
  test,
  viteConfig,
} from "./helpers/vite.js";

const js = dedent;

const templateNames = [
  "vite-7-template",
  "vite-8-template",
] as const satisfies TemplateName[];

const RECORD_FILE = "child-compiler-watch.jsonl";

const recordChildCompilerWatchPlugin = js`
  {
    name: "record-child-compiler-watch",
    configResolved(config) {
      if (!config.cacheDir.endsWith(".vite-child-compiler")) return;
      fs.appendFileSync(
        path.join(config.root, "${RECORD_FILE}"),
        JSON.stringify({ watching: config.server.watch !== null }) + os.EOL,
      );
    },
  }
`;

const viteConfigWithRecorder = async (port?: number) => js`
  import fs from "node:fs";
  import os from "node:os";
  import path from "node:path";
  import { reactRouter } from "@react-router/dev/vite";

  export default {
    ${port ? await viteConfig.server({ port }) : ""}
    plugins: [
      reactRouter(),
      ${recordChildCompilerWatchPlugin},
    ],
  };
`;

const files = {
  "app/routes/_index.tsx": js`
    export default function Index() {
      return <h1>Index</h1>;
    }
  `,
  "app/routes/about.tsx": js`
    export default function About() {
      return <h1>About</h1>;
    }
  `,
};

async function readRecords(cwd: string) {
  let contents = await fs.promises.readFile(
    path.join(cwd, RECORD_FILE),
    "utf8",
  );
  return contents
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as { watching: boolean });
}

test.describe("Vite child compiler file watching", () => {
  for (const templateName of templateNames) {
    test.describe(templateName, () => {
      test("watches files during dev", async ({ dev }) => {
        let { cwd } = await dev(
          async ({ port }) => ({
            ...files,
            "react-router.config.ts": reactRouterConfig(),
            "vite.config.ts": await viteConfigWithRecorder(port),
          }),
          templateName,
        );

        expect(await readRecords(cwd)).toEqual([{ watching: true }]);
      });

      test("does not watch files while prerendering", async () => {
        let cwd = await createProject(
          {
            ...files,
            "react-router.config.ts": reactRouterConfig({
              ssr: false,
              prerender: ["/", "/about"],
            }),
            "vite.config.ts": await viteConfigWithRecorder(),
          },
          templateName,
        );

        let result = build({ cwd });
        expect(result.stderr.toString()).toBeFalsy();
        expect(result.status).toBe(0);
        expect(
          fs.existsSync(path.join(cwd, "build/client/about/index.html")),
        ).toBe(true);

        expect(await readRecords(cwd)).toEqual([
          { watching: false },
          { watching: false },
        ]);
      });

      test("does not watch files during vite preview", async ({
        vitePreview,
      }) => {
        let { cwd } = await vitePreview(
          async () => ({
            ...files,
            "react-router.config.ts": reactRouterConfig(),
            "vite.config.ts": await viteConfigWithRecorder(),
          }),
          templateName,
        );

        expect(await readRecords(cwd)).toEqual([
          { watching: false },
          { watching: false },
        ]);
      });
    });
  }
});
