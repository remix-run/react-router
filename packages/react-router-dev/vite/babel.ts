import type { NodePath } from "@babel/traverse";
import type { types as Babel } from "@babel/core";
import { parse, type ParseResult, type ParserOptions } from "@babel/parser";
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

/** Parse route source while JSX or TypeScript syntax may still be present. */
export function parseRouteSource(
  code: string,
  id: string,
  options: ParserOptions = {},
) {
  const filename = id.split("?")[0];
  const ast = parse(code, {
    sourceType: "module",
    plugins: [
      "decorators-legacy",
      "typescript",
      ...(/\.[cm]?ts$/.test(filename) ? [] : ["jsx" as const]),
    ],
    ...options,
  });
  // JSX pragmas must stay before generated imports and survive removal of the
  // first statement, including when generating an isolated route chunk.
  const first = ast.program.directives[0] ?? ast.program.body[0];
  ast.program.leadingComments = first?.leadingComments?.filter((comment) =>
    /@jsx(?:\s|Runtime\s|ImportSource\s|Frag\s)/.test(comment.value),
  );
  return ast;
}

export function getSourceExportNames(code: string, id: string): string[] {
  const ast = parseRouteSource(code, id);
  return ast.program.body.flatMap((node) => {
    if (node.type === "ExportDefaultDeclaration") return ["default"];
    if (node.type !== "ExportNamedDeclaration" || node.exportKind === "type")
      return [];
    if (
      node.declaration &&
      "declare" in node.declaration &&
      node.declaration.declare
    )
      return [];
    if (node.declaration)
      return Object.keys(t.getOuterBindingIdentifiers(node.declaration));
    return node.specifiers.flatMap((specifier) =>
      "exported" in specifier &&
      !("exportKind" in specifier && specifier.exportKind === "type")
        ? [
            specifier.exported.type === "Identifier"
              ? specifier.exported.name
              : specifier.exported.value,
          ]
        : [],
    );
  });
}

export { traverse, generate, parse, t };
export type { Babel, NodePath, ParseResult };
