import type { JSCodeshift } from "jscodeshift";

import type { MappedNormalizedImports } from "./mapNormalizedImports";
import type { NormalizedImport } from "./normalizeImports";

const orgName = "@remix-run";

type GetImportDeclarationForImportKindArgs = {
  importKind: "type" | "value";
  imports: NormalizedImport[];
  j: JSCodeshift;
  packageName: string;
};
const getImportDeclarationForImportKind = ({
  importKind,
  imports,
  j,
  packageName,
}: GetImportDeclarationForImportKindArgs) => {
  let importsForKind = imports.filter(
    (imprt) => imprt.importKind === importKind
  );

  if (importsForKind.length === 0) {
    return null;
  }

  return j.importDeclaration(
    importsForKind
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ alias, name }) =>
        j.importSpecifier(j.identifier(name), j.identifier(alias))
      ),
    j.stringLiteral(
      packageName === "remix" ? packageName : `${orgName}/${packageName}`
    ),
    importKind
  );
};

export const getNewImportDeclarations = (
  j: JSCodeshift,
  mappedNormalizedImports: MappedNormalizedImports
) =>
  Object.entries(mappedNormalizedImports)
    .sort(([packageAName], [packageBName]) =>
      packageAName.localeCompare(packageBName)
    )
    .flatMap(([packageName, imports]) => [
      getImportDeclarationForImportKind({
        importKind: "type",
        imports,
        j,
        packageName,
      }),
      getImportDeclarationForImportKind({
        importKind: "value",
        imports,
        j,
        packageName,
      }),
    ]);
