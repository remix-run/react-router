import * as babel from "@babel/core";
// @ts-expect-error These modules don't have types
import babelPluginSyntaxJSX from "@babel/plugin-syntax-jsx";
// @ts-expect-error These modules don't have types
import babelPresetTypeScript from "@babel/preset-typescript";
import prettier from "prettier";

type ConvertTSFileToJSArguments = {
  filename: string;
  projectDir: string;
  source: string;
};
export const convertTSFileToJS = ({
  filename,
  projectDir,
  source,
}: ConvertTSFileToJSArguments): string => {
  let result = babel.transformSync(source, {
    compact: false,
    cwd: projectDir,
    filename,
    plugins: [babelPluginSyntaxJSX],
    presets: [[babelPresetTypeScript, { jsx: "preserve" }]],
    retainLines: true,
  });

  if (!result || !result.code) {
    throw new Error("Could not parse TypeScript");
  }

  /**
   * Babel's `compact` and `retainLines` options are both bad at formatting code.
   * Use Prettier for nicer formatting.
   */
  return prettier.format(result.code, { parser: "babel" });
};
