var React = require('react');
var withoutProperties = require('../helpers/withoutProperties');

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
      return withoutProperties(props, RESERVED_PROPS);
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

