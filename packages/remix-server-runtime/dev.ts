import type { ServerBuild } from "./build";

export function broadcastDevReady(build: ServerBuild, origin?: string) {
  origin ??= process.env.REMIX_DEV_HTTP_ORIGIN;
  if (!origin) throw Error("Dev server origin not set");

  fetch(`${origin}/ping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ buildHash: build.assets.version }),
  }).catch((error) => {
    console.error(`Could not reach Remix dev server at ${origin}`);
  });
}

export function logDevReady(build: ServerBuild) {
  console.log(`[REMIX DEV] ${build.assets.version} ready`);
}
