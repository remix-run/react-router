import invariant from 'invariant';
import React, { Component, PropTypes } from 'react';
import * as RouterPropTypes from './PropTypes';
import BaseRouterRenderer from './RouterRenderer';
import createReactRouter from './createReactRouter';
import routerContext from './routerContext';
import compose from './compose';
import { parseQueryString } from './QueryUtils';
import createMemoryHistory from 'history/lib/createMemoryHistory';
import useQueries from 'history/lib/useQueries';
import matchUntilResolved from './matchUntilResolved';
import { pick, inArray } from './CollectionUtils';

function noop() {}

const createFallbackHistory = createMemoryHistory

const componentSpecificOptions = [
  'createElement'
];

export default class Router extends Component {
  static propTypes = {
    createElement: PropTypes.func,
    parseQueryString: PropTypes.func,
    onError: PropTypes.func,
    onUpdate: PropTypes.func,
    routes: RouterPropTypes.routes,
    // Routes may also be given as children (JSX)
    children: RouterPropTypes.routes,

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
    const router = createReactRouter(createFallbackHistory)({
      routes,
      initialState
    });
    router.match(initialState, location, callback);
  }

  constructor(props, context) {
    super(props, context);
    const {
      history,
      routes,
      children
    } = props;

    this.state = {
      isTransitioning: false,
    };

    const routerProps = pick(props, k => !inArray(componentSpecificOptions, k));

    const createHistory = history
      ? () => history
      : createFallbackHistory

    this.router = createReactRouter(createHistory)({
      ...routerProps,
      routes: routes || children
    });

    this.unlisten = this.router.listen(this.handleRouterChange);
    this.RouterRenderer = routerContext(this.router)(BaseRouterRenderer);
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

  handleRouterChange = state => {
    this.setState({
      isTransitioning: state.pendingLocation ? true : false,
      ...state
    }, this.props.onUpdate);
  }


  // Below are deprecated methods that are added here for 1.0
  // compatibility. Future versions should access these on either the router
  // directly. Outside modules (like <Link>) should not use these methods — they
  // should use the correct methods, and rely on their own fallbacks
  // for compatibility.

  transitionTo(...args) {
    const { router } = this;

    invariant(
      history,
      'Router#transitionTo needs history'
    );

    return router.transitionTo(...args);
  }


  replaceWith(...args) {
    const { router } = this;

    invariant(
      history,
      'Router#replaceWith needs history'
    );

    return router.replaceWith(...args);
  }

  go(n) {
    const { router } = this;

    invariant(
      router,
      'Router#go needs history'
    );

    return router.go(n);
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
    return this.router.createHref(...args);
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
