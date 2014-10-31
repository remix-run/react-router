var React = require('react');

var ActiveRouteHandler = module.exports = React.createClass({
  contextTypes: {
    getActiveHandlers: React.PropTypes.func.isRequired
  },

  componentWillMount: function() {
    if (!this._activeRouteHandler) {
      var handlers = this.context.getActiveHandlers();
      this._activeRouteHandler = handlers.shift();
    }
  },

  render: function() {
    return this._activeRouteHandler ? this._activeRouteHandler(this.props) : null;
  }
});

