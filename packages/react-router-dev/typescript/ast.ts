import type ts from "typescript/lib/tsserverlibrary";
import type { Context } from "./context";

export function generateUniqueIdentifier(): string {
  return "_" + crypto.randomUUID().replace(/-/g, "_");
}

export function findNodeAtPosition(
  node: ts.Node,
  pos: number
): ts.Node | undefined {
  if (pos < node.getStart() || node.getEnd() < pos) return;
  for (const child of node.getChildren()) {
    if (pos < child.getStart()) break;
    if (pos > child.getEnd()) continue;

    const found = findNodeAtPosition(child, pos);
    if (found) return found;

    return child;
  }
  return node;
}

export function getRouteExportName(ctx: Context, node: ts.Node) {
  if (node.kind === ctx.ts.SyntaxKind.DefaultKeyword) {
    return "default";
  }
  if (node.kind === ctx.ts.SyntaxKind.FunctionKeyword) {
    return getRouteExportName(ctx, node.parent);
  }

  if (ctx.ts.isIdentifier(node)) {
    return getRouteExportName(ctx, node.parent);
  }

  if (ctx.ts.isExportAssignment(node)) {
    if (node.isExportEquals) return;
    if (!ctx.ts.isArrowFunction(node.expression)) return;
    return "default";
  }

  if (ctx.ts.isFunctionDeclaration(node)) {
    if (!exported(ctx.ts, node)) return;
    if (defaulted(ctx.ts, node)) return "default";
    return node.name?.text;
  }
  if (ctx.ts.isVariableDeclaration(node)) {
    const varDeclList = node.parent;
    if (!ctx.ts.isVariableDeclarationList(varDeclList)) return;
    const varStmt = varDeclList.parent;
    if (!ctx.ts.isVariableStatement(varStmt)) return;
    if (!exported(ctx.ts, varStmt)) return;
    if (!ctx.ts.isIdentifier(node.name)) return;
    return node.name.text;
  }
}

export function getExportNames(
  ts: Context["ts"],
  sourceFile: ts.SourceFile
): Set<string> {
  const exports = new Set<string>();

  sourceFile.statements.forEach((stmt) => {
    if (ts.isExportDeclaration(stmt)) {
      if (stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
        stmt.exportClause.elements.forEach((element) =>
          exports.add(element.name.text)
        );
      }
    }
    if (ts.isVariableStatement(stmt) && exported(ts, stmt)) {
      stmt.declarationList.declarations.forEach((decl) => {
        if (ts.isIdentifier(decl.name)) {
          exports.add(decl.name.text);
        }
      });
    }
    if (ts.isFunctionDeclaration(stmt) && exported(ts, stmt)) {
      if (defaulted(ts, stmt)) {
        exports.add("default");
      } else if (stmt.name) {
        exports.add(stmt.name.text);
      }
    }
    if (ts.isExportAssignment(stmt)) {
      exports.add("default");
    }
  });

  return exports;
}

export function exported(
  ts: Context["ts"],
  stmt: ts.VariableStatement | ts.FunctionDeclaration
) {
  return stmt.modifiers?.find((m) => m.kind === ts.SyntaxKind.ExportKeyword);
}

export function defaulted(ts: Context["ts"], stmt: ts.FunctionDeclaration) {
  return stmt.modifiers?.find((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
}
