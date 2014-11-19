var React = require('react');
var warning = require('react/lib/warning');
var invariant = require('react/lib/invariant');
var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;
var ImitateBrowserBehavior = require('../behaviors/ImitateBrowserBehavior');
var RouteHandler = require('../components/RouteHandler');
var HashLocation = require('../locations/HashLocation');
var HistoryLocation = require('../locations/HistoryLocation');
var NavigationContext = require('../mixins/NavigationContext');
var StateContext = require('../mixins/StateContext');
var RouteHandlerContext = require('../mixins/RouteHandlerContext');
var Scrolling = require('../mixins/Scrolling');
var createRoutesFromChildren = require('../utils/createRoutesFromChildren');
var supportsHistory = require('../utils/supportsHistory');
var Transition = require('../utils/Transition');
var Redirect = require('../utils/Redirect');
var Path = require('../utils/Path');

/**
 * The default location for new routers.
 */
var DEFAULT_LOCATION = canUseDOM ? HashLocation : '/';

/**
 * The default scroll behavior for new routers.
 */
var DEFAULT_SCROLL_BEHAVIOR = canUseDOM ? ImitateBrowserBehavior : null;

/**
 * The default error handler for new routers.
 */
function defaultErrorHandler(error) {
  // Throw so we don't silently swallow async errors.
  throw error; // This error probably originated in a transition hook.
}

/**
 * The default aborted transition handler for new routers.
 */
function defaultAbortHandler(abortReason, location) {
  if (typeof location === 'string')
    throw new Error('Unhandled aborted transition! Reason: ' + abortReason);

  if (abortReason instanceof Redirect) {
    location.replace(this.makePath(abortReason.to, abortReason.params, abortReason.query));
  } else {
    location.pop();
  }
}

function findMatch(pathname, routes, defaultRoute, notFoundRoute) {
  var match, route, params;

  for (var i = 0, len = routes.length; i < len; ++i) {
    route = routes[i];

    // Check the subtree first to find the most deeply-nested match.
    match = findMatch(pathname, route.childRoutes, route.defaultRoute, route.notFoundRoute);

    if (match != null) {
      match.routes.unshift(route);
      return match;
    }

    // No routes in the subtree matched, so check this route.
    params = Path.extractParams(route.path, pathname);

    if (params)
      return createMatch(route, params);
  }

  // No routes matched, so try the default route if there is one.
  if (defaultRoute && (params = Path.extractParams(defaultRoute.path, pathname)))
    return createMatch(defaultRoute, params);

  // Last attempt: does the "not found" route match?
  if (notFoundRoute && (params = Path.extractParams(notFoundRoute.path, pathname)))
    return createMatch(notFoundRoute, params);

  return match;
}

function createMatch(route, params) {
  return { path: null, routes: [ route ], params: params, query: null };
}

function hasMatch(routes, route, prevParams, nextParams) {
  return routes.some(function (r) {
    if (r !== route)
      return false;

    var paramNames = route.paramNames;
    var paramName;

    for (var i = 0, len = paramNames.length; i < len; ++i) {
      paramName = paramNames[i];

      if (nextParams[paramName] !== prevParams[paramName])
        return false;
    }

    return true;
  });
}

/**
 * Creates and returns a new router using the given options. A router
 * is a ReactElement class that knows how to react to changes in the URL
 * and keep the contents of the page in sync.
 *
 * Options may be any of the following:
 *
 * - routes           (required) The route config
 * - location         The location to use. Defaults to HashLocation when
 *                    the DOM is available, "/" otherwise
 * - scrollBehavior   The scroll behavior to use. Defaults to ImitateBrowserBehavior
 *                    when the DOM is available, null otherwise
 * - onError          A function that is used to handle errors
 * - onAbort          A function that is used to handle aborted transitions
 *
 * When rendering in a server-side environment, the location should simply
 * be the URL path that was used in the request, including the query string.
 */
function createRouter(options) {
  options = options || {};

  if (typeof options === 'function') {
    options = { routes: options }; // Router.create(<Route>)
  } else if (Array.isArray(options)) {
    options = { routes: options }; // Router.create([ <Route>, <Route> ])
  }

  var routes = [];
  var namedRoutes = {};
  var elements = [];
  var location = options.location || DEFAULT_LOCATION;
  var scrollBehavior = options.scrollBehavior || DEFAULT_SCROLL_BEHAVIOR;
  var onError = options.onError || defaultErrorHandler;
  var onAbort = options.onAbort || defaultAbortHandler;
  var state = {};

  // Automatically fall back to full page refreshes in
  // browsers that don't support the HTML history API.
  if (location === HistoryLocation && !supportsHistory())
    location = RefreshLocation;

  var router = React.createClass({

    displayName: 'Router',

    mixins: [ NavigationContext, StateContext, RouteHandlerContext, Scrolling ],

    statics: {

      defaultRoute: null,
      notFoundRoute: null,

      /**
       * Adds routes to this router from the given children object (see ReactChildren).
       */
      addRoutes: function (children) {
        routes.push.apply(routes, createRoutesFromChildren(children, this, namedRoutes));
      },

      /**
       * Returns an absolute URL path created from the given route
       * name, URL parameters, and query.
       */
      makePath: function (to, params, query) {
        var path;
        if (Path.isAbsolute(to)) {
          path = Path.normalize(to);
        } else {
          var route = namedRoutes[to];

          invariant(
            route,
            'Unable to find a <Route> with name="%s"',
            to
          );

          path = route.path;
        }

        return Path.withQuery(Path.injectParams(path, params), query);
      },

      /**
       * Returns a string that may safely be used as the href of a link
       * to the route with the given name, URL parameters, and query.
       */
      makeHref: function (to, params, query) {
        var path = this.makePath(to, params, query);
        return (location === HashLocation) ? '#' + path : path;
      },

      /**
       * Transitions to the URL specified in the arguments by pushing
       * a new URL onto the history stack.
       */
      transitionTo: function (to, params, query) {
        invariant(
          typeof location !== 'string',
          'You cannot use transitionTo with a static location'
        );

        location.push(this.makePath(to, params, query));
      },

      /**
       * Transitions to the URL specified in the arguments by replacing
       * the current URL in the history stack.
       */
      replaceWith: function (to, params, query) {
        invariant(
          typeof location !== 'string',
          'You cannot use replaceWith with a static location'
        );

        location.replace(this.makePath(to, params, query));
      },

      /**
       * Transitions to the previous URL.
       */
      goBack: function () {
        invariant(
          typeof location !== 'string',
          'You cannot use goBack with a static location'
        );

        location.pop();
      },

      /**
       * Performs a match of the given path against this router and returns an object with
       * the { path, routes, params, query } that match. Returns null if no match can be made.
       */
      match: function (path) {
        var pathname = Path.withoutQuery(path);
        var match = findMatch(pathname, routes, this.defaultRoute, this.notFoundRoute);

        if (match == null)
          return null;

        match.path = path;
        match.query = Path.extractQuery(path) || {};

        return match;
      },

      /**
       * Performs a transition to the given path and calls callback(error, abortReason)
       * when the transition is finished. If both arguments are null the router's state
       * was updated. Otherwise the transition did not complete.
       *
       * In a transition, a router first determines which routes are involved by beginning
       * with the current route, up the route tree to the first parent route that is shared
       * with the destination route, and back down the tree to the destination route. The
       * willTransitionFrom hook is invoked on all route handlers we're transitioning away
       * from, in reverse nesting order. Likewise, the willTransitionTo hook is invoked on
       * all route handlers we're transitioning to.
       *
       * Both willTransitionFrom and willTransitionTo hooks may either abort or redirect the
       * transition. To resolve asynchronously, they may use transition.wait(promise). If no
       * hooks wait, the transition is fully synchronous.
       */
      dispatch: function (action, path, callback) {
        if (state.path === path)
          return; // Nothing to do!

        var nextState = this.match(path);

        warning(
          nextState != null,
          'No route matches path "%s". Make sure you have <Route path="%s"> somewhere in your routes',
          path, path
        );

        if (nextState == null)
          nextState = {};

        var prevRoutes = state.routes || [];
        var prevParams = state.params || {};

        var nextRoutes = nextState.routes || [];
        var nextParams = nextState.params || {};
        var nextQuery = nextState.query || {};

        var fromRoutes, toRoutes;
        if (prevRoutes.length) {
          fromRoutes = prevRoutes.filter(function (route) {
            return !hasMatch(nextRoutes, route, prevParams, nextParams);
          });

          toRoutes = nextRoutes.filter(function (route) {
            return !hasMatch(prevRoutes, route, prevParams, nextParams);
          });
        } else {
          fromRoutes = [];
          toRoutes = nextRoutes;
        }

        var transition = new Transition(path, this.replaceWith.bind(this, path));

        transition.from(fromRoutes, elements, function (error) {
          if (error || transition.isAborted)
            return callback.call(router, error, transition);

          transition.to(toRoutes, nextParams, nextQuery, function (error) {
            if (error || transition.isAborted)
              return callback.call(router, error, transition);

            state = nextState;
            state.action = action;

            callback.call(router, null, transition);
          });
        });
      },

      /**
       * Starts this router and calls callback(state, router) when the route changes.
       *
       * If the router's location is static (i.e. a URL path in a server environment)
       * the callback is called only once. Otherwise, the location should be one of the
       * Router.*Location objects (e.g. Router.HashLocation or Router.HistoryLocation).
       */
      run: function (callback) {
        function dispatchHandler(error, transition) {
          if (error) {
            onError.call(router, error);
          } else if (transition.isAborted) {
            onAbort.call(router, transition.abortReason, location);
          } else {
            callback.call(router, router, state);
          }
        }

        if (typeof location === 'string') {
          warning(
            !canUseDOM || process.env.NODE_ENV === 'test',
            'You should not use a static location in a DOM environment because ' +
            'the router will not be kept in sync with the current URL'
          );

          // Dispatch the location.
          router.dispatch(null, location, dispatchHandler);
        } else {
          invariant(
            canUseDOM,
            'You cannot use %s in a non-DOM environment',
            location
          );

          // Listen for changes to the location.
          function changeListener(change) {
            router.dispatch(change.type, change.path, dispatchHandler);
          }

          if (location.addChangeListener)
            location.addChangeListener(changeListener);

          // Bootstrap using the current path.
          router.dispatch(null, location.getCurrentPath(), dispatchHandler);
        }
      }

    },

    propTypes: {
      children: function (props, propName, componentName) {
        if (props[propName] != null)
          return new Error('You cannot pass children to a Router');
      }
    },

    getLocation: function () {
      return location;
    },

    getScrollBehavior: function () {
      return scrollBehavior;
    },

    getElements: function () {
      return elements;
    },

    getInitialState: function () {
      return state;
    },

    componentWillReceiveProps: function () {
      this.setState(state);
    },

    render: function () {
      return this.state.routes.length ? React.createElement(RouteHandler, this.props) : null;
    }

  });

  if (options.routes)
    router.addRoutes(options.routes);

  return router;
}

module.exports = createRouter;
