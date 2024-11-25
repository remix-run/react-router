export type Expect<T extends true> = T;

// prettier-ignore
export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false

export type IsAny<T> = 0 extends 1 & T ? true : false;

export type Func = (...args: any[]) => unknown;

export type Pretty<T> = { [K in keyof T]: T[K] } & {};
