import type * as Vite from "vite";
import { createRequire } from "node:module";
import path from "node:path";
import MagicString from "magic-string";
import { generate, getSourceExportNames, parseRouteSource } from "../babel";
import { removeExports } from "../remove-exports";
import { decorateComponentExportsWithProps } from "../with-props-external";
import * as VirtualModule from "../virtual-module";
import type {
  ReactIntegration,
  ReactIntegrationOptions,
} from "../react-integration";
import { routeHmrPlugin } from "./route-hmr";
import { routeSourceMapsPlugin } from "./route-source-maps";

export function isReactPlugin(plugin: Vite.Plugin): boolean {
  return plugin.name === "vite:react-babel";
}

export function externalReactIntegration({
  isEnabled,
  getCommand,
  getRouteId,
  ignoredExports,
  isHmrEnabled,
}: ReactIntegrationOptions & {
  isHmrEnabled: () => boolean;
}): ReactIntegration {
  const defaultsDirectory = path
    .join(
      path.dirname(
        createRequire(import.meta.url).resolve(
          "@react-router/dev/package.json",
        ),
      ),
      "dist/config/defaults",
    )
    .replaceAll("\\", "/");
  return {
    external: true,
    getExportNames: getSourceExportNames,
    chunkGeneratorOptions: {
      retainLines: true,
      ...{ experimental_preserveFormat: true },
    },
    transformRoute(code, id, { exportsToRemove, skipComponentProps }) {
      let ast = parseRouteSource(code, id, { tokens: true });
      if (exportsToRemove) removeExports(ast, exportsToRemove);
      if (!skipComponentProps) decorateComponentExportsWithProps(ast);
      return generate(
        ast,
        {
          sourceMaps: true,
          filename: id,
          sourceFileName: id.split("?")[0],
          retainLines: true,
          ...{ experimental_preserveFormat: true },
        },
        code,
      );
    },
    plugins: [
      {
        name: "react-router:external-default-entries",
        enforce: "pre",
        transform(code, id) {
          if (
            !isEnabled() ||
            path.dirname(id.split("?")[0]).replaceAll("\\", "/") !==
              defaultsDirectory
          )
            return;
          // Default entries also support consumer-configured classic JSX.
          const output = new MagicString(code);
          output.prepend('import * as React from "react";\n');
          return {
            code: output.toString(),
            map: output.generateMap({
              hires: true,
              source: id,
              includeContent: true,
            }),
          };
        },
      },
      {
        name: "react-router:inject-external-hmr-runtime",
        enforce: "pre",
        resolveId(id) {
          if (
            isEnabled() &&
            id === VirtualModule.create("inject-hmr-runtime").id
          )
            return VirtualModule.create("inject-hmr-runtime").resolvedId;
        },
        load(id) {
          if (
            !isEnabled() ||
            id !== VirtualModule.create("inject-hmr-runtime").resolvedId
          )
            return;
          if (!isHmrEnabled()) return "";
          return [
            'import "@vitejs/plugin-react/preamble"',
            `import "${VirtualModule.create("route-hmr").id}"`,
          ].join("\n");
        },
      },
      routeSourceMapsPlugin({
        isEnabled: () => isEnabled() && getCommand() === "serve",
        isRoute: (id) => Boolean(getRouteId(id)),
      }),
      routeHmrPlugin({
        isEnabled: () =>
          isEnabled() && getCommand() === "serve" && isHmrEnabled(),
        getRouteId,
        ignoredExports,
      }),
    ],
  };
}
