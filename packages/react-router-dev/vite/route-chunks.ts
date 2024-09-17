import type { GeneratorOptions, GeneratorResult } from "@babel/generator";
import invariant from "../invariant";
import { type Cache, getOrSetFromCache } from "./cache";
import {
  type Babel,
  type NodePath,
  parse,
  traverse,
  generate,
  t,
} from "./babel";

type Statement = Babel.Statement;
type Identifier = Babel.Identifier;

type ExportDependencies = Map<string, Dependencies>;

type Dependencies = {
  topLevelStatements: Set<Statement>;
  topLevelNonImportStatements: Set<Statement>;
  importedIdentifierNames: Set<string>;
};

function codeToAst(code: string, cache: Cache, cacheKey: string): Babel.File {
  // We use structuredClone to allow AST mutation without modifying the cache.
  return structuredClone(
    getOrSetFromCache(cache, `${cacheKey}::codeToAst`, code, () =>
      parse(code, { sourceType: "module" })
    )
  );
}

function getExportDependencies(
  code: string,
  cache: Cache,
  cacheKey: string
): ExportDependencies {
  return getOrSetFromCache(
    cache,
    `${cacheKey}::getExportDependencies`,
    code,
    () => {
      let exportDependencies: ExportDependencies = new Map();
      let ast = codeToAst(code, cache, cacheKey);

      traverse(ast, {
        ExportDeclaration(exportPath) {
          let identifiers = getDependentIdentifiersForPath(exportPath);

          let topLevelStatements = new Set([
            exportPath.node,
            ...getTopLevelStatementsForPaths(identifiers),
          ]);

          // We also keep track of non-import statements since import statements
          // get more fine-grained filtering, meaning that we often need to
          // exclude import statements in our chunking logic.
          let topLevelNonImportStatements = new Set(
            Array.from(topLevelStatements).filter(
              (statement) => !t.isImportDeclaration(statement)
            )
          );

          // We keep track of imported identifiers for each export since we
          // perform more fine-grained filtering on import statements.
          let importedIdentifierNames = new Set<string>();
          for (let identifier of identifiers) {
            if (identifier.parentPath.parentPath?.isImportDeclaration()) {
              importedIdentifierNames.add(identifier.node.name);
            }
          }

          let dependencies: Dependencies = {
            topLevelStatements,
            topLevelNonImportStatements,
            importedIdentifierNames,
          };

          // Since a single statement can have multiple exports, we need to set
          // the same dependencies for each export name. There's room for
          // optimization since we could handle each export name separately,
          // similarly to how we handle imported identifiers, but this case is
          // much less common for our use case of route module exports.
          for (let exportName of getExportNames(exportPath)) {
            exportDependencies.set(exportName, dependencies);
          }
        },
      });

      return exportDependencies;
    }
  );
}

function getDependentIdentifiersForPath(
  path: NodePath,
  state?: { visited: Set<NodePath>; identifiers: Set<NodePath<Identifier>> }
): Set<NodePath<Identifier>> {
  let { visited, identifiers } = state ?? {
    visited: new Set(),
    identifiers: new Set(),
  };

  visited.add(path);

  // Recursively traverse the AST to find all identifiers the path depends on.
  path.traverse({
    Identifier(path) {
      identifiers.add(path);
      let binding = path.scope.getBinding(path.node.name);
      if (binding?.path && !visited.has(binding.path)) {
        getDependentIdentifiersForPath(binding.path, { visited, identifiers });
      }
    },
  });

  return identifiers;
}

function getTopLevelStatementsForPaths(paths: Set<NodePath>): Set<Statement> {
  let topLevelStatements = new Set<Statement>();

  for (let path of paths) {
    let ancestry = path.getAncestry();

    // The last node is the Program node so we want the ancestor before that.
    let topLevelStatement = ancestry[ancestry.length - 2].node;

    invariant(
      t.isStatement(topLevelStatement),
      `Expected statement, found type "${topLevelStatement.type}"`
    );

    topLevelStatements.add(topLevelStatement);
  }

  return topLevelStatements;
}

function getExportNames(path: NodePath<Babel.ExportDeclaration>): string[] {
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
  // To optimize the check, we always iterate over the smaller set.
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
  code: string,
  exportName: string,
  cache: Cache,
  cacheKey: string
): boolean {
  return getOrSetFromCache(
    cache,
    `${cacheKey}::hasChunkableExport::${exportName}`,
    code,
    () => {
      let exportDependencies = getExportDependencies(code, cache, cacheKey);
      let dependencies = exportDependencies.get(exportName);

      // If there are no dependencies, the export wasn't found in the file.
      if (!dependencies) {
        return false;
      }

      invariant(
        dependencies.topLevelStatements.size > 0,
        `Expected export "${exportName}" to have top level statements if the set exists`
      );

      // Export had no identifiers to collect, so it's chunkable, e.g. export
      // default function () { return "string" }. Note that we check the size is
      // 1 here because the export statement itself is included in the set
      if (dependencies.topLevelStatements.size === 1) {
        return true;
      }

      // Loop through all other exports to see if they have top level non-import
      // statements in common with the export we're trying to chunk.
      for (let [currentExportName, currentDependencies] of exportDependencies) {
        if (currentExportName === exportName) {
          continue;
        }

        // As soon as we find any top level non-import statements in common with
        // another export, we know this export cannot be placed in its own
        // chunk. The reason import statements aren't factored into this check
        // is because we perform more fine-grained optimizations on them,
        // filtering out all unused imports within each chunk, meaning that it's
        // okay for multiple exports to share an import statement. We perform a
        // deeper check on imported identifiers in the step after this.
        if (
          !areSetsDisjoint(
            currentDependencies.topLevelNonImportStatements,
            dependencies.topLevelNonImportStatements
          )
        ) {
          return false;
        }
      }

      // Loop through all other exports to see if they have imported identifiers
      // in common with the export we're trying to chunk.
      if (dependencies.importedIdentifierNames.size > 0) {
        for (let [
          currentExportName,
          currentDependencies,
        ] of exportDependencies) {
          if (currentExportName === exportName) {
            continue;
          }

          // As soon as we find any imported identifiers in common with another
          // export, we know this export cannot be placed in its own chunk. Note
          // that the chunk can still share top level import statements with
          // other exports because we filter out all unused imports, so we can
          // treat each imported identifier as a separate entity in this check.
          if (
            !areSetsDisjoint(
              currentDependencies.importedIdentifierNames,
              dependencies.importedIdentifierNames
            )
          ) {
            return false;
          }
        }
      }

      return true;
    }
  );
}

export function getChunkedExport(
  code: string,
  exportName: string,
  generateOptions: GeneratorOptions = {},
  cache: Cache,
  cacheKey: string
): GeneratorResult | undefined {
  return getOrSetFromCache(
    cache,
    `${cacheKey}::getChunkedExport::${exportName}::${JSON.stringify(
      generateOptions
    )}`,
    code,
    () => {
      // If we already know the export isn't chunkable, we can bail out early.
      if (!hasChunkableExport(code, exportName, cache, cacheKey)) {
        return undefined;
      }

      let exportDependencies = getExportDependencies(code, cache, cacheKey);
      let dependencies = exportDependencies.get(exportName);
      invariant(dependencies, "Expected export to have dependencies");

      let topLevelStatementsArray = Array.from(dependencies.topLevelStatements);

      let ast = codeToAst(code, cache, cacheKey);

      // Filter the AST body to only include statements that are part of the
      // chunked export's dependencies. Note that since we bailed out early if
      // the export isn't chunkable, we can now simply remove any unused imports
      // and top-level statements.
      ast.program.body = ast.program.body
        .filter((node) =>
          topLevelStatementsArray.some((statement) =>
            t.isNodesEquivalent(node, statement)
          )
        )
        // Remove unused imports
        .map((node) => {
          // If the node isn't an import declaration or if the export doesn't
          // depend on any imported identifiers, we can return the node as-is.
          if (
            !t.isImportDeclaration(node) ||
            dependencies.importedIdentifierNames.size === 0
          ) {
            return node;
          }

          // Filter out unused import specifiers. Note that this handles
          // default imports, named imports, and namespace imports.
          let usedSpecifiers = node.specifiers.filter((specifier) =>
            dependencies.importedIdentifierNames.has(specifier.local.name)
          );

          // Ensure we haven't removed all specifiers. If we have, it means
          // our dependency analysis is incorrect.
          invariant(
            usedSpecifiers.length > 0,
            "Expected import statement to have used specifiers"
          );

          // Return a new import declaration with only the used specifiers.
          return { ...node, specifiers: usedSpecifiers };
        });

      return generate(ast, generateOptions);
    }
  );
}

export function omitChunkedExports(
  code: string,
  exportNames: readonly string[],
  generateOptions: GeneratorOptions = {},
  cache: Cache,
  cacheKey: string
): GeneratorResult | undefined {
  return getOrSetFromCache(
    cache,
    `${cacheKey}::omitChunkedExports::${exportNames.join(
      ","
    )}::${JSON.stringify(generateOptions)}`,
    code,
    () => {
      let exportDependencies = getExportDependencies(code, cache, cacheKey);
      let omittedStatements = new Set<Statement>();

      for (let exportName of exportNames) {
        let dependencies = exportDependencies.get(exportName);

        // If the export is not chunkable then its code will still remain in the
        // main chunk, so we need to keep its top level statements.
        if (
          !dependencies ||
          !hasChunkableExport(code, exportName, cache, cacheKey)
        ) {
          continue;
        }

        // Now that we know the export is chunkable, add all of its top level
        // non-import statements to the set of statements to be omitted from the
        // main chunk. Note that we don't include top level import statements in
        // this step because we perform more fine-grained filtering of import
        // statements below.
        for (let statement of dependencies.topLevelNonImportStatements) {
          omittedStatements.add(statement);
        }
      }

      let ast = codeToAst(code, cache, cacheKey);
      let omittedStatementsArray = Array.from(omittedStatements);

      ast.program.body = ast.program.body
        // Remove top level statements that belong solely to the chunked
        // exports that are being omitted.
        .filter((node) =>
          omittedStatementsArray.every(
            (statement) => !t.isNodesEquivalent(node, statement)
          )
        )
        // Remove unused imports.
        .map((node) => {
          // Skip non import nodes.
          if (!t.isImportDeclaration(node)) {
            return node;
          }

          // Remove import specifiers that are only used by the omitted chunks.
          // This ensures only the necessary imports remain in the main chunk.
          let usedSpecifiers = node.specifiers.filter((specifier) => {
            // Check the imported identifiers that each export depends on to see
            // if it includes the specifier's local name.
            for (let exportName of exportNames) {
              // If the export is not chunkable then its code will still remain
              // in the main chunk, so we need to keep its imports.
              if (!hasChunkableExport(code, exportName, cache, cacheKey)) {
                continue;
              }

              let importedIdentifierNames =
                exportDependencies.get(exportName)?.importedIdentifierNames;

              // If the import specifier's local name is in the set of imported
              // identifiers for the chunked export, we filter it out.
              if (importedIdentifierNames?.has(specifier.local.name)) {
                return false;
              }
            }

            // If we didn't return false, the specifier is not in the set of
            // imported identifiers for any chunked export, so we keep it.
            return true;
          });

          // If the import statement has no specifiers, we omit it entirely by
          // returning null and removing it in the filter step below.
          if (usedSpecifiers.length === 0) {
            return null;
          }

          // Return a new import declaration that only contains the specifiers
          // used in the main chunk.
          return { ...node, specifiers: usedSpecifiers };
        })
        // Filter out import statements that were entirely omitted above.
        .filter((node): node is Statement => node !== null);

      if (ast.program.body.length === 0) {
        return undefined;
      }

      return generate(ast, generateOptions);
    }
  );
}

export function detectRouteChunks(
  code: string,
  cache: Cache,
  cacheKey: string
): {
  hasClientActionChunk: boolean;
  hasClientLoaderChunk: boolean;
  hasRouteChunks: boolean;
} {
  let hasClientActionChunk = hasChunkableExport(
    code,
    "clientAction",
    cache,
    cacheKey
  );
  let hasClientLoaderChunk = hasChunkableExport(
    code,
    "clientLoader",
    cache,
    cacheKey
  );
  let hasRouteChunks = hasClientActionChunk || hasClientLoaderChunk;

  return {
    hasClientActionChunk,
    hasClientLoaderChunk,
    hasRouteChunks,
  };
}

const mainChunkName = "main" as const;
const chunkedExportNames = ["clientAction", "clientLoader"] as const;
export type RouteChunkName =
  | typeof mainChunkName
  | (typeof chunkedExportNames)[number];

export function isRouteChunkName(name: string): name is RouteChunkName {
  return name === mainChunkName || chunkedExportNames.includes(name as any);
}

export function getRouteChunk(
  code: string,
  chunkName: RouteChunkName,
  cache: Cache,
  cacheKey: string
): GeneratorResult | undefined {
  if (chunkName === mainChunkName) {
    return omitChunkedExports(code, chunkedExportNames, {}, cache, cacheKey);
  }

  return getChunkedExport(code, chunkName, {}, cache, cacheKey);
}
