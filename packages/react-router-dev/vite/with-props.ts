import type { Babel, NodePath, ParseResult } from "./babel";
import { traverse, t } from "./babel";

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
  ast: ParseResult<Babel.File>
) => {
  const hocs: Array<[string, Babel.Identifier]> = [];
  function getHocUid(path: NodePath, hocName: HocName) {
    const uid = path.scope.generateUidIdentifier(hocName);
    hocs.push([hocName, uid]);
    return uid;
  }

  traverse(ast, {
    ExportDeclaration(path) {
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
                t.callExpression(uid, [toFunctionExpression(decl.node)])
              ),
            ])
          );
        }
      }
    },
  });

  if (hocs.length > 0) {
    ast.program.body.unshift(
      t.importDeclaration(
        hocs.map(([name, identifier]) =>
          t.importSpecifier(identifier, t.identifier(name))
        ),
        t.stringLiteral("react-router")
      )
    );
  }
};

function toFunctionExpression(decl: Babel.FunctionDeclaration) {
  return t.functionExpression(
    decl.id,
    decl.params,
    decl.body,
    decl.generator,
    decl.async
  );
}
