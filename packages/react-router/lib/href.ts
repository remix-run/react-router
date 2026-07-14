import { encodePathParam } from "./router/utils";
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

function stringify(p: any) {
  return p == null ? "" : typeof p === "string" ? p : String(p);
}

/**
 * Returns a resolved URL path for the specified route.
 *
 * Param values are percent-encoded for use in a path segment: characters that
 * would change the URL structure (`/`, `?`, `#`, `%`, whitespace, non-ASCII)
 * are escaped, while characters that RFC 3986 allows literally in a path
 * segment (`$ & + , ; = : @`) are kept as-is. Note this differs from query-string
 * encoding (`encodeURIComponent`/`URLSearchParams`), where those characters are
 * delimiters and must be escaped. Splat (`*`) values are encoded per segment,
 * preserving `/` separators.
 *
 * See [RFC 3986 §3.3](https://datatracker.ietf.org/doc/html/rfc3986#section-3.3)
 *
 * @example
 * const h = href("/:lang?/about", { lang: "en" })
 * // -> `/en/about`
 *
 * <Link to={href("/products/:id", { id: "abc123" })} />
 *
 * @public
 * @category Utils
 * @mode framework
 * @param path The route path to resolve
 * @param args The route params to use when resolving the path
 * @returns The resolved URL path
 */
export function href<Path extends keyof Args>(
  path: Path,
  ...args: Args[Path]
): string {
  let params = args[0];
  let result = trimTrailingSplat(path) // Ignore trailing / and /*, we'll handle it below
    .replace(
      /\/:([\w-]+)(\?)?/g, // same regex as in .\router\utils.ts: compilePath().
      (_: string, param: string, questionMark: string | undefined) => {
        const isRequired = questionMark === undefined;
        const value = params?.[param];
        if (isRequired && value === undefined) {
          throw new Error(
            `Path '${path}' requires param '${param}' but it was not provided`,
          );
        }
        return value == null ? "" : "/" + encodePathParam(stringify(value));
      },
    );

  if (path.endsWith("*")) {
    // treat trailing splat the same way as compilePath, and force it to be as if it were `/*`.
    // `react-router typegen` will not generate the params for a malformed splat,
    // causing a type error, but we can still do the correct thing here.
    const value = params?.["*"];
    if (value !== undefined) {
      result +=
        "/" + stringify(value).split("/").map(encodePathParam).join("/");
    }
  }

  return result || "/";
}

/**
 * Removes a trailing splat and any number of slashes from the end of the path.
 *
 * Benchmarked to be faster than `path.replace(/\/*\*?$/, "")`, which backtracks.
 */
function trimTrailingSplat(path: string): string {
  let i = path.length - 1;
  let char = path[i];
  if (char !== "*" && char !== "/") return path;

  // for/break benchmarks faster than do/while
  i--;
  for (; i >= 0; i--) {
    if (path[i] !== "/") break;
  }

  return path.slice(0, i + 1);
}
