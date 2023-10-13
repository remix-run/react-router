import { parse, traverse, generate, t } from "./babel";

export const transformLegacyCssImports = (source: string) => {
  let ast = parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  traverse(ast, {
    // Handle `import styles from "./styles.css"`
    ImportDeclaration(path) {
      if (
        path.node.source.value.endsWith(".css") &&
        // CSS Modules are bundled in the Remix compiler so they're already
        // compatible with Vite's default CSS handling
        !path.node.source.value.endsWith(".module.css") &&
        t.isImportDefaultSpecifier(path.node.specifiers[0])
      ) {
        path.node.source.value += "?url";
      }
    },
  });

  return {
    code: generate(ast, { retainLines: true }).code,
    map: null,
  };
};
