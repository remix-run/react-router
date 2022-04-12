import type { Collection, ImportDeclaration } from "jscodeshift";

export type NormalizedImport = Pick<ImportDeclaration, "importKind"> & {
  alias: string;
  name: string;
};

export const normalizeImports = (
  allImports: Collection<ImportDeclaration>
): NormalizedImport[] =>
  allImports
    .nodes()
    .flatMap(({ importKind, specifiers }) => {
      if (!specifiers) return [];
      return (
        specifiers
          /**
           * HACK: Can't use casts nor type guards in a `jscodeshift` transform
           * https://github.com/facebook/jscodeshift/issues/467
           *
           * So to narrow specifier type, we use `flatMap` instead.
           * (`filter` can't narrow type without type guards)
           */
          .flatMap((specifier) => {
            return specifier.type === "ImportSpecifier" ? specifier : [];
          })
          .map((specifier) => ({
            ...specifier,
            importKind,
          }))
      );
    })
    .map(({ imported: { name }, importKind, local }) => ({
      alias: local?.name || name,
      importKind,
      name,
    }));
