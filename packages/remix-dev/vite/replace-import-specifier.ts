import { parse, traverse, generate } from "./babel";

export const replaceImportSpecifier = ({
  code,
  specifier,
  replaceWith,
}: {
  code: string;
  specifier: string;
  replaceWith: string;
}) => {
  let ast = parse(code, { sourceType: "module" });

  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === specifier) {
        path.node.source.value = replaceWith;
      }
    },
  });

  return {
    code: generate(ast, { retainLines: true }).code,
    map: null,
  };
};
