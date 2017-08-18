import pathToRegexp from "path-to-regexp";

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
const matchPath = (pathname, options = {}, parentMatch = null) => {
  if (typeof options === 'string')
    options = { path: options }

  const { exact = false, strict = false, sensitive = false } = options
  let path = options.path != null ? options.path : options.from

  const absolute = isAbsolute(path)

  if (path == null) 
    return parentMatch ? parentMatch : { url: '/', isExact: true, params: {} }

  if (!absolute)
    path = resolvePath(path, parentMatch && parentMatch.url)

  const { re, keys } = compilePath(path, { end: exact, strict, sensitive })
  const match = re.exec(pathname)

  if (path == null) return parent;

  const { re, keys } = compilePath(path, { end: exact, strict, sensitive });
  const match = re.exec(pathname);

  if (!match) return null;

  const [url, ...values] = match;
  const isExact = pathname === url;

  if (exact && !isExact) return null;

  const matchParams = keys.reduce((memo, key, index) => {
    memo[key.name] = values[index]
    return memo
  }, {})

  // merge parent match's params for partial paths
  // this allows us to join paths using the parent match's url instead of path
  const params = absolute
    ? matchParams
    : Object.assign({}, parentMatch && parentMatch.params, matchParams)

  return {
    path, // the path pattern used to match
    url: path === "/" && url === "" ? "/" : url, // the matched portion of the URL
    isExact, // whether or not we matched exactly
<<<<<<< 2b94b8f9e115bec6426be06b309b6963f4a96004
    params: keys.reduce((memo, key, index) => {
      memo[key.name] = values[index];
      return memo;
    }, {})
  };
};

export default matchPath;
=======
    params
  }
}

const resolvePath = (pathname, base) => {
  if (pathname === undefined || isAbsolute(pathname)) {
    return pathname
  }

  if (!base) {
    base = '/'
  }

  if (pathname === '') {
    return base
  } else {
    return `${addTrailingSlash(base)}${pathname}`
  }
}

const isAbsolute = pathname => !!(pathname && pathname.charAt(0) === '/')

const addTrailingSlash = pathname =>
  hasTrailingSlash(pathname) ? pathname : pathname + '/'

const hasTrailingSlash = pathname => 
  !!pathname && pathname.charAt(pathname.length-1) === '/'


export default matchPath
>>>>>>> Resolve relative paths in matchPath
