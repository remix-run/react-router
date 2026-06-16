import { transformSync } from "esbuild";

/**
 * Produce lexer-safe JavaScript from TS/TSX sources when Vite hands plugins
 * raw TypeScript or JSX (for example `experimental.bundledDev`).
 */
export function stripForEsModuleLexer(code: string): string {
  return transformSync(code, {
    loader: "tsx",
    format: "esm",
    target: "esnext",
    platform: "neutral",
    sourcemap: false,
    legalComments: "none",
  }).code;
}
