/**
 * @see https://github.com/sindresorhus/type-fest/blob/main/source/jsonify.d.ts
 */

declare const emptyObjectSymbol: unique symbol;
type EmptyObject = { [emptyObjectSymbol]?: never };

type IsAny<T> = 0 extends 1 & T ? true : false;

type JsonArray = JsonValue[];
type JsonObject = { [Key in string]: JsonValue } & {
  [Key in string]?: JsonValue | undefined;
};
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;

type NegativeInfinity = -1e999;
type PositiveInfinity = 1e999;

type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

type BaseKeyFilter<Type, Key extends keyof Type> = Key extends symbol
  ? never
  : Type[Key] extends symbol
  ? never
  : [(...args: any[]) => any] extends [Type[Key]]
  ? never
  : Key;
type FilterDefinedKeys<T extends object> = Exclude<
  {
    [Key in keyof T]: IsAny<T[Key]> extends true
      ? Key
      : undefined extends T[Key]
      ? never
      : T[Key] extends undefined
      ? never
      : BaseKeyFilter<T, Key>;
  }[keyof T],
  undefined
>;
type FilterOptionalKeys<T extends object> = Exclude<
  {
    [Key in keyof T]: IsAny<T[Key]> extends true
      ? never
      : undefined extends T[Key]
      ? T[Key] extends undefined
        ? never
        : BaseKeyFilter<T, Key>
      : never;
  }[keyof T],
  undefined
>;
type UndefinedToOptional<T extends object> = {
  // Property is not a union with `undefined`, keep it as-is.
  [Key in keyof Pick<T, FilterDefinedKeys<T>>]: T[Key];
} & {
  // Property _is_ a union with defined value. Set as optional (via `?`) and remove `undefined` from the union.
  [Key in keyof Pick<T, FilterOptionalKeys<T>>]?: Exclude<T[Key], undefined>;
};

// Note: The return value has to be `any` and not `unknown` so it can match `void`.
type NotJsonable = ((...args: any[]) => any) | undefined | symbol;

type JsonifyTuple<T extends [unknown, ...unknown[]]> = {
  [Key in keyof T]: T[Key] extends NotJsonable ? null : Jsonify<T[Key]>;
};

type FilterJsonableKeys<T extends object> = {
  [Key in keyof T]: T[Key] extends NotJsonable ? never : Key;
}[keyof T];

type JsonifyObject<T extends object> = {
  [Key in keyof Pick<T, FilterJsonableKeys<T>>]: Jsonify<T[Key]>;
};

// prettier-ignore
export type Jsonify<T> =
  IsAny<T> extends true ? any
  : T extends PositiveInfinity | NegativeInfinity ? null
  : T extends JsonPrimitive ? T
  // Instanced primitives are objects
  : T extends Number  ? number
  : T extends String ? string
  : T extends Boolean ? boolean
  : T extends Map<any, any> | Set<any> ? EmptyObject
  : T extends TypedArray ? Record<string, number>
  : T extends NotJsonable ? never // Non-JSONable type union was found not empty
  // Any object with toJSON is special case
  : T extends { toJSON(): infer J } ?
    (() => J) extends () => JsonValue // Is J assignable to JsonValue?
      ? J // Then T is Jsonable and its Jsonable value is J
      : Jsonify<J> // Maybe if we look a level deeper we'll find a JsonValue
  : T extends [] ? []
  : T extends [unknown, ...unknown[]] ? JsonifyTuple<T>
  : T extends ReadonlyArray<infer U> ? Array<U extends NotJsonable ? null : Jsonify<U>>
  : T extends object ? JsonifyObject<UndefinedToOptional<T>> // JsonifyObject recursive call for its children
  : never; // Otherwise any other non-object is removed
