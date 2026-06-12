import * as path from "node:path";
import type { NodePath } from "@babel/traverse";
import type { types as Babel } from "@babel/core";
import {
  parse,
  type ParseResult,
  type ParserPlugin,
} from "@babel/parser";
import * as t from "@babel/types";

// These `require`s were needed to support building within vite-ecosystem-ci,
// otherwise we get errors that `traverse` and `generate` are not functions.
const traverse = require("@babel/traverse")
  .default as typeof import("@babel/traverse").default;
const generate = require("@babel/generator")
  .default as typeof import("@babel/generator").default;

/** Parse route/module sources that may still contain TS or JSX (e.g. Vite bundledDev). */
export function parseModulePreservingSyntax(
  code: string,
  moduleId: string,
): ParseResult<Babel.File> {
  let ext = path.extname(moduleId.split("?")[0]).toLowerCase();

  let plugins: ParserPlugin[] = [];

  if (ext === ".tsx") {
    plugins.push(["typescript", { isTSX: true }] as ParserPlugin);
  } else if (ext === ".ts" || ext === ".mts" || ext === ".cts") {
    plugins.push(["typescript", { isTSX: false }] as ParserPlugin);
  } else if (ext === ".jsx") {
    plugins.push("jsx");
  }

  return parse(code, {
    sourceType: "module",
    ...(plugins.length > 0 ? { plugins } : {}),
  });
}

export { traverse, generate, parse, t };
export type { Babel, NodePath, ParseResult };
