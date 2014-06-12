var React = require('react');

var RESERVED_PROPS = {
  handler: true,
  name: true,
  path: true,
  children: true // ReactChildren
};

/**
 * Route components are used to configure a Router (see the Router docs).
 */
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

  render: function () {
    // This component is never actually inserted into the DOM, so we don't need to
    // return anything here. Instead, its props are used to configure a Router.
  }

});

module.exports = Route;

