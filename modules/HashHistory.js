/* jshint -W058 */
var assign = require('object-assign');
var warning = require('react/lib/warning');
var NavigationTypes = require('./NavigationTypes');
var { isAbsolutePath } = require('./PathUtils');
var { getHashPath, setHashPath } = require('./DOMUtils');
var DOMHistory = require('./DOMHistory');

function ensureSlash() {
  var path = getHashPath();

  if (isAbsolutePath(path))
    return true;

  setHashPath('/' + path);

  return false;
}

function handleHashChange() {
  if (ensureSlash()) {
    HashHistory._notifyChange();

    // On the next hashchange we want this to be accurate.
    HashHistory.navigationType = null;
  }
}

/**
 * A history implementation for DOM environments that uses window.location.hash
 * to store the current path. This is a hack for older browsers that do not
 * support the HTML5 history API (IE <= 9). It is currently used as the
 * default in DOM environments because it offers the widest range of support
 * without requiring server-side changes. However, the canGo* methods are not
 * reliable.
 */
var HashHistory = assign(new DOMHistory(1), {

  addChangeListener(listener) {
    DOMHistory.prototype.addChangeListener.call(this, listener);

    if (this.changeListeners.length === 1) {
      if (window.addEventListener) {
        window.addEventListener('hashchange', handleHashChange, false);
      } else {
        window.attachEvent('onhashchange', handleHashChange);
      }
    }
  },

  removeChangeListener(listener) {
    DOMHistory.prototype.removeChangeListener.call(this, listener);

    if (this.changeListeners.length === 0) {
      if (window.removeEventListener) {
        window.removeEventListener('hashchange', handleHashChange, false);
      } else {
        window.removeEvent('onhashchange', handleHashChange);
      }
    }
  },

  getPath: function () {
    ensureSlash();
    return getHashPath();
  },

  push(path) {
    this.current += 1;
    this.length = Math.min(this.length, this.current + 1);
    this.navigationType = NavigationTypes.PUSH;
    window.location.hash = path;
  },

  replace(path) {
    this.navigationType = NavigationTypes.REPLACE;
    setHashPath(path);
  },

  canGo(n) {
    warning(
      false,
      'HashHistory keeps session length in memory, so canGo(n) is not durable. Use HTML5History instead'
    );

    return DOMHistory.prototype.canGo.call(this, n);
  },

  makeHref(path) {
    return '#' + path;
  }

});

module.exports = HashHistory;
