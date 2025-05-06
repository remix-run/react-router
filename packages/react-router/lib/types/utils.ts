export type Expect<T extends true> = T;

// prettier-ignore
export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false

export type IsAny<T> = 0 extends 1 & T ? true : false;

export type Func = (...args: any[]) => unknown;

export type Pretty<T> = { [K in keyof T]: T[K] } & {};

export type Normalize<T> = _Normalize<UnionKeys<T>, T>;
// prettier-ignore
type _Normalize<Key extends keyof any, T> =
  T extends infer U ?
    Pretty<
      & { [K in Key as K extends keyof U ? undefined extends U[K] ? never : K : never]: K extends keyof U ? U[K] : never }
      & { [K in Key as K extends keyof U ? undefined extends U[K] ? K : never : never]?: K extends keyof U ? U[K] : never }
      & { [K in Key as K extends keyof U ? never : K]?: undefined}
    >
  :
  never
type UnionKeys<T> = T extends any ? keyof T : never;

// prettier-ignore
type __tests = [
  Expect<Equal<Normalize<{}>, {}>>,
  Expect<Equal<Normalize<{a: string}>, {a: string}>>,
  Expect<Equal<Normalize<{a: string} | {b: string}>, {a: string, b?: undefined} | {a?: undefined , b: string}>>,
  Expect<Equal<Normalize<{a?: string} | {b?: string}>, {a?: string, b?: undefined} | {a?: undefined , b?: string}>>,
]
