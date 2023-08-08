import type { Jsonify } from "type-fest";

import type { AppData } from "./data";
import type { TypedDeferredData, TypedResponse } from "./responses";

// Note: The return value has to be `any` and not `unknown` so it can match `void`.
type ArbitraryFunction = (...args: any[]) => any;
type NotJsonable = ArbitraryFunction | undefined | symbol;

type Serialize<T> = T extends TypedDeferredData<infer U>
  ? SerializeDeferred<U>
  : Jsonify<T>;

// prettier-ignore
type SerializeDeferred<T extends Record<string, unknown>> = {
  [k in keyof T as
    T[k] extends Promise<unknown> ? k :
    T[k] extends NotJsonable ? never :
    k
  ]:
    T[k] extends Promise<infer U>
    ? Promise<Serialize<U>> extends never ? "wtf" : Promise<Serialize<U>>
    : Serialize<T[k]>  extends never ? k : Serialize<T[k]>;
};

/**
 * Infer JSON serialized data type returned by a loader or action.
 *
 * For example:
 * `type LoaderData = SerializeFrom<typeof loader>`
 */
export type SerializeFrom<T extends AppData | ArbitraryFunction> = Serialize<
  T extends (...args: any[]) => infer Output
    ? Awaited<Output> extends TypedResponse<infer U>
      ? U
      : Awaited<Output>
    : Awaited<T>
>;
