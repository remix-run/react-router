// Runtimes
export const runtimes = ["cloudflare", "node"] as const;
export type Runtime = typeof runtimes[number];
export const isRuntime = (maybe: string): maybe is Runtime =>
  (runtimes as readonly string[]).includes(maybe);

// Adapters
const adapters = [
  "architect",
  "cloudflare-pages",
  "cloudflare-workers",
  "express",
  "netlify",
  "vercel",
] as const;
export type Adapter = typeof adapters[number];
export const isAdapter = (maybe: string): maybe is Adapter =>
  (adapters as readonly string[]).includes(maybe);

// Renderers
const renderers = ["react"] as const;
export type Renderer = typeof renderers[number];

export type RemixPackage =
  | "remix"
  | `@remix-run/${Runtime | Adapter | Renderer}`;
export const isRemixPackage = (pkgName: string): pkgName is RemixPackage => {
  return pkgName === "remix" || pkgName.startsWith("@remix-run/");
};
