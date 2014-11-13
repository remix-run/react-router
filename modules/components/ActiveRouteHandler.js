var React = require('react');
var REF_NAME = '__activeRouteHandler__';

/**
 * An <ActiveRouteHandler> component renders the active child route handler
 * when routes are nested.
 */
var ActiveRouteHandler = React.createClass({

  contextTypes: {
    getActiveRouteHandlerFor: React.PropTypes.func.isRequired,
    registerRef: React.PropTypes.func.isRequired,
    unregisterRef: React.PropTypes.func.isRequired
  },

  registerRef: function () {
    this._refIndex = this.context.registerRef(this.refs[REF_NAME], this._refIndex);
  },

  componentDidUpdate: function () {
    this.registerRef();
  },

  componentDidMount: function () {
    this.registerRef();
  },

  componentWillUnmount: function () {
    this.context.unregisterRef(this._refIndex);
  },

  render: function () {
    var Handler = this.context.getActiveRouteHandlerFor(this._owner.constructor);

    if (!Handler)
      return null;

    this.props.ref = REF_NAME;
    var handler = React.createElement(Handler, this.props);

    return handler;
  }

});

module.exports = ActiveRouteHandler;
