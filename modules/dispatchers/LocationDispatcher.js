var copyProperties = require('react/lib/copyProperties');
var Dispatcher = require('flux').Dispatcher;
var PayloadSources = require('../constants/PayloadSources');

/**
 * Dispatches actions that modify the URL.
 */
var LocationDispatcher = copyProperties(new Dispatcher, {

  handleViewAction: function (action) {
    this.dispatch({
      source: PayloadSources.VIEW_ACTION,
      action: action
    });
  },

  handleBrowserAction: function (action) {
    this.dispatch({
      source: PayloadSources.BROWSER_ACTION,
      action: action
    });
  },

});

module.exports = LocationDispatcher;
