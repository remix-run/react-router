import type {
  ClassDeclaration,
  ExportNamedDeclaration,
  FunctionDeclaration,
  JSCodeshift,
  VariableDeclaration,
} from "jscodeshift";

/**
 * export class Foo {}
 * export const foo = bar
 * export function foo() {}
 * =>
 * module.Foo = class Foo {}
 * module.foo = bar
 * module.foo = function foo() {}
 */
export const createExportExpressionStatementFromExportNamedDeclaration = (
  j: JSCodeshift,
  exportNamedDeclaration: ExportNamedDeclaration
) => {
  /**
   * HACK: Can't use casts nor type guards in a `jscodeshift` transform
   * https://github.com/facebook/jscodeshift/issues/467
   *
   * So to narrow declaration type, we check it against convertable values
   * instead.
   */
  if (
    !(
      exportNamedDeclaration.declaration?.type === "ClassDeclaration" ||
      exportNamedDeclaration.declaration?.type === "FunctionDeclaration" ||
      exportNamedDeclaration.declaration?.type === "VariableDeclaration"
    )
  ) {
    return exportNamedDeclaration;
  }

  // export class Foo {}
  if (exportNamedDeclaration.declaration.type === "ClassDeclaration") {
    return createExportExpressionStatementFromExportNamedClassDeclaration(
      j,
      exportNamedDeclaration.declaration
    );
  }

  // export function foo() {}
  if (exportNamedDeclaration.declaration.type === "FunctionDeclaration") {
    return createExportExpressionStatementFromExportNamedFunctionDeclaration(
      j,
      exportNamedDeclaration.declaration
    );
  }

  // export const foo = bar
  if (exportNamedDeclaration.declaration.type === "VariableDeclaration") {
    return createExportExpressionStatementFromExportNamedVariableDeclaration(
      j,
      exportNamedDeclaration.declaration
    );
  }
};

/**
 * export class Foo {}
 * =>
 * module.Foo = class Foo {}
 */
const createExportExpressionStatementFromExportNamedClassDeclaration = (
  j: JSCodeshift,
  classDeclaration: ClassDeclaration
) =>
  j.expressionStatement(
    j.assignmentExpression(
      "=",
      j.memberExpression(
        j.identifier("module"),
        classDeclaration.id || j.identifier("")
      ),
      j.classExpression.from(classDeclaration)
    )
  );

/**
 * export function foo() {}
 * =>
 * module.foo = function foo() {}
 */
const createExportExpressionStatementFromExportNamedFunctionDeclaration = (
  j: JSCodeshift,
  functionDeclaration: FunctionDeclaration
) =>
  j.expressionStatement(
    j.assignmentExpression(
      "=",
      j.memberExpression(
        j.identifier("module"),
        functionDeclaration.id || j.identifier("")
      ),
      j.functionExpression.from(functionDeclaration)
    )
  );

/**
 * export const foo = bar
 * export const foo = 5
 * export const foo = []
 * export const foo = function foo(){}
 * =>
 * module.foo = bar
 * module.foo = 5
 * module.foo = []
 * module.foo = function foo(){}
 */
const createExportExpressionStatementFromExportNamedVariableDeclaration = (
  j: JSCodeshift,
  variableDeclaration: VariableDeclaration
) =>
  variableDeclaration.declarations.flatMap((declaration) => {
    /**
     * HACK: Can't use casts nor type guards in a `jscodeshift` transform
     * https://github.com/facebook/jscodeshift/issues/467
     *
     * So to narrow declaration id type, we check it against convertable values
     * instead.
     */
    if (
      declaration.type !== "VariableDeclarator" ||
      declaration.id.type === "ArrayPattern" ||
      declaration.id.type === "AssignmentPattern" ||
      declaration.id.type === "ObjectPattern" ||
      declaration.id.type === "PropertyPattern" ||
      declaration.id.type === "RestElement" ||
      declaration.id.type === "SpreadElementPattern" ||
      declaration.id.type === "SpreadPropertyPattern" ||
      declaration.id.type === "TSParameterProperty" ||
      !declaration.init
    ) {
      return [];
    }

    return j.expressionStatement(
      j.assignmentExpression(
        "=",
        j.memberExpression(j.identifier("module"), declaration.id),
        declaration.init
      )
    );
  });
