import type * as esbuild from "esbuild";

const modes = ["development", "production", "test"] as const;

type Mode = typeof modes[number];

export const parseMode = (raw: string, fallback?: Mode): Mode => {
  if ((modes as readonly string[]).includes(raw)) {
    return raw as Mode;
  }
  if (!fallback) {
    throw Error(`Unrecognized mode: '${raw}'`);
  }
  return fallback;
};

type Target =
  | "browser" // TODO: remove
  | "server" // TODO: remove
  | "cloudflare-workers"
  | "node14";

export type CompileOptions = {
  mode: Mode;
  liveReloadPort?: number;
  target: Target;
  sourcemap: boolean;
  onWarning?: (message: string, key: string) => void;
  onCompileFailure?: (failure: Error | esbuild.BuildFailure) => void;
};
