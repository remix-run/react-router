import type { ImportDeclaration, JSCodeshift } from "jscodeshift";

/**
 * import { foo } from "foo"
 * import { foo as bar } from "foo"
 * =>
 * const { foo } = require("foo")
 * const { foo: bar } = require("foo")
 */
export const createVariableDeclarationObjectPattern = (
  j: JSCodeshift,
  { source, specifiers }: ImportDeclaration
) => {
  let callExpression = j.callExpression(j.identifier("require"), [source]);

  return j.variableDeclaration("const", [
    j.variableDeclarator(
      j.objectPattern(
        (specifiers || [])
          /**
           * HACK: Can't use casts nor type guards in a `jscodeshift` transform
           * https://github.com/facebook/jscodeshift/issues/467
           *
           * So to narrow specifier type, we use `flatMap` instead.
           * (`filter` can't narrow type without type guards)
           */
          .flatMap((specifier) =>
            specifier.type === "ImportSpecifier" ? specifier : []
          )
          .map(({ imported: { name }, local }) =>
            j.property.from({
              key: j.identifier(name),
              kind: "init",
              value: j.identifier(local?.name || name),
              shorthand: true,
            })
          )
      ),
      callExpression
    ),
  ]);
};
