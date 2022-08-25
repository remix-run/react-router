import type { ExportDefaultDeclaration, JSCodeshift } from "jscodeshift";

/**
 * export default foo
 * =>
 * module.exports = foo
 */
export const createExportExpressionStatementFromExportDefaultDeclaration = (
  j: JSCodeshift,
  exportDefaultDeclaration: ExportDefaultDeclaration
) => {
  /**
   * HACK: Can't use casts nor type guards in a `jscodeshift` transform
   * https://github.com/facebook/jscodeshift/issues/467
   *
   * So to narrow declaration type, we check it against all possible
   * `DeclarationKind` values instead.
   */
  if (
    exportDefaultDeclaration.declaration.type === "ClassBody" ||
    exportDefaultDeclaration.declaration.type === "ClassMethod" ||
    exportDefaultDeclaration.declaration.type === "ClassPrivateMethod" ||
    exportDefaultDeclaration.declaration.type === "ClassPrivateProperty" ||
    exportDefaultDeclaration.declaration.type === "ClassProperty" ||
    exportDefaultDeclaration.declaration.type === "ClassPropertyDefinition" ||
    exportDefaultDeclaration.declaration.type === "DeclareClass" ||
    exportDefaultDeclaration.declaration.type ===
      "DeclareExportAllDeclaration" ||
    exportDefaultDeclaration.declaration.type === "DeclareExportDeclaration" ||
    exportDefaultDeclaration.declaration.type === "DeclareInterface" ||
    exportDefaultDeclaration.declaration.type === "DeclareOpaqueType" ||
    exportDefaultDeclaration.declaration.type === "DeclareTypeAlias" ||
    exportDefaultDeclaration.declaration.type === "EnumDeclaration" ||
    exportDefaultDeclaration.declaration.type === "ExportAllDeclaration" ||
    exportDefaultDeclaration.declaration.type === "ExportDeclaration" ||
    exportDefaultDeclaration.declaration.type === "ExportDefaultDeclaration" ||
    exportDefaultDeclaration.declaration.type === "ExportNamedDeclaration" ||
    exportDefaultDeclaration.declaration.type === "FunctionDeclaration" ||
    exportDefaultDeclaration.declaration.type === "ImportDeclaration" ||
    exportDefaultDeclaration.declaration.type === "InterfaceDeclaration" ||
    exportDefaultDeclaration.declaration.type === "MethodDefinition" ||
    exportDefaultDeclaration.declaration.type === "OpaqueType" ||
    exportDefaultDeclaration.declaration.type ===
      "TSCallSignatureDeclaration" ||
    exportDefaultDeclaration.declaration.type ===
      "TSConstructSignatureDeclaration" ||
    exportDefaultDeclaration.declaration.type === "TSDeclareFunction" ||
    exportDefaultDeclaration.declaration.type === "TSDeclareMethod" ||
    exportDefaultDeclaration.declaration.type === "TSEnumDeclaration" ||
    exportDefaultDeclaration.declaration.type === "TSExternalModuleReference" ||
    exportDefaultDeclaration.declaration.type === "TSImportEqualsDeclaration" ||
    exportDefaultDeclaration.declaration.type === "TSIndexSignature" ||
    exportDefaultDeclaration.declaration.type === "TSInterfaceDeclaration" ||
    exportDefaultDeclaration.declaration.type === "TSMethodSignature" ||
    exportDefaultDeclaration.declaration.type === "TSModuleDeclaration" ||
    exportDefaultDeclaration.declaration.type ===
      "TSNamespaceExportDeclaration" ||
    exportDefaultDeclaration.declaration.type === "TSPropertySignature" ||
    exportDefaultDeclaration.declaration.type === "TSTypeAliasDeclaration" ||
    exportDefaultDeclaration.declaration.type ===
      "TSTypeParameterDeclaration" ||
    exportDefaultDeclaration.declaration.type === "TypeAlias" ||
    exportDefaultDeclaration.declaration.type === "VariableDeclaration"
  ) {
    return exportDefaultDeclaration;
  }

  let expressionKind =
    exportDefaultDeclaration.declaration.type === "ClassDeclaration"
      ? j.classExpression.from(exportDefaultDeclaration.declaration)
      : // : exportDefaultDeclaration.declaration.type === "FunctionDeclaration"
        // ? j.functionExpression.from(exportDefaultDeclaration.declaration)
        exportDefaultDeclaration.declaration;
  return j.expressionStatement(
    j.assignmentExpression(
      "=",
      j.memberExpression(j.identifier("module"), j.identifier("exports")),
      expressionKind
    )
  );
};
