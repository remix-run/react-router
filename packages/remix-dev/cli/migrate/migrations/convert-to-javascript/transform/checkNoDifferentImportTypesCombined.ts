import type { ImportDeclaration } from "jscodeshift";

export const checkNoDifferentImportTypesCombined = ({
  source,
  specifiers,
}: ImportDeclaration) => {
  let specifierTypes = (specifiers || []).map(({ type }) => type);

  if (
    specifierTypes.filter((type) => type === specifierTypes[0]).length !==
    specifierTypes.length
  ) {
    throw Error(
      `You shouldn't use different types of imports together in the same statement for ${source.value}. Please break them into multiple import statements and try again.`
    );
  }
};
