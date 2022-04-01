import type { Transform } from "jscodeshift";

import { getNewImportDeclarations } from "./get-new-import-declarations";
import { getRemixImports } from "./get-remix-imports";
import type { MapNormalizedImportsArgs } from "./map-normalized-imports";
import { mapNormalizedImports } from "./map-normalized-imports";
import { normalizeImports } from "./normalize-imports";

export { adapters, runtimes } from "./map-normalized-imports/package-exports";

export type ExtraOptions = Pick<
  MapNormalizedImportsArgs,
  "adapter" | "client" | "runtime"
>;
const transform: Transform = (file, api, options) => {
  let j = api.jscodeshift;
  let root = j(file.source);

  let remixImports = getRemixImports(j, root);
  if (remixImports.length === 0) {
    // This transform doesn't need to run if there are no `remix` imports
    return null;
  }

  // https://github.com/facebook/jscodeshift/blob/main/recipes/retain-first-comment.md
  let getFirstNode = () => root.find(j.Program).get("body", 0).node;
  let oldFirstNode = getFirstNode();

  let normalizedImports = normalizeImports(remixImports);
  let mappedNormalizedImports = mapNormalizedImports({
    adapter: options.adapter,
    client: options.client,
    normalizedImports,
    runtime: options.runtime,
  });
  let newImportDeclarations = getNewImportDeclarations(
    j,
    mappedNormalizedImports
  );

  let firstRemixImport = remixImports.at(0);
  newImportDeclarations.forEach((newImportDeclaration) => {
    firstRemixImport.insertBefore(newImportDeclaration);
  });

  remixImports.forEach((oldRemixImport) => {
    j(oldRemixImport).remove();
  });

  // If the first node has been modified or deleted, reattach the comments
  let newFirstNode = getFirstNode();
  if (newFirstNode !== oldFirstNode) {
    newFirstNode.comments = oldFirstNode.comments;
  }

  return root.toSource(options);
};
export default transform;
