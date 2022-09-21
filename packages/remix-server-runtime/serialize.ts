import type { AppData } from "./data";
import type { TypedResponse } from "./responses";

type JsonPrimitive =
  | string
  | number
  | boolean
  | String
  | Number
  | Boolean
  | null;
type NonJsonPrimitive = undefined | Function | symbol;

/*
 * `any` is the only type that can let you equate `0` with `1`
 * See https://stackoverflow.com/a/49928360/1490091
 */
type IsAny<T> = 0 extends 1 & T ? true : false;

// prettier-ignore
type Serialize<T> =
  IsAny<T> extends true ? any :
  T extends JsonPrimitive ? T :
  T extends NonJsonPrimitive ? never :
  T extends { toJSON(): infer U } ? U :
  T extends [] ? [] :
  T extends [unknown, ...unknown[]] ? SerializeTuple<T> :
  T extends ReadonlyArray<infer U> ? (U extends NonJsonPrimitive ? null : Serialize<U>)[] :
  T extends object ? SerializeObject<UndefinedToOptional<T>> :
  never;

/** JSON serialize [tuples](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types) */
type SerializeTuple<T extends [unknown, ...unknown[]]> = {
  [k in keyof T]: T[k] extends NonJsonPrimitive ? null : Serialize<T[k]>;
};

/** JSON serialize objects (not including arrays) and classes */
type SerializeObject<T extends object> = {
  [k in keyof T as T[k] extends NonJsonPrimitive ? never : k]: Serialize<T[k]>;
};

/*
 * For an object T, if it has any properties that are a union with `undefined`,
 * make those into optional properties instead.
 *
 * Example: { a: string | undefined} --> { a?: string}
 */
type UndefinedToOptional<T extends object> = {
  // Property is not a union with `undefined`, keep as-is
  [k in keyof T as undefined extends T[k] ? never : k]: T[k];
} & {
  // Property _is_ a union with `defined`. Set as optional (via `?`) and remove `undefined` from the union
  [k in keyof T as undefined extends T[k] ? k : never]?: Exclude<
    T[k],
    undefined
  >;
};

type ArbitraryFunction = (...args: any[]) => unknown;

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
