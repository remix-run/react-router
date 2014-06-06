var React = require('react');

var RESERVED_PROPS = {
  name: true,
  path: true,
  handler: true,
  children: true // ReactChildren
};

var Route = React.createClass({

  statics: {

    getUnreservedProps: function (props) {
      var unreservedProps = {};

      for (var name in props) {
        if (!RESERVED_PROPS[name]) {
          unreservedProps[name] = props[name];
        }
      }

      return unreservedProps;
    }

  },

  propTypes: {
    name: React.PropTypes.string,
    path: React.PropTypes.string,
    handler: React.PropTypes.component.isRequired
  },

  /**
   * Returns a hash of props that should be passed along to this route's handler.
   */
  getHandlerProps: function () {
    return Route.getUnreservedProps(this.props);
  },

  render: function () {
    // This component is never actually inserted into the DOM, so we don't need to
    // return anything here. Instead, its props are used to configure a router.
    return;
  }

});

module.exports = Route;

