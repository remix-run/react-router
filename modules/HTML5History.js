/* jshint -W058 */
var assign = require('object-assign');
var NavigationTypes = require('./NavigationTypes');
var { getWindowPath, supportsHistory } = require('./DOMUtils');
var RefreshHistory = require('./RefreshHistory');
var DOMHistory = require('./DOMHistory');

function getSerializableState(history) {
  return {
    length: history.length,
    current: history.current,
    navigationType: history.navigationType
  };
}

function handlePopState(event) {
  if (event.state === undefined)
    return; // Ignore extraneous popstate events in WebKit.

  var state = event.state;

  if ('length' in state)
    HTML5History.length = state.length

  if ('current' in state)
    HTML5History.current = state.current;

  HTML5History.navigationType = NavigationTypes.POP;
  HTML5History._notifyChange();
}

var state = window.history.state || {};

/**
 * A history implementation for DOM environments that support the
 * HTML5 history API (pushState, replaceState, and the popstate event).
 * Provides the cleanest URLs and a reliable canGo(n) in browser
 * environments. Should always be used in browsers if possible.
 */
var HTML5History = assign(new DOMHistory(state.length || 1, state.current, state.navigationType), {

  // Fall back to full page refreshes in browsers
  // that do not support the HTML5 history API.
  fallback: (supportsHistory() ? null : RefreshHistory),

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

  getPath: getWindowPath,

  push(path) {
    // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-pushstate
    this.navigationType = NavigationTypes.PUSH;
    this.current += 1;
    this.length = this.current + 1;
    window.history.pushState(getSerializableState(this), '', path);
    this._notifyChange();
  },

  replace(path) {
    // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-replacestate
    this.navigationType = NavigationTypes.REPLACE;
    window.history.replaceState(getSerializableState(this), '', path);
    this._notifyChange();
  }

});

module.exports = HTML5History;
