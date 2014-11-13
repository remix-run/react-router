var React = require('react');
var ConfigRoute = require('../mixins/ConfigRoute');

/**
 * A <NotFoundRoute> is a special kind of <Route> that
 * renders when the beginning of its parent's path matches
 * but none of its siblings do, including any <DefaultRoute>.
 * Only one such route may be used at any given level in the
 * route hierarchy.
 */
var NotFoundRoute = React.createClass({
  mixins: [ ConfigRoute ],

  getDefaultProps: function () {
    return {
      // TODO: make sure we ignore any path the user might supply, or
      // throw/warn when we encounter it
      path: null,
      catchAll: true
    };
  }
});

module.exports = NotFoundRoute;

