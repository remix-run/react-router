var merge = require('react/lib/merge');
var Route = require('./Route');

function NotFoundRoute(props) {
  return Route(
    merge(props, {
      path: null,
      catchAll: true
    })
  );
}

module.exports = NotFoundRoute;
