var supportsHistory = require('../utils/supportsHistory');
var HistoryLocation = require('../locations/HistoryLocation');
var RefreshLocation = require('../locations/RefreshLocation');
var LocationDispatcher = require('../dispatchers/LocationDispatcher');
var ActionTypes = require('../constants/ActionTypes');
var warning = require('react/lib/warning');
var invariant = require('react/lib/invariant');
var isAbsoluteURL = require('../utils/isAbsoluteURL');
var makePath = require('../utils/makePath');

function loadURL(url) {
  window.location = url;
}

var _location = null;
var _pendingActions = [];
var _isDispatching = false;
var _previousPath = null;

/**
 * Safely enqueues action for dispatch in current tick.
 * If a different action is being dispatched, this action
 * will be dispatched right after it.
 */
function dispatchAction(actionType, operation) {
  _pendingActions.push({
    actionType: actionType,
    operation: operation
  });

  if (!_isDispatching) {
    dispatchPendingActions();
  }
}

/**
 * Dispatches all pending actions one by one.
 * If more pending actions are enqueued during the loop, they will be processed in the same tick.
 */
function dispatchPendingActions() {
  invariant(!_isDispatching, 'Cannot dispatch in the middle of dispatch');
  _isDispatching = true;

  while (_pendingActions.length > 0) {
    dispatchNextPendingAction();
  }

  _isDispatching = false;
}

function dispatchNextPendingAction() {
  var pendingAction = _pendingActions.shift();

  var operation = pendingAction.operation;
  var actionType = pendingAction.actionType;

  var scrollPosition = {
    x: window.scrollX,
    y: window.scrollY
  };

  if (typeof operation === 'function')
    operation(_location);

  var path = _location.getCurrentPath();

  LocationDispatcher.handleViewAction({
    type: actionType,
    path: path,
    scrollPosition: scrollPosition
  });

  _previousPath = path;
}

function handleChange() {
  var path = _location.getCurrentPath();

  // Ignore location change inside or caused by dispatchAction
  if (_isDispatching || path === _previousPath) {
    return;
  }

  dispatchAction(ActionTypes.POP);
}

/**
 * Actions that modify the URL.
 */
var LocationActions = {

  getLocation: function () {
    return _location;
  },

  setup: function (location) {
    // When using HistoryLocation, automatically fallback
    // to RefreshLocation in browsers that do not support
    // the HTML5 history API.
    if (location === HistoryLocation && !supportsHistory())
      location = RefreshLocation;

    if (_location !== null) {
      warning(
        _location === location,
        'Cannot use location %s, already using %s', location, _location
      );
      return;
    }

    _location = location;

    if (_location !== null) {
      dispatchAction(ActionTypes.SETUP, function (location) {
        if (typeof location.setup === 'function')
          location.setup(handleChange);
      });
    }
  },

  teardown: function () {
    if (_location !== null) {
      if (typeof _location.teardown === 'function')
        _location.teardown();

      _location = null;
    }
  },

  /**
   * Transitions to the URL specified in the arguments by pushing
   * a new URL onto the history stack.
   */
  transitionTo: function (to, params, query) {
    if (isAbsoluteURL(to)) {
      loadURL(to);
    } else {
      dispatchAction(ActionTypes.PUSH, function (location) {
        var path = makePath(to, params, query);
        location.push(path);
      });
    }
  },

  /**
   * Transitions to the URL specified in the arguments by replacing
   * the current URL in the history stack.
   */
  replaceWith: function (to, params, query) {
    if (isAbsoluteURL(to)) {
      loadURL(to);
    } else {
      dispatchAction(ActionTypes.REPLACE, function (location) {
        var path = makePath(to, params, query);
        location.replace(path);
      });
    }
  },

  /**
   * Transitions to the previous URL.
   */
  goBack: function () {
    dispatchAction(ActionTypes.POP, function (location) {
      location.pop();
    });
  }

};

module.exports = LocationActions;
