import type { Jsonify } from "./jsonify";
import type { TypedDeferredData, TypedResponse } from "./responses";
import { expectType } from "./typecheck";
import { type Expect, type Equal } from "./typecheck";

// prettier-ignore
/**
 * Infer JSON serialized data type returned by a loader or action.
 *
 * For example:
 * `type LoaderData = SerializeFrom<typeof loader>`
 */
export type SerializeFrom<T> =
  T extends (...args: any[]) => infer Output ? Serialize<Awaited<Output>> :
  // Back compat: manually defined data type, not inferred from loader nor action
  Jsonify<Awaited<T>>
;

// note: cannot be inlined as logic requires union distribution
// prettier-ignore
type Serialize<Output> =
  Output extends TypedDeferredData<infer U> ?
    // top-level promises
    & {
      [K in keyof U as
        K extends symbol ? never :
        Promise<any> extends U[K] ? K :
        never
      ]: DeferValue<U[K]>; // use generic to distribute over union
    }
    // non-promises
    & Jsonify<{
      [K in keyof U as
        Promise<any> extends U[K] ? never :
        K
      ]: U[K];
    }>
  :
  Output extends TypedResponse<infer U> ? Jsonify<U> :
  Jsonify<Output>;

// prettier-ignore
type DeferValue<T> =
  T extends undefined ? undefined :
  T extends Promise<unknown> ? Promise<Jsonify<Awaited<T>>> :
  Jsonify<T>;

// tests ------------------------------------------------------------

type Pretty<T> = { [K in keyof T]: T[K] };

type Loader<T> = () => Promise<
  | TypedResponse<T> // returned responses
  | TypedResponse<never> // thrown responses
>;

type LoaderDefer<T extends Record<keyof unknown, unknown>> = () => Promise<
  | TypedDeferredData<T> // returned responses
  | TypedResponse<never> // thrown responses
>;

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _tests = [
  // back compat: plain object
  Expect<Equal<Pretty<SerializeFrom<{a: string}>>, {a: string}>>,

  // only thrown responses (e.g. redirects)
  Expect<Equal<SerializeFrom<Loader<never>>, never>>,

  // basic loader data
  Expect<Equal<Pretty<SerializeFrom<Loader<{a: string}>>>, {a: string}>>,

  // infer data type from `toJSON`
  Expect<Equal<Pretty<SerializeFrom<Loader<{a: Date}>>>, {a: string}>>,

  // regression test for specific field names
  Expect<Equal<Pretty<SerializeFrom<Loader<{a: string, name: number, data: boolean}>>>, {a: string, name: number, data: boolean}>>,

  // defer top-level promises
  Expect<SerializeFrom<LoaderDefer<{ a: string; lazy: Promise<{ b: number }>}>> extends {a: string, lazy: Promise<{ b: number }>} ? true : false>
];

// recursive
type Recursive = { a: string; recur?: Recursive };
declare const recursive: SerializeFrom<Loader<Recursive>>;
expectType<{ a: string; recur?: Jsonify<Recursive> }>(
  recursive.recur!.recur!.recur!
);
