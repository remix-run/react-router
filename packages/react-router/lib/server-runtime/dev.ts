import type { ServerBuild } from "./build";

type DevServerHooks = {
  getCriticalCss?:
    | ((build: ServerBuild, pathname: string) => Promise<string | undefined>)
    | undefined;
  processRequestError?: ((error: unknown) => void) | undefined;
};

const globalDevServerHooksKey = "__reactRouterDevServerHooks";

export function setDevServerHooks(devServerHooks: DevServerHooks) {
  // @ts-expect-error
  globalThis[globalDevServerHooksKey] = devServerHooks;
}

export function getDevServerHooks(): DevServerHooks | undefined {
  // @ts-expect-error
  return globalThis[globalDevServerHooksKey];
}
