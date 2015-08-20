import invariant from 'invariant';
import React, { Component, PropTypes } from 'react';
import * as RouterPropTypes from './PropTypes';
import BaseRouterRenderer from './RouterRenderer';
import createReactRouter from './createReactRouter';
import routerContext from './routerContext';
import addNavigation from './addNavigation';
import compose from './compose';
import { parseQueryString } from './QueryUtils';
import useParseQueryStringFallback from './useParseQueryStringFallback';

function noop() {}

/**
 * Create React router with 1.0 API compatibility added
 * @param  {Function} parseQueryString
 * @return {CreateRouter}
 */
function createReactRouterCompat(parseQueryString) {
  return compose(
    useParseQueryStringFallback(parseQueryString),
    createReactRouter
  );
}

export default class Router extends Component {
  static propTypes = {
    createElement: PropTypes.func,
    parseQueryString: PropTypes.func,
    onError: PropTypes.func,
    onUpdate: PropTypes.func,
    routes: RouterPropTypes.routes,
    // Routes may also be given as children (JSX)
    children: RouterPropTypes.routes,

    // Client
    history: RouterPropTypes.history,

    // Unit testing, simple server
    location: RouterPropTypes.location,

    // Flux, data fetching
    // @deprecated, use <RouterRenderer {...initialState} /> instead
    initialState: PropTypes.object
  }

  static defaultProps = {
    parseQueryString,
    onError: error => { throw error; },
    onUpdate: noop
  }

  /**
   * Server-side shortcut for `router.match()`. Use `router.match()`
   * directly instead.
   * @deprecated
   * @param {Array<Route>} routes
   * @param {Location} location
   * @param {Function} callback
   * @param {Object} [initialState]
   */
  static run(routes, location, callback, initialState) {
    const router = createReactRouterCompat(parseQueryString)(initialState);
    router.match(routes, location, callback);
  }

  constructor(props, context) {
    super(props, context);
    const { routes, children, location, parseQueryString } = props;
    let { history } = props;

    this.state = {
      isTransitioning: false,
      location
    };

    this.router = createReactRouterCompat(parseQueryString)(props.initialState);

    if (history) {
      // Check if navigation methods exist on history; add them if they don't.
      // This is a temporary solution — they should really be added using the
      // `addNavigation()` history enhancer. However, to maintain compatibility
      // with the 1.0 API, we can't require users to use that extension. We'll
      // need to either introduce a breaking change or update the history module
      // to include those methods by default.
      // TODO: get rid of this
      if (!history.transitionTo || !history.replaceWith) {
        // Pass history-creating function to "trick" enhancer
        this.history = addNavigation(() => history)();
      }

      this.unlisten = this.history.listen(this.handleLocationChange);
    } else if (location) {
      this.handleLocationChange(location);
    }

    this.RouterRenderer = routerContext(this.router, this.history)(BaseRouterRenderer);
  }

  setState(state, onUpdate) {
    if (!this.componentHasMounted) {
      this.state = { ...this.state, ...state };
      return;
    }
    super.setState(state, onUpdate);
  }

  componentDidMount() {
    this.componentHasMounted = true;
  }

  componentWillUnmount() {
    if (this.unlisten) {
      this.unlisten();
    }
  }

  handleLocationChange = location => {
    const { routes, children, history, onError, onUpdate, parseQueryString } = this.props;

    this.setState({
      isTransitioning: true
    });

    this.router.match(routes || children, location, (error, state, redirectInfo) => {
      if (error) {
        onError(error);
        return;
      }
      if (redirectInfo) {
        const { pathname, query, state } = redirectInfo;
        history.replaceState(state, history.createHref(pathname, query));
        return;
      }
      if (state == null) {
        return;
      }
      this.setState(state, onUpdate);
    });

    this.setState({
      isTransitioning: false
    });
  }


  // Below are deprecated methods that are added here for 1.0
  // compatibility. Future versions should access these on either the router
  // or history object, as appropriate. Outside modules (like <Link>) should not
  // use these methods — they should use the correct methods, and rely on their
  // own fallbacks for compatibility.

  transitionTo(...args) {
    const { history } = this;

    invariant(
      history,
      'Router#transitionTo needs history'
    );

    return history.transitionTo(...args);
  }


  replaceWith(...args) {
    const { history } = this;

    invariant(
      history,
      'Router#replaceWith needs history'
    );

    return history.replaceWith(...args);
  }

  go(n) {
    const { history } = this;

    invariant(
      history,
      'Router#go needs history'
    );

    return history.go(n);
  }

  goBack() {
    return this.go(-1);
  }

  goForward() {
    return this.go(1);
  }

  isActive(...args) {
    return this.router.isActive(...args);
  }

  createHref(...args) {
    return this.history.createHref(...args);
  }

  render() {
    const { router, history, RouterRenderer } = this;
    const { createElement, initialState } = this.props;

    const state = initialState || this.state;

    return (
      <RouterRenderer
        createElement={createElement}
        {...state}
      />
    );
  }
}
