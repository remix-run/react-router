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
          let warningMessage =
            `WARNING: All \`remix\` exports are considered deprecated as of v1.3.3. ` +
            `Please change your import in "${relativePath}" to come from the respective ` +
            `underlying \`@remix-run/*\` package. ` +
            `Run \`npx @remix-run/dev@latest codemod replace-remix-magic-imports\` ` +
            `to automatically migrate your code.`;
          ctx.options.onWarning?.(warningMessage, importer);
        }
        return undefined;
      });
    },
  };
}
