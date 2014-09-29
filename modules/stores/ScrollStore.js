var LocationDispatcher = require('../dispatchers/LocationDispatcher');
var ActionTypes = require('../constants/ActionTypes');
var warning = require('react/lib/warning');

var _scrollStrategy = null;
var _scrollPosition = null;

/**
 * The ScrollStore keeps track of the scrolling position
 * that needs to be set after the path change, and
 * the scrolling strategy that is used to determine it.
 */
var ScrollStore = {
  setup: function (scrollStrategy) {
    if (_scrollStrategy !== null) {
      warning(
        _scrollStrategy === scrollStrategy,
        'Cannot use strategy %s, already using %s', scrollStrategy, _scrollStrategy
      );
      return;
    }

    _scrollPosition = null;
    _scrollStrategy = scrollStrategy;

    if (typeof _scrollStrategy.setup === 'function')
      _scrollStrategy.setup();
  },

  teardown: function () {
    if (_scrollStrategy !== null) {
      if (typeof _scrollStrategy.teardown === 'function')
        _scrollStrategy.teardown();

      _scrollStrategy = null;
      _scrollPosition = null;
    }
  },

 /**
  * Returns the scroll position for the current path
  * according to the strategy specified in <Routes />.
  *
  * When falsy, the router won't attempt to restore scroll position.
  */
  getScrollPosition: function () {
    return _scrollPosition;
  },

  dispatchToken: LocationDispatcher.register(function (payload) {
    var action = payload.action;

    switch (action.type) {
      case ActionTypes.SETUP:
      case ActionTypes.PUSH:
      case ActionTypes.REPLACE:
      case ActionTypes.POP:
        _scrollPosition = _scrollStrategy.getScrollPosition(payload.action);
        break;
    }
  })

};

module.exports = ScrollStore;