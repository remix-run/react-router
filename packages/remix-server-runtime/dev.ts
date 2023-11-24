import type { ServerBuild } from "./build";

export async function broadcastDevReady(build: ServerBuild, origin?: string) {
  origin ??= process.env.REMIX_DEV_ORIGIN;
  if (!origin) throw Error("Dev server origin not set");
  let url = new URL(origin);
  url.pathname = "ping";

  let response = await fetch(url.href, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ buildHash: build.assets.version }),
  }).catch((error) => {
    console.error(`Could not reach Remix dev server at ${url}`);
    throw error;
  });
  if (!response.ok) {
    console.error(
      `Could not reach Remix dev server at ${url} (${response.status})`
    );
    throw Error(await response.text());
  }
}

export function logDevReady(build: ServerBuild) {
  console.log(`[REMIX DEV] ${build.assets.version} ready`);
}

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
