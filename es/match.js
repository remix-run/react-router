var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

import { REPLACE } from 'history/lib/Actions';
import invariant from 'invariant';

import createMemoryHistory from './createMemoryHistory';
import createTransitionManager from './createTransitionManager';
import { createRoutes } from './RouteUtils';
import { createRouterObject } from './RouterUtils';

/**
 * A high-level API to be used for server-side rendering.
 *
 * This function matches a location to a set of routes and calls
 * callback(error, redirectLocation, renderProps) when finished.
 *
 * Note: You probably don't want to use this in a browser unless you're using
 * server-side rendering with async routes.
 */
function match(_ref, callback) {
  var history = _ref.history,
      routes = _ref.routes,
      location = _ref.location,
      options = _objectWithoutProperties(_ref, ['history', 'routes', 'location']);

  !(history || location) ? process.env.NODE_ENV !== 'production' ? invariant(false, 'match needs a history or a location') : invariant(false) : void 0;

  history = history ? history : createMemoryHistory(options);
  var transitionManager = createTransitionManager(history, createRoutes(routes));

  if (location) {
    // Allow match({ location: '/the/path', ... })
    location = history.createLocation(location);
  } else {
    location = history.getCurrentLocation();
  }

  transitionManager.match(location, function (error, redirectLocation, nextState) {
    var renderProps = void 0;

    if (nextState) {
      var router = createRouterObject(history, transitionManager, nextState);
      renderProps = _extends({}, nextState, {
        router: router,
        matchContext: { transitionManager: transitionManager, router: router }
      });
    }

    callback(error, redirectLocation && history.createLocation(redirectLocation, REPLACE), renderProps);
  });
}

export default match;