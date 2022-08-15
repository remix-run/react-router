import type { ImportDeclaration, JSCodeshift } from "jscodeshift";

/**
 * import foo from "foo"
 * import * as foo from "foo"
 * =>
 * const foo = require("foo").default
 * const foo = require("foo")
 */
export const createVariableDeclarationIdentifier = (
  j: JSCodeshift,
  { source, specifiers }: ImportDeclaration
) => {
  let callExpression = j.callExpression(j.identifier("require"), [source]);
  let isDefaultImport = (specifiers || []).some(
    ({ type }) => type === "ImportDefaultSpecifier"
  );

  return j.variableDeclaration("const", [
    j.variableDeclarator(
      j.identifier(
        (specifiers || [])
          /**
           * HACK: Can't use casts nor type guards in a `jscodeshift` transform
           * https://github.com/facebook/jscodeshift/issues/467
           *
           * So to narrow specifier type, we use `flatMap` instead.
           * (`filter` can't narrow type without type guards)
           */
          .flatMap((specifier) =>
            specifier.type === "ImportDefaultSpecifier" ||
            specifier.type === "ImportNamespaceSpecifier"
              ? specifier
              : []
          )[0].local?.name || ""
      ),
      isDefaultImport
        ? j.memberExpression(callExpression, j.identifier("default"))
        : callExpression
    ),
  ]);
};
