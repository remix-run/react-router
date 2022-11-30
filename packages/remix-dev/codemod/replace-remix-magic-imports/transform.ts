import { type NodePath } from "@babel/core";
import * as t from "@babel/types";
import _ from "lodash";

import createTransform from "../createTransform";
import type { BabelPlugin } from "../utils/babel";
import { CodemodError } from "../utils/error";
import {
  type Export,
  getAdapterExports,
  getRendererExports,
  getRuntimeExports,
} from "./utils/export";
import {
  isRemixPackage,
  type Adapter,
  type RemixPackage,
  type Runtime,
} from "./utils/remix";

type Options = {
  runtime: Runtime;
  adapter?: Adapter;
};

type ExistingExport<Source extends string> = Export<Source> & {
  // include declaration path for contextual error messages
  _declaration: NodePath<t.ImportDeclaration>;
};

const createRemixMagicImportReplacer = ({ runtime, adapter }: Options) => {
  let remixExports = [
    ...getRuntimeExports(runtime),
    ...(adapter ? getAdapterExports(adapter) : []),
    ...getRendererExports("react"),
  ];

  let _key = ({ kind, name }: Omit<Export, "source" | "alias">) =>
    `kind:${kind},name:${name}`;

  let remixImportReplacements = new Map<
    string,
    { source: Exclude<RemixPackage, "remix">; name: string }
  >(
    remixExports.map(({ source, kind, name }) => [
      _key({ kind, name }),
      { source, name },
    ])
  );
  return (key: Omit<Export, "source" | "alias">) =>
    remixImportReplacements.get(_key(key));
};

// NOTE: `import { type blah } from "blah"` syntax introduced in TS 4.5
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html#type-modifiers-on-import-names
// which we started using in feb 18 2022
// https://github.com/remix-run/remix/pull/2028/files#diff-c4027b59d017e68accdc8974b21bd70721924836b18284a05b5a4944cf463c6fL16
// starting with v1.2.2
// https://github.com/remix-run/remix/blob/v1.2.2/package.json#L102
// which was release on February 21, 2022

const findRemixImportDeclarations = (
  program: NodePath<t.Program>
): NodePath<t.ImportDeclaration>[] => {
  let found: NodePath<t.ImportDeclaration>[] = [];
  program.traverse({
    ImportDeclaration: (path) => {
      let source = path.node.source.value;
      if (!isRemixPackage(source)) {
        return;
      }
      found.push(path);
    },
  });
  return found;
};

const flattenRemixImportDeclarations = (
  remixImportDeclarations: NodePath<t.ImportDeclaration>[]
): ExistingExport<RemixPackage>[] => {
  let flattened: ExistingExport<RemixPackage>[] = [];
  remixImportDeclarations.forEach((declaration) => {
    let { source, specifiers } = declaration.node;
    // Side-effect imports like `import "remix"` not produced flattened specifiers
    // so they will not contribute to the new Remix import declarations
    specifiers.forEach((specifier) => {
      if (t.isImportDefaultSpecifier(specifier)) {
        throw declaration.buildCodeFrameError(
          "This codemod does not support default imports for the `remix` package.\n" +
            "Replace the default import with named imports and try again."
        );
      }
      if (t.isImportNamespaceSpecifier(specifier)) {
        throw declaration.buildCodeFrameError(
          "This codemod does not support namespace imports for the `remix` package.\n" +
            "Replace the namespace import with named imports and try again."
        );
      }
      let { imported, local, importKind } = specifier;

      let kind =
        importKind === "type" || declaration.node.importKind === "type"
          ? ("type" as const)
          : importKind ?? declaration.node.importKind ?? "value";

      let name = t.isStringLiteral(imported) ? imported.value : imported.name;

      flattened.push({
        source: source.value as RemixPackage,
        kind,
        name,
        alias: local.name === name ? undefined : local.name,
        _declaration: declaration,
      });
    });
  });
  return flattened;
};

const convertToNewRemixImports = (
  currentRemixImports: ExistingExport<RemixPackage>[],
  options: Options
): Export<Exclude<RemixPackage, "remix">>[] => {
  let replaceRemixMagicImport = createRemixMagicImportReplacer(options);
  return currentRemixImports.map((currentRemixImport) => {
    if (currentRemixImport.source !== "remix") {
      return currentRemixImport as Export<Exclude<RemixPackage, "remix">>;
    }

    let newRemixImport = replaceRemixMagicImport({
      kind: currentRemixImport.kind,
      name: currentRemixImport.name,
    });
    if (newRemixImport === undefined) {
      throw currentRemixImport._declaration.buildCodeFrameError(
        `Unrecognized import from 'remix': ` +
          `${currentRemixImport.kind === "type" ? "type " : ""}${
            currentRemixImport.name
          }`
      );
    }
    return {
      source: newRemixImport.source,
      kind: currentRemixImport.kind,
      name: newRemixImport.name,
      alias: currentRemixImport.alias,
    };
  });
};

const groupImportsBySource = <Source extends string = string>(
  imports: Export<Source>[]
) => {
  let grouped = new Map<Source, Export<Source>[]>();
  imports.forEach((imp) => {
    let current = grouped.get(imp.source) ?? [];
    grouped.set(imp.source, [...current, imp]);
  });
  return grouped;
};

const plugin =
  (options: Options): BabelPlugin =>
  (babel) => {
    let { types: t } = babel;
    return {
      visitor: {
        Program(program) {
          // find current Remix import declarations
          let currentRemixImportDeclarations =
            findRemixImportDeclarations(program);

          // check for magic `from "remix"` imports
          let magicRemixImports = currentRemixImportDeclarations.filter(
            (path) => path.node.source.value === "remix"
          );
          if (magicRemixImports.length === 0) return;

          // flatten current Remix import declarations to specifiers
          let currentRemixImports = flattenRemixImportDeclarations(
            currentRemixImportDeclarations
          );

          // convert current remix imports to new imports
          let newRemixImports = convertToNewRemixImports(
            currentRemixImports,
            options
          );

          // group new imports by source
          let newRemixImportsBySource: [string, Export[]][] = Array.from(
            groupImportsBySource(newRemixImports)
          );

          // create new import declarations
          let newRemixImportDeclarations = _.sortBy(
            newRemixImportsBySource,
            ([source]) => source
          ).map(([source, specifiers]) => {
            return t.importDeclaration(
              _.sortBy(specifiers, ["kind", "name"]).map((spec) => {
                if (spec.source !== source)
                  throw new CodemodError(
                    `Specifier source '${spec.source}' does not match declaration source '${source}'`
                  );
                return {
                  type: "ImportSpecifier",
                  local: t.identifier(spec.alias ?? spec.name),
                  imported: t.identifier(spec.name),
                  importKind: spec.kind,
                };
              }),
              t.stringLiteral(source)
            );
          });

          // add new remix import declarations
          currentRemixImportDeclarations[0].insertAfter(
            newRemixImportDeclarations
          );

          // remove old remix import declarations
          currentRemixImportDeclarations.forEach((decl) => decl.remove());
        },
      },
    };
  };

export default (options: Options) => createTransform(plugin(options));
