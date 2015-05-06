var React = require('react');
var assign = require('object-assign');
var invariant = require('react/lib/invariant');
var { func, object, string, oneOfType, arrayOf } = React.PropTypes;
var { components, history, location, route } = require('./PropTypes');
var isReactChildren = require('./isReactChildren');
var createRoutesFromReactChildren = require('./createRoutesFromReactChildren');
var { mapAsync } = require('./AsyncUtils');
var NavigationMixin = require('./NavigationMixin');
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

function checkProps(props) {
  var { history, location, branch, params, components } = props;

  if (history) {
    invariant(
      !(location || branch || params || components),
      'A <Router> must not have location, branch, params, or components props when it has a history prop'
    );
  } else {
    invariant(
      location && branch && params && components,
      'A <Router> must have location, branch, params, and components props when it does not have a history prop'
    );
  }
}

/**
 * Creates and returns a new Router component that uses the given routes to
 * determine what to render to the page.
 *
 * In a client-side environment you simply pass a History object to the Router
 * as a prop. A History acts like a store for Location objects and emits new
 * ones as the location changes over time (i.e. a user navigates around your
 * site). History objects are included for all the most common scenarios in
 * which the router may be used.
 *
 *   var { createRouter } = require('react-router');
 *   var Router = createRouter(routes);
 *
 *   var BrowserHistory = require('react-router/BrowserHistory');
 *   React.render(<Router history={BrowserHistory}/>, document.body);
 *
 * In a server-side environment you should use the router component's
 * static `run` method to determine the props you need to pass to the router.
 *
 *   app.get('*', function (req, res) {
 *     Router.run(req.url, function (error, props) {
 *       res.send(
 *         React.renderToString(React.createElement(Router, props))
 *       );
 *     });
 *   });
 */
function createRouter(routes) {
  invariant(
    routes != null,
    'A router needs some routes'
  );

  if (isReactChildren(routes)) {
    // Allow users to specify routes as JSX.
    routes = createRoutesFromReactChildren(routes);
  } else if (!Array.isArray(routes)) {
    routes = [ routes ];
  }

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
      onError: func,
      onUpdate: func,

      // We either need a history...
      history,

      // OR ALL of these...
      location: oneOfType([ string, location ]),
      branch: arrayOf(route),
      params: object,
      components: arrayOf(components)
    }

    static childContextTypes = {
      router: object.isRequired
    }

    constructor(props) {
      super(props);
      this._updateLocation = this._updateLocation.bind(this);
      this.nextLocation = null;
      this.state = {
        location: props.location,
        branch: props.branch,
        params: props.params,
        components: props.components
      };
    }

    _updateLocation(location) {
      this.nextLocation = location;

      Router.run(location, (error, state) => {
        if (error) {
          this.handleError(error);
          return;
        }

        if (this.nextLocation !== location)
          return; // Another location change interrupted this one.

        this.nextLocation = null;

        if (state)
          this.setState(state, this.props.onUpdate);
      });
    }

    handleError(error) {
      if (this.props.onError) {
        this.props.onError.call(this, error);
      } else {
        // Throw errors so we don't silently swallow them.
        throw error; // This error probably originated in getChildRoutes or getComponents.
      }
    }

    getHistory() {
      var { history } = this.props;

      if (history == null)
        return null;

      return history.fallback || history;
    }

    getRoutes() {
      return routes;
    }

    componentWillMount() {
      checkProps(this.props);

      var history = this.getHistory();

      if (history)
        this._updateLocation(history.getLocation());
    }

    componentDidMount() {
      var history = this.getHistory();

      if (history)
        history.addChangeListener(this._updateLocation);
    }

    componentWillReceiveProps(nextProps) {
      checkProps(nextProps);

      if (!nextProps.history)
        this.setState(nextProps);
    }

    componentWillUnmount() {
      var history = this.getHistory();

      if (history)
        history.removeChangeListener(this._updateLocation);
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
