type DevServerHooks = {
  getCriticalCss?: (pathname: string) => Promise<string | undefined>;
  processRequestError?: (error: unknown) => void;
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

// Guarded access to build-time-only headers
export function getBuildTimeHeader(request: Request, headerName: string) {
  if (typeof process !== "undefined") {
    try {
      if (process.env?.IS_RR_BUILD_REQUEST === "yes") {
        return request.headers.get(headerName);
      }
    } catch (e) {}
  }
  return null;
}
