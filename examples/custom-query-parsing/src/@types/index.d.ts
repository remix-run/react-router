export type Nullable<T> = T | null | undefined;

export type AnyJson = boolean | number | string | null | JsonArray | JsonMap;

export interface JsonMap {
  [key: string]: AnyJson;
}

export interface JsonArray extends Array<AnyJson> {}
