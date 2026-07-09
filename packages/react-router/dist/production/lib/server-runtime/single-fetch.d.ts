
//#region lib/server-runtime/single-fetch.d.ts
type Serializable = undefined | null | boolean | string | symbol | number | Array<Serializable> | {
  [key: PropertyKey]: Serializable;
} | bigint | Date | URL | RegExp | Error | Map<Serializable, Serializable> | Set<Serializable> | Promise<Serializable>;
//#endregion
export { Serializable };