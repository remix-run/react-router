declare module "jsurl" {
  type Nullable<T> = T | null | undefined;
  export function stringify(input: any): string;
  export function parse(input?: Nullable<string>): Nullable<any>;
}
