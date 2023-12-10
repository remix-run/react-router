import * as babel from "@babel/core";
import eliminator from "babel-plugin-eliminator";
import type { Plugin } from "vite";

export default function remix({
  isRoute,
}: {
  isRoute: (id: string) => boolean;
}): Plugin {
  return {
    name: "remix",
    enforce: "post",
    async transform(code, id, options) {
      const ssr = options?.ssr;

      if (ssr || !isRoute(id)) return code;

      const transformed = await babel.transformAsync(code, {
        filename: id,
        plugins: [[eliminator, { namedExports: ["action", "loader"] }]],
      });

      return transformed?.code || code;
    },
  };
}
