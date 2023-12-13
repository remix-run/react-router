import {
  expectType,
  type Equal,
  type Expect,
  type MutualExtends,
} from "./typecheck";

// prettier-ignore
// `Jsonify` emulates `let y = JSON.parse(JSON.stringify(x))`, but for types
// so that we can infer the shape of the data sent over the network.
export type Jsonify<T> =
  // any
  IsAny<T> extends true ? any :

  // toJSON
  T extends { toJSON(): infer U } ? (U extends JsonValue ? U : unknown) :

  // primitives
  T extends JsonPrimitive ? T :
  T extends String ? string :
  T extends Number ? number :
  T extends Boolean ? boolean :

  // Promises JSON.stringify to an empty object
  T extends Promise<unknown> ? EmptyObject :

  // Map & Set
  T extends Map<unknown, unknown> ? EmptyObject :
  T extends Set<unknown> ? EmptyObject :

  // TypedArray
  T extends TypedArray ? Record<string, number> :

  // Not JSON serializable
  T extends NotJson ? never :

  // tuple & array
  T extends [] ? [] :
  T extends readonly [infer F, ...infer R] ? [NeverToNull<Jsonify<F>>, ...Jsonify<R>] :
  T extends readonly unknown[] ? Array<NeverToNull<Jsonify<T[number]>>>:

  // object
  T extends Record<keyof unknown, unknown> ? JsonifyObject<T> :

  // unknown
  unknown extends T ? unknown :

  never

// value is always not JSON => true
// value is always JSON => false
// value is somtimes JSON, sometimes not JSON => boolean
// note: cannot be inlined as logic requires union distribution
type ValueIsNotJson<T> = T extends NotJson ? true : false;

// note: remove optionality so that produced values are never `undefined`,
// only `true`, `false`, or `boolean`
type IsNotJson<T> = { [K in keyof T]-?: ValueIsNotJson<T[K]> };

type JsonifyValues<T> = { [K in keyof T]: Jsonify<T[K]> };

// prettier-ignore
type JsonifyObject<T extends Record<keyof unknown, unknown>> =
  // required
  { [K in keyof T as
    unknown extends T[K] ? never :
    IsNotJson<T>[K] extends false ? K :
    never
  ]: JsonifyValues<T>[K] } &
  // optional
  { [K in keyof T as
    unknown extends T[K] ? K :
    // if the value is always JSON, then it's not optional
    IsNotJson<T>[K] extends false ? never :
    // if the value is always not JSON, omit it entirely
    IsNotJson<T>[K] extends true ? never :
    // if the value is mixed, then it's optional
    K
  ]? : JsonifyValues<T>[K]}

// types ------------------------------------------------------------

type JsonPrimitive = string | number | boolean | null;

type JsonArray = JsonValue[] | readonly JsonValue[];

// prettier-ignore
type JsonObject =
  { [K in string]: JsonValue } &
  { [K in string]?: JsonValue }

type JsonValue = JsonPrimitive | JsonObject | JsonArray;

type NotJson = undefined | symbol | AnyFunction;

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

// tests ------------------------------------------------------------

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _tests = [
  // any
  Expect<Equal<Jsonify<any>, any>>,

  // primitives
  Expect<Equal<Jsonify<string>, string>>,
  Expect<Equal<Jsonify<number>, number>>,
  Expect<Equal<Jsonify<boolean>, boolean>>,
  Expect<Equal<Jsonify<null>, null>>,
  Expect<Equal<Jsonify<String>, string>>,
  Expect<Equal<Jsonify<Number>, number>>,
  Expect<Equal<Jsonify<Boolean>, boolean>>,
  Expect<Equal<Jsonify<Promise<string>>, EmptyObject>>,

  // Map & Set
  Expect<Equal<Jsonify<Map<unknown, unknown>>, EmptyObject>>,
  Expect<Equal<Jsonify<Set<unknown>>, EmptyObject>>,

  // TypedArray
  Expect<Equal<Jsonify<Int8Array>, Record<string, number>>>,
  Expect<Equal<Jsonify<Uint8Array>, Record<string, number>>>,
  Expect<Equal<Jsonify<Uint8ClampedArray>, Record<string, number>>>,
  Expect<Equal<Jsonify<Int16Array>, Record<string, number>>>,
  Expect<Equal<Jsonify<Uint16Array>, Record<string, number>>>,
  Expect<Equal<Jsonify<Int32Array>, Record<string, number>>>,
  Expect<Equal<Jsonify<Uint32Array>, Record<string, number>>>,
  Expect<Equal<Jsonify<Float32Array>, Record<string, number>>>,
  Expect<Equal<Jsonify<Float64Array>, Record<string, number>>>,
  Expect<Equal<Jsonify<BigInt64Array>, Record<string, number>>>,
  Expect<Equal<Jsonify<BigUint64Array>, Record<string, number>>>,

  // Not Json
  Expect<Equal<Jsonify<undefined>, never>>,
  Expect<Equal<Jsonify<AnyFunction>, never>>,
  Expect<Equal<Jsonify<() => void>, never>>,
  Expect<Equal<Jsonify<symbol>, never>>,

  // toJson
  Expect<Equal<Jsonify<{ toJSON(): "stuff" }>, "stuff">>,
  Expect<Equal<Jsonify<Date>, string>>,
  Expect<Equal<Jsonify<{ toJSON(): undefined }>, unknown>>,
  Expect<Equal<Jsonify<{ toJSON(): Date }>, unknown>>,
  Expect<Equal<Jsonify<BooleanWithToJson>, string>>,


  // tuple & array
  Expect<Equal<Jsonify<[]>, []>>,
  Expect<Equal<Jsonify<[1, 'two', Date, undefined, false]>, [1, 'two', string, null, false]>>,
  Expect<Equal<Jsonify<(string | number | undefined)[]>, (string | number)[]>>,
  Expect<Equal<Jsonify<undefined[]>, null[]>>,
  Expect<Equal<Jsonify<readonly [1,2,3]>, [1,2,3]>>,

  // object
  Expect<Equal<Pretty<Jsonify<{}>>, {}>>,
  Expect<Equal<Pretty<Jsonify<{a: string}>>, {a: string}>>,
  Expect<Equal<Pretty<Jsonify<{a: string | undefined}>>, {a?: string}>>,
  Expect<Equal<Pretty<Jsonify<{a?: string | undefined}>>, {a?: string}>>,
  Expect<Equal<Pretty<Jsonify<{a: string, b: string | undefined, c: undefined}>>, {a: string, b?: string}>>,
  Expect<Equal<Pretty<Jsonify<{a: undefined}>>, {}>>,
  Expect<Equal<Pretty<Jsonify<Record<string, any>>>, Record<string, any>>>,
  Expect<Equal<Pretty<Jsonify<Record<string, number>>>, Record<string, number>>>,
  Expect<MutualExtends<Jsonify<{payload: Record<string, any>}>, { payload: Record<string, any>}>>,
  Expect<Equal<Pretty<Jsonify<{
    // Should be kept
    requiredString: string;
    requiredUnion: number | boolean;

    // Should be kept and set to optional
    optionalString?: string;
    optionalUnion?: number | string;
    optionalStringUndefined: string | undefined;
    optionalUnionUndefined: number | string | undefined;
    requiredFunctionUnion: string | (() => any);
    optionalFunctionUnion?: string | (() => any);
    optionalFunctionUnionUndefined: string | (() => any) | undefined;

    // Should be omitted
    requiredFunction: () => any;
    optionalFunction?: () => any;
    optionalFunctionUndefined: (() => any) | undefined;
  }>>, {
    requiredString: string
    requiredUnion: number | boolean

    optionalString?: string;
    optionalUnion?: number | string;
    optionalStringUndefined?: string | undefined;
    optionalUnionUndefined?: number | string | undefined;
    requiredFunctionUnion?: string
    optionalFunctionUnion?: string;
    optionalFunctionUnionUndefined?: string
  }>>,

  // unknown
  Expect<Equal<Jsonify<unknown>, unknown>>,
  Expect<Equal<Jsonify<unknown[]>, unknown[]>>,
  Expect<Equal<Jsonify<[unknown, 1]>, [unknown, 1]>>,
  Expect<Equal<Pretty<Jsonify<{a: unknown}>>, {a?: unknown}>>,
  Expect<Equal<Pretty<Jsonify<{a: unknown, b: 'hello'}>>, {a?: unknown, b: 'hello'}>>,

  // never
  Expect<Equal<Jsonify<never>, never>>,
  Expect<Equal<Pretty<Jsonify<{a: never}>>, {a: never}>>,
  Expect<Equal<Pretty<Jsonify<{a: never, b: string}>>, {a: never, b:string}>>,
  Expect<Equal<Pretty<Jsonify<{a: never, b: string} | {a: string, b: never}>>, {a: never, b: string} | {a: string, b: never}>>,

  // class
  Expect<Equal<Pretty<Jsonify<MyClass>>, {a: string}>>,
];

class MyClass {
  a: string;
  b: () => string;

  constructor() {
    this.a = "hello";
    this.b = () => "world";
  }
}

// real-world example: `InvoiceLineItem` from `stripe`
type Recursive = {
  a: Date;
  recur?: Recursive;
};
declare const recursive: Jsonify<Recursive>;
expectType<{ a: string; recur?: Jsonify<Recursive> }>(
  recursive.recur!.recur!.recur!
);

// real-world example: `Temporal` from `@js-temporal/polyfill`
interface BooleanWithToJson extends Boolean {
  toJSON(): string;
}

// utils ------------------------------------------------------------

type Pretty<T> = { [K in keyof T]: T[K] };

type AnyFunction = (...args: any[]) => unknown;

type NeverToNull<T> = [T] extends [never] ? null : T;

// adapted from https://github.com/sindresorhus/type-fest/blob/main/source/empty-object.d.ts
declare const emptyObjectSymbol: unique symbol;
export type EmptyObject = { [emptyObjectSymbol]?: never };

// adapted from https://github.com/type-challenges/type-challenges/blob/main/utils/index.d.ts
type IsAny<T> = 0 extends 1 & T ? true : false;
