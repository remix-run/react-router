import path from "node:path";
import glob from "fast-glob";
import fs from "fs-extra";
import * as babel from "@babel/core";
// @ts-expect-error These modules don't have types
import babelPluginSyntaxJSX from "@babel/plugin-syntax-jsx";
// @ts-expect-error These modules don't have types
import babelPresetTypeScript from "@babel/preset-typescript";
import prettier from "prettier";

import { readConfig } from "../config";

export let convert = async (projectDir: string) => {
  let config = await readConfig(projectDir);

  let remixEnvD = path.join(config.rootDirectory, "remix.env.d.ts");
  if (fs.pathExistsSync(remixEnvD)) {
    fs.rmSync(remixEnvD);
  }

  let entries = await glob("**/*.+(ts|tsx)", {
    absolute: true,
    cwd: config.appDirectory,
  });
  for (let entry of entries) {
    if (entry.endsWith(".d.ts")) {
      fs.rmSync(entry);
      continue;
    }
    let tsx = await fs.readFile(entry, "utf8");
    let mjs = transpile(tsx, {
      filename: path.basename(entry),
      cwd: projectDir,
    });
    fs.rmSync(entry);
    await fs.writeFile(
      entry.replace(/\.ts$/, ".js").replace(/\.tsx$/, ".jsx"),
      mjs,
      "utf8"
    );
  }
};

export function transpile(
  tsx: string,
  options: {
    cwd?: string;
    filename?: string;
  } = {}
): string {
  let mjs = babel.transformSync(tsx, {
    compact: false,
    cwd: options.cwd,
    filename: options.filename,
    plugins: [babelPluginSyntaxJSX],
    presets: [[babelPresetTypeScript, { jsx: "preserve" }]],
    retainLines: true,
  });
  if (!mjs || !mjs.code) throw new Error("Could not parse TypeScript");

  /**
   * Babel's `compact` and `retainLines` options are both bad at formatting code.
   * Use Prettier for nicer formatting.
   */
  return prettier.format(mjs.code, { parser: "babel" });
}
