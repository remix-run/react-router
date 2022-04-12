/**
 * `jscodeshift` doesn't support Typescript casting, nor typeguards.
 * https://github.com/facebook/jscodeshift/issues/467
 *
 * Do not import from this file for the `jscodeshift` transform.
 */
export const runtimes = ["cloudflare", "node"] as const;
export type Runtime = typeof runtimes[number];
export const isRuntime = (maybe: string): maybe is Runtime => {
  return (runtimes as readonly string[]).includes(maybe);
};
