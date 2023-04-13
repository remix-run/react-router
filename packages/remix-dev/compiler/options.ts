import type * as esbuild from "esbuild";

type Mode = "development" | "production" | "test";

type Target =
  | "browser" // TODO: remove
  | "server" // TODO: remove
  | "cloudflare-workers"
  | "node14";

export type Options = {
  mode: Mode;
  liveReloadPort?: number;
  target: Target;
  sourcemap: boolean;
  onWarning?: (message: string, key: string) => void;
  onCompileFailure?: (failure: Error | esbuild.BuildFailure) => void;
};
