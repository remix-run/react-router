var copyProperties = require('react/lib/copyProperties');
var Dispatcher = require('flux').Dispatcher;

/**
 * Dispatches actions that modify the URL.
 */
var LocationDispatcher = copyProperties(new Dispatcher, {

  handleViewAction: function (action) {
    this.dispatch({
      source: 'VIEW_ACTION',
      action: action
    });
  }

});

module.exports = LocationDispatcher;
