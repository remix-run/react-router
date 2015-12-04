'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var _warning = require('warning');

var _warning2 = _interopRequireDefault(_warning);

var _historyLibActions = require('history/lib/Actions');

var _historyLibUseQueries = require('history/lib/useQueries');

var _historyLibUseQueries2 = _interopRequireDefault(_historyLibUseQueries);

var _computeChangedRoutes2 = require('./computeChangedRoutes');

var _computeChangedRoutes3 = _interopRequireDefault(_computeChangedRoutes2);

var _TransitionUtils = require('./TransitionUtils');

var _isActive2 = require('./isActive');

var _isActive3 = _interopRequireDefault(_isActive2);

var _getComponents = require('./getComponents');

var _getComponents2 = _interopRequireDefault(_getComponents);

var _matchRoutes = require('./matchRoutes');

var _matchRoutes2 = _interopRequireDefault(_matchRoutes);

function hasAnyProperties(object) {
  for (var p in object) {
    if (object.hasOwnProperty(p)) return true;
  }return false;
}

/**
 * Returns a new createHistory function that may be used to create
 * history objects that know about routing.
 *
 * Enhances history objects with the following methods:
 *
 * - listen((error, nextState) => {})
 * - listenBeforeLeavingRoute(route, (nextLocation) => {})
 * - match(location, (error, redirectLocation, nextState) => {})
 * - isActive(pathname, query, indexOnly=false)
 */
function useRoutes(createHistory) {
  return function () {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var routes = options.routes;

    var historyOptions = _objectWithoutProperties(options, ['routes']);

    var history = _historyLibUseQueries2['default'](createHistory)(historyOptions);
    var state = {};

    function isActive(pathname, query) {
      var indexOnly = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      return _isActive3['default'](pathname, query, indexOnly, state.location, state.routes, state.params);
    }

    function createLocationFromRedirectInfo(_ref) {
      var pathname = _ref.pathname;
      var query = _ref.query;
      var state = _ref.state;

      return history.createLocation(history.createPath(pathname, query), state, _historyLibActions.REPLACE);
    }

    var partialNextState = undefined;

    function match(location, callback) {
      if (partialNextState && partialNextState.location === location) {
        // Continue from where we left off.
        finishMatch(partialNextState, callback);
      } else {
        _matchRoutes2['default'](routes, location, function (error, nextState) {
          if (error) {
            callback(error);
          } else if (nextState) {
            finishMatch(_extends({}, nextState, { location: location }), callback);
          } else {
            callback();
          }
        });
      }
    }

    function finishMatch(nextState, callback) {
      var _computeChangedRoutes = _computeChangedRoutes3['default'](state, nextState);

      var leaveRoutes = _computeChangedRoutes.leaveRoutes;
      var enterRoutes = _computeChangedRoutes.enterRoutes;

      _TransitionUtils.runLeaveHooks(leaveRoutes);

      _TransitionUtils.runEnterHooks(enterRoutes, nextState, function (error, redirectInfo) {
        if (error) {
          callback(error);
        } else if (redirectInfo) {
          callback(null, createLocationFromRedirectInfo(redirectInfo));
        } else {
          // TODO: Fetch components after state is updated.
          _getComponents2['default'](nextState, function (error, components) {
            if (error) {
              callback(error);
            } else {
              // TODO: Make match a pure function and have some other API
              // for "match and update state".
              callback(null, null, state = _extends({}, nextState, { components: components }));
            }
          });
        }
      });
    }

    var RouteGuid = 1;

    function getRouteID(route) {
      return route.__id__ || (route.__id__ = RouteGuid++);
    }

    var RouteHooks = {};

    function getRouteHooksForRoutes(routes) {
      return routes.reduce(function (hooks, route) {
        hooks.push.apply(hooks, RouteHooks[getRouteID(route)]);
        return hooks;
      }, []);
    }

    function transitionHook(location, callback) {
      _matchRoutes2['default'](routes, location, function (error, nextState) {
        if (nextState == null) {
          // TODO: We didn't actually match anything, but hang
          // onto error/nextState so we don't have to matchRoutes
          // again in the listen callback.
          callback();
          return;
        }

        // Cache some state here so we don't have to
        // matchRoutes() again in the listen callback.
        partialNextState = _extends({}, nextState, { location: location });

        var hooks = getRouteHooksForRoutes(_computeChangedRoutes3['default'](state, partialNextState).leaveRoutes);

        var result = undefined;
        for (var i = 0, len = hooks.length; result == null && i < len; ++i) {
          // Passing the location arg here indicates to
          // the user that this is a transition hook.
          result = hooks[i](location);
        }

        callback(result);
      });
    }

    function beforeUnloadHook() {
      // Synchronously check to see if any route hooks want
      // to prevent the current window/tab from closing.
      if (state.routes) {
        var hooks = getRouteHooksForRoutes(state.routes);

        var message = undefined;
        for (var i = 0, len = hooks.length; typeof message !== 'string' && i < len; ++i) {
          // Passing no args indicates to the user that this is a
          // beforeunload hook. We don't know the next location.
          message = hooks[i]();
        }

        return message;
      }
    }

    var unlistenBefore = undefined,
        unlistenBeforeUnload = undefined;

    /**
     * Registers the given hook function to run before leaving the given route.
     *
     * During a normal transition, the hook function receives the next location
     * as its only argument and must return either a) a prompt message to show
     * the user, to make sure they want to leave the page or b) false, to prevent
     * the transition.
     *
     * During the beforeunload event (in browsers) the hook receives no arguments.
     * In this case it must return a prompt message to prevent the transition.
     *
     * Returns a function that may be used to unbind the listener.
     */
    function listenBeforeLeavingRoute(route, hook) {
      // TODO: Warn if they register for a route that isn't currently
      // active. They're probably doing something wrong, like re-creating
      // route objects on every location change.
      var routeID = getRouteID(route);
      var hooks = RouteHooks[routeID];

      if (hooks == null) {
        var thereWereNoRouteHooks = !hasAnyProperties(RouteHooks);

        hooks = RouteHooks[routeID] = [hook];

        if (thereWereNoRouteHooks) {
          // setup transition & beforeunload hooks
          unlistenBefore = history.listenBefore(transitionHook);

          if (history.listenBeforeUnload) unlistenBeforeUnload = history.listenBeforeUnload(beforeUnloadHook);
        }
      } else if (hooks.indexOf(hook) === -1) {
        hooks.push(hook);
      }

      return function () {
        var hooks = RouteHooks[routeID];

        if (hooks != null) {
          var newHooks = hooks.filter(function (item) {
            return item !== hook;
          });

          if (newHooks.length === 0) {
            delete RouteHooks[routeID];

            if (!hasAnyProperties(RouteHooks)) {
              // teardown transition & beforeunload hooks
              if (unlistenBefore) {
                unlistenBefore();
                unlistenBefore = null;
              }

              if (unlistenBeforeUnload) {
                unlistenBeforeUnload();
                unlistenBeforeUnload = null;
              }
            }
          } else {
            RouteHooks[routeID] = newHooks;
          }
        }
      };
    }

    /**
     * This is the API for stateful environments. As the location
     * changes, we update state and call the listener. We can also
     * gracefully handle errors and redirects.
     */
    function listen(listener) {
      // TODO: Only use a single history listener. Otherwise we'll
      // end up with multiple concurrent calls to match.
      return history.listen(function (location) {
        if (state.location === location) {
          listener(null, state);
        } else {
          match(location, function (error, redirectLocation, nextState) {
            if (error) {
              listener(error);
            } else if (redirectLocation) {
              history.transitionTo(redirectLocation);
            } else if (nextState) {
              listener(null, nextState);
            } else {
              process.env.NODE_ENV !== 'production' ? _warning2['default'](false, 'Location "%s" did not match any routes', location.pathname + location.search + location.hash) : undefined;
            }
          });
        }
      });
    }

    return _extends({}, history, {
      isActive: isActive,
      match: match,
      listenBeforeLeavingRoute: listenBeforeLeavingRoute,
      listen: listen
    });
  };
}

exports['default'] = useRoutes;
module.exports = exports['default'];