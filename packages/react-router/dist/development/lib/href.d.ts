
import { Equal } from "./types/utils.js";
import { Pages } from "./types/register.js";

//#region lib/href.d.ts
type Args = { [K in keyof Pages]: ToArgs<Pages[K]["params"]> };
type ToArgs<Params extends Record<string, string | undefined>> = Equal<Params, {}> extends true ? [] : Partial<Params> extends Params ? [Params] | [] : [Params];
/**
  Returns a resolved URL path for the specified route.

  ```tsx
  const h = href("/:lang?/about", { lang: "en" })
  // -> `/en/about`

  <Link to={href("/products/:id", { id: "abc123" })} />
  ```
 */
declare function href<Path extends keyof Args>(path: Path, ...args: Args[Path]): string;
//#endregion
export { href };