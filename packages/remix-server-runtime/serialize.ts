import type { Jsonify } from "type-fest";

import type { AppData } from "./data";
import type { TypedDeferredData, TypedResponse } from "./responses";

// Note: The return value has to be `any` and not `unknown` so it can match `void`.
type Fn = (...args: any[]) => any;

// prettier-ignore
/**
 * Infer JSON serialized data type returned by a loader or action.
 *
 * For example:
 * `type LoaderData = SerializeFrom<typeof loader>`
 */
export type SerializeFrom<T extends AppData | Fn> =
  T extends (...args: any[]) => infer Output ?
    Awaited<Output> extends TypedResponse<infer U> ? Jsonify<U> :
    Awaited<Output> extends TypedDeferredData<infer U> ?
      // top-level promises
      & {
        [K in keyof U as
          K extends symbol ? never :
          Promise<any> extends U[K] ? K :
          never
        ]:
        // use generic to distribute over union
        DeferValue<U[K]>
      }
      // non-promises
      & Jsonify<{ [K in keyof U as Promise<any> extends U[K] ? never : K]: U[K] }>
      :
    Jsonify<Awaited<Output>> :
  Jsonify<Awaited<T>>
;

// prettier-ignore
type DeferValue<T> =
  T extends undefined ? undefined :
  T extends Promise<unknown> ? Promise<Jsonify<Awaited<T>>> :
  Jsonify<T>;
