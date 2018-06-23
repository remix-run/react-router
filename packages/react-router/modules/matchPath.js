import pathToRegexp from "path-to-regexp";

const cache = {};

const isAbsolute = pathname => !!(pathname && pathname.charAt(0) === "/");

const addTrailingSlash = pathname =>
  hasTrailingSlash(pathname) ? pathname : pathname + "/";

const hasTrailingSlash = pathname =>
  !!pathname && pathname.charAt(pathname.length - 1) === "/";

const resolvePath = (pathname, base) => {
  if (pathname === undefined || isAbsolute(pathname)) {
    return pathname;
  }

  if (!base) {
    base = "/";
  }

  if (pathname === "") {
    return base;
  } else {
    return `${addTrailingSlash(base)}${pathname}`;
  }
};

const cacheLimit = 10000;
let cacheCount = 0;

function compilePath(path, options) {
  const cacheKey = `${options.end}${options.strict}${options.sensitive}`;
  const pathCache = cache[cacheKey] || (cache[cacheKey] = {});

  if (pathCache[path]) return pathCache[path];

  const keys = [];
  const regexp = pathToRegexp(path, keys, options);
  const result = { regexp, keys };

  if (cacheCount < cacheLimit) {
    pathCache[path] = result;
    cacheCount++;
  }

  return result;
}

/**
 * Public API for matching a URL pathname to a path.
 */
function matchPath(pathname, options = {}, parent = null) {
  if (typeof options === "string") options = { path: options };

  const { exact = false, strict = false, sensitive = false } = options;
  let path = options.path != null ? options.path : options.from;

  const paths = [].concat(path);

  return paths.reduce((matched, path) => {
    if (!path) return null;
    if (matched) return matched;

    const absolute = isAbsolute(path);

    if (!absolute) path = resolvePath(path, parent && parent.url);

    const { regexp, keys } = compilePath(path, {
      end: exact,
      strict,
      sensitive
    });
    const match = regexp.exec(pathname);

    if (!match) return null;

    const [url, ...values] = match;
    const isExact = pathname === url;

    if (exact && !isExact) return null;

    const matchParams = keys.reduce((memo, key, index) => {
      memo[key.name] = values[index];
      return memo;
    }, {});

    const params = absolute
      ? matchParams
      : Object.assign({}, parent && parent.params, matchParams);

    return {
      path, // the path used to match
      url: path === "/" && url === "" ? "/" : url, // the matched portion of the URL
      isExact, // whether or not we matched exactly
      params: keys.reduce((memo, key, index) => {
        memo[key.name] = values[index];
        return memo;
      }, {})
    };
  }, null);
}

export default matchPath;
