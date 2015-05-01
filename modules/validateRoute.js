var invariant = require('react/lib/invariant');

function validateRoute(route) {
  invariant(
    route.handler || route.getHandler,
    'Route %s needs a "handler" or "getHandler" property',
    route
  );
}

module.exports = validateRoute;
