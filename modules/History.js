import invariant from 'invariant';
import { getPathname, getQueryString, parseQueryString, stringifyQuery, makePath } from './URLUtils';
import Location from './Location';

var RequiredHistorySubclassMethods = [ 'pushState', 'replaceState', 'go' ];

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
class History {

  constructor(options={}) {
    RequiredHistorySubclassMethods.forEach(function (method) {
      invariant(
        typeof this[method] === 'function',
        '%s needs a "%s" method',
        this.constructor.name, method
      );
    }, this);

    this.parseQueryString = options.parseQueryString || parseQueryString;
    this.stringifyQuery = options.stringifyQuery || stringifyQuery;
    this.changeListeners = [];
    this.location = null;
  }

  _notifyChange() {
    for (var i = 0, len = this.changeListeners.length; i < len; ++i)
      this.changeListeners[i].call(this);
  }

  addChangeListener(listener) {
    this.changeListeners.push(listener);
  }

  removeChangeListener(listener) {
    this.changeListeners = this.changeListeners.filter(function (li) {
      return li !== listener;
    });
  }

  /**
   * Returns a full URL path from the given pathname and query.
   */
  makePath(pathname, query) {
    return makePath(pathname, query);
  }

  /**
   * Pushes a new Location onto the history stack.
   */
  transitionTo(pathname, query, state=null) {
    this.pushState(state, this.makePath(pathname, query));
  }

  /**
   * Replaces the current Location on the history stack.
   */
  replaceWith(pathname, query, state=null) {
    this.replaceState(state, this.makePath(pathname, query));
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

  createLocation(path, state, navigationType) {
    var pathname = getPathname(path);
    var queryString = getQueryString(path);
    var query = queryString ? this.parseQueryString(queryString) : null;
    return new Location(pathname, query, state, navigationType);
  }

}

export default History;
