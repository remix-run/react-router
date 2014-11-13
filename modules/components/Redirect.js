var React = require('react');
var Route = require('../components/Route');

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
var Redirect = React.createClass({
  statics: {
    createRoute: function (props) {
      return Route({
        name: props.name,
        path: props.from,
        handler: createRedirectHandler(props.to, props.params, props.query)
      });
    }
  },

  propTypes: {
    from: React.PropTypes.string.isRequired,
    to: React.PropTypes.string.isRequired,
    params: React.PropTypes.object,
    query: React.PropTypes.object,
    isRedirect: React.PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      isRedirect: true
    };
  },

  render: function () {
    return null;
  }
});

module.exports = Redirect;

