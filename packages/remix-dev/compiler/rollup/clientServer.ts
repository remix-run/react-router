import type { Plugin } from "rollup";

import { BuildTarget } from "../../build";
import empty from "./empty";

/**
 * All file extensions we support for JavaScript modules.
 */
const moduleExts = [".md", ".mdx", ".js", ".jsx", ".ts", ".tsx"];

function isClientOnlyModuleId(id: string): boolean {
  return moduleExts.some(ext => id.endsWith(`.client${ext}`));
}

function isServerOnlyModuleId(id: string): boolean {
  return moduleExts.some(ext => id.endsWith(`.server${ext}`));
}

/**
 * Rollup plugin that excludes `*.client.js` files from the server build and
 * `*.server.js` files from the browser build.
 */
export default function clientServerPlugin({
  target
}: {
  target: string;
}): Plugin {
  return empty({
    isEmptyModuleId(id) {
      if (/\bnode_modules\b/.test(id)) return false;

      return (
        (isClientOnlyModuleId(id) && target === BuildTarget.Server) ||
        (isServerOnlyModuleId(id) && target === BuildTarget.Browser)
      );
    }
  });
}
