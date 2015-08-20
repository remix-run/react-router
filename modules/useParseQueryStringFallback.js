import { parseQueryString } from './QueryUtils';

/**
 * Router enhancer that parses and adds a query to location objects
 * Temporary until we figure out better strategy for building hrefs and queries.
 * @deprecated
 */
export default function useParseQueryStringFallback(parseQueryString) {
  return createRouter => initialState => {
    function ensureQuery(location) {
      return location.query
        ? location
        : {
          ...location,
          query: parseQueryString(location.search.substring(1))
        };
    }

    const router = createRouter(
      initialState
        ? { ...initialState, location: ensureQuery(location) }
        : initialState
    );

    function match(routes, location, callback) {
      router.match(routes, ensureQuery(location), callback);
    }

    return {
      ...router,
      match
    };
  };
}
