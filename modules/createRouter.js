var React = require('react');
var assign = require('object-assign');
var invariant = require('react/lib/invariant');
var { object, string, oneOfType } = React.PropTypes;
var { location } = require('./PropTypes');
var isReactChildren = require('./isReactChildren');
var createRoutesFromReactChildren = require('./createRoutesFromReactChildren');
var { isAbsolutePath, stripLeadingSlashes, stripTrailingSlashes, withQuery, injectParams } = require('./PathUtils');
var AbstractHistory = require('./AbstractHistory');
var { mapAsync } = require('./AsyncUtils');
var StateMixin = require('./StateMixin');
var findMatch = require('./findMatch');
var Transition = require('./Transition');
var Location = require('./Location');

function createElement(component, props) {
  return typeof component === 'function' ? React.createElement(component, props) : null;
}

function getComponents(route, callback) {
  if (route.component || route.components) {
    callback(null, route.component || route.components);
  } else if (route.getComponents) {
    route.getComponents(callback);
  } else {
    callback();
  }
}

function getComponentsForBranch(branch, callback) {
  mapAsync(branch, function (route, index, callback) {
    getComponents(route, callback);
  }, callback);
}

function searchRoutesSync(routes, test) {
  var route, branch;
  for (var i = 0, len = routes.length; i < len; ++i) {
    route = routes[i];

    if (test(route))
      return [ route ];

    if (route.childRoutes && (branch = searchRoutesSync(route.childRoutes, test))) {
      branch.unshift(route);
      return branch;
    }
  }

  return null;
}

function getBranchToRoute(routes, route) {
  return searchRoutesSync(routes, function (r) {
    return r === route;
  });
}

function getBranchToRouteWithName(routes, name) {
  return searchRoutesSync(routes, function (route) {
    return route.name === name;
  });
}

function makePatternFromBranch(branch) {
  return branch.reduce(function (pattern, route) {
    return stripTrailingSlashes(pattern) + '/' + stripLeadingSlashes(route.path);
  }, '');
}

/**
 * Wraps the given component in a new Router component. The Router component
 * gets its state from one of two places:
 *
 * - A History object
 * - A single Location object
 *
 * A History object acts like a store for Location objects and emits new
 * ones as the location changes over time (i.e. a user navigates around your
 * site). History objects are included for all the most common scenarios in
 * which the router may be used.
 *
 *   var HTML5History = require('react-router/HTML5History');
 *   var { createRouter } = require('react-router');
 *   var Router = createRouter(routes, HTML5History);
 *   React.render(<Router/>, document.body);
 *
 * In a server-side routing scenario, you should use pass the URL of
 * the incoming request directly to the Router in the location prop.
 *
 *   var { createRouter } = require('react-router');
 *   var Router = createRouter(routes);
 *
 *   app.get('*', function (req, res) {
 *     res.send(
 *       React.renderToString(<Router location={req.url}/>)
 *     );
 *   });
 */
function createRouter(options, history) {
  options = options || {};

  if (isReactChildren(options))
    options = { routes: options };

  if (history)
    options.history = history;

  var { routes, history, onError, onChange, onUpdate } = options;

  invariant(
    routes != null,
    'A router needs at least one route'
  );

  if (isReactChildren(routes)) {
    // Allow users to specify routes as JSX.
    routes = createRoutesFromReactChildren(routes);
  } else if (!Array.isArray(routes)) {
    routes = [ routes ];
  }

  if (history && history.fallback)
    history = history.fallback;

  var currentTransition;

  var NavigationMixin = {
    
    /**
     * Returns an absolute URL path created from the given route
     * name, URL parameters, and query.
     */
    makePath(to, params, query) {
      var pattern;
      if (isAbsolutePath(to)) {
        pattern = to;
      } else {
        var branch = typeof to === 'string' ? getBranchToRouteWithName(routes, to) : getBranchToRoute(routes, to);

        invariant(
          branch,
          'Cannot find route "%s"',
          to
        );

        pattern = makePatternFromBranch(branch);
      }

      return withQuery(injectParams(pattern, params), query);
    },

    /**
     * Returns a string that may safely be used as the href of a link
     * to the route with the given name, URL parameters, and query.
     */
    makeHref(to, params, query) {
      var path = this.makePath(to, params, query);

      if (history)
        return history.makeHref(path);

      return path;
    },

    /**
     * Transitions to the URL specified in the arguments by pushing
     * a new URL onto the history stack.
     */
    transitionTo(to, params, query) {
      invariant(
        history,
        'transitionTo() needs history'
      );

      var path = this.makePath(to, params, query);

      if (currentTransition) {
        currentTransition.isCancelled = true;

        // Replace so pending location does not stay in history.
        history.replace(path);
      } else {
        history.push(path);
      }
    },

    /**
     * Transitions to the URL specified in the arguments by replacing
     * the current URL in the history stack.
     */
    replaceWith(to, params, query) {
      invariant(
        history,
        'replaceWith() needs history'
      );

      if (currentTransition)
        currentTransition.isCancelled = true;

      history.replace(this.makePath(to, params, query));
    },

    go(n) {
      invariant(
        history,
        'go() needs history'
      );

      if (currentTransition)
        currentTransition.isCancelled = true;

      history.go(n);
    },

    goBack() {
      this.go(-1);
    },

    goForward() {
      this.go(1);
    },

    canGo(n) {
      invariant(
        history,
        'canGo() needs history'
      );

      return history.canGo(n);
    },

    canGoBack() {
      return this.canGo(-1);
    },

    canGoForward() {
      return this.canGo(1);
    }

  };

  class Router extends React.Component {

    /**
     * Matches the given location on this router's routes, fetches their
     * components, and calls callback(error, state) when finished. This
     * is the main router interface.
     */
    static run(location, callback) {
      if (typeof location === 'string')
        location = new Location(location);

      invariant(
        location instanceof Location,
        'Router.run needs a Location'
      );

      Router.match(location.path, function (error, state) {
        if (error) {
          callback(error);
        } else if (state) {
          state.location = location;

          getComponentsForBranch(state.branch, function (error, components) {
            if (error) {
              callback(error);
            } else {
              state.components = components;
              callback(null, state);
            }
          });
        } else {
          callback();
        }
      });
    }

    /**
     * Low-level utility method that attempts to find a match for the
     * given path in this router's routes.
     */
    static match(path, callback) {
      findMatch(routes, path, callback);
    }

    static propTypes = {
      location: oneOfType([ string, location ])
    }

    constructor(props) {
      super(props);
      this.handleLocationChange = this.handleLocationChange.bind(this);
      this.state = {
        location: null,
        branch: null,
        params: null,
        components: null
      };
    }

    handleError(error) {
      if (onError) {
        onError.call(this, error);
      } else {
        // Throw errors so we don't silently swallow them.
        throw error; // This error probably originated in getChildRoutes, getComponents, or routerWillUpdate.
      }
    }

    handleLocationChange() {
      this._updateLocation(history.getLocation());
    }

    _updateLocation(location) {
      var transition = new Transition(location);
      currentTransition = transition;

      Router.run(location, (error, state) => {
        if (error) {
          this.handleError(error);
          return;
        }

        if (currentTransition !== transition)
          return; // Another transition interrupted this one.

        if (state) {
          try {
            if (onChange)
              onChange.call(this, this, this.state, state);
  
            if (!transition.isCancelled)
              this.setState(state, onUpdate);
          } catch (error) {
            this.handleError(error);
          }
        }

        currentTransition = null;
      });
    }

    componentWillMount() {
      invariant(
        this.props.location || history,
        'Router needs a location or history'
      );

      this._updateLocation(
        this.props.location || history.getLocation()
      );
    }

    componentDidMount() {
      if (history)
        history.addChangeListener(this.handleLocationChange);

      // The setState callback is ignored when it is called from inside
      // componentWillMount. So we need to trigger onUpdate manually here.
      if (onUpdate)
        onUpdate.call(this);
    }

    componentWillReceiveProps(nextProps) {
      if (this.props.location !== nextProps.location)
        this._updateLocation(nextProps.location);
    }

    componentWillUnmount() {
      if (history)
        history.removeChangeListener(this.handleLocationChange);
    }

    static childContextTypes = {
      router: object.isRequired
    }

    getChildContext() {
      return {
        router: this
      };
    }

    render() {
      var children = null;
      var { location, branch, params, components } = this.state;

      if (components) {
        children = components.reduceRight(function (children, components, index) {
          if (components == null)
            return children; // Don't create new children; use the grandchildren.

          var route = branch[index];
          var props = { location, params, route, children };
          
          if (Array.isArray(components)) {
            return components.map(function (component) {
              return createElement(component, assign({}, props));
            });
          }
          
          if (typeof components === 'object') {
            // In render, use children like:
            // var { header, sidebar } = this.props.children;
            var elements = {};
            
            for (var key in components)
              if (components.hasOwnProperty(key))
                elements[key] = createElement(components[property], assign({}, props, { key }));

            return elements;
          }

          return createElement(components, props);
        }, children);
      }

      return children;
    }

  }

  assign(Router.prototype, NavigationMixin, StateMixin);

  return Router;
}

module.exports = createRouter;
