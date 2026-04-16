import { RouteConfigEntry } from '@react-router/dev/routes';

interface RouteManifestEntry {
    path?: string;
    index?: boolean;
    caseSensitive?: boolean;
    id: string;
    parentId?: string;
    file: string;
}
interface RouteManifest {
    [routeId: string]: RouteManifestEntry;
}

type DefineRoutesFunction = (callback: (defineRoute: DefineRouteFunction) => void) => RouteManifest;
interface DefineRouteOptions {
    /**
     * Should be `true` if the route `path` is case-sensitive. Defaults to
     * `false`.
     */
    caseSensitive?: boolean;
    /**
     * Should be `true` if this is an index route that does not allow child routes.
     */
    index?: boolean;
    /**
     * An optional unique id string for this route. Use this if you need to aggregate
     * two or more routes with the same route file.
     */
    id?: string;
}
interface DefineRouteChildren {
    (): void;
}
interface DefineRouteFunction {
    (
    /**
     * The path this route uses to match the URL pathname.
     */
    path: string | undefined, 
    /**
     * The path to the file that exports the React component rendered by this
     * route as its default export, relative to the `app` directory.
     */
    file: string, 
    /**
     * Options for defining routes, or a function for defining child routes.
     */
    optionsOrChildren?: DefineRouteOptions | DefineRouteChildren, 
    /**
     * A function for defining child routes.
     */
    children?: DefineRouteChildren): void;
}

/**
 * Adapts routes defined using [Remix's `routes` config
 * option](https://v2.remix.run/docs/file-conventions/vite-config#routes) to
 * React Router's config format, for use within `routes.ts`.
 */
declare function remixRoutesOptionAdapter(routes: (defineRoutes: DefineRoutesFunction) => ReturnType<DefineRoutesFunction> | Promise<ReturnType<DefineRoutesFunction>>): Promise<RouteConfigEntry[]>;

export { type DefineRouteFunction, type DefineRoutesFunction, remixRoutesOptionAdapter };
