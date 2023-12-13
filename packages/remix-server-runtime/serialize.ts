import type { EmptyObject, Jsonify } from "./jsonify";
import type { TypedDeferredData, TypedResponse } from "./responses";
import type {
  ClientActionFunctionArgs,
  ClientLoaderFunctionArgs,
} from "./routeModules";
import { expectType } from "./typecheck";
import { type Expect, type Equal } from "./typecheck";

// prettier-ignore
/**
 * Infer JSON serialized data type returned by a loader or action, while
 * avoiding deserialization if the input type if it's a clientLoader or
 * clientAction that returns a non-Response
 *
 * For example:
 * `type LoaderData = SerializeFrom<typeof loader>`
 */
export type SerializeFrom<T> =
  T extends (...args: any[]) => infer Output ?
    Parameters<T> extends [ClientLoaderFunctionArgs | ClientActionFunctionArgs] ?
      // Client data functions may not serialize
      SerializeClient<Awaited<Output>>
    :
    // Serialize responses
    Serialize<Awaited<Output>>
  :
  // Back compat: manually defined data type, not inferred from loader nor action
  Jsonify<Awaited<T>>
;

// note: cannot be inlined as logic requires union distribution
// prettier-ignore
type SerializeClient<Output> =
  Output extends TypedDeferredData<infer U> ?
    // top-level promises
    & {
        [K in keyof U as K extends symbol
          ? never
          : Promise<any> extends U[K]
          ? K
          : never]: DeferValueClient<U[K]>; // use generic to distribute over union
    }
    // non-promises
    & {
      [K in keyof U as Promise<any> extends U[K] ? never : K]: U[K];
    }
  :
  Output extends TypedResponse<infer U> ? Jsonify<U> :
  Awaited<Output>

// prettier-ignore
type DeferValueClient<T> =
  T extends undefined ? undefined :
  T extends Promise<unknown> ? Promise<Awaited<T>> :
  T;

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

type Loader<T> = () => Promise<TypedResponse<T>>;

type LoaderDefer<T extends Record<keyof unknown, unknown>> = () => Promise<
  TypedDeferredData<T>
>;

type LoaderBoth<
  T1 extends Record<keyof unknown, unknown>,
  T2 extends Record<keyof unknown, unknown>
> = () => Promise<TypedResponse<T1> | TypedDeferredData<T2>>;

type ClientLoaderRaw<T extends Record<keyof unknown, unknown>> = ({
  request,
}: ClientLoaderFunctionArgs) => Promise<T>; // returned non-Response

type ClientLoaderResponse<T extends Record<keyof unknown, unknown>> = ({
  request,
}: ClientLoaderFunctionArgs) => Promise<TypedResponse<T>>; // returned responses

type ClientLoaderDefer<T extends Record<keyof unknown, unknown>> = ({
  request,
}: ClientLoaderFunctionArgs) => Promise<TypedDeferredData<T>>; // returned responses

type ClientLoaderResponseAndDefer<
  T1 extends Record<keyof unknown, unknown>,
  T2 extends Record<keyof unknown, unknown>
> = ({
  request,
}: ClientLoaderFunctionArgs) => Promise<
  TypedResponse<T1> | TypedDeferredData<T2>
>;

type ClientLoaderRawAndDefer<
  T1 extends Record<keyof unknown, unknown>,
  T2 extends Record<keyof unknown, unknown>
> = ({
  request,
}: ClientLoaderFunctionArgs) => Promise<T1 | TypedDeferredData<T2>>;

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
  Expect<SerializeFrom<LoaderDefer<{ a: string; lazy: Promise<{ b: number }>}>> extends {a: string, lazy: Promise<{ b: number }>} ? true : false>,

  // conditional defer or json
  Expect<SerializeFrom<LoaderBoth<{ a:string, b: Promise<string> }, { c: string; lazy: Promise<{ d: number }>}>> extends { a: string, b: EmptyObject } | { c: string; lazy: Promise<{ d: number }> } ? true : false>,

  // clientLoader raw JSON
  Expect<Equal<Pretty<SerializeFrom<ClientLoaderRaw<{a: string}>>>, {a: string}>>,
  Expect<Equal<Pretty<SerializeFrom<ClientLoaderRaw<{a: Date, b: Map<string,number> }>>>, {a: Date, b: Map<string,number>}>>,

  // clientLoader json() Response
  Expect<Equal<Pretty<SerializeFrom<ClientLoaderResponse<{a: string}>>>, {a: string}>>,
  Expect<Equal<Pretty<SerializeFrom<ClientLoaderResponse<{a: Date}>>>, {a: string}>>,

  // clientLoader defer() data
  Expect<SerializeFrom<ClientLoaderDefer<{ a: string; lazy: Promise<{ b: number }>}>> extends {a: string, lazy: Promise<{ b: number }>} ? true : false>,

  // clientLoader conditional defer or json
  Expect<SerializeFrom<ClientLoaderResponseAndDefer<{ a: string, b: Promise<string> }, { c: string; lazy: Promise<{ d: number }>}>> extends { a: string, b: EmptyObject } | { c: string; lazy: Promise<{ d: number }> } ? true : false>,

  // clientLoader conditional defer or raw
  Expect<SerializeFrom<ClientLoaderRawAndDefer<{ a: string, b: Promise<string> }, { c: string; lazy: Promise<{ d: number }>}>> extends { a: string, b: Promise<string> } | { c: string; lazy: Promise<{ d: number }> } ? true : false>,
];

// recursive
type Recursive = { a: string; recur?: Recursive };
declare const recursive: SerializeFrom<Loader<Recursive>>;
expectType<{ a: string; recur?: Jsonify<Recursive> }>(
  recursive.recur!.recur!.recur!
);
