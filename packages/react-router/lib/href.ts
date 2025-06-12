import type { Pages } from "./types/register";
import type { Equal } from "./types/utils";

type Args = { [K in keyof Pages]: ToArgs<Pages[K]["params"]> };

// prettier-ignore
type ToArgs<Params extends Record<string, string | undefined>> =
  // path without params -> no `params` arg
  Equal<Params, {}> extends true ? [] :
  // path with only optional params -> optional `params` arg
  Partial<Params> extends Params ? [Params] | [] :
  // otherwise, require `params` arg
  [Params];

/**
  Returns a resolved URL path for the specified route.

  ```tsx
  const h = href("/:lang?/about", { lang: "en" })
  // -> `/en/about`

  <Link to={href("/products/:id", { id: "abc123" })} />
  ```
 */
export function href<Path extends keyof Args>(
  path: Path,
  ...args: Args[Path]
): string {
  let params = args[0];
  let result = path.replace(
    /\/:([\w-]+)(\?)?/g, // same regex as in .\router\utils.ts: compilePath().
    (_: string, param: string, isOptional) => {
      const value = params ? params[param] : undefined;
      if (isOptional == null && value == null) {
        throw new Error(
          `Path '${path}' requires param '${param}' but it was not provided`,
        );
      }
      return value == null ? "" : "/" + value;
    },
  );

  if (result.endsWith("*")) {
    // treat trailing splat the same way as compilePath, and force it to be as if it were `/*`.
    // `react-router typegen` will not generate the params for a malformed splat, causing a type error, but we can still do the correct thing here.
    result = result.slice(0, result.endsWith("/*") ? -2 : -1);
    if (params && params["*"] != null) {
      result += "/" + params["*"];
    }
  }

  return result || "/";
}
