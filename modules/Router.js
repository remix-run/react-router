import React, { createElement, isValidElement } from 'react';
import warning from 'warning';
import invariant from 'invariant';
import { loopAsync } from './AsyncUtils';
import { createRoutes } from './RouteUtils';
import { getState, getTransitionHooks, getComponents, getRouteParams, createTransitionHook } from './RoutingUtils';
import { routes, component, components, history, location } from './PropTypes';
import RouterContextMixin from './RouterContextMixin';
import ScrollManagementMixin from './ScrollManagementMixin';
import { isLocation } from './Location';

var { arrayOf, func, object } = React.PropTypes;

function runTransition(prevState, routes, location, transitionHooks, callback) {
  var transition = {
    isCancelled: false,
    redirectInfo: null,
    abortReason: null,
    to(pathname, query, state) {
      transition.redirectInfo = { pathname, query, state };
      transition.isCancelled = true;
    },
    abort(reason) {
      transition.abortReason = reason;
      transition.isCancelled = true;
    }
  };

  getState(routes, location, function (error, nextState) {
    if (error || nextState == null || transition.isCancelled) {
      callback(error, transition);
    } else {
      nextState.location = location;

      var hooks = getTransitionHooks(prevState, nextState);
      if (Array.isArray(transitionHooks))
        hooks.unshift.apply(hooks, transitionHooks);

      loopAsync(hooks.length, (index, next, done) => {
        hooks[index](nextState, transition, (error) => {
          if (error || transition.isCancelled) {
            done(error); // No need to continue.
          } else {
            next();
          }
        });
      }, function (error) {
        if (error || transition.isCancelled) {
          callback(error, transition);
        } else {
          getComponents(nextState.branch, function (error, components) {
            if (error || transition.isCancelled) {
              callback(error, transition);
            } else {
              nextState.components = components;
              callback(null, transition, nextState);
            }
          });
        }
      });
    }
  });
}

var Router = React.createClass({

  mixins: [ RouterContextMixin, ScrollManagementMixin ],

  statics: {

    /**
     * Runs a transition to the given location using the given routes and
     * transition hooks (optional) and calls callback(error, transition, state)
     * when finished. This is primarily useful for server-side rendering.
     */
    run(routes, location, transitionHooks, callback) {
      if (typeof transitionHooks === 'function') {
        callback = transitionHooks;
        transitionHooks = null;
      }

      invariant(
        typeof callback === 'function',
        'Router.run needs a callback'
      );

      runTransition(null, routes, location, transitionHooks, callback);
    }

  },

  propTypes: {
    createElement: func.isRequired,
    onError: func.isRequired,
    onUpdate: func,

    // Client-side
    history,
    routes,
    // Routes may also be given as children (JSX)
    children: routes,

    // Server-side
    location,
    branch: routes,
    params: object,
    components: arrayOf(components)
  },

  getDefaultProps() {
    return {
      createElement,
      onError: function (error) {
        // Throw errors by default so we don't silently swallow them!
        throw error; // This error probably originated in getChildRoutes or getComponents.
      }
    };
  },

  getInitialState() {
    return {
      isTransitioning: false,
      location: null,
      branch: null,
      params: null,
      components: null
    };
  },

  _updateState(location) {
    invariant(
      isLocation(location),
      'A <Router> needs a valid Location'
    );

    var hooks = this.transitionHooks;
    if (hooks)
      hooks = hooks.map(hook => createTransitionHook(hook, this));

    this.setState({ isTransitioning: true });

    runTransition(this.state, this.routes, location, hooks, (error, transition, state) => {
      if (error) {
        this.handleError(error);
      } else if (transition.isCancelled) {
        if (transition.redirectInfo) {
          var { pathname, query, state } = transition.redirectInfo;
          this.replaceWith(pathname, query, state);
        } else {
          invariant(
            this.state.location,
            'You may not abort the initial transition'
          );

          // TODO: Do something with transition.abortReason ?

          // The best we can do here is goBack so the location state reverts
          // to what it was. However, we also set a flag so that we know not
          // to run through _updateState again since state did not change.
          this._ignoreNextHistoryChange = true;
          this.goBack();
        }
      } else if (state == null) {
        warning(false, 'Location "%s" did not match any routes', location.pathname);
      } else {
        this.setState(state, this.props.onUpdate);
      }

      this.setState({ isTransitioning: false });
    });
  },

  /**
   * Adds a transition hook that runs before all route hooks in a
   * transition. The signature is the same as route transition hooks.
   */
  addTransitionHook(hook) {
    if (!this.transitionHooks)
      this.transitionHooks = [];

    this.transitionHooks.push(hook);
  },

  /**
   * Removes the given transition hook.
   */
  removeTransitionHook(hook) {
    if (this.transitionHooks)
      this.transitionHooks = this.transitionHooks.filter(h => h !== hook);
  },

  _createElement(component, props) {
    return typeof component === 'function' ? this.props.createElement(component, props) : null;
  },

  handleHistoryChange() {
    if (this._ignoreNextHistoryChange) {
      this._ignoreNextHistoryChange = false;
    } else {
      this._updateState(this.props.history.location);
    }
  },

  componentWillMount() {
    var { history, routes, children, location, branch, params, components } = this.props;

    if (history) {
      invariant(
        routes || children,
        'Client-side <Router>s need routes. Try using <Router routes> or ' +
        'passing your routes as nested <Route> children'
      );

      this.routes = createRoutes(routes || children);

      if (typeof history.setup === 'function')
        history.setup();

      // We need to listen first in case we redirect immediately.
      if (history.addChangeListener)
        history.addChangeListener(this.handleHistoryChange);

      this._updateState(history.location);
    } else {
      invariant(
        location && branch && params && components,
        'Server-side <Router>s need location, branch, params, and components ' +
        'props. Try using Router.match to get all the props you need'
      );

      this.setState({ location, branch, params, components });
    }
  },

  componentWillReceiveProps(nextProps) {
    invariant(
      this.props.history === nextProps.history,
      '<Router history> may not be changed'
    );

    if (nextProps.history) {
      var currentRoutes = this.props.routes || this.props.children;
      var nextRoutes = nextProps.routes || nextProps.children;

      if (currentRoutes !== nextRoutes) {
        this.routes = createRoutes(nextRoutes);

        // Call this here because _updateState
        // uses this.routes to determine state.
        if (nextProps.history.location)
          this._updateState(nextProps.history.location);
      }
    }
  },

  componentWillUnmount() {
    var { history } = this.props;

    if (history && history.removeChangeListener)
      history.removeChangeListener(this.handleHistoryChange);
  },

  render() {
    var { location, branch, params, components, isTransitioning } = this.state;
    var element = null;

    if (components) {
      element = components.reduceRight((element, components, index) => {
        if (components == null)
          return element; // Don't create new children; use the grandchildren.

        var route = branch[index];
        var routeParams = getRouteParams(route, params);
        var props = { location, params, route, routeParams, isTransitioning };

        if (isValidElement(element)) {
          props.children = element;
        } else if (element) {
          // In render, do var { header, sidebar } = this.props;
          Object.assign(props, element);
        }

        if (typeof components === 'object') {
          var elements = {};

          for (var key in components)
            if (components.hasOwnProperty(key))
              elements[key] = this._createElement(components[key], props);

          return elements;
        }

        return this._createElement(components, props);
      }, element);
    }

    invariant(
      element === null || element === false || isValidElement(element),
      'The root route must render a single element'
    );

    return element;
  }

});

export default Router;
