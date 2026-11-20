import type { Babel, NodePath, ParseResult } from "./babel";
import { traverse, t } from "./babel";
import { isRouteChunkModuleId } from "./route-chunks";

const namedComponentExports = ["HydrateFallback", "ErrorBoundary"] as const;
type NamedComponentExport = (typeof namedComponentExports)[number];
function isNamedComponentExport(name: string): name is NamedComponentExport {
  return namedComponentExports.includes(name as NamedComponentExport);
}

type HocName =
  | "UNSAFE_withComponentProps"
  | "UNSAFE_withHydrateFallbackProps"
  | "UNSAFE_withErrorBoundaryProps";

/** Keep component definitions at module scope for React Compiler and Refresh. */
export const decorateComponentExportsWithProps = (
  ast: ParseResult<Babel.File>,
) => {
  const hocs: Array<[string, Babel.Identifier]> = [];
  const generatedComponents = new Set<string>();

  function wrap(path: NodePath, hocName: HocName, expr: Babel.Expression) {
    const uid = path.scope.generateUidIdentifier(hocName);
    hocs.push([hocName, uid]);
    const call = t.callExpression(uid, [expr]);
    // Allow unused split route chunks (such as fallbacks) to be tree-shaken.
    t.addComment(call, "leading", "#__PURE__");
    return call;
  }

  function getComponentUid(path: NodePath) {
    let name = "ReactRouterRouteComponent";
    let suffix = 0;
    while (
      path.scope.hasBinding(name) ||
      path.scope.hasGlobal(name) ||
      generatedComponents.has(name)
    ) {
      name = `ReactRouterRouteComponent${++suffix}`;
    }
    generatedComponents.add(name);
    // Compiler and refresh inference require an uppercase component name.
    // Babel's usual generated identifiers start with an underscore.
    return t.identifier(name);
  }

  const generated = new WeakSet<Babel.Node>();
  // Wrapped local bindings (i.e., `export { Page as default }`) are appended
  // to the end of the module so the binding is initialized before we read it
  const trailingStatements: Babel.Statement[] = [];

  traverse(ast, {
    ExportDeclaration(path) {
      if (generated.has(path.node)) return;
      if (path.isExportDefaultDeclaration()) {
        const declaration = path.node.declaration;
        const statements: Babel.Statement[] = [];
        let component: Babel.Identifier;
        if (t.isFunctionDeclaration(declaration)) {
          declaration.id ??= getComponentUid(path);
          component = declaration.id;
          statements.push(declaration);
        } else if (t.isIdentifier(declaration)) {
          component = declaration;
        } else if (t.isExpression(declaration)) {
          component = getComponentUid(path);
          statements.push(
            t.variableDeclaration("const", [
              t.variableDeclarator(component, declaration),
            ]),
          );
        } else {
          return;
        }
        path.insertBefore(statements);
        path.node.declaration = wrap(
          path,
          "UNSAFE_withComponentProps",
          component,
        );
        return;
      }

      if (!path.isExportNamedDeclaration() || path.node.exportKind === "type")
        return;
      // Handle export specifiers such as:
      //   export { default } from "./component";
      //   export { Component as default };
      //   export { ErrorBoundary } from "./error-boundary";
      if (path.node.specifiers.length > 0) {
        const source = path.node.source;
        // Route chunk modules are decorated individually, so re-exports from
        // them (i.e., the route chunk "index" module) must be left alone
        if (source && isRouteChunkModuleId(source.value)) return;
        const statements: Babel.Statement[] = [];
        for (const specifier of path.get("specifiers")) {
          if (!specifier.isExportSpecifier()) continue;
          const exported = specifier.node.exported;
          const exportedName = t.isIdentifier(exported)
            ? exported.name
            : exported.value;
          const hocName: HocName | undefined =
            exportedName === "default"
              ? "UNSAFE_withComponentProps"
              : isNamedComponentExport(exportedName)
                ? `UNSAFE_with${exportedName}Props`
                : undefined;
          if (!hocName) continue;

          let local: Babel.Identifier = specifier.node.local;
          if (source) {
            // Import the re-exported binding so we can wrap it locally
            const imported = path.scope.generateUidIdentifier(
              exportedName === "default" ? "Component" : exportedName,
            );
            statements.push(
              t.importDeclaration(
                [
                  local.name === "default"
                    ? t.importDefaultSpecifier(imported)
                    : t.importSpecifier(imported, local),
                ],
                t.stringLiteral(source.value),
              ),
            );
            local = imported;
          }

          const wrapped = path.scope.generateUidIdentifier(
            exportedName === "default" ? "default" : exportedName,
          );
          const exportDecl = t.exportNamedDeclaration(null, [
            t.exportSpecifier(wrapped, t.identifier(exportedName)),
          ]);
          generated.add(exportDecl);
          (source ? statements : trailingStatements).push(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                wrapped,
                wrap(path, hocName, t.identifier(local.name)),
              ),
            ]),
            exportDecl,
          );
          specifier.remove();
        }

        if (path.node.specifiers.length === 0) {
          if (statements.length > 0) {
            path.replaceWithMultiple(statements);
          } else {
            path.remove();
          }
        } else if (statements.length > 0) {
          path.insertAfter(statements);
        }
        return;
      }

      const declaration = path.node.declaration;
      const components = new Set<string>();
      if (t.isVariableDeclaration(declaration)) {
        for (const { id, init } of declaration.declarations) {
          if (t.isIdentifier(id) && init && isNamedComponentExport(id.name))
            components.add(id.name);
        }
      } else if (t.isFunctionDeclaration(declaration) && declaration.id) {
        if (isNamedComponentExport(declaration.id.name))
          components.add(declaration.id.name);
      }
      if (!declaration || !components.size) return;

      // Wrap only the exported value; local references retain the component
      // definition, including recursive calls and references in other exports.
      const statements: Babel.Statement[] = [declaration];
      const specifiers = Object.entries(
        t.getOuterBindingIdentifiers(declaration),
      ).map(([name, local]) => {
        if (isNamedComponentExport(name) && components.has(name)) {
          const wrapped = path.scope.generateUidIdentifier(`${name}WithProps`);
          statements.push(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                wrapped,
                wrap(path, `UNSAFE_with${name}Props`, local),
              ),
            ]),
          );
          return t.exportSpecifier(wrapped, t.identifier(name));
        }
        return t.exportSpecifier(local, t.identifier(name));
      });
      const exportDecl = t.exportNamedDeclaration(null, specifiers);
      generated.add(exportDecl);
      statements.push(exportDecl);
      path.replaceWithMultiple(statements);
      path.skip();
    },
  });

  ast.program.body.push(...trailingStatements);

  if (hocs.length > 0) {
    ast.program.body.unshift(
      t.importDeclaration(
        hocs.map(([name, identifier]) =>
          t.importSpecifier(identifier, t.identifier(name)),
        ),
        t.stringLiteral("react-router"),
      ),
    );
  }
};
