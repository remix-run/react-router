/**
 * This also probably warrants some explanation.
 *
 * The whole point here is to abstract out the server functionality that is required
 * by the server runtime but is dependent on the platform runtime.
 *
 * The origional use of this was error beautification as it depends on loading sourcemaps
 * from the file system in node, while functions hosted on cloudflare workers will not
 * need to format as they have built in sourcemap support. This is no longer needed though
 * as we utlize the `source-map-support` library to do this for us.
 */

/**
 * Abstracts functionality that is platform specific (node vs workers, etc.)
 */
export interface ServerPlatform {}
