var runRouter = require('./runRouter');
var invariant = require('react/lib/invariant');

/**
 * A high-level convenience method that creates, configures, and
 * runs a router synchonously in one shot. The method signature is:
 *
 *   { Handler, state } = Router.runSync(routes[, location ]);
 *
 * Using the current URL path on the server-side:
 *
 *   { Handler } = Router.runSync(routes, req.path);
 *   React.render(<Handler/>, document.body);
 *
 * Using `window.location.hash` to manage the URL, you could do:
 *
 *   { Handler } = Router.runSync(routes);
 *   React.render(<Handler/>, document.body);
 *
 * Using HTML5 history and a custom "cursor" prop:
 *
 *   { Handler } = Router.runSync(routes, Router.HistoryLocation);
 *   React.render(<Handler cursor={cursor}/>, document.body);
 *
 * Note: In contrast to Router.run, this method acts on the
 * assumption that all routing is fully synchronous, which is
 * usually the case. The sole exception to this are route handlers
 * with transition hooks taking a callback that is asynchronously
 * invoked when transitioning. On the server-side, this affects
 * only willTransitionTo (with a callback argument).
 */
function runRouterSync(routes, location) {
  var result = null;

  runRouter(routes, location, function(Handler, state) {
    result = { Handler: Handler, state: state };
  });

  invariant(
    result,
    'You cannot use "runSync" when your transition hook is async'
  );

  return result;
}

module.exports = runRouterSync;
