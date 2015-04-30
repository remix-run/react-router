/* jshint -W058 */
var assign = require('react/lib/Object.assign');
var NavigationTypes = require('../NavigationTypes');
var { getWindowPath } = require('../DOMUtils');
var DOMHistory = require('./DOMHistory');

function createState(state) {
  var length = state && state.length;
  var current = state && state.current;

  if (typeof length !== 'number' || isNaN(length) || length < 1)
    length = 1;

  if (typeof current !== 'number' || isNaN(current) || current >= length)
    current = length - 1;

  return {
    length,
    current
  };
}

var state = createState(window.history.state);

function handlePopState(event) {
  if (event.state === undefined)
    return; // Ignore extraneous popstate events in WebKit.

  state = createState(event.state);

  HTML5History.notifyChange(NavigationTypes.POP);
}

/**
 * A history implementation for DOM environments that support the
 * HTML5 history API (pushState and replaceState). Provides the
 * cleanest URLs and a reliable canGo(n) in browser environments.
 * Should always be used if possible in browsers.
 */
var HTML5History = assign(new DOMHistory, {

  addChangeListener(listener) {
    DOMHistory.prototype.addChangeListener.call(this, listener);

    if (this.changeListeners.length === 1) {
      if (window.addEventListener) {
        window.addEventListener('popstate', handlePopState, false);
      } else {
        window.attachEvent('onpopstate', handlePopState);
      }
    }
  },

  removeChangeListener(listener) {
    DOMHistory.prototype.removeChangeListener.call(this, listener);

    if (this.changeListeners.length === 0) {
      if (window.removeEventListener) {
        window.removeEventListener('popstate', handlePopState, false);
      } else {
        window.removeEvent('onpopstate', handlePopState);
      }
    }
  },

  getLength() {
    return state.length;
  },

  getCurrent() {
    return state.current;
  },

  getCurrentPath: getWindowPath,

  push(path) {
    // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-pushstate
    state.current += 1;
    state.length = state.current + 1;
    window.history.pushState(state, '', path);
    this.notifyChange(NavigationTypes.PUSH);
  },

  replace(path) {
    // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-replacestate
    window.history.replaceState(state, '', path);
    this.notifyChange(NavigationTypes.REPLACE);
  }

});

module.exports = HTML5History;
