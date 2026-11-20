import { SourceMap, type SourceMapPayload } from "node:module";
import type * as Vite from "vite";
import MagicString from "magic-string";
import { parseRouteSource, traverse, t, type Babel } from "../babel";

function restoreJsxSourceLocations(
  ast: Babel.File,
  map: SourceMapPayload,
  output: MagicString,
) {
  const sourceMap = new SourceMap(map);
  traverse(ast, {
    CallExpression(path) {
      const { callee, arguments: args, loc } = path.node;
      if (!loc || !t.isObjectExpression(args[4])) return;
      const binding = t.isIdentifier(callee)
        ? path.scope.getBinding(callee.name)
        : t.isMemberExpression(callee) &&
            t.isIdentifier(callee.object) &&
            t.isIdentifier(callee.property, { name: "jsxDEV" })
          ? path.scope.getBinding(callee.object.name)
          : undefined;
      if (
        !binding ||
        !binding.path.parentPath?.isImportDeclaration() ||
        !binding.path.parentPath.node.source.value.includes("jsx-dev-runtime")
      )
        return;
      if (
        binding.path.isImportSpecifier() &&
        !t.isIdentifier(binding.path.node.imported, { name: "jsxDEV" })
      )
        return;
      if (
        !binding.path.isImportSpecifier() &&
        !binding.path.isImportNamespaceSpecifier()
      )
        return;
      const entry = sourceMap.findEntry(loc.start.line - 1, loc.start.column);
      if (!("originalLine" in entry)) return;
      for (const property of args[4].properties) {
        if (
          !t.isObjectProperty(property) ||
          !t.isIdentifier(property.key) ||
          !t.isNumericLiteral(property.value)
        )
          continue;
        const value =
          property.key.name === "lineNumber"
            ? entry.originalLine + 1
            : property.key.name === "columnNumber"
              ? entry.originalColumn + 1
              : undefined;
        if (
          value !== undefined &&
          property.value.start != null &&
          property.value.end != null
        )
          output.overwrite(
            property.value.start,
            property.value.end,
            String(value),
          );
      }
    },
  });
}

/** Preserve JSX development locations after route and React transforms. */
export function routeSourceMapsPlugin({
  isEnabled,
  isRoute,
}: {
  isEnabled: () => boolean;
  isRoute: (id: string) => boolean;
}): Vite.Plugin {
  return {
    name: "react-router:route-source-maps",
    enforce: "post",
    transform(code, id) {
      if (!isEnabled() || !isRoute(id) || !code.includes("jsxDEV")) return;
      const output = new MagicString(code);
      const map = this.getCombinedSourcemap();
      // Recover original JSX positions through the composed map, including
      // Babel refresh/Compiler formatting, without regenerating the module.
      restoreJsxSourceLocations(
        parseRouteSource(code, id),
        {
          ...map,
          sourceRoot: "",
          sourcesContent: map.sourcesContent ?? [],
        },
        output,
      );
      return {
        code: output.toString(),
        map: output.generateMap({
          hires: true,
          source: id,
          includeContent: true,
        }),
      };
    },
  };
}
