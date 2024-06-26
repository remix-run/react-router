import * as babel from "@babel/core";
import type { Binding, NodePath } from "@babel/traverse";

import { parse as _parse, t, traverse } from "./babel";

export function transform(code: string) {
  let ast = parse(code);
  traverse(ast, {
    Identifier(path) {
      if (!isDefineRoute(path)) return;
      if (t.isImportSpecifier(path.parent)) return;
      if (!t.isCallExpression(path.parent)) {
        throw path.buildCodeFrameError(
          "`defineRoute` must be a function call immediately after `export default`"
        );
      }
      if (!t.isExportDefaultDeclaration(path.parentPath.parent)) {
        throw path.buildCodeFrameError(
          "`defineRoute` must be a function call immediately after `export default`"
        );
      }
    },
    ExportDefaultDeclaration(path) {
      analyzeRouteExport(path);
    },
  });
}

type Analysis = {
  params?: NodePath;
  links?: NodePath;
  HydrateFallback?: NodePath;

  serverLoader?: NodePath;
  clientLoader?: NodePath;
  serverAction?: NodePath;
  clientAction?: NodePath;

  meta?: NodePath;
  Component?: NodePath;
  ErrorBoundary?: NodePath;

  handle?: NodePath;
  // TODO: shouldRevalidate
};

function analyzeRouteExport(
  path: NodePath<t.ExportDefaultDeclaration>
): Analysis {
  let route = path.node.declaration;

  // export default {...}
  if (t.isObjectExpression(route)) {
    let routePath = path.get("declaration") as NodePath<t.ObjectExpression>;
    return analyzeRoute(routePath);
  }

  // export default defineRoute({...})
  if (t.isCallExpression(route)) {
    let routePath = path.get("declaration") as NodePath<t.CallExpression>;
    if (!isDefineRoute(routePath.get("callee"))) {
      throw routePath.buildCodeFrameError(
        "Default export of a route module must be either a literal object or a call to `defineRoute`"
      );
    }

    if (routePath.node.arguments.length !== 1) {
      throw routePath.buildCodeFrameError(
        "`defineRoute` must take exactly one argument"
      );
    }

    let arg = routePath.node.arguments[0];
    let argPath = routePath.get("arguments.0") as NodePath<t.ObjectExpression>;
    if (!t.isObjectExpression(arg)) {
      throw argPath.buildCodeFrameError(
        "`defineRoute` argument must be a literal object"
      );
    }

    return analyzeRoute(argPath);
  }
  throw path
    .get("declaration")
    .buildCodeFrameError(
      "Default export of a route module must be either a literal object or a call to `defineRoute`"
    );
}

function analyzeRoute(path: NodePath<t.ObjectExpression>): Analysis {
  let analysis: Analysis = {};
  for (let [i, property] of path.node.properties.entries()) {
    // spread: defineRoute({ ...dynamic })
    if (!t.isObjectProperty(property) && !t.isObjectMethod(property)) {
      let propertyPath = path.get(`properties.${i}`) as NodePath<t.Node>;
      throw propertyPath.buildCodeFrameError(
        "Properties cannot be spread into route"
      );
    }

    // defineRoute({ [dynamic]: ... })
    let propertyPath = path.get(`properties.${i}`) as NodePath<
      t.ObjectProperty | t.ObjectMethod
    >;
    if (property.computed || !t.isIdentifier(property.key)) {
      throw propertyPath.buildCodeFrameError("Route cannot have computed keys");
    }

    // defineRoute({ params: [...] })
    let key = property.key.name;
    if (key === "params") {
      let paramsPath = propertyPath as NodePath<t.ObjectProperty>;
      if (t.isObjectMethod(paramsPath.node)) {
        throw paramsPath.buildCodeFrameError(
          "Route params must be a literal array"
        );
      }
      if (!t.isArrayExpression(paramsPath.node.value)) {
        throw paramsPath.buildCodeFrameError(
          "Route params must be a literal array"
        );
      }
      for (let [i, element] of paramsPath.node.value.elements.entries()) {
        if (!t.isStringLiteral(element)) {
          let elementPath = paramsPath.get(
            `value.elements.${i}`
          ) as NodePath<t.Node>;
          throw elementPath.buildCodeFrameError(
            "Route param must be a literal string"
          );
        }
      }
    }
    analysis[key as keyof Analysis] = propertyPath;
  }

  return analysis;
}

export function assertNotImported(code: string): void {
  let ast = parse(code);
  traverse(ast, {
    Identifier(path) {
      if (isDefineRoute(path)) {
        throw path.buildCodeFrameError(
          "`defineRoute` cannot be used outside of route modules"
        );
      }
    },
  });
}

function parse(source: string) {
  let ast = _parse(source, {
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

function isDefineRoute(path: NodePath): boolean {
  if (!t.isIdentifier(path.node)) return false;
  let binding = path.scope.getBinding(path.node.name);
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
