import React from 'react';
import { history, location } from './PropTypes';
import passMiddlewareProps from './passMiddlewareProps';

/**
 * A middleware that provides transition hooks for routes and/or
 * mounted components.
 */
class TransitionManager extends React.Component {

  static contextTypes = {
    history: history.isRequired
  };

  static propTypes = {
    location: location.isRequired
  };

  constructor(props, context) {
    super(props, context);
    this.hooks = [];
  }

  addHook(hook) {
    this.hooks.push(hook);
  }

  removeHook(hook) {
    this.hooks = this.hooks.filter(function (h) {
      return h !== hook;
    });
  }

  /**
   * Compiles and returns an array of transition hook functions that
   * should be called before we transition to a new state. Transition
   * hooks receive the history and nextState as arguments.
   *
   * Additionally, routes may have onLeave and/or onEnter methods that
   * will be called when they enter and leave the active route tree.
   * These hooks run in order from the leaf route in the branch we're
   * leaving, up the tree to the common parent route, and back down the
   * branch we're entering to the leaf route. Route hooks always run
   * before component hooks.
   *
   * If any hook uses the history's navigation methods (i.e push,
   * replace, go, etc.) all remaining transition hooks are skipped.
   */
  _getTransitionHooks(nextState) {
    var { history } = this.context;
    var prevState = this.state;
    var fromRoutes = prevState.branch;
    var toRoutes = nextState.branch;

    var hooks = this.transitionHooks.map(function (hook) {
      return hook.bind(this, history, nextState);
    }, this);

    if (fromRoutes) {
      function isLeavingRoute(route) {
        return toRoutes.indexOf(route) === -1 || routeParamsChanged(route, prevState, nextState);
      }

      var leavingRoutes = [];

      fromRoutes.forEach(function (route, index) {
        if (isLeavingRoute(route)) {
          leavingRoutes.push(route);

          if (route.onLeave)
            hooks.push(route.onLeave.bind(route, history, nextState));
        }
      });

      // Call "leave" hooks starting at the leaf route.
      hooks.reverse();

      function isEnteringRoute(route) {
        return fromRoutes.indexOf(route) === -1 || leavingRoutes.indexOf(route) !== -1;
      }

      toRoutes.forEach(function (route, index) {
        if (isEnteringRoute(route) && route.onEnter)
          hooks.push(route.onEnter.bind(route, history, nextState));
      });
    } else {
      toRoutes.forEach(function (route, index) {
        if (route.onEnter)
          hooks.push(route.onEnter.bind(route, history, nextState));
      });
    }

    return hooks;
  }

  /**
   * Runs all transition hooks needed to get to the nextState.
   * Returns true to allow the transition, false to prevent it.
   */
  _runTransitionHooks(nextState) {
    var hooks = this._getTransitionHooks(nextState);
    var nextLocation = this.nextLocation;

    try {
      for (var i = 0, len = hooks.length; i < len; ++i) {
        hooks[i]();

        if (this.nextLocation !== nextLocation)
          break; // No need to proceed further.
      }
    } catch (error) {
      this.handleError(error);
      return false;
    }

    // Allow the transition if nextLocation hasn't changed.
    return this.nextLocation === nextLocation;
  }

  componentWillMount() {

  }

  componentWillReceiveProps(nextProps) {

  }

  render() {
    return passMiddlewareProps(this.props, {});
  }

}

export default TransitionManager;
