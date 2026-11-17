import * as v from 'valibot';

declare global {
    var __reactRouterAppDirectory: string;
}
/**
 * Provides the absolute path to the app directory, for use within `routes.ts`.
 * This is designed to support resolving file system routes.
 */
declare function getAppDirectory(): string;
interface RouteManifestEntry {
    /**
     * The path this route uses to match on the URL pathname.
     */
    path?: string;
    /**
     * Should be `true` if it is an index route. This disallows child routes.
     */
    index?: boolean;
    /**
     * Should be `true` if the `path` is case-sensitive. Defaults to `false`.
     */
    caseSensitive?: boolean;
    /**
     * The unique id for this route, named like its `file` but without the
     * extension. So `app/routes/gists/$username.tsx` will have an `id` of
     * `routes/gists/$username`.
     */
    id: string;
    /**
     * The unique `id` for this route's parent route, if there is one.
     */
    parentId?: string;
    /**
     * The path to the entry point for this route, relative to
     * `config.appDirectory`.
     */
    file: string;
}
interface RouteManifest {
    [routeId: string]: RouteManifestEntry;
}
/**
 * Configuration for an individual route, for use within `routes.ts`. As a
 * convenience, route config entries can be created with the {@link route},
 * {@link index} and {@link layout} helper functions.
 */
interface RouteConfigEntry {
    /**
     * The unique id for this route.
     */
    id?: string;
    /**
     * The path this route uses to match on the URL pathname.
     */
    path?: string;
    /**
     * Should be `true` if it is an index route. This disallows child routes.
     */
    index?: boolean;
    /**
     * Should be `true` if the `path` is case-sensitive. Defaults to `false`.
     */
    caseSensitive?: boolean;
    /**
     * The path to the entry point for this route, relative to
     * `config.appDirectory`.
     */
    file: string;
    /**
     * The child routes.
     */
    children?: RouteConfigEntry[];
}
declare const resolvedRouteConfigSchema: v.ArraySchema<v.BaseSchema<RouteConfigEntry, any, v.BaseIssue<unknown>>, undefined>;
type ResolvedRouteConfig = v.InferInput<typeof resolvedRouteConfigSchema>;
/**
 * Route config to be exported via the default export from `app/routes.ts`.
 */
type RouteConfig = ResolvedRouteConfig | Promise<ResolvedRouteConfig>;
declare const createConfigRouteOptionKeys: ["id", "index", "caseSensitive"];
type CreateRouteOptions = Pick<RouteConfigEntry, (typeof createConfigRouteOptionKeys)[number]>;
/**
 * Helper function for creating a route config entry, for use within
 * `routes.ts`.
 */
declare function route(path: string | null | undefined, file: string, children?: RouteConfigEntry[]): RouteConfigEntry;
declare function route(path: string | null | undefined, file: string, options: CreateRouteOptions, children?: RouteConfigEntry[]): RouteConfigEntry;
declare const createIndexOptionKeys: ["id"];
type CreateIndexOptions = Pick<RouteConfigEntry, (typeof createIndexOptionKeys)[number]>;
/**
 * Helper function for creating a route config entry for an index route, for use
 * within `routes.ts`.
 */
declare function index(file: string, options?: CreateIndexOptions): RouteConfigEntry;
declare const createLayoutOptionKeys: ["id"];
type CreateLayoutOptions = Pick<RouteConfigEntry, (typeof createLayoutOptionKeys)[number]>;
/**
 * Helper function for creating a route config entry for a layout route, for use
 * within `routes.ts`.
 */
declare function layout(file: string, children?: RouteConfigEntry[]): RouteConfigEntry;
declare function layout(file: string, options: CreateLayoutOptions, children?: RouteConfigEntry[]): RouteConfigEntry;
/**
 * Helper function for adding a path prefix to a set of routes without needing
 * to introduce a parent route file, for use within `routes.ts`.
 */
declare function prefix(prefixPath: string, routes: RouteConfigEntry[]): RouteConfigEntry[];
declare const helpers: {
    route: typeof route;
    index: typeof index;
    layout: typeof layout;
    prefix: typeof prefix;
};

/**
 * Creates a set of route config helpers that resolve file paths relative to the
 * given directory, for use within `routes.ts`. This is designed to support
 * splitting route config into multiple files within different directories.
 */
declare function relative(directory: string): typeof helpers;

export { type RouteManifest as R, type RouteManifestEntry as a, type RouteConfigEntry as b, type RouteConfig as c, relative as d, getAppDirectory as g, index as i, layout as l, prefix as p, route as r };
