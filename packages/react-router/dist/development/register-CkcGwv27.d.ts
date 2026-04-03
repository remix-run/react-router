import { R as RouteModule } from './routeModules-CA7kSxJJ.js';

/**
 * Apps can use this interface to "register" app-wide types for React Router via interface declaration merging and module augmentation.
 * React Router should handle this for you via type generation.
 *
 * For more on declaration merging and module augmentation, see https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation .
 */
interface Register {
}
type AnyParams = Record<string, string | undefined>;
type AnyPages = Record<string, {
    params: AnyParams;
}>;
type Pages = Register extends {
    pages: infer Registered extends AnyPages;
} ? Registered : AnyPages;
type AnyRouteFiles = Record<string, {
    id: string;
    page: string;
}>;
type RouteFiles = Register extends {
    routeFiles: infer Registered extends AnyRouteFiles;
} ? Registered : AnyRouteFiles;
type AnyRouteModules = Record<string, RouteModule>;
type RouteModules = Register extends {
    routeModules: infer Registered extends AnyRouteModules;
} ? Registered : AnyRouteModules;

export type { Pages as P, RouteFiles as R, RouteModules as a, Register as b };
