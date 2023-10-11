// typecheck that expression is assignable to type
export function expectType<T>(_expression: T) {}

// prettier-ignore
// adapted from https://github.com/type-challenges/type-challenges/blob/main/utils/index.d.ts
export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false

// adapted from https://github.com/type-challenges/type-challenges/blob/main/utils/index.d.ts
export type Expect<T extends true> = T;

// looser, lazy equality check for recursive types
// prettier-ignore
export type MutualExtends<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false
