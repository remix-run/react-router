import * as babel from "@babel/core";
import type { Binding, NodePath } from "@babel/traverse";
import type { GeneratorResult } from "@babel/generator";
import {
  deadCodeElimination,
  findReferencedIdentifiers,
} from "babel-dead-code-elimination";

import { generate, parse, t, traverse } from "./babel";

function parseRoute(source: string) {
  let ast = parse(source, {
    sourceType: "module",
    plugins: ["jsx", ["typescript", {}]],
  });

  // Workaround for `path.buildCodeFrameError`
  // See:
  // - https://github.com/babel/babel/issues/11889
  // - https://github.com/babel/babel/issues/11350#issuecomment-606169054
  // @ts-expect-error `@types/babel__core` is missing types for `File`
  new babel.File({ filename: undefined }, { code: source, ast });

  return ast;
}

let fields = [
  "loader",
  "clientLoader",
  "action",
  "clientAction",
  "Component",
  "ErrorBoundary",
] as const;

type Field = (typeof fields)[number];
type FieldPath = NodePath<t.ObjectProperty | t.ObjectMethod>;

function isField(field: string): field is Field {
  return (fields as readonly string[]).includes(field);
}

type Analysis = Record<Field, FieldPath | null>;

export function parseRouteFields(source: string): string[] {
  let ast = parseRoute(source);

  let fieldNames: Field[] = [];
  traverse(ast, {
    ExportDefaultDeclaration(path) {
      let fields = analyzeRouteExport(path);
      if (fields instanceof Error) throw fields;
      for (let [key, fieldPath] of Object.entries(fields)) {
        if (!fieldPath) continue;
        fieldNames.push(key as Field);
      }
    },
  });
  return fieldNames;
}

export function transform(
  source: string,
  id: string,
  options: { ssr: boolean }
): GeneratorResult {
  let ast = parseRoute(source);

  let refs = findReferencedIdentifiers(ast);
  traverse(ast, {
    ExportDefaultDeclaration(path) {
      let fields = analyzeRouteExport(path);
      if (fields instanceof Error) throw fields;
      if (options.ssr) return;

      let markedForRemoval: NodePath<t.Node>[] = [];
      for (let [key, fieldPath] of Object.entries(fields)) {
        if (["loader", "action"].includes(key)) {
          if (!fieldPath) continue;
          markedForRemoval.push(fieldPath);
        }
      }
      markedForRemoval.forEach((path) => path.remove());
    },
  });
  deadCodeElimination(ast, refs);
  return generate(ast, { sourceMaps: true, sourceFileName: id }, source);
}

function analyzeRouteExport(
  path: NodePath<t.ExportDefaultDeclaration>
): Analysis | Error {
  let route = path.node.declaration;

  // export default {...}
  if (t.isObjectExpression(route)) {
    let routePath = path.get("declaration") as NodePath<t.ObjectExpression>;
    return analyzeRoute(routePath);
  }

  // export default defineRoute({...})
  if (t.isCallExpression(route)) {
    let routePath = path.get("declaration") as NodePath<t.CallExpression>;
    if (!isDefineRoute(routePath)) {
      return routePath.buildCodeFrameError("TODO");
    }

    if (routePath.node.arguments.length !== 1) {
      return path.buildCodeFrameError(
        `defineRoute must take exactly one argument`
      );
    }
    let arg = routePath.node.arguments[0];
    let argPath = path.get("arguments.0") as NodePath<t.ObjectExpression>;
    if (!t.isObjectExpression(arg)) {
      return argPath.buildCodeFrameError(
        "defineRoute argument must be a literal object"
      );
    }
    return analyzeRoute(argPath);
  }

  return path.get("declaration").buildCodeFrameError("TODO");
}

function analyzeRoute(path: NodePath<t.ObjectExpression>): Analysis {
  let analysis: Analysis = {
    loader: null,
    clientLoader: null,
    action: null,
    clientAction: null,
    Component: null,
    ErrorBoundary: null,
  };

  for (let [i, property] of path.node.properties.entries()) {
    if (!t.isObjectProperty(property) && !t.isObjectMethod(property)) {
      let propertyPath = path.get(`properties.${i}`) as NodePath<t.Node>;
      throw propertyPath.buildCodeFrameError("todo");
    }

    let propertyPath = path.get(`properties.${i}`) as NodePath<
      t.ObjectProperty | t.ObjectMethod
    >;
    if (property.computed || !t.isIdentifier(property.key)) {
      throw propertyPath.buildCodeFrameError("todo");
    }

    let key = property.key.name;
    if (key === "params") {
      let paramsPath = propertyPath as NodePath<t.ObjectProperty>;
      checkRouteParams(paramsPath);
      continue;
    }
    if (isField(key)) {
      analysis[key] = propertyPath;
      continue;
    }
  }
  return analysis;
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

function isDefineRoute(path: NodePath<t.CallExpression>): boolean {
  if (!t.isIdentifier(path.node.callee)) return false;
  let binding = path.scope.getBinding(path.node.callee.name);
  if (!binding) return false;
  return isCanonicallyImportedAs(binding, {
    imported: "defineRoute",
    source: "react-router",
  });
}

function isCanonicallyImportedAs(
  binding: Binding,
  {
    source: sourceName,
    imported: importedName,
  }: {
    source: string;
    imported: string;
  }
): boolean {
  // import source
  if (!t.isImportDeclaration(binding?.path.parent)) return false;
  if (binding.path.parent.source.value !== sourceName) return false;

  // import specifier
  if (!t.isImportSpecifier(binding?.path.node)) return false;
  let { imported } = binding.path.node;
  if (!t.isIdentifier(imported)) return false;
  if (imported.name !== importedName) return false;
  return true;
}
