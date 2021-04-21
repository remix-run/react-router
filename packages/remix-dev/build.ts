export enum BuildMode {
  Development = "development",
  Production = "production"
}

export function isBuildMode(mode: any): mode is BuildMode {
  return mode === BuildMode.Development || mode === BuildMode.Production;
}

export enum BuildTarget {
  Browser = "browser", // TODO: remove
  Server = "server", // TODO: remove
  CloudflareWorkers = "cloudflare-workers",
  Node14 = "node14"
}

export function isBuildTarget(target: any): target is BuildTarget {
  return (
    target === BuildTarget.Browser ||
    target === BuildTarget.Server ||
    target === BuildTarget.Node14
  );
}

export interface BuildOptions {
  mode: BuildMode;
  target: BuildTarget;
}
