import invariant from 'invariant';
import warning from 'warning';
import NavigationTypes from './NavigationTypes';
import { getPathname, getQueryString, parseQueryString } from './URLUtils';
import Location from './Location';

var RequiredHistorySubclassMethods = [ 'push', 'replace', 'go' ];

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

    this.changeListeners = [];
    this.beforeChangeListener = null;

    this.path = null;
    this.location = null;
    this._pendingLocation = null;
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

  onBeforeChange(listener) {
    warning(
      this.beforeChangeListener != null,
      'beforeChange listener of History should not be overwritten'
    );

    this.beforeChangeListener = listener;
  }

  setup(path, entry = {}) {
    if (this.location)
      return;

    if (!entry.key)
      entry = this.replace(path, this.createRandomKey());

    var state = null;
    if (typeof this.readState === 'function')
      state = this.readState(entry.key);

    var location = this._createLocation(path, state, entry, NavigationTypes.POP);
    this._update(path, location, false);
  }

  teardown() {
    this.changeListeners = [];
    this.beforeChangeListener = null;

    this.path = null;
    this.location = null;
    this._pendingLocation = null;
  }

  handlePop(path, entry={}, applyEntry=null) {
    var state = null;
    if (entry.key && typeof this.readState === 'function')
      state = this.readState(entry.key);

    var pendingLocation = this._createLocation(path, state, entry, NavigationTypes.POP);

    this._schedule(pendingLocation, () => {
      applyEntry && applyEntry();
      var location = this._createLocation(path, state, entry, NavigationTypes.POP);
      this._update(path, location);
    });
  }

  createRandomKey() {
    return Math.random().toString(36).substr(2);
  }

  _saveNewState(state) {
    var key = this.createRandomKey();

    if (state != null) {
      invariant(
        typeof this.saveState === 'function',
        '%s needs a saveState method in order to store state',
        this.constructor.name
      );

      this.saveState(key, state);
    }

    return key;
  }

  _schedule(location, done) {
    if (!this.beforeChangeListener) {
      done();
    } else {
      this._pendingLocation = location;

      this.beforeChangeListener.call(this, location, () => {
        if (this._pendingLocation === location) {
          this._pendingLocation = null;
          done();
          return true;
        }
        return false;
      });
    }
  }

  pushState(state, path) {
    var pendingLocation = this._createLocation(path, state, null, NavigationTypes.PUSH);
    this._schedule(pendingLocation, () => {
      this._doPushState(state, path)
    });
  }

  _doPushState(state, path) {
    var key = this._saveNewState(state);
    var entry = null;

    if (this.path === path) {
      entry = this.replace(path, key) || {};
    } else {
      entry = this.push(path, key) || {};
    }

    warning(
      entry.key || state == null,
      '%s does not support storing state',
      this.constructor.name
    );

    var location = this._createLocation(path, state, entry, NavigationTypes.PUSH);
    this._update(path, location);
  }

  replaceState(state, path) {
    var pendingLocation = this._createLocation(path, state, null, NavigationTypes.REPLACE);
    this._schedule(pendingLocation, () => {
      this._doReplaceState(state, path);
    });
  }

  _doReplaceState(state, path) {
    var key = this._saveNewState(state);
    var entry = this.replace(path, key) || {};

    warning(
      entry.key || state == null,
      '%s does not support storing state',
      this.constructor.name
    );

    var location = this._createLocation(path, state, entry, NavigationTypes.REPLACE);
    this._update(path, location);
  }

  back() {
    this.go(-1);
  }

  forward() {
    this.go(1);
  }

  _update(path, location, notify=true) {
    this.path = path;
    this.location = location;
    this._pendingLocation = null;

    if (notify)
      this._notifyChange();
  }

  _createLocation(path, state, entry, navigationType) {
    var pathname = getPathname(path);
    var queryString = getQueryString(path);
    var query = queryString ? this.parseQueryString(queryString) : null;
    return new Location(pathname, query, {...state, ...entry}, navigationType);
  }

}

export default History;
