import type { Transform } from "jscodeshift";

import { checkNoDifferentImportTypesCombined } from "./checkNoDifferentImportTypesCombined";
import { createExportExpressionStatementFromExportDefaultDeclaration } from "./createExportExpressionStatementFromExportDefaultDeclaration";
import { createImportExpressionStatement } from "./createImportExpressionStatement";
import { createVariableDeclarationIdentifier } from "./createVariableDeclarationIdentifier";
import { createVariableDeclarationObjectPattern } from "./createVariableDeclarationObjectPattern";

const transform: Transform = (file, api, options) => {
  let j = api.jscodeshift;
  let root = j(file.source);

  let allImportDeclarations = root.find(j.ImportDeclaration);
  let allExportDefaultDeclarations = root.find(j.ExportDefaultDeclaration);
  if (
    allImportDeclarations.length === 0 &&
    allExportDefaultDeclarations.length === 0
  ) {
    // This transform doesn't need to run if there are no ES imports/exports
    return null;
  }

  // https://github.com/facebook/jscodeshift/blob/main/recipes/retain-first-comment.md
  let getFirstNode = () => root.find(j.Program).get("body", 0).node;
  let oldFirstNode = getFirstNode();

  allImportDeclarations.forEach((importDeclaration) => {
    if (importDeclaration.node.importKind === "type") {
      return;
    }

    let { specifiers } = importDeclaration.node;

    // import "foo"
    if (!specifiers || specifiers.length === 0) {
      return j(importDeclaration).replaceWith(
        createImportExpressionStatement(j, importDeclaration.node)
      );
    }

    // import Foo, { bar } from "foo"
    checkNoDifferentImportTypesCombined(importDeclaration.node);

    // import foo from "foo" || import * as foo from "foo"
    if (
      ["ImportDefaultSpecifier", "ImportNamespaceSpecifier"].includes(
        specifiers[0].type
      )
    ) {
      return j(importDeclaration).replaceWith(
        createVariableDeclarationIdentifier(j, importDeclaration.node)
      );
    }

    // import { foo } from "foo" || import { foo as bar } from "foo"
    return j(importDeclaration).replaceWith(
      createVariableDeclarationObjectPattern(j, importDeclaration.node)
    );
  });

  allExportDefaultDeclarations.forEach((exportDefaultDeclaration) => {
    // export default foo
    j(exportDefaultDeclaration).replaceWith(
      createExportExpressionStatementFromExportDefaultDeclaration(
        j,
        exportDefaultDeclaration.node
      )
    );
  });

  // If the first node has been modified or deleted, reattach the comments
  let newFirstNode = getFirstNode();
  if (newFirstNode !== oldFirstNode) {
    newFirstNode.comments = oldFirstNode.comments;
  }

  return root.toSource(options);
};
export default transform;
