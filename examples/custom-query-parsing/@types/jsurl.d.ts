declare module "jsurl" {
  type Nullable<T> = T | null | undefined;
  type AnyJson = boolean | number | string | null | JsonArray | JsonMap;
  interface JsonMap {
    [key: string]: AnyJson;
  }
  interface JsonArray extends Array<AnyJson> {}
  export function stringify(input: AnyJson): string;
  export function parse(input?: Nullable<string>): Nullable<AnyJson>;
}
