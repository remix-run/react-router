/**
 * `jscodeshift` doesn't support Typescript casting, nor typeguards.
 * https://github.com/facebook/jscodeshift/issues/467
 *
 * Do not import from this file for the `jscodeshift` transform.
 */
const adapters = [
  "architect",
  "cloudflare-pages",
  "cloudflare-workers",
  "express",
  "netlify",
  "vercel",
] as const;
export type Adapter = typeof adapters[number];
export const isAdapter = (maybe: string): maybe is Adapter => {
  return (adapters as readonly string[]).includes(maybe);
};
