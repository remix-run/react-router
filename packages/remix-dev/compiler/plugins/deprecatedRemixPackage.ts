import path from "path";
import type { Plugin } from "esbuild";

import type { Context } from "../context";

/**
 * A plugin to warn users when importing from the deprecated `remix` package
 */
export function deprecatedRemixPackagePlugin(ctx: Context): Plugin {
  return {
    name: "deprecated-remix-package",
    setup(build) {
      build.onResolve({ filter: /.*/ }, ({ importer, path: filePath }) => {
        // Warn on deprecated imports from the remix package
        if (filePath === "remix") {
          let relativePath = path.relative(process.cwd(), importer);
          ctx.logger.warn(`deprecated \`remix\` import in ${relativePath}`, {
            details: [
              "Imports from the `remix` package were deprecated in v1.3.3.",
              "Change your code to import from the appropriate `@remix-run/*` package instead.",
              "You can run the following codemod to autofix this issue:",
              "-> `npx @remix-run/dev@latest codemod replace-remix-magic-imports`",
            ],
            key: importer,
          });
        }
        return undefined;
      });
    },
  };
}
