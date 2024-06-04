import type { Binding, NodePath } from "@babel/traverse";
import { parse, traverse, generate, t } from "./babel";
import type { GeneratorResult } from "@babel/generator";
import { deadCodeElimination, findReferencedIdentifiers } from "./dce";

const MACRO = "defineRoute$";
const MACRO_PKG = "react-router";
const SERVER_ONLY_PROPERTIES = ["loader", "action"];

type Field = NodePath<t.ObjectProperty | t.ObjectMethod>;
type Fields = {
  params?: NodePath<t.ObjectProperty>;
  loader?: Field;
  clientLoader?: Field;
  action?: Field;
  clientAction?: Field;
  Component?: Field;
  ErrorBoundary?: Field;
};

export type HasFields = {
  hasLoader: boolean;
  hasClientLoader: boolean;
  hasAction: boolean;
  hasClientAction: boolean;
  hasErrorBoundary: boolean;
};

function analyzeRoute(path: NodePath<t.CallExpression>): Fields {
  if (path.node.arguments.length !== 1) {
    throw path.buildCodeFrameError(`macro must take exactly one argument`);
  }
  let arg = path.node.arguments[0];
  let argPath = path.get("arguments.0") as NodePath<t.Node>;
  if (!t.isObjectExpression(arg)) {
    throw argPath.buildCodeFrameError(
      "macro argument must be a literal object"
    );
  }

  let fields: Fields = {};
  for (let [i, property] of arg.properties.entries()) {
    if (!t.isObjectProperty(property) && !t.isObjectMethod(property)) {
      let propertyPath = argPath.get(`properties.${i}`) as NodePath<t.Node>;
      throw propertyPath.buildCodeFrameError(
        "macro argument must only have statically analyzable properties"
      );
    }
    let propertyPath = argPath.get(`properties.${i}`) as NodePath<
      t.ObjectProperty | t.ObjectMethod
    >;
    if (property.computed || !t.isIdentifier(property.key)) {
      throw propertyPath.buildCodeFrameError(
        "macro argument must only have statically analyzable fields"
      );
    }

    let key = property.key.name;
    if (key === "params") {
      let paramsPath = propertyPath as NodePath<t.ObjectProperty>;
      checkRouteParams(paramsPath);
      fields["params"] = paramsPath;
      continue;
    }

    if (
      key === "loader" ||
      key === "clientLoader" ||
      key === "action" ||
      key === "clientAction" ||
      key === "Component" ||
      key === "ErrorBoundary"
    ) {
      fields[key] = propertyPath;
    }
  }
  return fields;
}

export function getDefineRouteHasFields(source: string): HasFields | null {
  let ast = parse(source, { sourceType: "module" });
  let foundMacro = false;
  let metadata: HasFields = {
    hasLoader: false,
    hasClientAction: false,
    hasAction: false,
    hasClientLoader: false,
    hasErrorBoundary: false,
  };
  traverse(ast, {
    CallExpression(path) {
      if (!isMacro(path)) return;

      foundMacro = true;
      let fields = analyzeRoute(path);
      metadata = {
        hasLoader: fields.loader !== undefined,
        hasClientLoader: fields.clientLoader !== undefined,
        hasAction: fields.action !== undefined,
        hasClientAction: fields.clientAction !== undefined,
        hasErrorBoundary: fields.ErrorBoundary !== undefined,
      };
    },
  });
  if (!foundMacro) return null;
  return metadata;
}

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
      if (!isMacro(path)) return;

      let fields = analyzeRoute(path);
      if (options.ssr) {
        let markedForRemoval: NodePath<t.Node>[] = [];
        for (let [key, fieldPath] of Object.entries(fields)) {
          if (SERVER_ONLY_PROPERTIES.includes(key)) {
            markedForRemoval.push(fieldPath);
          }
        }
        markedForRemoval.forEach((path) => path.remove());
      }
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

function isMacro(path: NodePath<t.CallExpression>): boolean {
  if (!t.isIdentifier(path.node.callee)) return false;
  let name = path.node.callee.name;
  let binding = path.scope.getBinding(name);

  if (!binding) return false;
  if (!isMacroBinding(binding)) return false;
  return true;
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
