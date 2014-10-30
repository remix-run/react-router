var React = require('react');

var ActiveHandler = module.exports = React.createClass({
  contextTypes: {
    lookupActiveRouteHandler: React.PropTypes.func.isRequired
  },

  render: function() {
    var Handler = this.context.lookupActiveRouteHandler();
    return Handler(this.props);
  }
});

