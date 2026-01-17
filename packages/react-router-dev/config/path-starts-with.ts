/**
 * Returns true if `a` is a path that starts with `b` and might contains subpath.
 *
 * Note that `a` and `b` will not be normalized
 * so the returned boolean doesn't indicate whether `a` resolves to a path contained in `b`.
 */
export default function pathStartsWith(a: string, b: string) {
  return (
    a.startsWith(b) &&
    // they are the same string
    (a.length === b.length ||
      // or b is a directory path
      b.endsWith("/") ||
      b.endsWith("\\") ||
      // or a is `${b}/${subpath}`
      a[b.length] === "/" ||
      a[b.length] === "\\")
  );
}
