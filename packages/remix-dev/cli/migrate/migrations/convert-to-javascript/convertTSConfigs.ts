import { dirname, join } from "path";
import glob from "fast-glob";
import { readFileSync, renameSync, writeFileSync } from "fs-extra";
import JSON5 from "json5";
import prettier from "prettier";
import type { TsConfigJson } from "type-fest";

export const convertTSConfigs = (projectDir: string) => {
  let tsConfigPaths = glob.sync("**/tsconfig.json", {
    absolute: true,
    cwd: projectDir,
    ignore: ["**/node_modules/**"],
  });

  tsConfigPaths.forEach((tsConfigPath) => {
    let contents = readFileSync(tsConfigPath, "utf8");
    let tsConfigJson = JSON5.parse(contents) as TsConfigJson;

    let newTSConfig: TsConfigJson = {
      ...tsConfigJson,
      include: (tsConfigJson.include || [])
        .map((include) => {
          if (include === "remix.env.d.ts") {
            return null;
          }

          if (include === "**/*.ts") {
            return "**/*.js";
          }

          if (include === "**/*.tsx") {
            return "**/*.jsx";
          }

          return include;
        })
        .filter((include): include is string => include !== null),
    };

    writeFileSync(
      tsConfigPath,
      prettier.format(JSON.stringify(newTSConfig, null, 2), {
        parser: "json",
      }),
      "utf8"
    );

    let dir = dirname(tsConfigPath);
    renameSync(tsConfigPath, join(dir, "jsconfig.json"));
  });
};
