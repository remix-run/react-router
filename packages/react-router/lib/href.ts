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
  let result = trimEndSplat(path) // Ignore trailing / and /*, we'll handle it below
    .replace(
      /\/:([\w-]+)(\?)?/g, // same regex as in .\router\utils.ts: compilePath().
      (_: string, param: string, questionMark: string | undefined) => {
        const isRequired = questionMark === undefined;
        const value = params ? params[param] : undefined;
        if (isRequired && value === undefined) {
          throw new Error(
            `Path '${path}' requires param '${param}' but it was not provided`,
          );
        }
        return value === undefined ? "" : "/" + value;
      },
    );

  if (path.endsWith("*")) {
    // treat trailing splat the same way as compilePath, and force it to be as if it were `/*`.
    // `react-router typegen` will not generate the params for a malformed splat, causing a type error, but we can still do the correct thing here.
    const value = params ? params["*"] : undefined;
    if (value !== undefined) {
      result += "/" + value;
    }
  }

  return result || "/";
}

/**
  Removes a trailing splat and any number of slashes from the end of the path.

  Benchmarks as running faster than `path.replace(/\/*\*?$/, "")`, which backtracks.
 */
function trimEndSplat(path: string): string {
  let i = path.length - 1;
  let char = path[i];
  if (char !== "*" && char !== "/") {
    return path;
  }
  i--;
  for (; i >= 0; i--) {
    // for/break benchmarks faster than do/while
    if (path[i] !== "/") {
      break;
    }
  }
  return path.slice(0, i + 1);
}
