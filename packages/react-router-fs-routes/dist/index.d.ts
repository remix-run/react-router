import { RouteConfigEntry } from '@react-router/dev/routes';

/**
 * Creates route config from the file system using a convention that matches
 * [Remix v2's route file
 * naming](https://v2.remix.run/docs/file-conventions/routes), for use
 * within `routes.ts`.
 */
declare function flatRoutes(options?: {
    /**
     * An array of [minimatch](https://www.npmjs.com/package/minimatch) globs that match files to ignore.
     * Defaults to `[]`.
     */
    ignoredRouteFiles?: string[];
    /**
     * The directory containing file system routes, relative to the app directory.
     * Defaults to `"./routes"`.
     */
    rootDirectory?: string;
}): Promise<RouteConfigEntry[]>;

export { flatRoutes };
