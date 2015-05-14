var warning = require('warning');
var { getParamNames } = require('./PathUtils');

function forEachComponent(components, callback) {
  if (typeof components === 'object') {
    for (var key in components)
      if (components.hasOwnProperty(key))
        callback(components[key]);
  } else if (components) {
    callback(components);
  }
}

/**
 * Returns true if the params a route cares about changed in
 * the transition from prevState to nextState, false otherwise.
 */
function routeParamsChanged(route, prevState, nextState) {
  if (!route.path)
    return false;

  var paramNames = getParamNames(route.path);

  return paramNames.some(function (paramName) {
    return prevState.params[paramName] !== nextState.params[paramName];
  });
}

function getRouteAndComponentTransitionHooks(router, prevState, nextState) {
  var fromRoutes = prevState.branch;
  var toRoutes = nextState.branch;
  var hooks = [];

  if (fromRoutes) {
    function isLeavingRoute(route) {
      return toRoutes.indexOf(route) === -1 || routeParamsChanged(route, prevState, nextState);
    }

    var leavingRoutes = [];

    fromRoutes.forEach(function (route, index) {
      if (isLeavingRoute(route)) {
        leavingRoutes.push(route);

        forEachComponent(prevState.components[index], function (component) {
          if (component.routerWillLeave)
            hooks.push(component.routerWillLeave.bind(component, router, nextState, route));
        });

        if (route.onLeave)
          hooks.push(route.onLeave.bind(route, router, nextState));
      }
    });

    // Call "leave" hooks starting at the leaf route.
    hooks.reverse();

    function isEnteringRoute(route) {
      return fromRoutes.indexOf(route) === -1 || leavingRoutes.indexOf(route) !== -1;
    }

    toRoutes.forEach(function (route, index) {
      if (isEnteringRoute(route)) {
        if (route.onEnter)
          hooks.push(route.onEnter.bind(route, router, nextState));

        forEachComponent(nextState.components[index], function (component) {
          if (component.routerWillEnter)
            hooks.push(component.routerWillEnter.bind(component, router, nextState, route));
        });
      }
    });
  } else {
    toRoutes.forEach(function (route, index) {
      if (route.onEnter)
        hooks.push(route.onEnter.bind(route, router, nextState));

      forEachComponent(nextState.components[index], function (component) {
        if (component.routerWillEnter)
          hooks.push(component.routerWillEnter.bind(component, router, nextState, route));
      });
    });
  }

  return hooks;
}

var TransitionMixin = {

  /**
   * Compiles and returns an array of transition hook functions that
   * should be called before we transition to a new state. Transition
   * hook signatures are:
   *
   *   - route.onLeave(router, nextState)
   *   - component.routerWillLeave(router, nextState, route)
   *   - route.onEnter(router, nextState)
   *   - component.routerWillEnter(router, nextState, route)
   *
   * Transition hooks run in order from the leaf route in the branch
   * we're leaving, up the tree to the common parent route, and back
   * down the branch we're entering to the leaf route. Route hooks
   * always run before component hooks.
   *
   * If any hook uses the router's navigation methods (i.e transitionTo,
   * replaceWith, go, etc.) all remaining transition hooks are skipped.
   *
   * Returns true to allow the transition, false to prevent it.
   */
  _runTransitionHooks(nextState) {
    var hooks = [];

    if (this._transitionHooks) {
      this._transitionHooks.forEach(function (hook) {
        hooks.push(hook.bind(this, this, nextState));
      }, this);
    }

    hooks.push.apply(
      hooks,
      getRouteAndComponentTransitionHooks(this, this.state, nextState)
    );
  
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
  },

  cancelTransition() {
    warning(
      this.nextLocation,
      'cancelTransition: No transition is in progress'
    );

    this.cancelledLocation = this.nextLocation;
    this.nextLocation = null;
  },

  retryLastCancelledTransition() {
    warning(
      this.cancelledLocation,
      'retryTransition: There is no cancelled transition to retry'
    );

    if (this.cancelledLocation) {
      var location = this.cancelledLocation;
      this.cancelledLocation = null;
      this._updateLocation(location);
    }
  },

  addTransitionHook(hook) {
    if (!this._transitionHooks) {
      this._transitionHooks = [ hook ];
    } else {
      this._transitionHooks.push(hook);
    }
  },

  removeTransitionHook(hook) {
    if (this._transitionHooks) {
      this._transitionHooks = this._transitionHooks.filter(function (h) {
        return h !== hook;
      });
    }
  }

};

module.exports = TransitionMixin;
