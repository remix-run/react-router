
import { Equal } from "./types/utils.js";
import { Pages } from "./types/register.js";

//#region lib/href.d.ts
type Args = { [K in keyof Pages]: ToArgs<Pages[K]["params"]> };
type ToArgs<Params extends Record<string, string | undefined>> = Equal<Params, {}> extends true ? [] : Partial<Params> extends Params ? [Params] | [] : [Params];
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
declare function href<Path extends keyof Args>(path: Path, ...args: Args[Path]): string;
//#endregion
export { href };