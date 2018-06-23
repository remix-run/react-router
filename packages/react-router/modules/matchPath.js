import pathToRegexp from "path-to-regexp";

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

const patternCache = {};
const cacheLimit = 10000;
let cacheCount = 0;

const compilePath = (pattern, options) => {
  const cacheKey = `${options.end}${options.strict}${options.sensitive}`;
  const cache = patternCache[cacheKey] || (patternCache[cacheKey] = {});

  if (cache[pattern]) return cache[pattern];

  const keys = [];
  const re = pathToRegexp(pattern, keys, options);
  const compiledPattern = { re, keys };

  if (cacheCount < cacheLimit) {
    cache[pattern] = compiledPattern;
    cacheCount++;
  }

  return compiledPattern;
};

/**
 * Public API for matching a URL pathname to a path pattern.
 */
const matchPath = (pathname, options = {}, parent) => {
  if (typeof options === "string") options = { path: options };

  const { exact = false, strict = false, sensitive = false } = options;
  let path = options.path != null ? options.path : options.from;

  const absolute = isAbsolute(path);

  if (path == null) return parent;

  if (!absolute) path = resolvePath(path, parent && parent.url);

  const { re, keys } = compilePath(path, { end: exact, strict, sensitive });
  const match = re.exec(pathname);

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
    path, // the path pattern used to match
    url: path === "/" && url === "" ? "/" : url, // the matched portion of the URL
    isExact, // whether or not we matched exactly
    params
  };
};

export default matchPath;
