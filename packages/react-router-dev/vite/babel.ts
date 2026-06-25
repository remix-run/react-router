import type { NodePath } from "@babel/traverse";
import type { types as Babel } from "@babel/core";
import { parse, type ParseResult } from "@babel/parser";
import * as t from "@babel/types";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";

type DefaultImport<T> = T | { default: T };

export function unwrapDefault<T>(value: DefaultImport<T>): T {
  return (value as { default?: T }).default ?? (value as T);
}

// Babel's CommonJS packages are exposed differently across runtimes.
const traverse = unwrapDefault(
  _traverse as DefaultImport<typeof import("@babel/traverse").default>,
);
const generate = unwrapDefault(
  _generate as DefaultImport<typeof import("@babel/generator").default>,
);

export { traverse, generate, parse, t };
export type { Babel, NodePath, ParseResult };
