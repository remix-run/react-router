!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ReactRouter=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var warning = _dereq_('react/lib/warning');

function Router(route) {
  warning(
    false,
    'The Router(<Route>).renderComponent(container) interface is deprecated and ' +
    'will be removed soon. Use React.renderComponent(<Route>, container) instead'
  );

  return {
    renderComponent: function (container, callback) {
      return React.renderComponent(route, container, callback);
    }
  };
}

module.exports = Router;

},{"react/lib/warning":50}],2:[function(_dereq_,module,exports){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var ActiveState = _dereq_('../mixins/ActiveState');
var withoutProperties = _dereq_('../helpers/withoutProperties');
var transitionTo = _dereq_('../helpers/transitionTo');
var makeHref = _dereq_('../helpers/makeHref');

/**
 * A map of <Link> component props that are reserved for use by the
 * router and/or React. All other props are used as params that are
 * interpolated into the link's path.
 */
var RESERVED_PROPS = {
  to: true,
  className: true,
  activeClassName: true,
  query: true,
  children: true // ReactChildren
};

/**
 * <Link> components are used to create an <a> element that links to a route.
 * When that route is active, the link gets an "active" class name (or the
 * value of its `activeClassName` prop).
 *
 * For example, assuming you have the following route:
 *
 *   <Route name="showPost" path="/posts/:postId" handler={Post}/>
 *
 * You could use the following component to link to that route:
 * 
 *   <Link to="showPost" postId="123"/>
 *
 * In addition to params, links may pass along query string parameters
 * using the `query` prop.
 *
 *   <Link to="showPost" postId="123" query={{show:true}}/>
 */
var Link = React.createClass({

  displayName: 'Link',

  mixins: [ ActiveState ],

  statics: {

    getUnreservedProps: function (props) {
      return withoutProperties(props, RESERVED_PROPS);
    }

  },

  propTypes: {
    to: React.PropTypes.string.isRequired,
    activeClassName: React.PropTypes.string.isRequired,
    query: React.PropTypes.object
  },

  getDefaultProps: function () {
    return {
      activeClassName: 'active'
    };
  },

  getInitialState: function () {
    return {
      isActive: false
    };
  },

  /**
   * Returns a hash of URL parameters to use in this <Link>'s path.
   */
  getParams: function () {
    return Link.getUnreservedProps(this.props);
  },

  /**
   * Returns the value of the "href" attribute to use on the DOM element.
   */
  getHref: function () {
    return makeHref(this.props.to, this.getParams(), this.props.query);
  },

  /**
   * Returns the value of the "class" attribute to use on the DOM element, which contains
   * the value of the activeClassName property when this <Link> is active.
   */
  getClassName: function () {
    var className = this.props.className || '';

    if (this.state.isActive)
      return className + ' ' + this.props.activeClassName;

    return className;
  },

  componentWillReceiveProps: function (nextProps) {
    var params = Link.getUnreservedProps(nextProps);

    this.setState({
      isActive: Link.isActive(nextProps.to, params, nextProps.query)
    });
  },

  updateActiveState: function () {
    this.setState({
      isActive: Link.isActive(this.props.to, this.getParams(), this.props.query)
    });
  },

  handleClick: function (event) {
    if (isModifiedEvent(event))
      return;

    event.preventDefault();

    transitionTo(this.props.to, this.getParams(), this.props.query);
  },

  render: function () {
    var props = {
      href: this.getHref(),
      className: this.getClassName(),
      onClick: this.handleClick
    };

    return React.DOM.a(props, this.props.children);
  }

});

function isModifiedEvent(event) {
  return !!(event.metaKey || event.ctrlKey || event.shiftKey);
}

module.exports = Link;

},{"../helpers/makeHref":7,"../helpers/transitionTo":11,"../helpers/withoutProperties":12,"../mixins/ActiveState":14}],3:[function(_dereq_,module,exports){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var warning = _dereq_('react/lib/warning');
var ExecutionEnvironment = _dereq_('react/lib/ExecutionEnvironment');
var mergeProperties = _dereq_('../helpers/mergeProperties');
var goBack = _dereq_('../helpers/goBack');
var replaceWith = _dereq_('../helpers/replaceWith');
var transitionTo = _dereq_('../helpers/transitionTo');
var withoutProperties = _dereq_('../helpers/withoutProperties');
var Path = _dereq_('../helpers/Path');
var ActiveStore = _dereq_('../stores/ActiveStore');
var RouteStore = _dereq_('../stores/RouteStore');
var URLStore = _dereq_('../stores/URLStore');
var Promise = _dereq_('es6-promise').Promise;

/**
 * A map of <Route> component props that are reserved for use by the
 * router and/or React. All other props are considered "static" and
 * are passed through to the route handler.
 */
var RESERVED_PROPS = {
  location: true,
  handler: true,
  name: true,
  path: true,
  children: true // ReactChildren
};

/**
 * The ref name that can be used to reference the active route component.
 */
var REF_NAME = '__activeRoute__';

/**
 * <Route> components specify components that are rendered to the page when the
 * URL matches a given pattern.
 *
 * Routes are arranged in a nested tree structure. When a new URL is requested,
 * the tree is searched depth-first to find a route whose path matches the URL.
 * When one is found, all routes in the tree that lead to it are considered
 * "active" and their components are rendered into the DOM, nested in the same
 * order as they are in the tree.
 *
 * Unlike Ember, a nested route's path does not build upon that of its parents.
 * This may seem like it creates more work up front in specifying URLs, but it
 * has the nice benefit of decoupling nested UI from "nested" URLs.
 *
 * The preferred way to configure a router is using JSX. The XML-like syntax is
 * a great way to visualize how routes are laid out in an application.
 *
 *   React.renderComponent((
 *     <Route handler={App}>
 *       <Route name="login" handler={Login}/>
 *       <Route name="logout" handler={Logout}/>
 *       <Route name="about" handler={About}/>
 *     </Route>
 *   ), document.body);
 *
 * If you don't use JSX, you can also assemble a Router programmatically using
 * the standard React component JavaScript API.
 *
 *   React.renderComponent((
 *     Route({ handler: App },
 *       Route({ name: 'login', handler: Login }),
 *       Route({ name: 'logout', handler: Logout }),
 *       Route({ name: 'about', handler: About })
 *     )
 *   ), document.body);
 *
 * Handlers for Route components that contain children can render their active
 * child route using the activeRouteHandler prop.
 *
 *   var App = React.createClass({
 *     render: function () {
 *       return (
 *         <div class="application">
 *           {this.props.activeRouteHandler()}
 *         </div>
 *       );
 *     }
 *   });
 */
var Route = React.createClass({
  displayName: 'Route',

  statics: {

    getUnreservedProps: function (props) {
      return withoutProperties(props, RESERVED_PROPS);
    },

    /**
     * Handles errors that were thrown asynchronously. By default, the
     * error is re-thrown so we don't swallow them silently.
     */
    handleAsyncError: function (error, route) {
      throw error; // This error probably originated in a transition hook.
    },

    /**
     * Handles cancelled transitions. By default, redirects replace the
     * current URL and aborts roll it back.
     */
    handleCancelledTransition: function (transition, route) {
      var reason = transition.cancelReason;

      if (reason instanceof Redirect) {
        replaceWith(reason.to, reason.params, reason.query);
      } else if (reason instanceof Abort) {
        goBack();
      }
    }

  },

  propTypes: {
    location: React.PropTypes.oneOf([ 'hash', 'history' ]).isRequired,
    handler: React.PropTypes.any.isRequired,
    path: React.PropTypes.string,
    name: React.PropTypes.string
  },

  getDefaultProps: function () {
    return {
      location: 'hash'
    };
  },

  getInitialState: function () {
    return {};
  },

  componentWillMount: function () {
    RouteStore.registerRoute(this);

    if (!URLStore.isSetup() && ExecutionEnvironment.canUseDOM)
      URLStore.setup(this.props.location);

    URLStore.addChangeListener(this.handleRouteChange);
  },

  componentDidMount: function () {
    this.dispatch(URLStore.getCurrentPath());
  },

  componentWillUnmount: function () {
    URLStore.removeChangeListener(this.handleRouteChange);
  },

  handleRouteChange: function () {
    this.dispatch(URLStore.getCurrentPath());
  },

  /**
   * Performs a depth-first search for the first route in the tree that matches
   * on the given path. Returns an array of all routes in the tree leading to
   * the one that matched in the format { route, params } where params is an
   * object that contains the URL parameters relevant to that route. Returns
   * null if no route in the tree matches the path.
   *
   *   ( <Route handler={App}>
   *       <Route name="posts" handler={Posts}>
   *         <Route name="newPost" path="/posts/new" handler={NewPost}/>
   *         <Route name="showPost" path="/posts/:id" handler={Post}/>
   *       </Route>
   *     </Route>
   *   ).match('/posts/123'); => [ { route: <AppRoute>, params: {} },
   *                               { route: <PostsRoute>, params: {} },
   *                               { route: <PostRoute>, params: { id: '123' } } ]
   */
  match: function (path) {
    return findMatches(Path.withoutQuery(path), this);
  },

  /**
   * Performs a transition to the given path and returns a promise for the
   * Transition object that was used.
   *
   * In order to do this, the router first determines which routes are involved
   * in the transition beginning with the current route, up the route tree to
   * the first parent route that is shared with the destination route, and back
   * down the tree to the destination route. The willTransitionFrom static
   * method is invoked on all route handlers we're transitioning away from, in
   * reverse nesting order. Likewise, the willTransitionTo static method
   * is invoked on all route handlers we're transitioning to.
   *
   * Both willTransitionFrom and willTransitionTo hooks may either abort or
   * redirect the transition. If they need to resolve asynchronously, they may
   * return a promise.
   *
   * Any error that occurs asynchronously during the transition is re-thrown in
   * the top-level scope unless returnRejectedPromise is true, in which case a
   * rejected promise is returned so the caller may handle the error.
   *
   * Note: This function does not update the URL in a browser's location bar.
   * If you want to keep the URL in sync with transitions, use Router.transitionTo,
   * Router.replaceWith, or Router.goBack instead.
   */
  dispatch: function (path, returnRejectedPromise) {
    var transition = new Transition(path);
    var route = this;

    var promise = syncWithTransition(route, transition).then(function (newState) {
      if (transition.isCancelled) {
        Route.handleCancelledTransition(transition, route);
      } else if (newState) {
        ActiveStore.updateState(newState);
      }

      return transition;
    });

    if (!returnRejectedPromise) {
      promise = promise.then(undefined, function (error) {
        // Use setTimeout to break the promise chain.
        setTimeout(function () {
          Route.handleAsyncError(error, route);
        });
      });
    }

    return promise;
  },

  render: function () {
    if (!this.state.path)
      return null;

    return this.props.handler(computeHandlerProps(this.state.matches || [], this.state.activeQuery));
  }

});

function Transition(path) {
  this.path = path;
  this.cancelReason = null;
  this.isCancelled = false;
}

mergeProperties(Transition.prototype, {

  abort: function () {
    this.cancelReason = new Abort();
    this.isCancelled = true;
  },

  redirect: function (to, params, query) {
    this.cancelReason = new Redirect(to, params, query);
    this.isCancelled = true;
  },

  retry: function () {
    transitionTo(this.path);
  }

});

function Abort() {}

function Redirect(to, params, query) {
  this.to = to;
  this.params = params;
  this.query = query;
}

function findMatches(path, route) {
  var children = route.props.children, matches;
  var params;

  // Check the subtree first to find the most deeply-nested match.
  if (Array.isArray(children)) {
    for (var i = 0, len = children.length; matches == null && i < len; ++i) {
      matches = findMatches(path, children[i]);
    }
  } else if (children) {
    matches = findMatches(path, children);
  }

  if (matches) {
    var rootParams = getRootMatch(matches).params;
    params = {};

    Path.extractParamNames(route.props.path).forEach(function (paramName) {
      params[paramName] = rootParams[paramName];
    });

    matches.unshift(makeMatch(route, params));

    return matches;
  }

  // No routes in the subtree matched, so check this route.
  params = Path.extractParams(route.props.path, path);

  if (params)
    return [ makeMatch(route, params) ];

  return null;
}

function makeMatch(route, params) {
  return { route: route, params: params };
}

function hasMatch(matches, match) {
  return matches.some(function (m) {
    if (m.route !== match.route)
      return false;

    for (var property in m.params) {
      if (m.params[property] !== match.params[property])
        return false;
    }

    return true;
  });
}

function getRootMatch(matches) {
  return matches[matches.length - 1];
}

function updateMatchComponents(matches, refs) {
  var i = 0, component;
  while (component = refs[REF_NAME]) {
    matches[i++].component = component;
    refs = component.refs;
  }
}

/**
 * Runs all transition hooks that are required to get from the current state
 * to the state specified by the given transition and updates the current state
 * if they all pass successfully. Returns a promise that resolves to the new
 * state if it needs to be updated, or undefined if not.
 */
function syncWithTransition(route, transition) {
  if (route.state.path === transition.path)
    return Promise.resolve(); // Nothing to do!

  var currentMatches = route.state.matches;
  var nextMatches = route.match(transition.path);

  warning(
    nextMatches,
    'No route matches path "' + transition.path + '". Make sure you have ' +
    '<Route path="' + transition.path + '"> somewhere in your routes'
  );

  if (!nextMatches)
    nextMatches = [];

  var fromMatches, toMatches;
  if (currentMatches) {
    updateMatchComponents(currentMatches, route.refs);

    fromMatches = currentMatches.filter(function (match) {
      return !hasMatch(nextMatches, match);
    });

    toMatches = nextMatches.filter(function (match) {
      return !hasMatch(currentMatches, match);
    });
  } else {
    fromMatches = [];
    toMatches = nextMatches;
  }

  return checkTransitionFromHooks(fromMatches, transition).then(function () {
    if (transition.isCancelled)
      return; // No need to continue.

    return checkTransitionToHooks(toMatches, transition).then(function () {
      if (transition.isCancelled)
        return; // No need to continue.

      var rootMatch = getRootMatch(nextMatches);
      var params = (rootMatch && rootMatch.params) || {};
      var query = Path.extractQuery(transition.path) || {};
      var state = {
        path: transition.path,
        matches: nextMatches,
        activeParams: params,
        activeQuery: query,
        activeRoutes: nextMatches.map(function (match) {
          return match.route;
        })
      };

      route.setState(state);

      return state;
    });
  });
}

/**
 * Calls the willTransitionFrom hook of all handlers in the given matches
 * serially in reverse with the transition object and the current instance of
 * the route's handler, so that the deepest nested handlers are called first.
 * Returns a promise that resolves after the last handler.
 */
function checkTransitionFromHooks(matches, transition) {
  var promise = Promise.resolve();

  reversedArray(matches).forEach(function (match) {
    promise = promise.then(function () {
      var handler = match.route.props.handler;

      if (!transition.isCancelled && handler.willTransitionFrom)
        return handler.willTransitionFrom(transition, match.component);
    });
  });

  return promise;
}

/**
 * Calls the willTransitionTo hook of all handlers in the given matches serially
 * with the transition object and any params that apply to that handler. Returns
 * a promise that resolves after the last handler.
 */
function checkTransitionToHooks(matches, transition) {
  var promise = Promise.resolve();

  matches.forEach(function (match, index) {
    promise = promise.then(function () {
      var handler = match.route.props.handler;

      if (!transition.isCancelled && handler.willTransitionTo)
        return handler.willTransitionTo(transition, match.params);
    });
  });

  return promise;
}

/**
 * Returns a props object for a component that renders the routes in the
 * given matches.
 */
function computeHandlerProps(matches, query) {
  var props = {
    ref: null,
    key: null,
    params: null,
    query: null,
    activeRouteHandler: returnNull
  };

  var childHandler;
  reversedArray(matches).forEach(function (match) {
    var route = match.route;

    props = Route.getUnreservedProps(route.props);

    props.ref = REF_NAME;
    props.key = Path.injectParams(route.props.path, match.params);
    props.params = match.params;
    props.query = query;

    if (childHandler) {
      props.activeRouteHandler = childHandler;
    } else {
      props.activeRouteHandler = returnNull;
    }

    childHandler = function (props, addedProps) {
      if (arguments.length > 2 && typeof arguments[2] !== 'undefined')
        throw new Error('Passing children to a route handler is not supported');

      return route.props.handler(mergeProperties(props, addedProps));
    }.bind(this, props);
  });

  return props;
}

function returnNull() {
  return null;
}

function reversedArray(array) {
  return array.slice(0).reverse();
}

module.exports = Route;

},{"../helpers/Path":4,"../helpers/goBack":6,"../helpers/mergeProperties":9,"../helpers/replaceWith":10,"../helpers/transitionTo":11,"../helpers/withoutProperties":12,"../stores/ActiveStore":15,"../stores/RouteStore":16,"../stores/URLStore":17,"es6-promise":21,"react/lib/ExecutionEnvironment":46,"react/lib/warning":50}],4:[function(_dereq_,module,exports){
var invariant = _dereq_('react/lib/invariant');
var qs = _dereq_('querystring');
var mergeProperties = _dereq_('./mergeProperties');
var URL = _dereq_('./URL');

var paramMatcher = /((?::[a-z_$][a-z0-9_$]*)|\*)/ig;
var queryMatcher = /\?(.+)/;

function getParamName(pathSegment) {
  return pathSegment === '*' ? 'splat' : pathSegment.substr(1);
}

var _compiledPatterns = {};

function compilePattern(pattern) {
  if (_compiledPatterns[pattern])
    return _compiledPatterns[pattern];

  var compiled = _compiledPatterns[pattern] = {};
  var paramNames = compiled.paramNames = [];

  var source = pattern.replace(paramMatcher, function (match, pathSegment) {
    paramNames.push(getParamName(pathSegment));
    return pathSegment === '*' ? '(.*?)' : '([^/?#]+)';
  });

  compiled.matcher = new RegExp('^' + source + '$', 'i');

  return compiled;
}

function isDynamicPattern(pattern) {
  return pattern.indexOf(':') !== -1 || pattern.indexOf('*') !== -1;
}

var Path = {

  /**
   * Extracts the portions of the given URL path that match the given pattern
   * and returns an object of param name => value pairs. Returns null if the
   * pattern does not match the given path.
   */
  extractParams: function (pattern, path) {
    if (!isDynamicPattern(pattern)) {
      if (pattern === URL.decode(path))
        return {}; // No dynamic segments, but the paths match.

      return null;
    }

    var compiled = compilePattern(pattern);
    var match = URL.decode(path).match(compiled.matcher);

    if (!match)
      return null;

    var params = {};

    compiled.paramNames.forEach(function (paramName, index) {
      params[paramName] = match[index + 1];
    });

    return params;
  },

  /**
   * Returns an array of the names of all parameters in the given pattern.
   */
  extractParamNames: function (pattern) {
    return compilePattern(pattern).paramNames;
  },

  /**
   * Returns a version of the given route path with params interpolated. Throws
   * if there is a dynamic segment of the route path for which there is no param.
   */
  injectParams: function (pattern, params) {
    if (!isDynamicPattern(pattern))
      return pattern;

    params = params || {};

    return pattern.replace(paramMatcher, function (match, pathSegment) {
      var paramName = getParamName(pathSegment);

      invariant(
        params[paramName] != null,
        'Missing "' + paramName + '" parameter for path "' + pattern + '"'
      );

      // Preserve forward slashes.
      return String(params[paramName]).split('/').map(URL.encode).join('/');
    });
  },

  /**
   * Returns an object that is the result of parsing any query string contained in
   * the given path, null if the path contains no query string.
   */
  extractQuery: function (path) {
    var match = path.match(queryMatcher);
    return match && qs.parse(match[1]);
  },

  /**
   * Returns a version of the given path without the query string.
   */
  withoutQuery: function (path) {
    return path.replace(queryMatcher, '');
  },

  /**
   * Returns a version of the given path with the parameters in the given query
   * added to the query string.
   */
  withQuery: function (path, query) {
    var existingQuery = Path.extractQuery(path);

    if (existingQuery)
      query = query ? mergeProperties(existingQuery, query) : existingQuery;

    var queryString = query && qs.stringify(query);

    if (queryString)
      return Path.withoutQuery(path) + '?' + queryString;

    return path;
  },

  /**
   * Returns a normalized version of the given path.
   */
  normalize: function (path) {
    return path.replace(/^\/*/, '/');
  }

};

module.exports = Path;

},{"./URL":5,"./mergeProperties":9,"querystring":20,"react/lib/invariant":49}],5:[function(_dereq_,module,exports){
var urlEncodedSpaceRE = /\+/g;
var encodedSpaceRE = /%20/g;

var URL = {

  /* These functions were copied from the https://github.com/cujojs/rest source, MIT licensed */

  decode: function (str) {
    // spec says space should be encoded as '+'
    str = str.replace(urlEncodedSpaceRE, ' ');
    return decodeURIComponent(str);
  },

  encode: function (str) {
    str = encodeURIComponent(str);
    // spec says space should be encoded as '+'
    return str.replace(encodedSpaceRE, '+');
  }

};

module.exports = URL;

},{}],6:[function(_dereq_,module,exports){
var URLStore = _dereq_('../stores/URLStore');

function goBack() {
  URLStore.back();
}

module.exports = goBack;

},{"../stores/URLStore":17}],7:[function(_dereq_,module,exports){
var URLStore = _dereq_('../stores/URLStore');
var makePath = _dereq_('./makePath');

/**
 * Returns a string that may safely be used as the href of a
 * link to the route with the given name.
 */
function makeHref(routeName, params, query) {
  var path = makePath(routeName, params, query);

  if (URLStore.getLocation() === 'hash')
    return '#' + path;

  return path;
}

module.exports = makeHref;

},{"../stores/URLStore":17,"./makePath":8}],8:[function(_dereq_,module,exports){
var invariant = _dereq_('react/lib/invariant');
var RouteStore = _dereq_('../stores/RouteStore');
var Path = _dereq_('./Path');

/**
 * Returns an absolute URL path created from the given route name, URL
 * parameters, and query values.
 */
function makePath(to, params, query) {
  var path;
  if (to.charAt(0) === '/') {
    path = Path.normalize(to); // Absolute path.
  } else {
    var route = RouteStore.getRouteByName(to);

    invariant(
      route,
      'Unable to find a route named "' + to + '". Make sure you have ' +
      'a <Route name="' + to + '"> defined somewhere in your routes'
    );

    path = route.props.path;
  }

  return Path.withQuery(Path.injectParams(path, params), query);
}

module.exports = makePath;

},{"../stores/RouteStore":16,"./Path":4,"react/lib/invariant":49}],9:[function(_dereq_,module,exports){
function mergeProperties(object, properties) {
  for (var property in properties) {
    if (properties.hasOwnProperty(property))
      object[property] = properties[property];
  }

  return object;
}

module.exports = mergeProperties;

},{}],10:[function(_dereq_,module,exports){
var URLStore = _dereq_('../stores/URLStore');
var makePath = _dereq_('./makePath');

/**
 * Transitions to the URL specified in the arguments by replacing
 * the current URL in the history stack.
 */
function replaceWith(to, params, query) {
  URLStore.replace(makePath(to, params, query));
}

module.exports = replaceWith;

},{"../stores/URLStore":17,"./makePath":8}],11:[function(_dereq_,module,exports){
var URLStore = _dereq_('../stores/URLStore');
var makePath = _dereq_('./makePath');

/**
 * Transitions to the URL specified in the arguments by pushing
 * a new URL onto the history stack.
 */
function transitionTo(to, params, query) {
  URLStore.push(makePath(to, params, query));
}

module.exports = transitionTo;

},{"../stores/URLStore":17,"./makePath":8}],12:[function(_dereq_,module,exports){
function withoutProperties(object, properties) {
  var result = {};

  for (var property in object) {
    if (object.hasOwnProperty(property) && !properties[property])
      result[property] = object[property];
  }

  return result;
}

module.exports = withoutProperties;

},{}],13:[function(_dereq_,module,exports){
exports.Link = _dereq_('./components/Link');
exports.Route = _dereq_('./components/Route');

exports.goBack = _dereq_('./helpers/goBack');
exports.replaceWith = _dereq_('./helpers/replaceWith');
exports.transitionTo = _dereq_('./helpers/transitionTo');

exports.ActiveState = _dereq_('./mixins/ActiveState');

// Backwards compat with 0.1. We should
// remove this when we ship 1.0.
exports.Router = _dereq_('./Router');

},{"./Router":1,"./components/Link":2,"./components/Route":3,"./helpers/goBack":6,"./helpers/replaceWith":10,"./helpers/transitionTo":11,"./mixins/ActiveState":14}],14:[function(_dereq_,module,exports){
var ActiveStore = _dereq_('../stores/ActiveStore');

/**
 * A mixin for components that need to know about the routes, params,
 * and query that are currently active. Components that use it get two
 * things:
 *
 *   1. An `isActive` static method they can use to check if a route,
 *      params, and query are active.
 *   2. An `updateActiveState` instance method that is called when the
 *      active state changes.
 *
 * Example:
 *
 *   var Tab = React.createClass({
 *     
 *     mixins: [ Router.ActiveState ],
 *
 *     getInitialState: function () {
 *       return {
 *         isActive: false
 *       };
 *     },
 *   
 *     updateActiveState: function () {
 *       this.setState({
 *         isActive: Tab.isActive(routeName, params, query)
 *       })
 *     }
 *   
 *   });
 */
var ActiveState = {

  statics: {

    /**
     * Returns true if the route with the given name, URL parameters, and query
     * are all currently active.
     */
    isActive: ActiveStore.isActive

  },

  componentWillMount: function () {
    ActiveStore.addChangeListener(this.handleActiveStateChange);
  },

  componentDidMount: function () {
    if (this.updateActiveState)
      this.updateActiveState();
  },

  componentWillUnmount: function () {
    ActiveStore.removeChangeListener(this.handleActiveStateChange);
  },

  handleActiveStateChange: function () {
    if (this.isMounted() && this.updateActiveState)
      this.updateActiveState();
  }

};

module.exports = ActiveState;

},{"../stores/ActiveStore":15}],15:[function(_dereq_,module,exports){
var _activeRoutes = [];
var _activeParams = {};
var _activeQuery = {};

function routeIsActive(routeName) {
  return _activeRoutes.some(function (route) {
    return route.props.name === routeName;
  });
}

function paramsAreActive(params) {
  for (var property in params) {
    if (_activeParams[property] !== String(params[property]))
      return false;
  }

  return true;
}

function queryIsActive(query) {
  for (var property in query) {
    if (_activeQuery[property] !== String(query[property]))
      return false;
  }

  return true;
}

var EventEmitter = _dereq_('event-emitter');
var _events = EventEmitter();

function notifyChange() {
  _events.emit('change');
}

/**
 * The ActiveStore keeps track of which routes, URL and query parameters are
 * currently active on a page. <Link>s subscribe to the ActiveStore to know
 * whether or not they are active.
 */
var ActiveStore = {

  /**
   * Adds a listener that will be called when this store changes.
   */
  addChangeListener: function (listener) {
    _events.on('change', listener);
  },

  /**
   * Removes the given change listener.
   */
  removeChangeListener: function (listener) {
    _events.off('change', listener);
  },

  /**
   * Updates the currently active state and notifies all listeners.
   * This is automatically called by routes as they become active.
   */
  updateState: function (state) {
    state = state || {};

    _activeRoutes = state.activeRoutes || [];
    _activeParams = state.activeParams || {};
    _activeQuery = state.activeQuery || {};

    notifyChange();
  },

  /**
   * Returns true if the route with the given name, URL parameters, and query
   * are all currently active.
   */
  isActive: function (routeName, params, query) {
    var isActive = routeIsActive(routeName) && paramsAreActive(params);

    if (query)
      return isActive && queryIsActive(query);

    return isActive;
  }

};

module.exports = ActiveStore;

},{"event-emitter":31}],16:[function(_dereq_,module,exports){
var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
var invariant = _dereq_('react/lib/invariant');
var Path = _dereq_('../helpers/Path');

var _namedRoutes = {};

/**
 * The RouteStore contains a directory of all <Route>s in the system. It is
 * used primarily for looking up routes by name so that <Link>s can use a
 * route name in the "to" prop and users can use route names in `Router.transitionTo`
 * and other high-level utility methods.
 */
var RouteStore = {

  /**
   * Registers a <Route> and all of its children with the RouteStore. Also,
   * does some normalization and validation on route props.
   */
  registerRoute: function (route, _parentRoute) {
    // Make sure the <Route>'s path begins with a slash. Default to its name.
    // We can't do this in getDefaultProps because it may not be called on
    // <Route>s that are never actually mounted.
    if (route.props.path || route.props.name) {
      route.props.path = Path.normalize(route.props.path || route.props.name);
    } else {
      route.props.path = '/';
    }

    // Make sure the <Route> has a valid React component for a handler.
    invariant(
      React.isValidClass(route.props.handler),
      'The handler for Route "' + (route.props.name || route.props.path) + '" ' +
      'must be a valid React component'
    );

    // Make sure the <Route> has all params that its parent needs.
    if (_parentRoute) {
      var paramNames = Path.extractParamNames(route.props.path);

      Path.extractParamNames(_parentRoute.props.path).forEach(function (paramName) {
        invariant(
          paramNames.indexOf(paramName) !== -1,
          'The nested route path "' + route.props.path + '" is missing the "' + paramName + '" ' +
          'parameter of its parent path "' + _parentRoute.props.path + '"'
        );
      });
    }

    // Make sure the <Route> can be looked up by <Link>s.
    if (route.props.name) {
      var existingRoute = _namedRoutes[route.props.name];

      invariant(
        !existingRoute || route === existingRoute,
        'You cannot use the name "' + route.props.name + '" for more than one route'
      );

      _namedRoutes[route.props.name] = route;
    }

    React.Children.forEach(route.props.children, function (child) {
      RouteStore.registerRoute(child, route);
    });
  },

  /**
   * Removes the reference to the given <Route> and all of its children from
   * the RouteStore.
   */
  unregisterRoute: function (route) {
    if (route.props.name)
      delete _namedRoutes[route.props.name];

    React.Children.forEach(route.props.children, function (child) {
      RouteStore.unregisterRoute(route);
    });
  },

  /**
   * Returns the Route object with the given name, if one exists.
   */
  getRouteByName: function (routeName) {
    return _namedRoutes[routeName] || null;
  }

};

module.exports = RouteStore;

},{"../helpers/Path":4,"react/lib/invariant":49}],17:[function(_dereq_,module,exports){
var ExecutionEnvironment = _dereq_('react/lib/ExecutionEnvironment');
var invariant = _dereq_('react/lib/invariant');
var warning = _dereq_('react/lib/warning');

var CHANGE_EVENTS = {
  hash: (window.addEventListener) ? 'hashchange' : 'onhashchange',
  history: 'popstate'
};

var _location;
var _currentPath = '/';
var _lastPath = null;

function getWindowPath() {
  return window.location.pathname + window.location.search;
}

var EventEmitter = _dereq_('event-emitter');
var _events = EventEmitter();

function notifyChange() {
  _events.emit('change');
}

/**
 * The URLStore keeps track of the current URL. In DOM environments, it may be
 * attached to window.location to automatically sync with the URL in a browser's
 * location bar. <Route>s subscribe to the URLStore to know when the URL changes.
 */
var URLStore = {

  /**
   * Adds a listener that will be called when this store changes.
   */
  addChangeListener: function (listener) {
    _events.on('change', listener);
  },

  /**
   * Removes the given change listener.
   */
  removeChangeListener: function (listener) {
    _events.off('change', listener);
  },

  /**
   * Returns the type of navigation that is currently being used.
   */
  getLocation: function () {
    return _location || 'hash';
  },

  /**
   * Returns the value of the current URL path.
   */
  getCurrentPath: function () {
    if (_location === 'history')
      return getWindowPath();
    
    if (_location === 'hash')
      return window.location.hash.substr(1);
    
    return _currentPath;
  },

  /**
   * Pushes the given path onto the browser navigation stack.
   */
  push: function (path) {
    if (_location === 'history') {
      window.history.pushState({ path: path }, '', path);
      notifyChange();
    } else if (_location === 'hash') {
      window.location.hash = path;
    } else {
      _lastPath = _currentPath;
      _currentPath = path;
      notifyChange();
    }
  },

  /**
   * Replaces the current URL path with the given path without adding an entry
   * to the browser's history.
   */
  replace: function (path) {
    if (_location === 'history') {
      window.history.replaceState({ path: path }, '', path);
      notifyChange();
    } else if (_location === 'hash') {
      window.location.replace(getWindowPath() + '#' + path);
    } else {
      _currentPath = path;
      notifyChange();
    }
  },

  /**
   * Reverts the URL to whatever it was before the last update.
   */
  back: function () {
    if (_location != null) {
      window.history.back();
    } else {
      invariant(
        _lastPath,
        'You cannot make the URL store go back more than once when it does not use the DOM'
      );

      _currentPath = _lastPath;
      _lastPath = null;
      notifyChange();
    }
  },

  /**
   * Returns true if the URL store has already been setup.
   */
  isSetup: function () {
    return _location != null;
  },

  /**
   * Sets up the URL store to get the value of the current path from window.location
   * as it changes. The location argument may be either "hash" or "history".
   */
  setup: function (location) {
    invariant(
      ExecutionEnvironment.canUseDOM,
      'You cannot setup the URL store in an environment with no DOM'
    );

    if (_location != null) {
      warning(
        _location === location,
        'The URL store was already setup using ' + _location + ' location. ' +
        'You cannot use ' + location + ' location on the same page'
      );

      return; // Don't setup twice.
    }

    var changeEvent = CHANGE_EVENTS[location];

    invariant(
      changeEvent,
      'The URL store location "' + location + '" is not valid. ' +
      'It must be either "hash" or "history"'
    );

    _location = location;

    if (location === 'hash' && window.location.hash === '')
      URLStore.replace('/');

    if (window.addEventListener) {
      window.addEventListener(changeEvent, notifyChange, false);
    } else {
      window.attachEvent(changeEvent, notifyChange);
    }

    notifyChange();
  },

  /**
   * Stops listening for changes to window.location.
   */
  teardown: function () {
    if (_location == null)
      return;

    var changeEvent = CHANGE_EVENTS[_location];

    if (window.removeEventListener) {
      window.removeEventListener(changeEvent, notifyChange, false);
    } else {
      window.detachEvent(changeEvent, notifyChange);
    }

    _location = null;
  }

};

module.exports = URLStore;

},{"event-emitter":31,"react/lib/ExecutionEnvironment":46,"react/lib/invariant":49,"react/lib/warning":50}],18:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],19:[function(_dereq_,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],20:[function(_dereq_,module,exports){
'use strict';

exports.decode = exports.parse = _dereq_('./decode');
exports.encode = exports.stringify = _dereq_('./encode');

},{"./decode":18,"./encode":19}],21:[function(_dereq_,module,exports){
"use strict";
var Promise = _dereq_("./promise/promise").Promise;
var polyfill = _dereq_("./promise/polyfill").polyfill;
exports.Promise = Promise;
exports.polyfill = polyfill;
},{"./promise/polyfill":25,"./promise/promise":26}],22:[function(_dereq_,module,exports){
"use strict";
/* global toString */

var isArray = _dereq_("./utils").isArray;
var isFunction = _dereq_("./utils").isFunction;

/**
  Returns a promise that is fulfilled when all the given promises have been
  fulfilled, or rejected if any of them become rejected. The return promise
  is fulfilled with an array that gives all the values in the order they were
  passed in the `promises` array argument.

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.resolve(2);
  var promise3 = RSVP.resolve(3);
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `RSVP.all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.reject(new Error("2"));
  var promise3 = RSVP.reject(new Error("3"));
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @for RSVP
  @param {Array} promises
  @param {String} label
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
*/
function all(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to all.');
  }

  return new Promise(function(resolve, reject) {
    var results = [], remaining = promises.length,
    promise;

    if (remaining === 0) {
      resolve([]);
    }

    function resolver(index) {
      return function(value) {
        resolveAll(index, value);
      };
    }

    function resolveAll(index, value) {
      results[index] = value;
      if (--remaining === 0) {
        resolve(results);
      }
    }

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && isFunction(promise.then)) {
        promise.then(resolver(i), reject);
      } else {
        resolveAll(i, promise);
      }
    }
  });
}

exports.all = all;
},{"./utils":30}],23:[function(_dereq_,module,exports){
"use strict";
var browserGlobal = (typeof window !== 'undefined') ? window : {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var local = (typeof global !== 'undefined') ? global : (this === undefined? window:this);

// node
function useNextTick() {
  return function() {
    process.nextTick(flush);
  };
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function() {
    node.data = (iterations = ++iterations % 2);
  };
}

function useSetTimeout() {
  return function() {
    local.setTimeout(flush, 1);
  };
}

var queue = [];
function flush() {
  for (var i = 0; i < queue.length; i++) {
    var tuple = queue[i];
    var callback = tuple[0], arg = tuple[1];
    callback(arg);
  }
  queue = [];
}

var scheduleFlush;

// Decide what async method to use to triggering processing of queued callbacks:
if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else {
  scheduleFlush = useSetTimeout();
}

function asap(callback, arg) {
  var length = queue.push([callback, arg]);
  if (length === 1) {
    // If length is 1, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    scheduleFlush();
  }
}

exports.asap = asap;
},{}],24:[function(_dereq_,module,exports){
"use strict";
var config = {
  instrument: false
};

function configure(name, value) {
  if (arguments.length === 2) {
    config[name] = value;
  } else {
    return config[name];
  }
}

exports.config = config;
exports.configure = configure;
},{}],25:[function(_dereq_,module,exports){
"use strict";
/*global self*/
var RSVPPromise = _dereq_("./promise").Promise;
var isFunction = _dereq_("./utils").isFunction;

function polyfill() {
  var local;

  if (typeof global !== 'undefined') {
    local = global;
  } else if (typeof window !== 'undefined' && window.document) {
    local = window;
  } else {
    local = self;
  }

  var es6PromiseSupport = 
    "Promise" in local &&
    // Some of these methods are missing from
    // Firefox/Chrome experimental implementations
    "resolve" in local.Promise &&
    "reject" in local.Promise &&
    "all" in local.Promise &&
    "race" in local.Promise &&
    // Older version of the spec had a resolver object
    // as the arg rather than a function
    (function() {
      var resolve;
      new local.Promise(function(r) { resolve = r; });
      return isFunction(resolve);
    }());

  if (!es6PromiseSupport) {
    local.Promise = RSVPPromise;
  }
}

exports.polyfill = polyfill;
},{"./promise":26,"./utils":30}],26:[function(_dereq_,module,exports){
"use strict";
var config = _dereq_("./config").config;
var configure = _dereq_("./config").configure;
var objectOrFunction = _dereq_("./utils").objectOrFunction;
var isFunction = _dereq_("./utils").isFunction;
var now = _dereq_("./utils").now;
var all = _dereq_("./all").all;
var race = _dereq_("./race").race;
var staticResolve = _dereq_("./resolve").resolve;
var staticReject = _dereq_("./reject").reject;
var asap = _dereq_("./asap").asap;

var counter = 0;

config.async = asap; // default async is asap;

function Promise(resolver) {
  if (!isFunction(resolver)) {
    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
  }

  if (!(this instanceof Promise)) {
    throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
  }

  this._subscribers = [];

  invokeResolver(resolver, this);
}

function invokeResolver(resolver, promise) {
  function resolvePromise(value) {
    resolve(promise, value);
  }

  function rejectPromise(reason) {
    reject(promise, reason);
  }

  try {
    resolver(resolvePromise, rejectPromise);
  } catch(e) {
    rejectPromise(e);
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value, error, succeeded, failed;

  if (hasCallback) {
    try {
      value = callback(detail);
      succeeded = true;
    } catch(e) {
      failed = true;
      error = e;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (handleThenable(promise, value)) {
    return;
  } else if (hasCallback && succeeded) {
    resolve(promise, value);
  } else if (failed) {
    reject(promise, error);
  } else if (settled === FULFILLED) {
    resolve(promise, value);
  } else if (settled === REJECTED) {
    reject(promise, value);
  }
}

var PENDING   = void 0;
var SEALED    = 0;
var FULFILLED = 1;
var REJECTED  = 2;

function subscribe(parent, child, onFulfillment, onRejection) {
  var subscribers = parent._subscribers;
  var length = subscribers.length;

  subscribers[length] = child;
  subscribers[length + FULFILLED] = onFulfillment;
  subscribers[length + REJECTED]  = onRejection;
}

function publish(promise, settled) {
  var child, callback, subscribers = promise._subscribers, detail = promise._detail;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    invokeCallback(settled, child, callback, detail);
  }

  promise._subscribers = null;
}

Promise.prototype = {
  constructor: Promise,

  _state: undefined,
  _detail: undefined,
  _subscribers: undefined,

  then: function(onFulfillment, onRejection) {
    var promise = this;

    var thenPromise = new this.constructor(function() {});

    if (this._state) {
      var callbacks = arguments;
      config.async(function invokePromiseCallback() {
        invokeCallback(promise._state, thenPromise, callbacks[promise._state - 1], promise._detail);
      });
    } else {
      subscribe(this, thenPromise, onFulfillment, onRejection);
    }

    return thenPromise;
  },

  'catch': function(onRejection) {
    return this.then(null, onRejection);
  }
};

Promise.all = all;
Promise.race = race;
Promise.resolve = staticResolve;
Promise.reject = staticReject;

function handleThenable(promise, value) {
  var then = null,
  resolved;

  try {
    if (promise === value) {
      throw new TypeError("A promises callback cannot return that same promise.");
    }

    if (objectOrFunction(value)) {
      then = value.then;

      if (isFunction(then)) {
        then.call(value, function(val) {
          if (resolved) { return true; }
          resolved = true;

          if (value !== val) {
            resolve(promise, val);
          } else {
            fulfill(promise, val);
          }
        }, function(val) {
          if (resolved) { return true; }
          resolved = true;

          reject(promise, val);
        });

        return true;
      }
    }
  } catch (error) {
    if (resolved) { return true; }
    reject(promise, error);
    return true;
  }

  return false;
}

function resolve(promise, value) {
  if (promise === value) {
    fulfill(promise, value);
  } else if (!handleThenable(promise, value)) {
    fulfill(promise, value);
  }
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = value;

  config.async(publishFulfillment, promise);
}

function reject(promise, reason) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = reason;

  config.async(publishRejection, promise);
}

function publishFulfillment(promise) {
  publish(promise, promise._state = FULFILLED);
}

function publishRejection(promise) {
  publish(promise, promise._state = REJECTED);
}

exports.Promise = Promise;
},{"./all":22,"./asap":23,"./config":24,"./race":27,"./reject":28,"./resolve":29,"./utils":30}],27:[function(_dereq_,module,exports){
"use strict";
/* global toString */
var isArray = _dereq_("./utils").isArray;

/**
  `RSVP.race` allows you to watch a series of promises and act as soon as the
  first promise given to the `promises` argument fulfills or rejects.

  Example:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 2");
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // result === "promise 2" because it was resolved before promise1
    // was resolved.
  });
  ```

  `RSVP.race` is deterministic in that only the state of the first completed
  promise matters. For example, even if other promises given to the `promises`
  array argument are resolved, but the first completed promise has become
  rejected before the other promises became fulfilled, the returned promise
  will become rejected:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error("promise 2"));
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // Code here never runs because there are rejected promises!
  }, function(reason){
    // reason.message === "promise2" because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  @method race
  @for RSVP
  @param {Array} promises array of promises to observe
  @param {String} label optional string for describing the promise returned.
  Useful for tooling.
  @return {Promise} a promise that becomes fulfilled with the value the first
  completed promises is resolved with if the first completed promise was
  fulfilled, or rejected with the reason that the first completed promise
  was rejected with.
*/
function race(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to race.');
  }
  return new Promise(function(resolve, reject) {
    var results = [], promise;

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && typeof promise.then === 'function') {
        promise.then(resolve, reject);
      } else {
        resolve(promise);
      }
    }
  });
}

exports.race = race;
},{"./utils":30}],28:[function(_dereq_,module,exports){
"use strict";
/**
  `RSVP.reject` returns a promise that will become rejected with the passed
  `reason`. `RSVP.reject` is essentially shorthand for the following:

  ```javascript
  var promise = new RSVP.Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = RSVP.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @for RSVP
  @param {Any} reason value that the returned promise will be rejected with.
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become rejected with the given
  `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Promise = this;

  return new Promise(function (resolve, reject) {
    reject(reason);
  });
}

exports.reject = reject;
},{}],29:[function(_dereq_,module,exports){
"use strict";
function resolve(value) {
  /*jshint validthis:true */
  if (value && typeof value === 'object' && value.constructor === this) {
    return value;
  }

  var Promise = this;

  return new Promise(function(resolve) {
    resolve(value);
  });
}

exports.resolve = resolve;
},{}],30:[function(_dereq_,module,exports){
"use strict";
function objectOrFunction(x) {
  return isFunction(x) || (typeof x === "object" && x !== null);
}

function isFunction(x) {
  return typeof x === "function";
}

function isArray(x) {
  return Object.prototype.toString.call(x) === "[object Array]";
}

// Date.now is not available in browsers < IE9
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
var now = Date.now || function() { return new Date().getTime(); };


exports.objectOrFunction = objectOrFunction;
exports.isFunction = isFunction;
exports.isArray = isArray;
exports.now = now;
},{}],31:[function(_dereq_,module,exports){
'use strict';

var d        = _dereq_('d')
  , callable = _dereq_('es5-ext/object/valid-callable')

  , apply = Function.prototype.apply, call = Function.prototype.call
  , create = Object.create, defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , descriptor = { configurable: true, enumerable: false, writable: true }

  , on, once, off, emit, methods, descriptors, base;

on = function (type, listener) {
	var data;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) {
		data = descriptor.value = create(null);
		defineProperty(this, '__ee__', descriptor);
		descriptor.value = null;
	} else {
		data = this.__ee__;
	}
	if (!data[type]) data[type] = listener;
	else if (typeof data[type] === 'object') data[type].push(listener);
	else data[type] = [data[type], listener];

	return this;
};

once = function (type, listener) {
	var once, self;

	callable(listener);
	self = this;
	on.call(this, type, once = function () {
		off.call(self, type, once);
		apply.call(listener, this, arguments);
	});

	once.__eeOnceListener__ = listener;
	return this;
};

off = function (type, listener) {
	var data, listeners, candidate, i;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) return this;
	data = this.__ee__;
	if (!data[type]) return this;
	listeners = data[type];

	if (typeof listeners === 'object') {
		for (i = 0; (candidate = listeners[i]); ++i) {
			if ((candidate === listener) ||
					(candidate.__eeOnceListener__ === listener)) {
				if (listeners.length === 2) data[type] = listeners[i ? 0 : 1];
				else listeners.splice(i, 1);
			}
		}
	} else {
		if ((listeners === listener) ||
				(listeners.__eeOnceListener__ === listener)) {
			delete data[type];
		}
	}

	return this;
};

emit = function (type) {
	var i, l, listener, listeners, args;

	if (!hasOwnProperty.call(this, '__ee__')) return;
	listeners = this.__ee__[type];
	if (!listeners) return;

	if (typeof listeners === 'object') {
		l = arguments.length;
		args = new Array(l - 1);
		for (i = 1; i < l; ++i) args[i - 1] = arguments[i];

		listeners = listeners.slice();
		for (i = 0; (listener = listeners[i]); ++i) {
			apply.call(listener, this, args);
		}
	} else {
		switch (arguments.length) {
		case 1:
			call.call(listeners, this);
			break;
		case 2:
			call.call(listeners, this, arguments[1]);
			break;
		case 3:
			call.call(listeners, this, arguments[1], arguments[2]);
			break;
		default:
			l = arguments.length;
			args = new Array(l - 1);
			for (i = 1; i < l; ++i) {
				args[i - 1] = arguments[i];
			}
			apply.call(listeners, this, args);
		}
	}
};

methods = {
	on: on,
	once: once,
	off: off,
	emit: emit
};

descriptors = {
	on: d(on),
	once: d(once),
	off: d(off),
	emit: d(emit)
};

base = defineProperties({}, descriptors);

module.exports = exports = function (o) {
	return (o == null) ? create(base) : defineProperties(Object(o), descriptors);
};
exports.methods = methods;

},{"d":32,"es5-ext/object/valid-callable":41}],32:[function(_dereq_,module,exports){
'use strict';

var assign        = _dereq_('es5-ext/object/assign')
  , normalizeOpts = _dereq_('es5-ext/object/normalize-options')
  , isCallable    = _dereq_('es5-ext/object/is-callable')
  , contains      = _dereq_('es5-ext/string/#/contains')

  , d;

d = module.exports = function (dscr, value/*, options*/) {
	var c, e, w, options, desc;
	if ((arguments.length < 2) || (typeof dscr !== 'string')) {
		options = value;
		value = dscr;
		dscr = null;
	} else {
		options = arguments[2];
	}
	if (dscr == null) {
		c = w = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
		w = contains.call(dscr, 'w');
	}

	desc = { value: value, configurable: c, enumerable: e, writable: w };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

d.gs = function (dscr, get, set/*, options*/) {
	var c, e, options, desc;
	if (typeof dscr !== 'string') {
		options = set;
		set = get;
		get = dscr;
		dscr = null;
	} else {
		options = arguments[3];
	}
	if (get == null) {
		get = undefined;
	} else if (!isCallable(get)) {
		options = get;
		get = set = undefined;
	} else if (set == null) {
		set = undefined;
	} else if (!isCallable(set)) {
		options = set;
		set = undefined;
	}
	if (dscr == null) {
		c = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
	}

	desc = { get: get, set: set, configurable: c, enumerable: e };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

},{"es5-ext/object/assign":33,"es5-ext/object/is-callable":36,"es5-ext/object/normalize-options":40,"es5-ext/string/#/contains":43}],33:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./is-implemented')()
	? Object.assign
	: _dereq_('./shim');

},{"./is-implemented":34,"./shim":35}],34:[function(_dereq_,module,exports){
'use strict';

module.exports = function () {
	var assign = Object.assign, obj;
	if (typeof assign !== 'function') return false;
	obj = { foo: 'raz' };
	assign(obj, { bar: 'dwa' }, { trzy: 'trzy' });
	return (obj.foo + obj.bar + obj.trzy) === 'razdwatrzy';
};

},{}],35:[function(_dereq_,module,exports){
'use strict';

var keys  = _dereq_('../keys')
  , value = _dereq_('../valid-value')

  , max = Math.max;

module.exports = function (dest, src/*, …srcn*/) {
	var error, i, l = max(arguments.length, 2), assign;
	dest = Object(value(dest));
	assign = function (key) {
		try { dest[key] = src[key]; } catch (e) {
			if (!error) error = e;
		}
	};
	for (i = 1; i < l; ++i) {
		src = arguments[i];
		keys(src).forEach(assign);
	}
	if (error !== undefined) throw error;
	return dest;
};

},{"../keys":37,"../valid-value":42}],36:[function(_dereq_,module,exports){
// Deprecated

'use strict';

module.exports = function (obj) { return typeof obj === 'function'; };

},{}],37:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./is-implemented')()
	? Object.keys
	: _dereq_('./shim');

},{"./is-implemented":38,"./shim":39}],38:[function(_dereq_,module,exports){
'use strict';

module.exports = function () {
	try {
		Object.keys('primitive');
		return true;
	} catch (e) { return false; }
};

},{}],39:[function(_dereq_,module,exports){
'use strict';

var keys = Object.keys;

module.exports = function (object) {
	return keys(object == null ? object : Object(object));
};

},{}],40:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_('./assign')

  , forEach = Array.prototype.forEach
  , create = Object.create, getPrototypeOf = Object.getPrototypeOf

  , process;

process = function (src, obj) {
	var proto = getPrototypeOf(src);
	return assign(proto ? process(proto, obj) : obj, src);
};

module.exports = function (options/*, …options*/) {
	var result = create(null);
	forEach.call(arguments, function (options) {
		if (options == null) return;
		process(Object(options), result);
	});
	return result;
};

},{"./assign":33}],41:[function(_dereq_,module,exports){
'use strict';

module.exports = function (fn) {
	if (typeof fn !== 'function') throw new TypeError(fn + " is not a function");
	return fn;
};

},{}],42:[function(_dereq_,module,exports){
'use strict';

module.exports = function (value) {
	if (value == null) throw new TypeError("Cannot use null or undefined");
	return value;
};

},{}],43:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./is-implemented')()
	? String.prototype.contains
	: _dereq_('./shim');

},{"./is-implemented":44,"./shim":45}],44:[function(_dereq_,module,exports){
'use strict';

var str = 'razdwatrzy';

module.exports = function () {
	if (typeof str.contains !== 'function') return false;
	return ((str.contains('dwa') === true) && (str.contains('foo') === false));
};

},{}],45:[function(_dereq_,module,exports){
'use strict';

var indexOf = String.prototype.indexOf;

module.exports = function (searchString/*, position*/) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

},{}],46:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ExecutionEnvironment
 */

/*jslint evil: true */

"use strict";

var canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

/**
 * Simple, lightweight module assisting with the detection and context of
 * Worker. Helps avoid circular dependencies and allows code to reason about
 * whether or not they are in a Worker, even if they never include the main
 * `ReactWorker` dependency.
 */
var ExecutionEnvironment = {

  canUseDOM: canUseDOM,

  canUseWorkers: typeof Worker !== 'undefined',

  canUseEventListeners:
    canUseDOM && !!(window.addEventListener || window.attachEvent),

  canUseViewport: canUseDOM && !!window.screen,

  isInWorker: !canUseDOM // For now, this is true - might change in the future.

};

module.exports = ExecutionEnvironment;

},{}],47:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule copyProperties
 */

/**
 * Copy properties from one or more objects (up to 5) into the first object.
 * This is a shallow copy. It mutates the first object and also returns it.
 *
 * NOTE: `arguments` has a very significant performance penalty, which is why
 * we don't support unlimited arguments.
 */
function copyProperties(obj, a, b, c, d, e, f) {
  obj = obj || {};

  if ("production" !== "production") {
    if (f) {
      throw new Error('Too many arguments passed to copyProperties');
    }
  }

  var args = [a, b, c, d, e];
  var ii = 0, v;
  while (args[ii]) {
    v = args[ii++];
    for (var k in v) {
      obj[k] = v[k];
    }

    // IE ignores toString in object iteration.. See:
    // webreflection.blogspot.com/2007/07/quick-fix-internet-explorer-and.html
    if (v.hasOwnProperty && v.hasOwnProperty('toString') &&
        (typeof v.toString != 'undefined') && (obj.toString !== v.toString)) {
      obj.toString = v.toString;
    }
  }

  return obj;
}

module.exports = copyProperties;

},{}],48:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule emptyFunction
 */

var copyProperties = _dereq_("./copyProperties");

function makeEmptyFunction(arg) {
  return function() {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
function emptyFunction() {}

copyProperties(emptyFunction, {
  thatReturns: makeEmptyFunction,
  thatReturnsFalse: makeEmptyFunction(false),
  thatReturnsTrue: makeEmptyFunction(true),
  thatReturnsNull: makeEmptyFunction(null),
  thatReturnsThis: function() { return this; },
  thatReturnsArgument: function(arg) { return arg; }
});

module.exports = emptyFunction;

},{"./copyProperties":47}],49:[function(_dereq_,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if ("production" !== "production") {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

},{}],50:[function(_dereq_,module,exports){
/**
 * Copyright 2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule warning
 */

"use strict";

var emptyFunction = _dereq_("./emptyFunction");

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = emptyFunction;

if ("production" !== "production") {
  warning = function(condition, format ) {var args=Array.prototype.slice.call(arguments,2);
    if (format === undefined) {
      throw new Error(
        '`warning(condition, format, ...args)` requires a warning ' +
        'message argument'
      );
    }

    if (!condition) {
      var argIndex = 0;
      console.warn('Warning: ' + format.replace(/%s/g, function()  {return args[argIndex++];}));
    }
  };
}

module.exports = warning;

},{"./emptyFunction":48}]},{},[13])
(13)
});