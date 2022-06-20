import type { Transform } from "jscodeshift";

import { checkNoDifferentImportTypesCombined } from "./checkNoDifferentImportTypesCombined";
import { createExpressionStatement } from "./createExpressionStatement";
import { createVariableDeclarationIdentifier } from "./createVariableDeclarationIdentifier";
import { createVariableDeclarationObjectPattern } from "./createVariableDeclarationObjectPattern";

const transform: Transform = (file, api, options) => {
  let j = api.jscodeshift;
  let root = j(file.source);

  let allESImportDeclarations = root.find(j.ImportDeclaration);
  if (allESImportDeclarations.length === 0) {
    // This transform doesn't need to run if there are no ES imports
    return null;
  }

  // https://github.com/facebook/jscodeshift/blob/main/recipes/retain-first-comment.md
  let getFirstNode = () => root.find(j.Program).get("body", 0).node;
  let oldFirstNode = getFirstNode();

  allESImportDeclarations.forEach((importDeclaration) => {
    if (importDeclaration.node.importKind === "type") {
      return;
    }

    let { specifiers } = importDeclaration.node;
    if (!specifiers || specifiers.length === 0) {
      return j(importDeclaration).replaceWith(
        createExpressionStatement(j, importDeclaration.node)
      );
    }

    checkNoDifferentImportTypesCombined(importDeclaration.node);

    if (
      ["ImportDefaultSpecifier", "ImportNamespaceSpecifier"].includes(
        specifiers[0].type
      )
    ) {
      return j(importDeclaration).replaceWith(
        createVariableDeclarationIdentifier(j, importDeclaration.node)
      );
    }

    return j(importDeclaration).replaceWith(
      createVariableDeclarationObjectPattern(j, importDeclaration.node)
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
