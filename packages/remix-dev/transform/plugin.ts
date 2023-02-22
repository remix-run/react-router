import type Babel from "@babel/core";
import type { File } from "@babel/types";

/**
 * Fixes the `PluginObj` type from `@babel/core` by making all fields optional
 * and adding parser and generator override methods.
 *
 * Adapted from [@codemod/core](https://github.com/codemod-js/codemod/blob/5a9fc6968409613eefd87e646408c08b6dad0c40/packages/core/src/BabelPluginTypes.ts)
 */
type PluginObj<S = File> = Partial<Babel.PluginObj<S>> & {
  parserOverride?(
    code: string,
    options: Babel.ParserOptions,
    parse: (code: string, options: Babel.ParserOptions) => File
  ): File;

  generatorOverride?(
    ast: File,
    options: Babel.GeneratorOptions,
    code: string,
    generate: (ast: File, options: Babel.GeneratorOptions) => string
  ): { code: string; map?: object };
};

export type Plugin = (babel: typeof Babel) => PluginObj;
