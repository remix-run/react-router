
import { RouteModule } from "./route-module.js";

//#region lib/types/register.d.ts
/**
 * Apps can use this interface to "register" app-wide types for React Router via interface declaration merging and module augmentation.
 * React Router should handle this for you via type generation.
 *
 * For more on declaration merging and module augmentation, see https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation .
 */
interface Register {}
type AnyParams = Record<string, string | undefined>;
type AnyPages = Record<string, {
  params: AnyParams;
}>;
type Pages = Register extends {
  pages: infer Registered extends AnyPages;
} ? Registered : AnyPages;
type AnyRouteModules = Record<string, RouteModule>;
type RouteModules = Register extends {
  routeModules: infer Registered extends AnyRouteModules;
} ? Registered : AnyRouteModules;
//#endregion
export { Pages, Register, RouteModules };