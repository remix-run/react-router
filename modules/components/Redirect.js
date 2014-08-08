var React = require('react');
var Route = require('./Route');

function Redirect(props) {
  return Route({
    name: props.name,
    path: props.from,
    handler: createRedirectClass(props.to)
  });
}

function createRedirectClass(to) {
  return React.createClass({
    statics: {
      willTransitionTo: function(transition, params, query) {
        transition.redirect(to, params, query);
      }
    },

    render: function() {
      return null;
    }
  });
}

module.exports = Redirect;
