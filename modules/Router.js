import React from 'react';
import warning from 'warning';
import invariant from 'invariant';
import { loopAsync } from './AsyncUtils';
import { createRoutes } from './RouteUtils';
import { getQueryString, parseQueryString, stringifyQuery, queryContains } from './URLUtils';
import { branchMatches, getProps, getTransitionHooks, createTransitionHook, getAndAssignComponents, makePath, makeHref } from './RoutingUtils';
import { routes, component, components, history, location } from './PropTypes';
import RoutingContext from './RoutingContext';
import Location from './Location';

var { any, array, func, object, instanceOf } = React.PropTypes;

var NavigationMixin = {

  /**
   * Returns a full URL path from the given pathname and query.
   */
  makePath(pathname, query) {
    return makePath(pathname, query, this.props.stringifyQuery);
  },

  /**
   * Returns a string that may safely be used to link to the given
   * pathname and query.
   */
  makeHref(pathname, query) {
    var { stringifyQuery, history } = this.props;
    return makeHref(pathname, query, stringifyQuery, history);
  },

  transitionTo(pathname, query, state=null) {
    var path = this.makePath(pathname, query);
    var { history } = this.props;

    if (history) {
      if (this.nextLocation) {
        history.replaceState(state, path);
      } else {
        history.pushState(state, path);
      }
    } else {
      this._updateState(new Location(path, state));
    }
  },

  replaceWith(pathname, query, state=null) {
    var path = this.makePath(pathname, query);
    var { history } = this.props;

    if (history) {
      history.replaceState(state, path);
    } else {
      this._updateState(new Location(path, state));
    }
  },

  go(n) {
    var { history } = this.props;
    invariant(history, 'Router#go needs a history');
    history.go(n);
  },

  goBack() {
    this.go(-1);
  },

  goForward() {
    this.go(1);
  }
 
};

export var Router = React.createClass({

  mixins: [ NavigationMixin ],

  statics: {
    
    match(routes, location, callback) {
      // TODO: Mimic what we're doing in _updateState, but statically
      // so we can get the right props for doing server-side rendering.
    }

  },

  propTypes: {
    history,
    children: routes.isRequired,
    parseQueryString: func.isRequired,
    stringifyQuery: func.isRequired,
    onError: func.isRequired,
    onUpdate: func,

    // Primarily for server-side rendering.
    location: any,
    branch: routes,
    params: object,
    query: object,
    components
  },

  getDefaultProps() {
    return {
      location: '/',
      parseQueryString,
      stringifyQuery,
      onError: function (error) {
        // Throw errors by default so we don't silently swallow them!
        throw error; // This error probably originated in getChildRoutes or getComponents.
      }
    };
  },

  getInitialState() {
    return {
      location: null,
      branch: null,
      params: null,
      query: null,
      components: null,
      isTransitioning: false
    };
  },

  _updateState(location) {
    if (!Location.isLocation(location))
      location = Location.create(location);

    this.nextLocation = location;
    this.setState({ isTransitioning: true });

    getProps(this.routes, location, this.props.parseQueryString, (error, state) => {
      if (error || this.nextLocation !== location) {
        this._finishTransition(error);
      } else if (state == null) {
        this._finishTransition();
        warning(false, 'Location "%s" did not match any routes', location.path);
      } else {
        state.location = location;

        this._runTransitionHooks(state, (error) => {
          if (error || this.nextLocation !== location) {
            this._finishTransition(error);
          } else {
            this._getAndAssignComponents(state, (error) => {
              if (error || this.nextLocation !== location) {
                this._finishTransition(error);
              } else {
                this._finishTransition();
                this.setState(state, this.props.onUpdate);
                this._alreadyUpdated = true;
              }
            });
          }
        });
      }
    });
  },

  _finishTransition(error) {
    this.setState({ isTransitioning: false });
    this.nextLocation = null;

    if (error)
      this.handleError(error);
  },

  _runTransitionHooks(nextState, callback) {
    // Run component hooks before route hooks.
    var hooks = this.transitionHooks.map(hook => createTransitionHook(hook, this));

    hooks.push.apply(
      hooks,
      getTransitionHooks(this.state, nextState)
    );

    var nextLocation = this.nextLocation;

    loopAsync(hooks.length, (index, next, done) => {
      var hook = hooks[index];

      hooks[index].call(this, nextState, this, (error) => {
        if (error || this.nextLocation !== nextLocation) {
          done.call(this, error); // No need to continue.
        } else {
          next.call(this);
        }
      });
    }, callback);
  },

  _getAndAssignComponents(nextState, callback) {
    if (this.props.components) {
      nextState.components = this.props.components;
      callback();
    } else {
      getAndAssignComponents(nextState, callback);
    }
  },

  /**
   * Cancels the current transition, preventing any subsequent
   * transition hooks from running.
   */
  cancelTransition() {
    this.nextLocation = null;
  },

  /**
   * Adds a transition hook that runs before all route hooks in a
   * transition. The signature is the same as route transition hooks.
   */
  addTransitionHook(hook) {
    this.transitionHooks.push(hook);
  },

  /**
   * Removes the given transition hook.
   */
  removeTransitionHook(hook) {
    this.transitionHooks = this.transitionHooks.filter(h => h !== hook);
  },

  componentWillMount() {
    var { children, history, location } = this.props;

    this.transitionHooks = [];
    this.routes = createRoutes(children);
    this.nextLocation = null;

    if (history) {
      if (typeof history.setup === 'function')
        history.setup();

      this._updateState(history.location);
    } else {
      this._updateState(location);
    }
  },

  handleHistoryChange() {
    this._updateState(this.props.history.location);
  },

  componentDidMount() {
    var { history } = this.props;

    if (history)
      history.addChangeListener(this.handleHistoryChange);

    // React doesn't fire the setState callback when we call setState
    // synchronously within componentWillMount, so we need this. Note
    // that we still only get one call to onUpdate, even if setState
    // was called multiple times in componentWillMount.
    if (this._alreadyUpdated && this.props.onUpdate)
      this.props.onUpdate.call(this);
  },

  componentWillReceiveProps(nextProps) {
    invariant(
      this.props.history === nextProps.history,
      '<Router history> may not be changed'
    );

    if (this.props.children !== nextProps.children) {
      this.routes = createRoutes(nextProps.children);

      // Call this here because _updateState
      // uses this.routes to determine state.
      this._updateState(nextProps.location);
    } else if (this.props.location !== nextProps.location) {
      this._updateState(nextProps.location);
    }
  },

  componentWillUnmount() {
    var { history } = this.props;

    if (history)
      history.removeChangeListener(this.handleHistoryChange);
  },

  render() {
    return <RoutingContext
      {...this.state}
      stringifyQuery={this.props.stringifyQuery}
      history={this.props.history}
      routerContext={{
        transitionTo: this.transitionTo,
        replaceWith: this.replaceWith,
        go: this.go,
        goBack: this.goBack,
        goForward: this.goForward,
        addTransitionHook: this.addTransitionHook,
        removeTransitionHook: this.removeTransitionHook,
        cancelTransition: this.cancelTransition,
      }}
    />;
  }

});

export default Router;
