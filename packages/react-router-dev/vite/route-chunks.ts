import { type BabelTypes, type NodePath, parse, traverse } from "./babel";
import invariant from "../invariant";

type Identifier = BabelTypes.Identifier;

export function getTopLevelStatementsByExportName(
  code: string
): Map<string, Set<NodePath>> {
  let ast = parse(code, { sourceType: "module" });
  let topLevelStatementsByExportName = new Map<string, Set<NodePath>>();

  traverse(ast, {
    ExportDeclaration(exportPath) {
      let visited = new Set<NodePath>();
      let identifiers = new Set<NodePath<Identifier>>();

      collectIdentifiers(visited, identifiers, exportPath);

      let topLevelStatements = new Set([
        exportPath,
        ...getTopLevelStatementsForPaths(identifiers),
      ]);
      for (let exportName of getExportNames(exportPath)) {
        topLevelStatementsByExportName.set(exportName, topLevelStatements);
      }
    },
  });

  return topLevelStatementsByExportName;
}

function collectIdentifiers(
  visited: Set<NodePath>,
  identifiers: Set<NodePath<Identifier>>,
  path: NodePath
): void {
  visited.add(path);
  path.traverse({
    Identifier(path) {
      identifiers.add(path);
      let binding = path.scope.getBinding(path.node.name);
      if (binding?.path && !visited.has(binding.path)) {
        collectIdentifiers(visited, identifiers, binding.path);
      }
    },
  });
}

function getTopLevelStatementsForPaths(paths: Set<NodePath>): Set<NodePath> {
  let topLevelStatements = new Set<NodePath>();
  for (let path of paths) {
    let ancestry = path.getAncestry();
    // The last node is the Program node so we want the ancestor before that
    let topLevelStatement = ancestry[ancestry.length - 2];
    topLevelStatements.add(topLevelStatement);
  }
  return topLevelStatements;
}

function getExportNames(
  path: NodePath<BabelTypes.ExportDeclaration>
): string[] {
  // export default ...;
  if (path.node.type === "ExportDefaultDeclaration") {
    return ["default"];
  }

  // export { foo };
  // export { bar } from "./module";
  if (path.node.type === "ExportNamedDeclaration") {
    if (path.node.declaration?.type === "VariableDeclaration") {
      let declaration = path.node.declaration;
      return declaration.declarations.map((declaration) => {
        if (declaration.id.type === "Identifier") {
          return declaration.id.name;
        }

        throw new Error(
          "Exporting of destructured identifiers not yet implemented"
        );
      });
    }

    // export function foo() {}
    if (path.node.declaration?.type === "FunctionDeclaration") {
      let id = path.node.declaration.id;
      invariant(id, "Expected exported function declaration to have a name");
      return [id.name];
    }

    // export class Foo() {}
    if (path.node.declaration?.type === "ClassDeclaration") {
      let id = path.node.declaration.id;
      invariant(id, "Expected exported class declaration to have a name");
      return [id.name];
    }
  }

  return [];
}

function areSetsDisjoint(set1: Set<any>, set2: Set<any>): boolean {
  let smallerSet = set1;
  let largerSet = set2;
  if (set1.size > set2.size) {
    smallerSet = set2;
    largerSet = set1;
  }
  for (let element of smallerSet) {
    if (largerSet.has(element)) {
      return false;
    }
  }
  return true;
}

export function hasChunkableExport(
  topLevelStatementsByExportName: Map<string, Set<NodePath>>,
  exportName: string
): boolean {
  let topLevelStatements = topLevelStatementsByExportName.get(exportName);

  // Export wasn't found in the file
  if (!topLevelStatements) {
    return false;
  }

  // Export had no identifiers to collect, so it's isolated
  // e.g. export default function () { return "string" }
  if (topLevelStatements.size === 0) {
    return true;
  }

  // Loop through all other exports to see if they have any top level statements
  // in common with the export we're trying to create a chunk for
  for (let [
    currentExportName,
    currentTopLevelStatements,
  ] of topLevelStatementsByExportName) {
    if (currentExportName === exportName) {
      continue;
    }
    // As soon as we find any top level statements in common with another export,
    // we know this export cannot be placed in its own chunk
    if (!areSetsDisjoint(currentTopLevelStatements, topLevelStatements)) {
      return false;
    }
  }

  return true;
}

// TODO: Make this real
export function detectRouteChunks({ code }: { code: string }): {
  hasClientActionChunk: boolean;
  hasClientLoaderChunk: boolean;
  hasRouteChunks: boolean;
} {
  let hasClientActionChunk = code.includes(
    'export { clientAction } from "./clientAction";'
  );
  let hasClientLoaderChunk = code.includes(
    'export { clientLoader } from "./clientLoader";'
  );
  let hasRouteChunks = hasClientActionChunk || hasClientLoaderChunk;

  return {
    hasClientActionChunk,
    hasClientLoaderChunk,
    hasRouteChunks,
  };
}

// TODO: Make this real
export function getRouteChunks({ code }: { code: string }) {
  let { hasClientActionChunk, hasClientLoaderChunk } = detectRouteChunks({
    code,
  });

  return {
    main: code
      .replace('export { clientAction } from "./clientAction";', "")
      .replace('export { clientLoader } from "./clientLoader";', ""),
    clientAction: hasClientActionChunk
      ? `export { clientAction } from "./clientAction";`
      : undefined,
    clientLoader: hasClientLoaderChunk
      ? `export { clientLoader } from "./clientLoader";`
      : undefined,
  };
}
