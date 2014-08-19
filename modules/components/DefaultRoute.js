var merge = require('react/lib/merge');
var Route = require('./Route');

/**
 * A <DefaultRoute> component is a special kind of <Route> that
 * renders when its parent matches but none of its siblings do.
 * Only one such route may be used at any given level in the
 * route hierarchy.
 */
function DefaultRoute(props) {
  return Route(
    merge(props, {
      name: null,
      path: null
    })
  );
}

module.exports = DefaultRoute;
