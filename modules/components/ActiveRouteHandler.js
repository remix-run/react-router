var React = require('react');

/**
 * An <ActiveRouteHandler> component renders the active child route handler
 * when routes are nested.
 */
var ActiveRouteHandler = React.createClass({

  contextTypes: {
    getActiveRouteHandlerFor: React.PropTypes.func.isRequired
  },

  render: function () {
    var handler = this.context.getActiveRouteHandlerFor(this._owner);
    return handler ? React.createElement(handler, this.props) : null;
  }

});

module.exports = ActiveRouteHandler;
