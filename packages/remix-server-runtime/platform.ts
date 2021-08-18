/**
 * This also probably warrants some explanation.
 *
 * The whole point here is to abstract out the server functionality that is required
 * by the server runtime but is dependant on the platform runtime.
 *
 * An example of this is error beautification as it depends on loading sourcemaps from
 * the file system in node, while functions hosted on cloudflare workers will not need
 * to format as they have built in sourcemap support.
 */

/**
 * Abstracts functionality that is platform specific (node vs workers, etc.)
 */
export interface ServerPlatform {
  formatServerError?(error: Error): Promise<Error>;
}
