import type { NodePath } from "@babel/traverse";
import type { types as Babel } from "@babel/core";
import { parse, type ParseResult } from "@babel/parser";
import * as t from "@babel/types";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";

// These `require`s were needed to support building within vite-ecosystem-ci,
// otherwise we get errors that `traverse` and `generate` are not functions.
const traverse = (_traverse as any)
  .default as typeof import("@babel/traverse").default;
const generate = (_generate as any)
  .default as typeof import("@babel/generator").default;

export { traverse, generate, parse, t };
export type { Babel, NodePath, ParseResult };
