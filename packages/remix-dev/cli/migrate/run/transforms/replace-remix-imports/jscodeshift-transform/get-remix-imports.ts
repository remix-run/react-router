import type { Collection, ImportDeclaration, JSCodeshift } from "jscodeshift";
import { fromNodes } from "jscodeshift/src/Collection";

const checkNoImpossibleImports = (
  j: JSCodeshift,
  allImports: Collection<ImportDeclaration>
) => {
  let defaultImports = allImports.find(j.ImportDefaultSpecifier);
  if (defaultImports.length > 0) {
    throw Error(
      "There shouldn't be any default imports for `remix`. Please remove the default imports and try again."
    );
  }

  let sideEffectImports = allImports.filter(
    ({ node: { specifiers } }) => !specifiers || specifiers.length === 0
  );
  if (sideEffectImports.length > 0) {
    throw Error(
      "There shouldn't be any side-effect imports for `remix`. Please remove the side-effect imports and try again."
    );
  }
};

const checkNoInvalidImports = (
  j: JSCodeshift,
  allImports: Collection<ImportDeclaration>
) => {
  let namespaceImports = allImports.find(j.ImportNamespaceSpecifier);
  if (namespaceImports.length > 0) {
    throw Error(
      "There shouldn't be any namespace imports for `remix`. Please replace the namespace imports with named imports and try again."
    );
  }
};

export const getRemixImports = (j: JSCodeshift, root: Collection) => {
  let allRemixImports = root.find(j.ImportDeclaration, {
    source: { value: "remix" },
  });

  if (allRemixImports.length === 0) {
    return fromNodes([]) as Collection<ImportDeclaration>;
  }

  checkNoImpossibleImports(j, allRemixImports);
  checkNoInvalidImports(j, allRemixImports);

  return allRemixImports;
};
