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

export const decorateComponentExportsWithProps = (
  ast: ParseResult<Babel.File>,
) => {
  const hocs: Array<[string, Babel.Identifier]> = [];
  function getHocUid(path: NodePath, hocName: HocName) {
    const uid = path.scope.generateUidIdentifier(hocName);
    hocs.push([hocName, uid]);
    return uid;
  }

  const generated = new WeakSet<Babel.Node>();

  traverse(ast, {
    ExportDeclaration(path) {
      if (generated.has(path.node)) return;
      if (path.isExportDefaultDeclaration()) {
        const declaration = path.get("declaration");
        // prettier-ignore
        const expr =
          declaration.isExpression() ? declaration.node :
          declaration.isFunctionDeclaration() ? toFunctionExpression(declaration.node) :
          undefined
        if (expr) {
          const uid = getHocUid(path, "UNSAFE_withComponentProps");
          declaration.replaceWith(t.callExpression(uid, [expr]));
        }
        return;
      }

      if (path.isExportNamedDeclaration()) {
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
                      : t.importSpecifier(imported, t.identifier(local.name)),
                  ],
                  t.stringLiteral(source.value),
                ),
              );
              local = imported;
            }

            const uid = getHocUid(path, hocName);
            const wrapped = path.scope.generateUidIdentifier(
              exportedName === "default" ? "default" : exportedName,
            );
            const exportDecl = t.exportNamedDeclaration(null, [
              t.exportSpecifier(wrapped, t.identifier(exportedName)),
            ]);
            generated.add(exportDecl);
            statements.push(
              t.variableDeclaration("const", [
                t.variableDeclarator(
                  wrapped,
                  t.callExpression(uid, [t.identifier(local.name)]),
                ),
              ]),
              exportDecl,
            );
            specifier.remove();
          }

          if (statements.length > 0) {
            if (path.node.specifiers.length === 0) {
              path.replaceWithMultiple(statements);
            } else {
              path.insertAfter(statements);
            }
          }
          return;
        }

        const decl = path.get("declaration");

        if (decl.isVariableDeclaration()) {
          decl.get("declarations").forEach((varDeclarator) => {
            const id = varDeclarator.get("id");
            const init = varDeclarator.get("init");
            const expr = init.node;
            if (!expr) return;
            if (!id.isIdentifier()) return;
            const { name } = id.node;
            if (!isNamedComponentExport(name)) return;
            const uid = getHocUid(path, `UNSAFE_with${name}Props`);
            init.replaceWith(t.callExpression(uid, [expr]));
          });
          return;
        }

        if (decl.isFunctionDeclaration()) {
          const { id } = decl.node;
          if (!id) return;
          const { name } = id;
          if (!isNamedComponentExport(name)) return;

          const uid = getHocUid(path, `UNSAFE_with${name}Props`);
          decl.replaceWith(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                t.identifier(name),
                t.callExpression(uid, [toFunctionExpression(decl.node)]),
              ),
            ]),
          );
        }
      }
    },
  });

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

function toFunctionExpression(decl: Babel.FunctionDeclaration) {
  return t.functionExpression(
    decl.id,
    decl.params,
    decl.body,
    decl.generator,
    decl.async,
  );
}
