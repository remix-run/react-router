import type { ImportDeclaration, JSCodeshift } from "jscodeshift";

/**
 * import "foo"
 * =>
 * require("foo")
 */
export const createImportExpressionStatement = (
  j: JSCodeshift,
  { source }: ImportDeclaration
) => {
  let callExpression = j.callExpression(j.identifier("require"), [source]);

  return j.expressionStatement(callExpression);
};
