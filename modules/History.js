import invariant from 'invariant';
import { getPathname, getQueryString, parseQueryString, stringifyQuery } from './URLUtils';
import ChangeEmitter from './ChangeEmitter';
import Location from './Location';

var RequiredSubclassMethods = [ 'pushState', 'replaceState', 'go' ];

function createRandomKey() {
  return Math.random().toString(36).substr(2);
}

/**
 * A history interface that normalizes the differences across
 * various environments and implementations. Requires concrete
 * subclasses to implement the following methods:
 *
 * - pushState(state, path)
 * - replaceState(state, path)
 * - go(n)
 */
class History extends ChangeEmitter {

  constructor(options={}) {
    super();

    this.parseQueryString = options.parseQueryString || parseQueryString;
    this.stringifyQuery = options.stringifyQuery || stringifyQuery;
    this.location = null;

    RequiredSubclassMethods.forEach(function (method) {
      invariant(
        typeof this[method] === 'function',
        '%s needs a "%s" method',
        this.constructor.name, method
      );
    }, this);
  }

  back() {
    this.go(-1);
  }

  forward() {
    this.go(1);
  }

  _createState(state) {
    state = state || {};

    if (!state.key)
      state.key = createRandomKey();

    return state;
  }

  _createLocation(path, state, navigationType) {
    var pathname = getPathname(path);
    var query = this.parseQueryString(getQueryString(path));
    return new Location(pathname, query, state, navigationType);
  }

  /**
   * Returns a full URL path from the given pathname and query.
   */
  makePath(pathname, query) {
    if (query) {
      if (typeof query !== 'string')
        query = this.stringifyQuery(query);

      if (query !== '')
        return pathname + '?' + query;
    }

    return pathname;
  }

  /**
   * Returns a string that may safely be used to link to the given
   * pathname and query.
   */
  makeHref(pathname, query) {
    return this.makePath(pathname, query);
  }

}

export default History;
