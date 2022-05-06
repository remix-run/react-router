/**
 * `jscodeshift` doesn't support Typescript casting, nor typeguards.
 * https://github.com/facebook/jscodeshift/issues/467
 *
 * Do not import from this file for the `jscodeshift` transform.
 */
import type { Adapter } from "./adapter";
import type { Runtime } from "./runtime";

export type Options = {
  adapter?: Adapter;
  runtime: Runtime;
};
