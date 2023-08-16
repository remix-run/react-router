import * as babel from "@babel/core";
// @ts-expect-error These modules don't have types
import babelPluginSyntaxJSX from "@babel/plugin-syntax-jsx";
// @ts-expect-error These modules don't have types
import babelPresetTypeScript from "@babel/preset-typescript";
import prettier from "prettier";

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
