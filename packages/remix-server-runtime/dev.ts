import type { ServerBuild } from "./build";

type DevServerHooks = {
  getCriticalCss?: (
    build: ServerBuild,
    pathname: string
  ) => Promise<string | undefined>;
  processRequestError?: (error: unknown) => void;
};

const globalDevServerHooksKey = "__remix_devServerHooks";

export function setDevServerHooks(devServerHooks: DevServerHooks) {
  // @ts-expect-error
  globalThis[globalDevServerHooksKey] = devServerHooks;
}

export function getDevServerHooks(): DevServerHooks | undefined {
  // @ts-expect-error
  return globalThis[globalDevServerHooksKey];
}
