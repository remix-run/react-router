import type * as Vite from "vite";
import { parseExpression } from "@babel/parser";
import { generate, parseRouteSource } from "../babel";
import { getVite } from "../vite";

/** Lower TypeScript before route analysis, leaving JSX to the React plugin. */
export function routeSourcePlugin({
  isRoute,
  onSource,
}: {
  isRoute: (id: string) => boolean;
  onSource?: (id: string, code: string) => void;
}): Vite.Plugin {
  let config: Vite.ResolvedConfig;
  return {
    name: "react-router:route-source",
    enforce: "pre",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async transform(code, id) {
      let filename = id.split("?")[0];
      if (!isRoute(filename)) return;
      let transformed;
      if (/\.[cm]?tsx?$/.test(filename)) {
        let vite = getVite();
        if (
          "transformWithOxc" in vite &&
          typeof vite.transformWithOxc === "function"
        ) {
          // Apply type-sensitive options before erasing TypeScript, including
          // decorator metadata. Defer JSX and value import elision to Vite.
          let oxc =
            "oxc" in config && typeof config.oxc === "object"
              ? (config.oxc as Record<string, unknown> | null)
              : undefined;
          transformed = await vite.transformWithOxc(code, filename, {
            target: "esnext",
            jsx: "preserve",
            assumptions: oxc?.assumptions,
            typescript: {
              ...(oxc?.typescript as Record<string, unknown> | undefined),
              onlyRemoveTypeImports: true,
            },
            decorator: oxc?.decorator,
            helpers: oxc?.helpers,
            cwd: oxc?.cwd,
          });
        } else {
          let rawOptions =
            config.esbuild === false ? undefined : config.esbuild.tsconfigRaw;
          // The string form also accepts JSON with comments and trailing commas.
          let tsconfigRaw: Exclude<Vite.ESBuildOptions["tsconfigRaw"], string> =
            typeof rawOptions === "string"
              ? JSON.parse(
                  generate(parseExpression(rawOptions), { comments: false })
                    .code,
                )
              : rawOptions;
          // esbuild drops JSX pragmas and implicit factory imports in preserve
          // mode. Keep the pragmas and defer value import elision to Vite's normal
          // transform, where the JSX runtime and factory are known.
          let jsxPragmas = code.includes("@jsx")
            ? parseRouteSource(code, filename)
                .comments?.filter((comment) =>
                  /@jsx(?:\s|Runtime\s|ImportSource\s|Frag\s)/.test(
                    comment.value,
                  ),
                )
                .map((comment) => `/*${comment.value}*/`)
                .join("\n")
            : undefined;
          transformed = await vite.transformWithEsbuild(code, filename, {
            target: "esnext",
            jsx: "preserve",
            banner: jsxPragmas,
            tsconfigRaw: {
              ...tsconfigRaw,
              compilerOptions: {
                ...tsconfigRaw?.compilerOptions,
                verbatimModuleSyntax: true,
              },
            },
          });
        }
      }
      onSource?.(id, transformed?.code ?? code);
      return transformed;
    },
  };
}
