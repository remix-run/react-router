import type { Register } from "./types/register";
import type { Equal } from "./types/utils";

type AnyParams = Record<string, Record<string, string | boolean | undefined>>;
type Params = Register extends {
  params: infer RegisteredParams extends AnyParams;
}
  ? RegisteredParams
  : AnyParams;

type Args = { [K in keyof Params]: ToArgs<Params[K]> };

// prettier-ignore
type ToArgs<T> =
  // path without params -> no `params` arg
  Equal<T, {}> extends true ? [] :
  // path with only optional params -> optional `params` arg
  Partial<T> extends T ? [T] | [] :
  // otherwise, require `params` arg
  [T];

/**
  Returns a resolved URL path for the specified route.

  ```tsx
  const h = href("/:lang?/about", { lang: "en" })
  // -> `/en/about`

  const h = href("/users/:userId/edit?", { userId: "abc123", edit: true })
  // -> `/users/abc123/edit`

  <Link to={href("/products/:id", { id: "abc123" })} />
  ```
 */
export function href<Path extends keyof Args>(
  path: Path,
  ...args: Args[Path]
): string {
  let params = args[0];
  return path
    .split("/")
    .map((segment) => {
      const match = segment.match(/^\*$|^(:)?([\w-]+)(\?)?$/);
      if (!match) return segment;

      const isSplat = match[0] === "*";
      const param = isSplat ? "*" : match[2];
      const isDynamic = isSplat ? true : match[1] === ":";
      const isOptional = isSplat ? false : match[3] === "?";

      if (isDynamic) {
        const value = params ? params[param] : undefined;
        if (!isOptional && value === undefined) {
          throw Error(
            `Path '${path}' requires param '${param}' but it was not provided`
          );
        }
        return value;
      } else {
        if (isOptional) {
          const include = params ? params[param] === true : false;
          return include ? param : undefined;
        } else {
          return param;
        }
      }
    })
    .filter((segment) => segment !== undefined)
    .join("/");
}
