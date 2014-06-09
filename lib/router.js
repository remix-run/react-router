var React = require('react');
var mergeInto = require('react/lib/mergeInto');
var invariant = require('react/lib/invariant');
var warning = require('react/lib/warning');
var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');
var path = require('./path');
var urlStore = require('./stores/url-store');

var _lookupTable = {};

/**
 * A Router specifies a component that will be rendered to the page when the URL
 * matches a given pattern. Routers may also be named, which makes it easy for
 * <Link> components to link to them.
 * 
 * Routers are arranged in a nested tree structure. When a new URL is requested, the
 * tree is searched depth-first to find a route whose pattern matches the URL. When one
 * is found, all routes in the tree that lead to it are considered "active" and their
 * components are rendered into the DOM, nested in the same order as they are in the tree.
 *
 * Unlike Ember, a nested router's URL pattern does not build upon that of its parents.
 * This may seem like it creates more work up front in specifying URLs, but it has the
 * nice benefit of decoupling nested UI from "nested" URLs.
 *
 * The preferred way to configure a router is using JSX. The XML-like syntax is an excellent
 * tool that helps to visualize the way routes are laid out in an application.
 *
 *   Router(
 *     <Route handler={App}>
 *       <Route name="login" handler={Login}/>
 *       <Route name="logout" handler={Logout}/>
 *       <Route name="about" handler={About}/>
 *     </Route>
 *   ).renderComponent(document.body);
 *
 * If you don't use JSX, you can also assemble a Router programmatically using the standard
 * JavaScript API for a React component.
 *
 *   Router(
 *     Route({ handler: App },
 *       Route({ name: 'login', handler: Login }),
 *       Route({ name: 'logout', handler: Logout }),
 *       Route({ name: 'about', handler: About })
 *     )
 *   ).renderComponent(document.body);
 *
 * Router "handler" components that contain children can render their active child route
 * using the activeRoute prop in their render method.
 *
 *   var App = React.createClass({
 *     render: function () {
 *       return (
 *         <div class="application">
 *           {this.props.activeRoute}
 *         </div>
 *       );
 *     }
 *   });
 */
function Router(options) {
  // Support Router(<Route>) usage.
  if (React.isValidComponent(options))
    return Router.fromRouteComponent(options);

  // Support Router(options) usage, without new.
  if (!(this instanceof Router))
    return new Router(options);

  options = options || {};

  this.name = options.name;
  this.path = path.normalize(options.path || options.name || '/');
  this.handler = options.handler;

  invariant(
    React.isValidComponent(this.handler),
    'Router "' + this.name + '" must have a valid React component for a handler'
  );

  this.displayName = getComponentDisplayName(this.handler) + 'Router';

  // If this router has a name, store it for lookup by <Link> components.
  if (this.name) {
    invariant(
      !_lookupTable[this.name],
      'You cannot use the name "' + this.name + '" for more than one router'
    );

    _lookupTable[this.name] = this;
  }

  // Any other options that were passed in are "static" component props.
  this.staticProps = Route.getUnreservedProps(options);

  this.currentContext = null;
  this.childRouters = [];
}

var Route = require('./components/route');

/**
 * A convenience method that creates a Router from a <Route> component. This allows
 * you to use JSX to describe your route hierarchy instead of the JavaScript API.
 *
 *   var AppRouter = Router.fromRouteComponent(
 *     <Route handler={App}>
 *       <Route name="login" handler={Login}/>
 *       <Route name="logout" handler={Logout}/>
 *       <Route name="about" handler={About}/>
 *     </Route>
 *   );
 */
Router.fromRouteComponent = function (routeComponent) {
  invariant(
    routeComponent.type === Route.type,
    'A Router may only be created from <Route> components'
  );

  var router = new Router(routeComponent.props);

  React.Children.forEach(routeComponent.props.children, function (child) {
    router.childRouters.push(Router.fromRouteComponent(child));
  });

  return router;
};

/**
 * Resolves the given string value to a pattern that can be used to match on
 * the URL path. This may be the name of a <Route> or an absolute URL path.
 */
Router.resolveTo = function (to) {
  if (to.charAt(0) === '/')
    return path.normalize(to); // Absolute path.

  var router = _lookupTable[to];

  invariant(
    router,
    'Unable to resolve to "' + to + '". Make sure you have a <Route name="' + to + '">'
  );

  return router.path;
};

/**
 * Returns a string that is the result of resolving the given "to" value with
 * the given params interpolated and query appended (see Router.resolveTo). The
 * result may safely be used as the href of a link.
 */
Router.makeHref = function (to, params, query) {
  var href = path.withQuery(path.injectParams(Router.resolveTo(to), params), query);

  if (urlStore.getLocation() === 'hash')
    return '#' + href;

  return href;
};

/**
 * Returns the current path being used in the URL. This is useful if you want to
 * store and transition to it later.
 */
Router.getCurrentPath = function () {
  return urlStore.getCurrentPath();
};

/**
 * Initiates a transition to the URL specified by the given arguments (see
 * Router.makeHref).
 */
Router.transitionTo = function (to, params, query) {
  urlStore.push(Router.makeHref(to, params, query));
};

/**
 * Replaces the current URL with the URL specified by the given arguments (see
 * Router.makeHref).
 */
Router.replaceWith = function (to, params, query) {
  urlStore.replace(Router.makeHref(to, params, query));
};

/**
 * Tells the router to use the HTML5 history API for modifying URLs instead of
 * hashes, which is the default. This is opt-in because it requires the server
 * to be configured to serve the same HTML page regardless of the URL.
 */
Router.useHistory = function () {
  urlStore.setup('history');
};

mergeInto(Router.prototype, {

  /**
   * Searches this Router and its subtree depth-first for a Router that matches
   * on the given path. Returns an array of all routes in the tree leading to
   * the one that matched in the format { route, params } where params is an
   * object that contains the URL parameters relevant to that route. Returns
   * null if no Router in the tree matches the path.
   *
   *   var AppRouter = Router(
   *     <Route handler={App}>
   *       <Route name="posts" handler={Posts}>
   *         <Route name="newPost" path="/posts/new" handler={NewPost}/>
   *         <Route name="showPost" path="/posts/:id" handler={Post}/>
   *       </Route>
   *     </Route>
   *   );
   * 
   *   AppRouter.match('/posts/123'); => [ { router: <AppRouter>, params: {} },
   *                                       { router: <PostsRouter>, params: {} },
   *                                       { router: <PostRouter>, params: { id: '123' } } ]
   */
  match: function (currentPath) {
    var childRouters = this.childRouters, match;

    // Search the subtree first to find the most deeply-nested route.
    for (var i = 0, length = childRouters.length; i < length; ++i) {
      match = childRouters[i].match(currentPath);

      if (match) {
        var rootMatch = match[match.length - 1];
        var rootRouter = rootMatch.router;
        var rootParams = rootMatch.params;

        var paramNames = path.extractParamNames(this.path);
        var params = {};

        paramNames.forEach(function (paramName) {
          // Ensure the child route contains all dynamic segments in this route. 
          // TODO: We should probably do this when routes are first declared.
          invariant(
            rootParams[paramName],
            'Router path "' + rootRouter.path + '" does not contain all parameters ' +
            'of its ancestor path "' + this.path + '", so they cannot be nested'
          );

          params[paramName] = rootParams[paramName];
        });

        match.unshift(makeMatch(this, params));

        return match;
      }
    }

    // No routes in the subtree matched, so check this route.
    var params = path.extractParams(this.path, currentPath);

    if (params)
      return [ makeMatch(this, params) ];

    return null;
  },

  /**
   * Renders this router's component to the given DOM node and returns a
   * reference to the rendered component.
   */
  renderComponent: function (node) {
    if (!this._component) {
      if (!urlStore.isSetup() && ExecutionEnvironment.canUseDOM)
        urlStore.setup('hash');

      urlStore.addChangeListener(this.handleRouteChange.bind(this));
    }

    this._component = React.renderComponent(this.handler(), node);
    this.transitionTo(urlStore.getCurrentPath());

    return this._component;
  },

  handleRouteChange: function () {
    this.transitionTo(urlStore.getCurrentPath());
  },

  /**
   * Executes a transition of this router to the given path, checking all
   * transition hooks along the way to ensure the transition is valid. Returns
   * a promise for the transition object that resolves after the transition
   * is complete.
   *
   * Note: This method may only be called on top-level routers that have already
   * been rendered (see Router#renderComponent).
   *
   * Transition Hooks
   * ----------------
   *
   * Route handlers may use the willTransitionTo and willTransitionAway static
   * methods to control routing behavior. When transitioning to a route, the
   * willTransitionTo hook is called with the transition object and a hash of
   * params that handler will receive. Its return value is used as the "context"
   * prop that is passed to the handler instance.
   *
   * When transitioning away from a route, the willTransitionAway hook is called
   * with the transition object. Either hook may return a promise for its result
   * if it needs to do something asynchronous, like make a request to a server.
   *
   * Aborting or Redirecting Transitions
   * -----------------------------------
   *
   * A hook may abort the transition by calling `transition.abort()`. Similarly,
   * hooks can perform a redirect using `transition.redirect('/login')`, for
   * example. After either aborting or redirecting the transition no other hooks
   * will be called.
   *
   * Note: transition.redirect replaces the current URL so it is not added to
   * the browser's history.
   *
   * Retrying Transitions
   * --------------------
   *
   * A reference to a transition object may be kept and used later to retry a
   * transition that was aborted or redirected for some reason. To do this, use
   * `transition.retry()`.
   */ 
  transitionTo: function (currentPath) {
    invariant(
      this._component,
      'You cannot use transitionTo on a router that has not been rendered'
    );

    var matches = this.match(path.withoutQuery(currentPath));

    if (matches) {
      var transition = new Transition(currentPath);

      return checkTransitionHooks(this._lastMatches, matches, transition).then(function () {
        if (transition.isCancelled()) {
          var reason = transition.cancelReason;

          if (reason instanceof Redirect)
            Router.replaceWith(reason.to, reason.params, reason.query);
        } else {
          this._lastMatches = matches;
          this._component.setProps(getComponentProps(currentPath, matches));
        }

        return transition;
      }.bind(this), function (error) {
        // There was an unrecoverable error, so let the user know!
        // TODO: Should we provide a hook so users can handle this?
        throw error;
      });
    }

    warning(
      false,
      'No routes matched path "' + currentPath + '"'
    );

    this._component.setProps(getNullComponentProps());
  },

  toString: function () {
    return '<' + this.displayName + '>';
  }

});

function Transition(path) {
  this.path = path;
  this.cancelReason = null;
}

mergeInto(Transition.prototype, {

  isCancelled: function () {
    return this.cancelReason != null;
  },

  abort: function () {
    this.cancelReason = new Abort();
  },

  redirect: function (to, params, query) {
    this.cancelReason = new Redirect(to, params, query);
  },

  retry: function () {
    Router.transitionTo(this.path);
  }

});

function Abort() {}

function Redirect(to, params, query) {
  this.to = to;
  this.params = params;
  this.query = query;
}

function getComponentDisplayName(component) {
  return component.type.displayName || 'UnnamedComponent';
}

function getComponentProps(currentPath, matches) {
  var query = path.extractQuery(currentPath) || {};

  return matches.reduceRight(function (childProps, match) {
    var props = {};
    var router = match.router;

    if (router.staticProps)
      mergeInto(props, router.staticProps);

    props.handler = router.handler;
    props.context = router.currentContext;
    props.params = match.params;
    props.query = query;
    props.key = urlStore.getCurrentPath();

    if (childProps && childProps.handler) {
      props.activeRoute = childProps.handler(childProps);
    } else {
      props.activeRoute = null;
    }

    return props;
  }, null);
}

function getNullComponentProps() {
  return {
    handler: null,
    context: null,
    params: null,
    query: null,
    activeRoute: null
  };
}

function makeMatch(router, params) {
  return { router: router, params: params };
}

function hasMatch(matches, match) {
  return matches.some(function (m) {
    return match.router === m.router && hasProperties(match.params, m.params);
  });
}

function hasProperties(object, properties) {
  for (var property in object) {
    if (object[property] !== properties[property])
      return false;
  }

  return true;
}

/**
 * Figures out which routers we're transitioning away from and to and runs all
 * transition hooks in serial, starting with the willTransitionAway hook on the most
 * deeply nested handler that is currently active, up the route hierarchy to the common
 * parent route, and back down the route hierarchy ending with the willTransitionTo
 * hook on the most deeply nested handler that will be active if the transition
 * completes successfully.
 *
 * After all hooks complete successfully, the currentContext of all routers involved
 * in the trasition is updated accordingly. Routes that we're transitioning to receive
 * the result of willTransitionTo as their currentContext.
 *
 * Returns a promise that resolves when all transition hooks are complete.
 */ 
function checkTransitionHooks(lastMatches, currentMatches, transition) {
  var awayMatches, toMatches;
  if (lastMatches) {
    awayMatches = lastMatches.filter(function (match) {
      return !hasMatch(currentMatches, match);
    });

    toMatches = currentMatches.filter(function (match) {
      return !hasMatch(lastMatches, match);
    });
  } else {
    awayMatches = [];
    toMatches = currentMatches;
  }

  return checkTransitionAwayHooks(awayMatches, transition).then(function () {
    if (transition.isCancelled())
      return; // No need to continue.

    return checkTransitionToHooks(toMatches, transition).then(function (contexts) {
      if (transition.isCancelled())
        return; // No need to continue.

      // At this point all checks have completed successfully so we proceed
      // with the transition and remove the reference to the context object
      // from routers we're transitioning away from.
      awayMatches.forEach(function (match) {
        match.router.currentContext = null;
      });

      // Likewise, update the currentContext of routers we're transitioning to.
      toMatches.forEach(function (match, index) {
        match.router.currentContext = contexts[index] || null;
      });
    });
  });
}

var Promise = require('es6-promise').Promise;

/**
 * Calls the willTransitionAway hook of all handlers in the given matches
 * serially in reverse, so that the deepest nested handlers are called first.
 * Returns a promise that resolves after the last handler.
 */
function checkTransitionAwayHooks(matches, transition) {
  var promise = Promise.resolve();

  reversedArray(matches).forEach(function (match) {
    promise = promise.then(function () {
      if (transition.isCancelled())
        return; // Short-circuit.

      var handler = match.router.handler;

      if (handler.willTransitionAway)
        return handler.willTransitionAway(transition);
    });
  });

  return promise;
}

function reversedArray(array) {
  return array.slice(0).reverse();
}

/**
 * Calls the willTransitionTo hook of all handlers in the given matches serially
 * with the transition object and any params that apply to that handler. Returns
 * a promise for an array of the context objects that are returned. If any handler
 * does not specify a willTransitionTo hook, its context is undefined.
 */
function checkTransitionToHooks(matches, transition) {
  var promise = Promise.resolve();
  var contexts = [];

  matches.forEach(function (match) {
    promise = promise.then(function () {
      if (transition.isCancelled())
        return; // Short-circuit.

      var handler = match.router.handler;

      if (handler.willTransitionTo) {
        return Promise.resolve(handler.willTransitionTo(transition, match.params)).then(function (context) {
          contexts.push(context);
        });
      }

      contexts.push(undefined);
    });
  });

  return promise.then(function () {
    return contexts;
  });
}

module.exports = Router;
