import type { Binding, NodePath } from "@babel/traverse";
import { parse, traverse, generate, t } from "./babel";
import type { GeneratorResult } from "@babel/generator";
import { deadCodeElimination, findReferencedIdentifiers } from "./dce";

// given a route module filepath
// determine if its using `defineRoute$`
//    if not, just do the old stuff that looks at exports

const MACRO = "defineRoute$";
const MACRO_PKG = "react-router";
const SERVER_ONLY_PROPERTIES = ["loader", "action"];

export function transform(
  source: string,
  id: string,
  options: { ssr: boolean }
): GeneratorResult {
  let ast = parse(source, { sourceType: "module" });
  let refs = findReferencedIdentifiers(ast);

  traverse(ast, {
    Identifier(path) {
      if (t.isImportSpecifier(path.parent)) return;
      let binding = path.scope.getBinding(path.node.name);
      if (!binding) return;
      if (!isMacroBinding(binding)) return;
      if (t.isCallExpression(path.parent)) return;
      throw path.buildCodeFrameError(
        `'${path.node.name}' macro cannot be manipulated at runtime as it must be statically analyzable`
      );
    },
    CallExpression(path) {
      if (!t.isIdentifier(path.node.callee)) return false;
      let macro = path.node.callee.name;
      let binding = path.scope.getBinding(macro);

      if (!binding) return false;
      if (!isMacroBinding(binding)) return false;
      if (path.node.arguments.length !== 1) {
        throw path.buildCodeFrameError(
          `'${macro}' macro must take exactly one argument`
        );
      }
      let arg = path.node.arguments[0];
      let argPath = path.get("arguments.0") as NodePath<t.Node>;
      if (!t.isObjectExpression(arg)) {
        throw argPath.buildCodeFrameError(
          `'${macro}' macro argument must be a literal object`
        );
      }

      let markedForRemoval: NodePath<t.Node>[] = [];
      for (let [i, property] of arg.properties.entries()) {
        let propertyPath = argPath.get(`properties.${i}`) as NodePath<t.Node>;
        if (!t.isObjectProperty(property) && !t.isObjectMethod(property)) {
          throw propertyPath.buildCodeFrameError(
            `'${macro}' macro argument must only have statically analyzable properties`
          );
        }
        if (property.computed || !t.isIdentifier(property.key)) {
          throw propertyPath.buildCodeFrameError(
            `'${macro}' macro argument must only have statically analyzable fields`
          );
        }

        if (property.key.name === "params") {
          checkRouteParams(propertyPath as NodePath<t.ObjectProperty>);
        }

        if (options.ssr && SERVER_ONLY_PROPERTIES.includes(property.key.name)) {
          markedForRemoval.push(propertyPath);
        }
      }
      markedForRemoval.forEach((path) => path.remove());
    },
  });
  deadCodeElimination(ast, refs);
  return generate(ast, { sourceMaps: true, sourceFileName: id }, source);
}

function checkRouteParams(path: NodePath<t.ObjectProperty>) {
  if (t.isObjectMethod(path.node)) {
    throw path.buildCodeFrameError(`params must be statically analyzable`);
  }
  if (!t.isArrayExpression(path.node.value)) {
    throw path.buildCodeFrameError(`params must be statically analyzable`);
  }
  for (let [i, element] of path.node.value.elements.entries()) {
    if (!t.isStringLiteral(element)) {
      let elementPath = path.get(`value.elements.${i}`) as NodePath<t.Node>;
      throw elementPath.buildCodeFrameError(
        `params must be statically analyzable`
      );
    }
  }
}

function isMacroBinding(binding: Binding): boolean {
  // import source
  if (!t.isImportDeclaration(binding?.path.parent)) return false;
  if (binding.path.parent.source.value !== MACRO_PKG) return false;

  // import specifier
  if (!t.isImportSpecifier(binding?.path.node)) return false;
  let { imported } = binding.path.node;
  if (!t.isIdentifier(imported)) return false;
  if (imported.name !== MACRO) return false;
  return true;
}
