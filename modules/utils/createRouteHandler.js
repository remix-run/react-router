var React = require('react');
var assign = require('react/lib/Object.assign');
var invariant = require('react/lib/invariant');
var RouteHandler = require('../components/RouteHandler');
var HashLocation = require('../locations/HashLocation');
var Route = require('../Route');
var Match = require('../Match');
var Path = require('./Path');

function routeIsActive(activeRoutes, routeName) {
  return activeRoutes.some(function (route) {
    return route.name === routeName;
  });
}

function paramsAreActive(activeParams, params) {
  for (var property in params)
    if (String(activeParams[property]) !== String(params[property]))
      return false;

  return true;
}

function queryIsActive(activeQuery, query) {
  for (var property in query)
    if (String(activeQuery[property]) !== String(query[property]))
      return false;

  return true;
}

/**
 * Returns a React class that can be used to render the current state of
 * the given Router.
 */
function createRouteHandler(router, location) {
  var LocationContext = {

    /**
     * Returns the location (static or dynamic) that is in use.
     */
    getLocation: function () {
      return location;
    },

    childContextTypes: {
      location: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.object
      ]).isRequired
    },

    getChildContext: function () {
      // TODO: move this somewhere better? it was in the `render` method but
      // context all gets setup before render is called, so this is our chance to
      // flip the switch
      router.flipSwitch();

      return {
        location: this.getLocation()
      };
    }

  };

  var StateContext = {

    /**
     * Returns the current URL path + query string.
     */
    getCurrentPath: function () {
      return router.state.path;
    },

    /**
     * Returns a read-only array of the currently active routes.
     */
    getCurrentRoutes: function () {
      return router.state.routes.slice(0);
    },

    /**
     * Returns a read-only object of the currently active URL parameters.
     */
    getCurrentParams: function () {
      return assign({}, router.state.params);
    },

    /**
     * Returns a read-only object of the currently active query parameters.
     */
    getCurrentQuery: function () {
      return assign({}, router.state.query);
    },

    /**
     * Returns true if the given route, params, and query are active.
     */
    isActive: function (to, params, query) {
      if (Path.isAbsolute(to))
        return to === router.state.path;

      return routeIsActive(router.state.routes, to) &&
        paramsAreActive(router.state.params, params) &&
        (query == null || queryIsActive(router.state.query, query));
    },

    childContextTypes: {
      currentPath: React.PropTypes.string.isRequired,
      currentRoutes: React.PropTypes.arrayOf(React.PropTypes.instanceOf(Route)).isRequired,
      currentParams: React.PropTypes.object.isRequired,
      currentQuery: React.PropTypes.object.isRequired,
      isActive: React.PropTypes.func.isRequired
    },

    getChildContext: function () {
      return {
        currentPath: this.getCurrentPath(),
        currentRoutes: this.getCurrentRoutes(),
        currentParams: this.getCurrentParams(),
        currentQuery: this.getCurrentQuery(),
        isActive: this.isActive
      };
    }

  };

  var NavigationContext = {

    /**
     * Returns an absolute URL path created from the given route
     * name, URL parameters, and query.
     */
    makePath: function (to, params, query) {
      return router.makePath(to, params, query);
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

    childContextTypes: {
      makePath: React.PropTypes.func.isRequired,
      makeHref: React.PropTypes.func.isRequired,
      transitionTo: React.PropTypes.func.isRequired,
      replaceWith: React.PropTypes.func.isRequired,
      goBack: React.PropTypes.func.isRequired
    },

    getChildContext: function () {
      return {
        makePath: this.makePath,
        makeHref: this.makeHref,
        transitionTo: this.transitionTo,
        replaceWith: this.replaceWith,
        goBack: this.goBack
      };
    }

  };

  var RouteHandlerContext = {

    componentWillMount: function () {
      this._routeHandlerElements = [];
    },

    registerRouteHandlerElement: function (element) {
      var elements = this._routeHandlerElements;

      invariant(
        !elements.some(function (el) {
          return el._owner === element._owner
        }),
        'Using <RouteHandler> twice in the same render method is not allowed'
      );

      elements.push(element);

      return elements.length - 1;
    },

    unregisterRouteHandlerElement: function (element) {
      var elements = this._routeHandlerElements;

      // We're assuming that elements are unmounted starting
      // at children. If that is incorrect, we need to revise.

      // TODO: Put this inside a __DEV__ guard. Right
      // now it's just a sanity check.
      invariant(
        elements[elements.length - 1] === element,
        'The <RouteHandler> stack is corrupt'
      );

      elements.pop();
    },

    getRouteMatchAtDepth: function (depth) {
      return router.state.matches[depth];
    },

    childContextTypes: {
      registerRouteHandlerElement: React.PropTypes.func.isRequired,
      unregisterRouteHandlerElement: React.PropTypes.func.isRequired,
      getRouteMatchAtDepth: React.PropTypes.func.isRequired
    },

    getChildContext: function () {
      return {
        registerRouteHandlerElement: this.registerRouteHandlerElement,
        unregisterRouteHandlerElement: this.unregisterRouteHandlerElement,
        getRouteMatchAtDepth: this.getRouteMatchAtDepth
      };
    }

  };

  return React.createClass({

    displayName: 'RouteHandler',

    mixins: [ LocationContext, StateContext, NavigationContext, RouteHandlerContext ],

    propTypes: {
      children: function (props, propName, componentName) {
        if (props[propName] != null)
          return new Error('You cannot pass children to a RouteHandler');
      }
    },

    render: function () {
      var route = router.state.routes[0];
      return route ? React.createElement(RouteHandler, this.props) : null;
    }

  });
}

module.exports = createRouteHandler;
