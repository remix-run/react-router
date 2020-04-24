import { match } from "path-to-regexp";
import qs from "qs";

const cache = {};
const cacheLimit = 10000;
let cacheCount = 0;

function compilePath(path, options) {
  const cacheKey = `${options.end}${options.strict}${options.sensitive}`;
  const pathCache = cache[cacheKey] || (cache[cacheKey] = {});

  if (pathCache[path]) return pathCache[path];

  // match the path to get the regexp function
  const result = match(path, options);

  if (cacheCount < cacheLimit) {
    pathCache[path] = result;
    cacheCount++;
  }

  return result;
}

/**
 * Public API for matching a URL pathname to a path.
 */
function matchPath({ pathname, search }, options = {}) {
  if (typeof options === "string" || Array.isArray(options)) {
    options = { path: options };
  }

  const { path, exact = false, strict = false, sensitive = false } = options;

  const paths = [].concat(path);

  return paths.reduce((matched, path) => {
    if (!path && path !== "") return null;
    if (matched) return matched;

    const regexpFunction = compilePath(path, {
      end: exact,
      strict,
      sensitive
    });
    const match = regexpFunction(pathname);

    if (!match) return null;

    // transform the location search to query object
    const query = qs.parse(search, { ignoreQueryPrefix: true });

    const { path: url, params } = match;
    const isExact = pathname === url;

    if (exact && !isExact) return null;

    return {
      path, // the path used to match
      url: path === "/" && url === "" ? "/" : url, // the matched portion of the URL
      isExact, // whether or not we matched exactly
      params, // path params
      query // location query
    };
  }, null);
}

export default matchPath;
