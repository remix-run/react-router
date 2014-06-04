var React = require('react');

var Route = React.createClass({

  propTypes: {
    name: React.PropTypes.string,
    path: React.PropTypes.string,
    handler: React.PropTypes.component.isRequired
  },

  render: function () {
    // This component is never actually inserted into the DOM, so we don't
    // need to return anything here. Instead, the <Routes> component simply
    // uses its props to determine which handler to run when the route matches.
    return;
  }

});

module.exports = Route;

