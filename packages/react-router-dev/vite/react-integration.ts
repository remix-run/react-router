import type * as Vite from "vite";
import type { GeneratorOptions, GeneratorResult } from "@babel/generator";

export interface ReactIntegrationOptions {
  isEnabled: () => boolean;
  getCommand: () => Vite.ResolvedConfig["command"];
  getRouteId: (id: string) => string | undefined;
  isRouteVirtualModule: (id: string) => boolean;
  ignoredExports: readonly string[];
}

export interface ReactIntegration {
  readonly external: boolean;
  getExportNames: (code: string, id: string) => string[];
  transformRoute: (
    code: string,
    id: string,
    options: { exportsToRemove?: string[]; skipComponentProps?: boolean },
  ) => GeneratorResult;
  chunkGeneratorOptions?: GeneratorOptions;
  plugins: Vite.Plugin[];
}

/** Vite fixes enforce before loading framework config. Register both positions,
 * then run only the selected integration after configuration has completed. */
function routeTransformPlugins(
  plugin: Vite.Plugin,
  getIntegration: () => ReactIntegration | undefined,
): Vite.Plugin[] {
  const handler =
    typeof plugin.transform === "function"
      ? plugin.transform
      : plugin.transform?.handler;
  return [true, false].map<Vite.Plugin>((external) => ({
    ...plugin,
    name: external ? `${plugin.name}:external` : plugin.name,
    enforce: external ? "pre" : undefined,
    transform(...args) {
      if (getIntegration()?.external === external)
        return handler?.apply(this, args);
    },
  }));
}

/** Select the early or normal route transforms without changing Vite's fixed plugin order. */
export function withRouteTransformOrder(
  plugins: Vite.Plugin[],
  getIntegration: () => ReactIntegration | undefined,
): Vite.Plugin[] {
  const routeTransforms = new Set([
    "react-router:route-chunks-index",
    "react-router:build-client-route",
    "react-router:split-route-modules",
    "react-router:route-exports",
  ]);
  return plugins.flatMap((plugin) =>
    routeTransforms.has(plugin.name)
      ? routeTransformPlugins(plugin, getIntegration)
      : plugin,
  );
}
