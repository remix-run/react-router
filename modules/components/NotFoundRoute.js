var assign = require('react/lib/Object.assign');
var Route = require('./Route');

/**
 * A <NotFoundRoute> is a special kind of <Route> that
 * renders when the beginning of its parent's path matches
 * but none of its siblings do, including any <DefaultRoute>.
 * Only one such route may be used at any given level in the
 * route hierarchy.
 */
function NotFoundRoute(props) {
  return Route(
    assign({}, props, {
      path: null,
      catchAll: true
    })
  );
}

module.exports = NotFoundRoute;
