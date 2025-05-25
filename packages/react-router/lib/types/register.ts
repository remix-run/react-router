/**
 * Apps can use this interface to "register" app-wide types for React Router via interface declaration merging and module augmentation.
 * React Router should handle this for you via type generation.
 *
 * For more on declaration merging and module augmentation, see https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation .
 */
export interface Register {
  // pages
  // routeFiles
}

// pages
type AnyParams = Record<string, string | undefined>;
type AnyPages = Record<string, { params: AnyParams }>;
export type Pages = Register extends {
  pages: infer Registered extends AnyPages;
}
  ? Registered
  : AnyPages;

// route files
type AnyRouteFiles = Record<string, { id: string; page: string }>;
export type RouteFiles = Register extends {
  routeFiles: infer Registered extends AnyRouteFiles;
}
  ? Registered
  : AnyRouteFiles;
