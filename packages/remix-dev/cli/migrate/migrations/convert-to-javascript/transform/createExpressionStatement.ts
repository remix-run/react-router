import type { ImportDeclaration, JSCodeshift } from "jscodeshift";

export const createExpressionStatement = (
  j: JSCodeshift,
  { source }: ImportDeclaration
) => {
  let callExpression = j.callExpression(j.identifier("require"), [source]);

  return j.expressionStatement(callExpression);
};
