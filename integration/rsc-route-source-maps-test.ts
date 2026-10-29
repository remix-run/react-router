import { expect, test } from "@playwright/test";
import { globSync, readFileSync } from "node:fs";
import { SourceMap } from "node:module";
import path from "node:path";

import { build, createProject, viteConfig } from "./helpers/vite.js";

const routeSource = `export function meta() {
  return [{ title: "RSC_SHARED_ROUTE_SOURCE_MAP_TEST" }];
}

export async function clientLoader() {
  throw new Error("RSC_ROUTE_SOURCE_MAP_TEST");
}

export async function clientAction() {
  throw new Error("RSC_CLIENT_ACTION_SOURCE_MAP_TEST");
}

export async function loader() {
  throw new Error("RSC_SERVER_ROUTE_SOURCE_MAP_TEST");
}

export default function Index() {
  return <h1>Index</h1>;
}
`;

function findMarkerMappings(
  cwd: string,
  output: "client" | "server",
  marker: string,
) {
  return globSync(path.join(cwd, `build/${output}/**/*.js`)).flatMap(
    (chunkPath) => {
      let chunk = readFileSync(chunkPath, "utf8");
      let markerOffset = chunk.indexOf(marker);
      if (markerOffset === -1) {
        return [];
      }

      let generatedLines = chunk.slice(0, markerOffset).split("\n");
      let map = JSON.parse(readFileSync(`${chunkPath}.map`, "utf8"));
      let entry = new SourceMap(map).findEntry(
        generatedLines.length - 1,
        generatedLines.at(-1)!.length,
      );
      if (!("originalSource" in entry)) {
        throw new Error(`Expected a source map entry for ${marker}`);
      }

      return [{ chunkPath, entry }];
    },
  );
}

test("RSC Framework route modules preserve source maps", async () => {
  let cwd = await createProject(
    {
      "vite.config.ts": await viteConfig.basic({
        templateName: "rsc-vite-framework",
        sourcemap: true,
      }),
      "app/routes/_index.tsx": routeSource,
    },
    "rsc-vite-framework",
  );

  let { status } = build({ cwd });
  expect(status).toBe(0);

  let expectations = [
    ["client", "RSC_ROUTE_SOURCE_MAP_TEST", 5, 18],
    ["server", "RSC_ROUTE_SOURCE_MAP_TEST", 5, 18],
    ["client", "RSC_CLIENT_ACTION_SOURCE_MAP_TEST", 9, 18],
    ["server", "RSC_CLIENT_ACTION_SOURCE_MAP_TEST", 9, 18],
    ["client", "RSC_SHARED_ROUTE_SOURCE_MAP_TEST", 1, 19],
    ["server", "RSC_SHARED_ROUTE_SOURCE_MAP_TEST", 1, 19],
    ["server", "RSC_SERVER_ROUTE_SOURCE_MAP_TEST", 13, 18],
  ] as const;

  for (let [output, marker, originalLine, originalColumn] of expectations) {
    let mappings = findMarkerMappings(cwd, output, marker);
    expect(mappings, `${marker} in the ${output} output`).not.toHaveLength(0);

    for (let { chunkPath, entry } of mappings) {
      expect(
        path.resolve(
          path.dirname(chunkPath),
          entry.originalSource!.split("?")[0],
        ),
      ).toBe(path.join(cwd, "app/routes/_index.tsx"));
      expect(entry.originalLine).toBe(originalLine);
      expect(entry.originalColumn).toBe(originalColumn);
    }
  }
});
