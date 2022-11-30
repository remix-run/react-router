import { transformSync } from "@babel/core";
import { strict as assert } from "assert";
// @ts-expect-error TODO
import babelPluginSyntaxJsx from "@babel/plugin-syntax-jsx";
// @ts-expect-error TODO
import babelPluginSyntaxTypescript from "@babel/plugin-syntax-typescript";

import babelRecastPlugin from "./utils/babelPluginRecast";
import type { BabelPlugin } from "./utils/babel";

type Transform = (code: string, filepath: string) => string;

export default (plugin: BabelPlugin): Transform =>
  (code, filepath) => {
    let result = transformSync(code, {
      babelrc: false,
      configFile: false,
      filename: filepath,
      plugins: [babelPluginSyntaxTypescript, babelRecastPlugin, plugin],
      overrides: [
        {
          test: /\.tsx$/,
          plugins: [
            babelPluginSyntaxJsx,
            [babelPluginSyntaxTypescript, { isTSX: true }],
          ],
        },
      ],
    });
    assert(result, "transformSync must return a result");
    return result.code!;
  };
