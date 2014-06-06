var React = require('react');

var RESERVED_PROPS = {
  handler: true,
  name: true,
  path: true,
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
    handler: React.PropTypes.component.isRequired,
    name: React.PropTypes.string,
    path: React.PropTypes.string
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

