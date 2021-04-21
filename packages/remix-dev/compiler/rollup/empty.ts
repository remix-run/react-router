import type { Plugin } from "rollup";

/**
 * Rollup plugin that uses an empty shim for any module id that is considered
 * "empty" according to the given `isEmptyModuleId` test function.
 */
export default function emptyPlugin({
  isEmptyModuleId
}: {
  isEmptyModuleId: (id: string) => boolean;
}): Plugin {
  return {
    name: "empty",

    load(id) {
      if (!isEmptyModuleId(id)) return null;

      return {
        code: "export default {}",
        syntheticNamedExports: true
      };
    }
  };
}
