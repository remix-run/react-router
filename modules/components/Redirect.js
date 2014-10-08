var React = require('react');
var Route = require('./Route');

function createRedirectHandler(to, _params, _query) {
  return React.createClass({
    statics: {
      willTransitionTo: function (transition, params, query) {
        transition.redirect(to, _params || params, _query || query);
      }
    },

    render: function () {
      return null;
    }
  });
}

/**
 * A <Redirect> component is a special kind of <Route> that always
 * redirects to another route when it matches.
 */
function Redirect(props) {
  return Route({
    name: props.name,
    path: props.from || props.path || '*',
    handler: createRedirectHandler(props.to, props.params, props.query)
  });
}

module.exports = Redirect;
