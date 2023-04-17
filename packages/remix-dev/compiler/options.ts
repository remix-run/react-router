import type * as esbuild from "esbuild";

type Mode = "development" | "production" | "test";

export type Options = {
  mode: Mode;
  liveReloadPort?: number;
  sourcemap: boolean;
  onWarning?: (message: string, key: string) => void;
  onCompileFailure?: (failure: Error | esbuild.BuildFailure) => void;
};
