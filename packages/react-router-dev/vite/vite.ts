// This file serves two purposes. First, it's used to avoid CJS deprecation
// warnings in Vite since `@react-router/dev` currently compiles to CJS. We do
// this by dynamically importing Vite, forcing it to use the ESM build. Second,
// it's used to allow us to test against different versions of Vite by ensuring
// that Vite is resolved from the current working directory when running within
// this repo. If we don't do this, Vite will always be imported relative to this
// package, which means that it will always resolve to Vite 6.

import path from "pathe";

import invariant from "../invariant";
import { isReactRouterRepo } from "../config/is-react-router-repo";

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type Vite = typeof import("vite");
let vite: Vite | undefined;

const viteImportSpecifier = !isReactRouterRepo()
  ? "vite"
  : `file:///${path
      .normalize(
        require.resolve("vite/package.json", { paths: [process.cwd()] })
      )
      .replace("package.json", "dist/node/index.js")}`;

export async function preloadVite(): Promise<void> {
  vite = await import(viteImportSpecifier);
}

export function getVite(): Vite {
  invariant(vite, "getVite() called before preloadVite()");
  return vite;
}
