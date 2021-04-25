import pathToRegexp from "path-to-regexp";

const cache = {};
const cacheLimit = 10000;
let cacheCount = 0;

// 计算 path 是否匹配的方法 api
// options 传参格式，由 pathToRegexp 定义 https://www.npmjs.com/package/path-to-regexp
function compilePath(path, options) {
  const cacheKey = `${options.end}${options.strict}${options.sensitive}`;
  const pathCache = cache[cacheKey] || (cache[cacheKey] = {});

  if (pathCache[path]) return pathCache[path];

  const keys = [];
  // Turn a path string such as /user/:name into a regular expression.

  // keys 在执行pathToRegexp 方法后，会被重新复新值
  // keys = [{ name: 'bar', prefix: '/', suffix: '', pattern: '[^\\/#\\?]+?', modifier: '' }]
  const regexp = pathToRegexp(path, keys, options);
  const result = {
    regexp,
    keys
  };

  if (cacheCount < cacheLimit) {
    pathCache[path] = result;
    cacheCount++;
  }

  return result;
}

/**
 * Public API for matching a URL pathname to a path.
 */
// 区分输入类型，规范输出结构
function matchPath(pathname, options = {}) {
  // 统一规范入参格式为对象
  if (typeof options === "string" || Array.isArray(options)) {
    options = {
      path: options
    };
  }

  const {
    path,
    exact = false,
    strict = false,
    sensitive = false
  } = options;

  // concat 入参可为数组/或字符串
  // 统一格式为数组
  const paths = [].concat(path);

  return paths.reduce((matched, path) => {
    // 输出结果1: undefined & null
    if (!path && path !== "") return null;

    if (matched) return matched;

    const {
      regexp,
      keys
    } = compilePath(path, {
      end: exact,
      strict,
      sensitive
    });

    // 正则匹配检测函数
    const match = regexp.exec(pathname);

    // 输出结果 2:不匹配
    if (!match) return null;

    const [url, ...values] = match;
    const isExact = pathname === url;

    // 输出结果 3: 不精确匹配
    if (exact && !isExact) return null;

    // 输出结果 4: 匹配结果
    return {
      path, // the path used to match
      url: path === "/" && url === "" ? "/" : url, // the matched portion of the URL
      isExact, // whether or not we matched exactly
      params: keys.reduce((memo, key, index) => { // 类似 qs.stringify
        memo[key.name] = values[index];
        return memo;
      }, {})
    };
  }, null);
}

export default matchPath;