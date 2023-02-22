import { transformSync } from "@babel/core";
import { strict as assert } from "assert";
// @ts-expect-error TODO
import babelPluginSyntaxJsx from "@babel/plugin-syntax-jsx";
// @ts-expect-error TODO
import babelPluginSyntaxTypescript from "@babel/plugin-syntax-typescript";

import { plugin as babelRecastPlugin } from "./plugins/recast";
import type { Plugin } from "./plugin";

type Transform = (code: string, filepath: string) => string;

export let create =
  (plugin: Plugin): Transform =>
  (code, filepath) => {
    let result = transformSync(code, {
      babelrc: false,
      configFile: false,
      filename: filepath,
      plugins: [babelPluginSyntaxTypescript, babelRecastPlugin, plugin],
      overrides: [
        {
          test: /\.[jt]sx?$/,
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
