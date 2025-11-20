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
  ast: ParseResult<Babel.File>,
) => {
  const hocs: Array<[string, Babel.Identifier]> = [];
  function getHocUid(path: NodePath, hocName: HocName) {
    const uid = path.scope.generateUidIdentifier(hocName);
    hocs.push([hocName, uid]);
    return uid;
  }

  /**
   * Rewrite any re-exports for named components (`default Component`, `HydrateFallback`, `ErrorBoundary`)
   * into `export const <name> = <expr>` form in preparation for adding props HOCs in the next traversal.
   *
   * Case 1: `export { name, ... }` or `export { value as name, ... }`
   * -> Rename `name` to `uid` where `uid` is a new unique identifier
   * -> Insert `export const name = uid`
   *
   * Case 2: `export { name1, value as name 2, ... } from "source"`
   * -> Insert `import { name as uid }` where `uid` is a new unique identifier
   * -> Insert `export const name = uid`
   */
  traverse(ast, {
    ExportNamedDeclaration(path) {
      if (path.node.declaration) return;
      const { source } = path.node;

      const exports: Array<{
        specifier: NodePath;
        local: Babel.Identifier;
        uid: Babel.Identifier;
        exported: Babel.Identifier;
      }> = [];
      for (const specifier of path.get("specifiers")) {
        if (specifier.isExportSpecifier()) {
          const { local, exported } = specifier.node;
          const { name } = local;
          if (!t.isIdentifier(exported)) continue;
          const uid = path.scope.generateUidIdentifier(`_${name}`);
          if (exported.name === "default" || isNamedComponentExport(name)) {
            exports.push({ specifier, local, uid, exported });
          }
        }
      }
      if (exports.length === 0) return;

      if (source != null) {
        // `import { local as uid } from "source"`
        path.insertAfter([
          t.importDeclaration(
            exports.map(({ local, uid }) => t.importSpecifier(uid, local)),
            source,
          ),
        ]);
      } else {
        const scope = path.scope.getProgramParent();
        exports.forEach(({ local, uid }) => scope.rename(local.name, uid.name));
      }

      // `export const exported = uid`
      path.insertAfter(
        exports.map(({ uid, exported }) => {
          if (exported.name === "default") {
            return t.exportDefaultDeclaration(uid);
          }
          return t.exportNamedDeclaration(
            t.variableDeclaration("const", [
              t.variableDeclarator(exported, uid),
            ]),
          );
        }),
      );

      exports.forEach(({ specifier }) => specifier.remove());
    },
  });

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
