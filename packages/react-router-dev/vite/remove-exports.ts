import {
  findReferencedIdentifiers,
  deadCodeElimination,
} from "babel-dead-code-elimination";

import type { Babel, NodePath, ParseResult } from "./babel";
import { traverse } from "./babel";

export const removeExports = (
  ast: ParseResult<Babel.File>,
  exportsToRemove: string[]
) => {
  let previouslyReferencedIdentifiers = findReferencedIdentifiers(ast);
  let exportsFiltered = false;
  let markedForRemoval = new Set<NodePath<Babel.Node>>();

  traverse(ast, {
    ExportDeclaration(path) {
      // export { foo };
      // export { bar } from "./module";
      if (path.node.type === "ExportNamedDeclaration") {
        if (path.node.specifiers.length) {
          path.node.specifiers = path.node.specifiers.filter((specifier) => {
            // Filter out individual specifiers
            if (
              specifier.type === "ExportSpecifier" &&
              specifier.exported.type === "Identifier"
            ) {
              if (exportsToRemove.includes(specifier.exported.name)) {
                exportsFiltered = true;
                return false;
              }
            }
            return true;
          });
          // Remove the entire export statement if all specifiers were removed
          if (path.node.specifiers.length === 0) {
            markedForRemoval.add(path);
          }
        }

        // export const foo = ...;
        // export const [ foo ] = ...;
        if (path.node.declaration?.type === "VariableDeclaration") {
          let declaration = path.node.declaration;
          declaration.declarations = declaration.declarations.filter(
            (declaration) => {
              // export const foo = ...;
              // export const foo = ..., bar = ...;
              if (
                declaration.id.type === "Identifier" &&
                exportsToRemove.includes(declaration.id.name)
              ) {
                // Filter out individual variables
                exportsFiltered = true;
                return false;
              }

              // export const [ foo ] = ...;
              // export const { foo } = ...;
              if (
                declaration.id.type === "ArrayPattern" ||
                declaration.id.type === "ObjectPattern"
              ) {
                // NOTE: These exports cannot be safely removed, so instead we
                // validate them to ensure that any exports that are intended to
                // be removed are not present
                validateDestructuredExports(declaration.id, exportsToRemove);
              }

              return true;
            }
          );
          // Remove the entire export statement if all variables were removed
          if (declaration.declarations.length === 0) {
            markedForRemoval.add(path);
          }
        }

        // export function foo() {}
        if (path.node.declaration?.type === "FunctionDeclaration") {
          let id = path.node.declaration.id;
          if (id && exportsToRemove.includes(id.name)) {
            markedForRemoval.add(path);
          }
        }

        // export class Foo() {}
        if (path.node.declaration?.type === "ClassDeclaration") {
          let id = path.node.declaration.id;
          if (id && exportsToRemove.includes(id.name)) {
            markedForRemoval.add(path);
          }
        }
      }

      // export default ...;
      if (
        path.node.type === "ExportDefaultDeclaration" &&
        exportsToRemove.includes("default")
      ) {
        markedForRemoval.add(path);
      }
    },
  });

  if (markedForRemoval.size > 0 || exportsFiltered) {
    for (let path of markedForRemoval) {
      path.remove();
    }

    // Run dead code elimination on any newly unreferenced identifiers
    deadCodeElimination(ast, previouslyReferencedIdentifiers);
  }
};

function validateDestructuredExports(
  id: Babel.ArrayPattern | Babel.ObjectPattern,
  exportsToRemove: string[]
) {
  if (id.type === "ArrayPattern") {
    for (let element of id.elements) {
      if (!element) {
        continue;
      }

      // [ foo ]
      if (
        element.type === "Identifier" &&
        exportsToRemove.includes(element.name)
      ) {
        throw invalidDestructureError(element.name);
      }

      // [ ...foo ]
      if (
        element.type === "RestElement" &&
        element.argument.type === "Identifier" &&
        exportsToRemove.includes(element.argument.name)
      ) {
        throw invalidDestructureError(element.argument.name);
      }

      // [ [...] ]
      // [ {...} ]
      if (element.type === "ArrayPattern" || element.type === "ObjectPattern") {
        validateDestructuredExports(element, exportsToRemove);
      }
    }
  }

  if (id.type === "ObjectPattern") {
    for (let property of id.properties) {
      if (!property) {
        continue;
      }

      if (
        property.type === "ObjectProperty" &&
        property.key.type === "Identifier"
      ) {
        // { foo }
        if (
          property.value.type === "Identifier" &&
          exportsToRemove.includes(property.value.name)
        ) {
          throw invalidDestructureError(property.value.name);
        }

        // { foo: [...] }
        // { foo: {...} }
        if (
          property.value.type === "ArrayPattern" ||
          property.value.type === "ObjectPattern"
        ) {
          validateDestructuredExports(property.value, exportsToRemove);
        }
      }

      // { ...foo }
      if (
        property.type === "RestElement" &&
        property.argument.type === "Identifier" &&
        exportsToRemove.includes(property.argument.name)
      ) {
        throw invalidDestructureError(property.argument.name);
      }
    }
  }
}

function invalidDestructureError(name: string) {
  return new Error(`Cannot remove destructured export "${name}"`);
}
