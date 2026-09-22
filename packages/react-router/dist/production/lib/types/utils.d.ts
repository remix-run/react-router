
//#region lib/types/utils.d.ts
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type IsAny<T> = 0 extends 1 & T ? true : false;
type Func = (...args: any[]) => unknown;
type Pretty<T> = { [K in keyof T]: T[K] } & {};
type Normalize<T> = _Normalize<UnionKeys<T>, T>;
type _Normalize<Key extends keyof any, T> = T extends infer U ? Pretty<{ [K in Key as K extends keyof U ? undefined extends U[K] ? never : K : never]: K extends keyof U ? U[K] : never } & { [K in Key as K extends keyof U ? undefined extends U[K] ? K : never : never]?: K extends keyof U ? U[K] : never } & { [K in Key as K extends keyof U ? never : K]?: undefined }> : never;
type UnionKeys<T> = T extends any ? keyof T : never;
//#endregion
export { Equal, Func, IsAny, Normalize, Pretty };