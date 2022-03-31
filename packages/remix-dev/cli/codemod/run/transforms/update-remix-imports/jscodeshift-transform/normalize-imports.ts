import type {
  Collection,
  ImportDeclaration,
  ImportSpecifier,
} from "jscodeshift";

export type NormalizedImport = Pick<ImportDeclaration, "importKind"> & {
  alias: string;
  name: string;
};

export const normalizeImports = (
  allImports: Collection<ImportDeclaration>
): NormalizedImport[] =>
  allImports
    .nodes()
    .flatMap(
      ({ importKind, specifiers }) =>
        specifiers!.map((specifier) => ({
          ...specifier,
          importKind,
        })) as Array<ImportSpecifier & Pick<ImportDeclaration, "importKind">>
    )
    .map(({ imported: { name }, importKind, local }) => ({
      alias: local?.name || name,
      importKind,
      name,
    }));
