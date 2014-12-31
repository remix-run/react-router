var ReactRouter =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	exports.DefaultRoute = __webpack_require__(1);
	exports.Link = __webpack_require__(2);
	exports.NotFoundRoute = __webpack_require__(3);
	exports.Redirect = __webpack_require__(4);
	exports.Route = __webpack_require__(5);
	exports.RouteHandler = __webpack_require__(6);

	exports.HashLocation = __webpack_require__(7);
	exports.HistoryLocation = __webpack_require__(8);
	exports.RefreshLocation = __webpack_require__(9);

	exports.ImitateBrowserBehavior = __webpack_require__(10);
	exports.ScrollToTopBehavior = __webpack_require__(11);

	exports.Navigation = __webpack_require__(12);
	exports.State = __webpack_require__(13);

	exports.create = __webpack_require__(14);
	exports.run = __webpack_require__(15);

	exports.History = __webpack_require__(16);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(17);
	var FakeNode = __webpack_require__(18);
	var PropTypes = __webpack_require__(19);

	/**
	 * A <DefaultRoute> component is a special kind of <Route> that
	 * renders when its parent matches but none of its siblings do.
	 * Only one such route may be used at any given level in the
	 * route hierarchy.
	 */
	var DefaultRoute = React.createClass({

	  displayName: 'DefaultRoute',

	  mixins: [ FakeNode ],

	  propTypes: {
	    name: React.PropTypes.string,
	    path: PropTypes.falsy,
	    handler: React.PropTypes.func.isRequired
	  }

	});

	module.exports = DefaultRoute;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(17);
	var classSet = __webpack_require__(32);
	var assign = __webpack_require__(33);
	var Navigation = __webpack_require__(12);
	var State = __webpack_require__(13);

	function isLeftClickEvent(event) {
	  return event.button === 0;
	}

	function isModifiedEvent(event) {
	  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
	}

	/**
	 * <Link> components are used to create an <a> element that links to a route.
	 * When that route is active, the link gets an "active" class name (or the
	 * value of its `activeClassName` prop).
	 *
	 * For example, assuming you have the following route:
	 *
	 *   <Route name="showPost" path="/posts/:postID" handler={Post}/>
	 *
	 * You could use the following component to link to that route:
	 *
	 *   <Link to="showPost" params={{ postID: "123" }} />
	 *
	 * In addition to params, links may pass along query string parameters
	 * using the `query` prop.
	 *
	 *   <Link to="showPost" params={{ postID: "123" }} query={{ show:true }}/>
	 */
	var Link = React.createClass({

	  displayName: 'Link',

	  mixins: [ Navigation, State ],

	  propTypes: {
	    activeClassName: React.PropTypes.string.isRequired,
	    to: React.PropTypes.string.isRequired,
	    params: React.PropTypes.object,
	    query: React.PropTypes.object,
	    onClick: React.PropTypes.func
	  },

	  getDefaultProps: function () {
	    return {
	      activeClassName: 'active'
	    };
	  },

	  handleClick: function (event) {
	    var allowTransition = true;
	    var clickResult;

	    if (this.props.onClick)
	      clickResult = this.props.onClick(event);

	    if (isModifiedEvent(event) || !isLeftClickEvent(event))
	      return;

	    if (clickResult === false || event.defaultPrevented === true)
	      allowTransition = false;

	    event.preventDefault();

	    if (allowTransition)
	      this.transitionTo(this.props.to, this.props.params, this.props.query);
	  },

	  /**
	   * Returns the value of the "href" attribute to use on the DOM element.
	   */
	  getHref: function () {
	    return this.makeHref(this.props.to, this.props.params, this.props.query);
	  },

	  /**
	   * Returns the value of the "class" attribute to use on the DOM element, which contains
	   * the value of the activeClassName property when this <Link> is active.
	   */
	  getClassName: function () {
	    var classNames = {};

	    if (this.props.className)
	      classNames[this.props.className] = true;

	    if (this.isActive(this.props.to, this.props.params, this.props.query))
	      classNames[this.props.activeClassName] = true;

	    return classSet(classNames);
	  },

	  render: function () {
	    var props = assign({}, this.props, {
	      href: this.getHref(),
	      className: this.getClassName(),
	      onClick: this.handleClick
	    });

	    return React.DOM.a(props, this.props.children);
	  }

	});

	module.exports = Link;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(17);
	var FakeNode = __webpack_require__(18);
	var PropTypes = __webpack_require__(19);

	/**
	 * A <NotFoundRoute> is a special kind of <Route> that
	 * renders when the beginning of its parent's path matches
	 * but none of its siblings do, including any <DefaultRoute>.
	 * Only one such route may be used at any given level in the
	 * route hierarchy.
	 */
	var NotFoundRoute = React.createClass({

	  displayName: 'NotFoundRoute',

	  mixins: [ FakeNode ],

	  propTypes: {
	    name: React.PropTypes.string,
	    path: PropTypes.falsy,
	    handler: React.PropTypes.func.isRequired
	  }

	});

	module.exports = NotFoundRoute;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(17);
	var FakeNode = __webpack_require__(18);
	var PropTypes = __webpack_require__(19);

	/**
	 * A <Redirect> component is a special kind of <Route> that always
	 * redirects to another route when it matches.
	 */
	var Redirect = React.createClass({

	  displayName: 'Redirect',

	  mixins: [ FakeNode ],

	  propTypes: {
	    path: React.PropTypes.string,
	    from: React.PropTypes.string, // Alias for path.
	    to: React.PropTypes.string,
	    handler: PropTypes.falsy
	  }

	});

	module.exports = Redirect;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(17);
	var FakeNode = __webpack_require__(18);

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
	 * The preferred way to configure a router is using JSX. The XML-like syntax is
	 * a great way to visualize how routes are laid out in an application.
	 *
	 *   var routes = [
	 *     <Route handler={App}>
	 *       <Route name="login" handler={Login}/>
	 *       <Route name="logout" handler={Logout}/>
	 *       <Route name="about" handler={About}/>
	 *     </Route>
	 *   ];
	 *   
	 *   Router.run(routes, function (Handler) {
	 *     React.render(<Handler/>, document.body);
	 *   });
	 *
	 * Handlers for Route components that contain children can render their active
	 * child route using a <RouteHandler> element.
	 *
	 *   var App = React.createClass({
	 *     render: function () {
	 *       return (
	 *         <div class="application">
	 *           <RouteHandler/>
	 *         </div>
	 *       );
	 *     }
	 *   });
	 */
	var Route = React.createClass({

	  displayName: 'Route',

	  mixins: [ FakeNode ],

	  propTypes: {
	    name: React.PropTypes.string,
	    path: React.PropTypes.string,
	    handler: React.PropTypes.func.isRequired,
	    ignoreScrollBehavior: React.PropTypes.bool
	  }

	});

	module.exports = Route;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(17);
	var RouteHandlerMixin = __webpack_require__(20);

	/**
	 * A <RouteHandler> component renders the active child route handler
	 * when routes are nested.
	 */
	var RouteHandler = React.createClass({

	  displayName: 'RouteHandler',

	  mixins: [RouteHandlerMixin],

	  getDefaultProps: function () {
	    return {
	      ref: '__routeHandler__'
	    };
	  },

	  render: function () {
	    return this.getRouteHandler();
	  }

	});

	module.exports = RouteHandler;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var LocationActions = __webpack_require__(30);
	var History = __webpack_require__(16);
	var Path = __webpack_require__(21);

	/**
	 * Returns the current URL path from the `hash` portion of the URL, including
	 * query string.
	 */
	function getHashPath() {
	  return Path.decode(
	    // We can't use window.location.hash here because it's not
	    // consistent across browsers - Firefox will pre-decode it!
	    window.location.href.split('#')[1] || ''
	  );
	}

	var _actionType;

	function ensureSlash() {
	  var path = getHashPath();

	  if (path.charAt(0) === '/')
	    return true;

	  HashLocation.replace('/' + path);

	  return false;
	}

	var _changeListeners = [];

	function notifyChange(type) {
	  if (type === LocationActions.PUSH)
	    History.length += 1;

	  var change = {
	    path: getHashPath(),
	    type: type
	  };

	  _changeListeners.forEach(function (listener) {
	    listener(change);
	  });
	}

	var _isListening = false;

	function onHashChange() {
	  if (ensureSlash()) {
	    // If we don't have an _actionType then all we know is the hash
	    // changed. It was probably caused by the user clicking the Back
	    // button, but may have also been the Forward button or manual
	    // manipulation. So just guess 'pop'.
	    notifyChange(_actionType || LocationActions.POP);
	    _actionType = null;
	  }
	}

	/**
	 * A Location that uses `window.location.hash`.
	 */
	var HashLocation = {

	  addChangeListener: function (listener) {
	    _changeListeners.push(listener);

	    // Do this BEFORE listening for hashchange.
	    ensureSlash();

	    if (!_isListening) {
	      if (window.addEventListener) {
	        window.addEventListener('hashchange', onHashChange, false);
	      } else {
	        window.attachEvent('onhashchange', onHashChange);
	      }

	      _isListening = true;
	    }
	  },

	  removeChangeListener: function(listener) {
	    _changeListeners = _changeListeners.filter(function (l) {
	      return l !== listener;
	    });

	    if (_changeListeners.length === 0) {
	      if (window.removeEventListener) {
	        window.removeEventListener('hashchange', onHashChange, false);
	      } else {
	        window.removeEvent('onhashchange', onHashChange);
	      }

	      _isListening = false;
	    }
	  },

	  push: function (path) {
	    _actionType = LocationActions.PUSH;
	    window.location.hash = Path.encode(path);
	  },

	  replace: function (path) {
	    _actionType = LocationActions.REPLACE;
	    window.location.replace(window.location.pathname + window.location.search + '#' + Path.encode(path));
	  },

	  pop: function () {
	    _actionType = LocationActions.POP;
	    History.back();
	  },

	  getCurrentPath: getHashPath,

	  toString: function () {
	    return '<HashLocation>';
	  }

	};

	module.exports = HashLocation;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var LocationActions = __webpack_require__(30);
	var History = __webpack_require__(16);
	var Path = __webpack_require__(21);

	/**
	 * Returns the current URL path from `window.location`, including query string.
	 */
	function getWindowPath() {
	  return Path.decode(
	    window.location.pathname + window.location.search
	  );
	}

	var _changeListeners = [];

	function notifyChange(type) {
	  var change = {
	    path: getWindowPath(),
	    type: type
	  };

	  _changeListeners.forEach(function (listener) {
	    listener(change);
	  });
	}

	var _isListening = false;

	function onPopState() {
	  notifyChange(LocationActions.POP);
	}

	/**
	 * A Location that uses HTML5 history.
	 */
	var HistoryLocation = {

	  addChangeListener: function (listener) {
	    _changeListeners.push(listener);

	    if (!_isListening) {
	      if (window.addEventListener) {
	        window.addEventListener('popstate', onPopState, false);
	      } else {
	        window.attachEvent('popstate', onPopState);
	      }

	      _isListening = true;
	    }
	  },

	  removeChangeListener: function(listener) {
	    _changeListeners = _changeListeners.filter(function (l) {
	      return l !== listener;
	    });

	    if (_changeListeners.length === 0) {
	      if (window.addEventListener) {
	        window.removeEventListener('popstate', onPopState);
	      } else {
	        window.removeEvent('popstate', onPopState);
	      }

	      _isListening = false;
	    }
	  },

	  push: function (path) {
	    window.history.pushState({ path: path }, '', Path.encode(path));
	    History.length += 1;
	    notifyChange(LocationActions.PUSH);
	  },

	  replace: function (path) {
	    window.history.replaceState({ path: path }, '', Path.encode(path));
	    notifyChange(LocationActions.REPLACE);
	  },

	  pop: History.back,

	  getCurrentPath: getWindowPath,

	  toString: function () {
	    return '<HistoryLocation>';
	  }

	};

	module.exports = HistoryLocation;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var HistoryLocation = __webpack_require__(8);
	var History = __webpack_require__(16);
	var Path = __webpack_require__(21);

	/**
	 * A Location that uses full page refreshes. This is used as
	 * the fallback for HistoryLocation in browsers that do not
	 * support the HTML5 history API.
	 */
	var RefreshLocation = {

	  push: function (path) {
	    window.location = Path.encode(path);
	  },

	  replace: function (path) {
	    window.location.replace(Path.encode(path));
	  },

	  pop: History.back,

	  getCurrentPath: HistoryLocation.getCurrentPath,

	  toString: function () {
	    return '<RefreshLocation>';
	  }

	};

	module.exports = RefreshLocation;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var LocationActions = __webpack_require__(30);

	/**
	 * A scroll behavior that attempts to imitate the default behavior
	 * of modern browsers.
	 */
	var ImitateBrowserBehavior = {

	  updateScrollPosition: function (position, actionType) {
	    switch (actionType) {
	      case LocationActions.PUSH:
	      case LocationActions.REPLACE:
	        window.scrollTo(0, 0);
	        break;
	      case LocationActions.POP:
	        if (position) {
	          window.scrollTo(position.x, position.y);
	        } else {
	          window.scrollTo(0, 0);
	        }
	        break;
	    }
	  }

	};

	module.exports = ImitateBrowserBehavior;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A scroll behavior that always scrolls to the top of the page
	 * after a transition.
	 */
	var ScrollToTopBehavior = {

	  updateScrollPosition: function () {
	    window.scrollTo(0, 0);
	  }

	};

	module.exports = ScrollToTopBehavior;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(17);

	/**
	 * A mixin for components that modify the URL.
	 *
	 * Example:
	 *
	 *   var MyLink = React.createClass({
	 *     mixins: [ Router.Navigation ],
	 *     handleClick: function (event) {
	 *       event.preventDefault();
	 *       this.transitionTo('aRoute', { the: 'params' }, { the: 'query' });
	 *     },
	 *     render: function () {
	 *       return (
	 *         <a onClick={this.handleClick}>Click me!</a>
	 *       );
	 *     }
	 *   });
	 */
	var Navigation = {

	  contextTypes: {
	    makePath: React.PropTypes.func.isRequired,
	    makeHref: React.PropTypes.func.isRequired,
	    transitionTo: React.PropTypes.func.isRequired,
	    replaceWith: React.PropTypes.func.isRequired,
	    goBack: React.PropTypes.func.isRequired
	  },

	  /**
	   * Returns an absolute URL path created from the given route
	   * name, URL parameters, and query values.
	   */
	  makePath: function (to, params, query) {
	    return this.context.makePath(to, params, query);
	  },

	  /**
	   * Returns a string that may safely be used as the href of a
	   * link to the route with the given name.
	   */
	  makeHref: function (to, params, query) {
	    return this.context.makeHref(to, params, query);
	  },

	  /**
	   * Transitions to the URL specified in the arguments by pushing
	   * a new URL onto the history stack.
	   */
	  transitionTo: function (to, params, query) {
	    this.context.transitionTo(to, params, query);
	  },

	  /**
	   * Transitions to the URL specified in the arguments by replacing
	   * the current URL in the history stack.
	   */
	  replaceWith: function (to, params, query) {
	    this.context.replaceWith(to, params, query);
	  },

	  /**
	   * Transitions to the previous URL.
	   */
	  goBack: function () {
	    this.context.goBack();
	  }

	};

	module.exports = Navigation;


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(17);

	/**
	 * A mixin for components that need to know the path, routes, URL
	 * params and query that are currently active.
	 *
	 * Example:
	 *
	 *   var AboutLink = React.createClass({
	 *     mixins: [ Router.State ],
	 *     render: function () {
	 *       var className = this.props.className;
	 *   
	 *       if (this.isActive('about'))
	 *         className += ' is-active';
	 *   
	 *       return React.DOM.a({ className: className }, this.props.children);
	 *     }
	 *   });
	 */
	var State = {

	  contextTypes: {
	    getCurrentPath: React.PropTypes.func.isRequired,
	    getCurrentRoutes: React.PropTypes.func.isRequired,
	    getCurrentPathname: React.PropTypes.func.isRequired,
	    getCurrentParams: React.PropTypes.func.isRequired,
	    getCurrentQuery: React.PropTypes.func.isRequired,
	    isActive: React.PropTypes.func.isRequired
	  },

	  /**
	   * Returns the current URL path.
	   */
	  getPath: function () {
	    return this.context.getCurrentPath();
	  },

	  /**
	   * Returns an array of the routes that are currently active.
	   */
	  getRoutes: function () {
	    return this.context.getCurrentRoutes();
	  },

	  /**
	   * Returns the current URL path without the query string.
	   */
	  getPathname: function () {
	    return this.context.getCurrentPathname();
	  },

	  /**
	   * Returns an object of the URL params that are currently active.
	   */
	  getParams: function () {
	    return this.context.getCurrentParams();
	  },

	  /**
	   * Returns an object of the query params that are currently active.
	   */
	  getQuery: function () {
	    return this.context.getCurrentQuery();
	  },

	  /**
	   * A helper method to determine if a given route, params, and query
	   * are active.
	   */
	  isActive: function (to, params, query) {
	    return this.context.isActive(to, params, query);
	  }

	};

	module.exports = State;


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	/* jshint -W058 */
	var React = __webpack_require__(17);
	var warning = __webpack_require__(34);
	var invariant = __webpack_require__(35);
	var canUseDOM = __webpack_require__(36).canUseDOM;
	var ImitateBrowserBehavior = __webpack_require__(10);
	var RouteHandler = __webpack_require__(6);
	var LocationActions = __webpack_require__(30);
	var HashLocation = __webpack_require__(7);
	var HistoryLocation = __webpack_require__(8);
	var RefreshLocation = __webpack_require__(9);
	var NavigationContext = __webpack_require__(22);
	var StateContext = __webpack_require__(23);
	var Scrolling = __webpack_require__(24);
	var createRoutesFromChildren = __webpack_require__(25);
	var supportsHistory = __webpack_require__(26);
	var Transition = __webpack_require__(27);
	var PropTypes = __webpack_require__(19);
	var Redirect = __webpack_require__(28);
	var History = __webpack_require__(16);
	var Cancellation = __webpack_require__(29);
	var Path = __webpack_require__(21);

	/**
	 * The default location for new routers.
	 */
	var DEFAULT_LOCATION = canUseDOM ? HashLocation : '/';

	/**
	 * The default scroll behavior for new routers.
	 */
	var DEFAULT_SCROLL_BEHAVIOR = canUseDOM ? ImitateBrowserBehavior : null;

	/**
	 * The default error handler for new routers.
	 */
	function defaultErrorHandler(error) {
	  // Throw so we don't silently swallow async errors.
	  throw error; // This error probably originated in a transition hook.
	}

	/**
	 * The default aborted transition handler for new routers.
	 */
	function defaultAbortHandler(abortReason, location) {
	  if (typeof location === 'string')
	    throw new Error('Unhandled aborted transition! Reason: ' + abortReason);

	  if (abortReason instanceof Cancellation) {
	    return;
	  } else if (abortReason instanceof Redirect) {
	    location.replace(this.makePath(abortReason.to, abortReason.params, abortReason.query));
	  } else {
	    location.pop();
	  }
	}

	function findMatch(pathname, routes, defaultRoute, notFoundRoute) {
	  var match, route, params;

	  for (var i = 0, len = routes.length; i < len; ++i) {
	    route = routes[i];

	    // Check the subtree first to find the most deeply-nested match.
	    match = findMatch(pathname, route.childRoutes, route.defaultRoute, route.notFoundRoute);

	    if (match != null) {
	      match.routes.unshift(route);
	      return match;
	    }

	    // No routes in the subtree matched, so check this route.
	    params = Path.extractParams(route.path, pathname);

	    if (params)
	      return createMatch(route, params);
	  }

	  // No routes matched, so try the default route if there is one.
	  if (defaultRoute && (params = Path.extractParams(defaultRoute.path, pathname)))
	    return createMatch(defaultRoute, params);

	  // Last attempt: does the "not found" route match?
	  if (notFoundRoute && (params = Path.extractParams(notFoundRoute.path, pathname)))
	    return createMatch(notFoundRoute, params);

	  return match;
	}

	function createMatch(route, params) {
	  return { routes: [ route ], params: params };
	}

	function hasProperties(object, properties) {
	  for (var propertyName in properties)
	    if (properties.hasOwnProperty(propertyName) && object[propertyName] !== properties[propertyName])
	      return false;

	  return true;
	}

	function hasMatch(routes, route, prevParams, nextParams, prevQuery, nextQuery) {
	  return routes.some(function (r) {
	    if (r !== route)
	      return false;

	    var paramNames = route.paramNames;
	    var paramName;

	    // Ensure that all params the route cares about did not change.
	    for (var i = 0, len = paramNames.length; i < len; ++i) {
	      paramName = paramNames[i];

	      if (nextParams[paramName] !== prevParams[paramName])
	        return false;
	    }

	    // Ensure the query hasn't changed.
	    return hasProperties(prevQuery, nextQuery) && hasProperties(nextQuery, prevQuery);
	  });
	}

	/**
	 * Creates and returns a new router using the given options. A router
	 * is a ReactComponent class that knows how to react to changes in the
	 * URL and keep the contents of the page in sync.
	 *
	 * Options may be any of the following:
	 *
	 * - routes           (required) The route config
	 * - location         The location to use. Defaults to HashLocation when
	 *                    the DOM is available, "/" otherwise
	 * - scrollBehavior   The scroll behavior to use. Defaults to ImitateBrowserBehavior
	 *                    when the DOM is available, null otherwise
	 * - onError          A function that is used to handle errors
	 * - onAbort          A function that is used to handle aborted transitions
	 *
	 * When rendering in a server-side environment, the location should simply
	 * be the URL path that was used in the request, including the query string.
	 */
	function createRouter(options) {
	  options = options || {};

	  if (typeof options === 'function') {
	    options = { routes: options }; // Router.create(<Route>)
	  } else if (Array.isArray(options)) {
	    options = { routes: options }; // Router.create([ <Route>, <Route> ])
	  }

	  var routes = [];
	  var namedRoutes = {};
	  var components = [];
	  var location = options.location || DEFAULT_LOCATION;
	  var scrollBehavior = options.scrollBehavior || DEFAULT_SCROLL_BEHAVIOR;
	  var onError = options.onError || defaultErrorHandler;
	  var onAbort = options.onAbort || defaultAbortHandler;
	  var state = {};
	  var nextState = {};
	  var pendingTransition = null;
	  var changeListener = null;

	  function cancelPendingTransition() {
	    if (pendingTransition) {
	      pendingTransition.abort(new Cancellation);
	      pendingTransition = null;
	    }
	  }

	  function updateState() {
	    state = nextState;
	    nextState = {};
	  }

	  if (typeof location === 'string') {
	    warning(
	      !canUseDOM || ("production") === 'test',
	      'You should not use a static location in a DOM environment because ' +
	      'the router will not be kept in sync with the current URL'
	    );
	  } else {
	    invariant(
	      canUseDOM,
	      'You cannot use %s without a DOM',
	      location
	    );
	  }

	  // Automatically fall back to full page refreshes in
	  // browsers that don't support the HTML history API.
	  if (location === HistoryLocation && !supportsHistory())
	    location = RefreshLocation;

	  var router = React.createClass({

	    displayName: 'Router',

	    mixins: [ NavigationContext, StateContext, Scrolling ],

	    statics: {

	      defaultRoute: null,
	      notFoundRoute: null,
	      isRunning: false,

	      /**
	       * Adds routes to this router from the given children object (see ReactChildren).
	       */
	      addRoutes: function (children) {
	        routes.push.apply(routes, createRoutesFromChildren(children, this, namedRoutes));
	      },

	      /**
	       * Returns an absolute URL path created from the given route
	       * name, URL parameters, and query.
	       */
	      makePath: function (to, params, query) {
	        var path;
	        if (Path.isAbsolute(to)) {
	          path = Path.normalize(to);
	        } else {
	          var route = namedRoutes[to];

	          invariant(
	            route,
	            'Unable to find <Route name="%s">',
	            to
	          );

	          path = route.path;
	        }

	        return Path.withQuery(Path.injectParams(path, params), query);
	      },

	      /**
	       * Returns a string that may safely be used as the href of a link
	       * to the route with the given name, URL parameters, and query.
	       */
	      makeHref: function (to, params, query) {
	        var path = this.makePath(to, params, query);
	        return (location === HashLocation) ? '#' + path : path;
	      },

	      /**
	       * Transitions to the URL specified in the arguments by pushing
	       * a new URL onto the history stack.
	       */
	      transitionTo: function (to, params, query) {
	        invariant(
	          typeof location !== 'string',
	          'You cannot use transitionTo with a static location'
	        );

	        var path = this.makePath(to, params, query);

	        if (pendingTransition) {
	          // Replace so pending location does not stay in history.
	          location.replace(path);
	        } else {
	          location.push(path);
	        }
	      },

	      /**
	       * Transitions to the URL specified in the arguments by replacing
	       * the current URL in the history stack.
	       */
	      replaceWith: function (to, params, query) {
	        invariant(
	          typeof location !== 'string',
	          'You cannot use replaceWith with a static location'
	        );

	        location.replace(this.makePath(to, params, query));
	      },

	      /**
	       * Transitions to the previous URL if one is available. Returns true if the
	       * router was able to go back, false otherwise.
	       *
	       * Note: The router only tracks history entries in your application, not the
	       * current browser session, so you can safely call this function without guarding
	       * against sending the user back to some other site. However, when using
	       * RefreshLocation (which is the fallback for HistoryLocation in browsers that
	       * don't support HTML5 history) this method will *always* send the client back
	       * because we cannot reliably track history length.
	       */
	      goBack: function () {
	        invariant(
	          typeof location !== 'string',
	          'You cannot use goBack with a static location'
	        );

	        if (History.length > 1 || location === RefreshLocation) {
	          location.pop();
	          return true;
	        }

	        warning(false, 'goBack() was ignored because there is no router history');

	        return false;
	      },

	      /**
	       * Performs a match of the given pathname against this router and returns an object
	       * with the { routes, params } that match. Returns null if no match can be made.
	       */
	      match: function (pathname) {
	        return findMatch(pathname, routes, this.defaultRoute, this.notFoundRoute) || null;
	      },

	      /**
	       * Performs a transition to the given path and calls callback(error, abortReason)
	       * when the transition is finished. If both arguments are null the router's state
	       * was updated. Otherwise the transition did not complete.
	       *
	       * In a transition, a router first determines which routes are involved by beginning
	       * with the current route, up the route tree to the first parent route that is shared
	       * with the destination route, and back down the tree to the destination route. The
	       * willTransitionFrom hook is invoked on all route handlers we're transitioning away
	       * from, in reverse nesting order. Likewise, the willTransitionTo hook is invoked on
	       * all route handlers we're transitioning to.
	       *
	       * Both willTransitionFrom and willTransitionTo hooks may either abort or redirect the
	       * transition. To resolve asynchronously, they may use the callback argument. If no
	       * hooks wait, the transition is fully synchronous.
	       */
	      dispatch: function (path, action, callback) {
	        cancelPendingTransition();

	        var prevPath = state.path;
	        if (prevPath === path)
	          return; // Nothing to do!

	        // Record the scroll position as early as possible to
	        // get it before browsers try update it automatically.
	        if (prevPath && action !== LocationActions.REPLACE)
	          this.recordScrollPosition(prevPath);

	        var pathname = Path.withoutQuery(path);
	        var match = this.match(pathname);

	        warning(
	          match != null,
	          'No route matches path "%s". Make sure you have <Route path="%s"> somewhere in your routes',
	          path, path
	        );

	        if (match == null)
	          match = {};

	        var prevRoutes = state.routes || [];
	        var prevParams = state.params || {};
	        var prevQuery = state.query || {};

	        var nextRoutes = match.routes || [];
	        var nextParams = match.params || {};
	        var nextQuery = Path.extractQuery(path) || {};

	        var fromRoutes, toRoutes;
	        if (prevRoutes.length) {
	          fromRoutes = prevRoutes.filter(function (route) {
	            return !hasMatch(nextRoutes, route, prevParams, nextParams, prevQuery, nextQuery);
	          });

	          toRoutes = nextRoutes.filter(function (route) {
	            return !hasMatch(prevRoutes, route, prevParams, nextParams, prevQuery, nextQuery);
	          });
	        } else {
	          fromRoutes = [];
	          toRoutes = nextRoutes;
	        }

	        var transition = new Transition(path, this.replaceWith.bind(this, path));
	        pendingTransition = transition;

	        var fromComponents = components.slice(prevRoutes.length - fromRoutes.length);

	        transition.from(fromRoutes, fromComponents, function (error) {
	          if (error || transition.isAborted)
	            return callback.call(router, error, transition);

	          transition.to(toRoutes, nextParams, nextQuery, function (error) {
	            if (error || transition.isAborted)
	              return callback.call(router, error, transition);

	            nextState.path = path;
	            nextState.action = action;
	            nextState.pathname = pathname;
	            nextState.routes = nextRoutes;
	            nextState.params = nextParams;
	            nextState.query = nextQuery;

	            callback.call(router, null, transition);
	          });
	        });
	      },

	      /**
	       * Starts this router and calls callback(router, state) when the route changes.
	       *
	       * If the router's location is static (i.e. a URL path in a server environment)
	       * the callback is called only once. Otherwise, the location should be one of the
	       * Router.*Location objects (e.g. Router.HashLocation or Router.HistoryLocation).
	       */
	      run: function (callback) {
	        invariant(
	          !this.isRunning,
	          'Router is already running'
	        );

	        var dispatchHandler = function (error, transition) {
	          pendingTransition = null;

	          if (error) {
	            onError.call(router, error);
	          } else if (transition.isAborted) {
	            onAbort.call(router, transition.abortReason, location);
	          } else {
	            callback.call(router, router, nextState);
	          }
	        };

	        if (typeof location === 'string') {
	          router.dispatch(location, null, dispatchHandler);
	        } else {
	          // Listen for changes to the location.
	          changeListener = function (change) {
	            router.dispatch(change.path, change.type, dispatchHandler);
	          };

	          if (location.addChangeListener)
	            location.addChangeListener(changeListener);

	          // Bootstrap using the current path.
	          router.dispatch(location.getCurrentPath(), null, dispatchHandler);

	          this.isRunning = true;
	        }
	      },

	      stop: function () {
	        cancelPendingTransition();

	        if (location.removeChangeListener && changeListener) {
	          location.removeChangeListener(changeListener);
	          changeListener = null;
	        }

	        this.isRunning = false;
	      }

	    },

	    propTypes: {
	      children: PropTypes.falsy
	    },

	    getLocation: function () {
	      return location;
	    },

	    getScrollBehavior: function () {
	      return scrollBehavior;
	    },

	    getRouteAtDepth: function (depth) {
	      var routes = this.state.routes;
	      return routes && routes[depth];
	    },

	    getRouteComponents: function () {
	      return components;
	    },

	    getInitialState: function () {
	      updateState();
	      return state;
	    },

	    componentWillReceiveProps: function () {
	      updateState();
	      this.setState(state);
	    },

	    componentWillUnmount: function () {
	      router.stop();
	    },

	    render: function () {
	      return this.getRouteAtDepth(0) ? React.createElement(RouteHandler, this.props) : null;
	    },

	    childContextTypes: {
	      getRouteAtDepth: React.PropTypes.func.isRequired,
	      getRouteComponents: React.PropTypes.func.isRequired,
	      routeHandlers: React.PropTypes.array.isRequired
	    },

	    getChildContext: function () {
	      return {
	        getRouteComponents: this.getRouteComponents,
	        getRouteAtDepth: this.getRouteAtDepth,
	        routeHandlers: [ this ]
	      };
	    }

	  });

	  if (options.routes)
	    router.addRoutes(options.routes);

	  return router;
	}

	module.exports = createRouter;


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var createRouter = __webpack_require__(14);

	/**
	 * A high-level convenience method that creates, configures, and
	 * runs a router in one shot. The method signature is:
	 *
	 *   Router.run(routes[, location ], callback);
	 *
	 * Using `window.location.hash` to manage the URL, you could do:
	 *
	 *   Router.run(routes, function (Handler) {
	 *     React.render(<Handler/>, document.body);
	 *   });
	 * 
	 * Using HTML5 history and a custom "cursor" prop:
	 * 
	 *   Router.run(routes, Router.HistoryLocation, function (Handler) {
	 *     React.render(<Handler cursor={cursor}/>, document.body);
	 *   });
	 *
	 * Returns the newly created router.
	 *
	 * Note: If you need to specify further options for your router such
	 * as error/abort handling or custom scroll behavior, use Router.create
	 * instead.
	 *
	 *   var router = Router.create(options);
	 *   router.run(function (Handler) {
	 *     // ...
	 *   });
	 */
	function runRouter(routes, location, callback) {
	  if (typeof location === 'function') {
	    callback = location;
	    location = null;
	  }

	  var router = createRouter({
	    routes: routes,
	    location: location
	  });

	  router.run(callback);

	  return router;
	}

	module.exports = runRouter;


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var invariant = __webpack_require__(35);
	var canUseDOM = __webpack_require__(36).canUseDOM;

	var History = {

	  /**
	   * Sends the browser back one entry in the history.
	   */
	  back: function () {
	    invariant(
	      canUseDOM,
	      'Cannot use History.back without a DOM'
	    );

	    // Do this first so that History.length will
	    // be accurate in location change listeners.
	    History.length -= 1;

	    window.history.back();
	  },

	  /**
	   * The current number of entries in the history.
	   */
	  length: 1

	};

	module.exports = History;


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = React;

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var invariant = __webpack_require__(35);

	var FakeNode = {

	  render: function () {
	    invariant(
	      false,
	      '%s elements should not be rendered',
	      this.constructor.displayName
	    );
	  }

	};

	module.exports = FakeNode;


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	var PropTypes = {

	  /**
	   * Requires that the value of a prop be falsy.
	   */
	  falsy: function (props, propName, componentName) {
	    if (props[propName])
	      return new Error('<' + componentName + '> may not have a "' + propName + '" prop');
	  }

	};

	module.exports = PropTypes;


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(17);

	module.exports = {
	  contextTypes: {
	    getRouteAtDepth: React.PropTypes.func.isRequired,
	    getRouteComponents: React.PropTypes.func.isRequired,
	    routeHandlers: React.PropTypes.array.isRequired
	  },

	  childContextTypes: {
	    routeHandlers: React.PropTypes.array.isRequired
	  },

	  getChildContext: function () {
	    return {
	      routeHandlers: this.context.routeHandlers.concat([ this ])
	    };
	  },

	  getRouteDepth: function () {
	    return this.context.routeHandlers.length - 1;
	  },

	  componentDidMount: function () {
	    this._updateRouteComponent();
	  },

	  componentDidUpdate: function () {
	    this._updateRouteComponent();
	  },

	  _updateRouteComponent: function () {
	    var depth = this.getRouteDepth();
	    var components = this.context.getRouteComponents();
	    components[depth] = this.refs[this.props.ref || '__routeHandler__'];
	  },

	  getRouteHandler: function (props) {
	    var route = this.context.getRouteAtDepth(this.getRouteDepth());
	    return route ? React.createElement(route.handler, props || this.props) : null;
	  }
	};

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var invariant = __webpack_require__(35);
	var merge = __webpack_require__(38).merge;
	var qs = __webpack_require__(37);

	var paramCompileMatcher = /:([a-zA-Z_$][a-zA-Z0-9_$]*)|[*.()\[\]\\+|{}^$]/g;
	var paramInjectMatcher = /:([a-zA-Z_$][a-zA-Z0-9_$?]*[?]?)|[*]/g;
	var paramInjectTrailingSlashMatcher = /\/\/\?|\/\?/g;
	var queryMatcher = /\?(.+)/;

	var _compiledPatterns = {};

	function compilePattern(pattern) {
	  if (!(pattern in _compiledPatterns)) {
	    var paramNames = [];
	    var source = pattern.replace(paramCompileMatcher, function (match, paramName) {
	      if (paramName) {
	        paramNames.push(paramName);
	        return '([^/?#]+)';
	      } else if (match === '*') {
	        paramNames.push('splat');
	        return '(.*?)';
	      } else {
	        return '\\' + match;
	      }
	    });

	    _compiledPatterns[pattern] = {
	      matcher: new RegExp('^' + source + '$', 'i'),
	      paramNames: paramNames
	    };
	  }

	  return _compiledPatterns[pattern];
	}

	var Path = {

	  /**
	   * Safely decodes special characters in the given URL path.
	   */
	  decode: function (path) {
	    return decodeURI(path.replace(/\+/g, ' '));
	  },

	  /**
	   * Safely encodes special characters in the given URL path.
	   */
	  encode: function (path) {
	    return encodeURI(path).replace(/%20/g, '+');
	  },

	  /**
	   * Returns an array of the names of all parameters in the given pattern.
	   */
	  extractParamNames: function (pattern) {
	    return compilePattern(pattern).paramNames;
	  },

	  /**
	   * Extracts the portions of the given URL path that match the given pattern
	   * and returns an object of param name => value pairs. Returns null if the
	   * pattern does not match the given path.
	   */
	  extractParams: function (pattern, path) {
	    var object = compilePattern(pattern);
	    var match = path.match(object.matcher);

	    if (!match)
	      return null;

	    var params = {};

	    object.paramNames.forEach(function (paramName, index) {
	      params[paramName] = match[index + 1];
	    });

	    return params;
	  },

	  /**
	   * Returns a version of the given route path with params interpolated. Throws
	   * if there is a dynamic segment of the route path for which there is no param.
	   */
	  injectParams: function (pattern, params) {
	    params = params || {};

	    var splatIndex = 0;

	    return pattern.replace(paramInjectMatcher, function (match, paramName) {
	      paramName = paramName || 'splat';

	      // If param is optional don't check for existence
	      if (paramName.slice(-1) !== '?') {
	        invariant(
	          params[paramName] != null,
	          'Missing "' + paramName + '" parameter for path "' + pattern + '"'
	        );
	      } else {
	        paramName = paramName.slice(0, -1);

	        if (params[paramName] == null)
	          return '';
	      }

	      var segment;
	      if (paramName === 'splat' && Array.isArray(params[paramName])) {
	        segment = params[paramName][splatIndex++];

	        invariant(
	          segment != null,
	          'Missing splat # ' + splatIndex + ' for path "' + pattern + '"'
	        );
	      } else {
	        segment = params[paramName];
	      }

	      return segment;
	    }).replace(paramInjectTrailingSlashMatcher, '/');
	  },

	  /**
	   * Returns an object that is the result of parsing any query string contained
	   * in the given path, null if the path contains no query string.
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
	   * Returns a version of the given path with the parameters in the given
	   * query merged into the query string.
	   */
	  withQuery: function (path, query) {
	    var existingQuery = Path.extractQuery(path);

	    if (existingQuery)
	      query = query ? merge(existingQuery, query) : existingQuery;

	    var queryString = query && qs.stringify(query);

	    if (queryString)
	      return Path.withoutQuery(path) + '?' + queryString;

	    return path;
	  },

	  /**
	   * Returns true if the given path is absolute.
	   */
	  isAbsolute: function (path) {
	    return path.charAt(0) === '/';
	  },

	  /**
	   * Returns a normalized version of the given path.
	   */
	  normalize: function (path, parentRoute) {
	    return path.replace(/^\/*/, '/');
	  },

	  /**
	   * Joins two URL paths together.
	   */
	  join: function (a, b) {
	    return a.replace(/\/*$/, '/') + b;
	  }

	};

	module.exports = Path;


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(17);

	/**
	 * Provides the router with context for Router.Navigation.
	 */
	var NavigationContext = {

	  childContextTypes: {
	    makePath: React.PropTypes.func.isRequired,
	    makeHref: React.PropTypes.func.isRequired,
	    transitionTo: React.PropTypes.func.isRequired,
	    replaceWith: React.PropTypes.func.isRequired,
	    goBack: React.PropTypes.func.isRequired
	  },

	  getChildContext: function () {
	    return {
	      makePath: this.constructor.makePath,
	      makeHref: this.constructor.makeHref,
	      transitionTo: this.constructor.transitionTo,
	      replaceWith: this.constructor.replaceWith,
	      goBack: this.constructor.goBack
	    };
	  }

	};

	module.exports = NavigationContext;


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(17);
	var assign = __webpack_require__(33);
	var Path = __webpack_require__(21);

	function routeIsActive(activeRoutes, routeName) {
	  return activeRoutes.some(function (route) {
	    return route.name === routeName;
	  });
	}

	function paramsAreActive(activeParams, params) {
	  for (var property in params)
	    if (String(activeParams[property]) !== String(params[property]))
	      return false;

	  return true;
	}

	function queryIsActive(activeQuery, query) {
	  for (var property in query)
	    if (String(activeQuery[property]) !== String(query[property]))
	      return false;

	  return true;
	}

	/**
	 * Provides the router with context for Router.State.
	 */
	var StateContext = {

	  /**
	   * Returns the current URL path + query string.
	   */
	  getCurrentPath: function () {
	    return this.state.path;
	  },

	  /**
	   * Returns a read-only array of the currently active routes.
	   */
	  getCurrentRoutes: function () {
	    return this.state.routes.slice(0);
	  },

	  /**
	   * Returns the current URL path without the query string.
	   */
	  getCurrentPathname: function () {
	    return this.state.pathname;
	  },

	  /**
	   * Returns a read-only object of the currently active URL parameters.
	   */
	  getCurrentParams: function () {
	    return assign({}, this.state.params);
	  },

	  /**
	   * Returns a read-only object of the currently active query parameters.
	   */
	  getCurrentQuery: function () {
	    return assign({}, this.state.query);
	  },

	  /**
	   * Returns true if the given route, params, and query are active.
	   */
	  isActive: function (to, params, query) {
	    if (Path.isAbsolute(to))
	      return to === this.state.path;

	    return routeIsActive(this.state.routes, to) &&
	      paramsAreActive(this.state.params, params) &&
	      (query == null || queryIsActive(this.state.query, query));
	  },

	  childContextTypes: {
	    getCurrentPath: React.PropTypes.func.isRequired,
	    getCurrentRoutes: React.PropTypes.func.isRequired,
	    getCurrentPathname: React.PropTypes.func.isRequired,
	    getCurrentParams: React.PropTypes.func.isRequired,
	    getCurrentQuery: React.PropTypes.func.isRequired,
	    isActive: React.PropTypes.func.isRequired
	  },

	  getChildContext: function () {
	    return {
	      getCurrentPath: this.getCurrentPath,
	      getCurrentRoutes: this.getCurrentRoutes,
	      getCurrentPathname: this.getCurrentPathname,
	      getCurrentParams: this.getCurrentParams,
	      getCurrentQuery: this.getCurrentQuery,
	      isActive: this.isActive
	    };
	  }

	};

	module.exports = StateContext;


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var invariant = __webpack_require__(35);
	var canUseDOM = __webpack_require__(36).canUseDOM;
	var getWindowScrollPosition = __webpack_require__(31);

	function shouldUpdateScroll(state, prevState) {
	  if (!prevState)
	    return true;

	  // Don't update scroll position when only the query has changed.
	  if (state.pathname === prevState.pathname)
	    return false;

	  var routes = state.routes;
	  var prevRoutes = prevState.routes;

	  var sharedAncestorRoutes = routes.filter(function (route) {
	    return prevRoutes.indexOf(route) !== -1;
	  });

	  return !sharedAncestorRoutes.some(function (route) {
	    return route.ignoreScrollBehavior;
	  });
	}

	/**
	 * Provides the router with the ability to manage window scroll position
	 * according to its scroll behavior.
	 */
	var Scrolling = {

	  statics: {
	    /**
	     * Records curent scroll position as the last known position for the given URL path.
	     */
	    recordScrollPosition: function (path) {
	      if (!this.scrollHistory)
	        this.scrollHistory = {};

	      this.scrollHistory[path] = getWindowScrollPosition();
	    },

	    /**
	     * Returns the last known scroll position for the given URL path.
	     */
	    getScrollPosition: function (path) {
	      if (!this.scrollHistory)
	        this.scrollHistory = {};

	      return this.scrollHistory[path] || null;
	    }
	  },

	  componentWillMount: function () {
	    invariant(
	      this.getScrollBehavior() == null || canUseDOM,
	      'Cannot use scroll behavior without a DOM'
	    );
	  },

	  componentDidMount: function () {
	    this._updateScroll();
	  },

	  componentDidUpdate: function (prevProps, prevState) {
	    this._updateScroll(prevState);
	  },

	  _updateScroll: function (prevState) {
	    if (!shouldUpdateScroll(this.state, prevState))
	      return;

	    var scrollBehavior = this.getScrollBehavior();

	    if (scrollBehavior)
	      scrollBehavior.updateScrollPosition(
	        this.constructor.getScrollPosition(this.state.path),
	        this.state.action
	      );
	  }

	};

	module.exports = Scrolling;


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	/* jshint -W084 */
	var React = __webpack_require__(17);
	var warning = __webpack_require__(34);
	var invariant = __webpack_require__(35);
	var DefaultRoute = __webpack_require__(1);
	var NotFoundRoute = __webpack_require__(3);
	var Redirect = __webpack_require__(4);
	var Route = __webpack_require__(5);
	var Path = __webpack_require__(21);

	var CONFIG_ELEMENT_TYPES = [
	  DefaultRoute.type,
	  NotFoundRoute.type,
	  Redirect.type,
	  Route.type
	];

	function createRedirectHandler(to, _params, _query) {
	  return React.createClass({
	    statics: {
	      willTransitionTo: function (transition, params, query) {
	        transition.redirect(to, _params || params, _query || query);
	      }
	    },

	    render: function () {
	      return null;
	    }
	  });
	}

	function checkPropTypes(componentName, propTypes, props) {
	  for (var propName in propTypes) {
	    if (propTypes.hasOwnProperty(propName)) {
	      var error = propTypes[propName](props, propName, componentName);

	      if (error instanceof Error)
	        warning(false, error.message);
	    }
	  }
	}

	function createRoute(element, parentRoute, namedRoutes) {
	  var type = element.type;
	  var props = element.props;
	  var componentName = (type && type.displayName) || 'UnknownComponent';

	  invariant(
	    CONFIG_ELEMENT_TYPES.indexOf(type) !== -1,
	    'Unrecognized route configuration element "<%s>"',
	    componentName
	  );

	  if (type.propTypes)
	    checkPropTypes(componentName, type.propTypes, props);

	  var route = { name: props.name };

	  if (props.ignoreScrollBehavior) {
	    route.ignoreScrollBehavior = true;
	  }

	  if (type === Redirect.type) {
	    route.handler = createRedirectHandler(props.to, props.params, props.query);
	    props.path = props.path || props.from || '*';
	  } else {
	    route.handler = props.handler;
	  }

	  var parentPath = (parentRoute && parentRoute.path) || '/';

	  if ((props.path || props.name) && type !== DefaultRoute.type && type !== NotFoundRoute.type) {
	    var path = props.path || props.name;

	    // Relative paths extend their parent.
	    if (!Path.isAbsolute(path))
	      path = Path.join(parentPath, path);

	    route.path = Path.normalize(path);
	  } else {
	    route.path = parentPath;

	    if (type === NotFoundRoute.type)
	      route.path += '*';
	  }

	  route.paramNames = Path.extractParamNames(route.path);

	  // Make sure the route's path has all params its parent needs.
	  if (parentRoute && Array.isArray(parentRoute.paramNames)) {
	    parentRoute.paramNames.forEach(function (paramName) {
	      invariant(
	        route.paramNames.indexOf(paramName) !== -1,
	        'The nested route path "%s" is missing the "%s" parameter of its parent path "%s"',
	        route.path, paramName, parentRoute.path
	      );
	    });
	  }

	  // Make sure the route can be looked up by <Link>s.
	  if (props.name) {
	    invariant(
	      namedRoutes[props.name] == null,
	      'You cannot use the name "%s" for more than one route',
	      props.name
	    );

	    namedRoutes[props.name] = route;
	  }

	  // Handle <NotFoundRoute>.
	  if (type === NotFoundRoute.type) {
	    invariant(
	      parentRoute,
	      '<NotFoundRoute> must have a parent <Route>'
	    );

	    invariant(
	      parentRoute.notFoundRoute == null,
	      'You may not have more than one <NotFoundRoute> per <Route>'
	    );

	    parentRoute.notFoundRoute = route;

	    return null;
	  }

	  // Handle <DefaultRoute>.
	  if (type === DefaultRoute.type) {
	    invariant(
	      parentRoute,
	      '<DefaultRoute> must have a parent <Route>'
	    );

	    invariant(
	      parentRoute.defaultRoute == null,
	      'You may not have more than one <DefaultRoute> per <Route>'
	    );

	    parentRoute.defaultRoute = route;

	    return null;
	  }

	  route.childRoutes = createRoutesFromChildren(props.children, route, namedRoutes);

	  return route;
	}

	/**
	 * Creates and returns an array of route objects from the given ReactChildren.
	 */
	function createRoutesFromChildren(children, parentRoute, namedRoutes) {
	  var routes = [];

	  React.Children.forEach(children, function (child) {
	    // Exclude <DefaultRoute>s and <NotFoundRoute>s.
	    if (child = createRoute(child, parentRoute, namedRoutes))
	      routes.push(child);
	  });

	  return routes;
	}

	module.exports = createRoutesFromChildren;


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	function supportsHistory() {
	  /*! taken from modernizr
	   * https://github.com/Modernizr/Modernizr/blob/master/LICENSE
	   * https://github.com/Modernizr/Modernizr/blob/master/feature-detects/history.js
	   * changed to avoid false negatives for Windows Phones: https://github.com/rackt/react-router/issues/586
	   */
	  var ua = navigator.userAgent;
	  if ((ua.indexOf('Android 2.') !== -1 ||
	      (ua.indexOf('Android 4.0') !== -1)) &&
	      ua.indexOf('Mobile Safari') !== -1 &&
	      ua.indexOf('Chrome') === -1 &&
	      ua.indexOf('Windows Phone') === -1) {
	    return false;
	  }
	  return (window.history && 'pushState' in window.history);
	}

	module.exports = supportsHistory;


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var assign = __webpack_require__(33);
	var Redirect = __webpack_require__(28);

	/**
	 * Calls the willTransitionFrom hook of all handlers in the given matches
	 * serially in reverse with the transition object and the current instance of
	 * the route's handler, so that the deepest nested handlers are called first.
	 * Calls callback(error) when finished.
	 */
	function runTransitionFromHooks(transition, routes, components, callback) {
	  var runHooks = routes.reduce(function (callback, route, index) {
	    return function (error) {
	      if (error || transition.isAborted) {
	        callback(error);
	      } else if (route.handler.willTransitionFrom) {
	        try {
	          route.handler.willTransitionFrom(transition, components[index], callback);

	          // If there is no callback in the argument list, call it automatically.
	          if (route.handler.willTransitionFrom.length < 3)
	            callback();
	        } catch (e) {
	          callback(e);
	        }
	      } else {
	        callback();
	      }
	    };
	  }, callback);

	  runHooks();
	}

	/**
	 * Calls the willTransitionTo hook of all handlers in the given matches
	 * serially with the transition object and any params that apply to that
	 * handler. Calls callback(error) when finished.
	 */
	function runTransitionToHooks(transition, routes, params, query, callback) {
	  var runHooks = routes.reduceRight(function (callback, route) {
	    return function (error) {
	      if (error || transition.isAborted) {
	        callback(error);
	      } else if (route.handler.willTransitionTo) {
	        try {
	          route.handler.willTransitionTo(transition, params, query, callback);

	          // If there is no callback in the argument list, call it automatically.
	          if (route.handler.willTransitionTo.length < 4)
	            callback();
	        } catch (e) {
	          callback(e);
	        }
	      } else {
	        callback();
	      }
	    };
	  }, callback);

	  runHooks();
	}

	/**
	 * Encapsulates a transition to a given path.
	 *
	 * The willTransitionTo and willTransitionFrom handlers receive
	 * an instance of this class as their first argument.
	 */
	function Transition(path, retry) {
	  this.path = path;
	  this.abortReason = null;
	  this.isAborted = false;
	  this.retry = retry.bind(this);
	}

	assign(Transition.prototype, {

	  abort: function (reason) {
	    if (this.isAborted) {
	      // First abort wins.
	      return;
	    }

	    this.abortReason = reason;
	    this.isAborted = true;
	  },

	  redirect: function (to, params, query) {
	    this.abort(new Redirect(to, params, query));
	  },

	  from: function (routes, components, callback) {
	    return runTransitionFromHooks(this, routes, components, callback);
	  },

	  to: function (routes, params, query, callback) {
	    return runTransitionToHooks(this, routes, params, query, callback);
	  }

	});

	module.exports = Transition;


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Encapsulates a redirect to the given route.
	 */
	function Redirect(to, params, query) {
	  this.to = to;
	  this.params = params;
	  this.query = query;
	}

	module.exports = Redirect;


/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Represents a cancellation caused by navigating away
	 * before the previous transition has fully resolved.
	 */
	function Cancellation() { }

	module.exports = Cancellation;


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Actions that modify the URL.
	 */
	var LocationActions = {

	  /**
	   * Indicates a new location is being pushed to the history stack.
	   */
	  PUSH: 'push',

	  /**
	   * Indicates the current location should be replaced.
	   */
	  REPLACE: 'replace',

	  /**
	   * Indicates the most recent entry should be removed from the history stack.
	   */
	  POP: 'pop'

	};

	module.exports = LocationActions;


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	var invariant = __webpack_require__(35);
	var canUseDOM = __webpack_require__(36).canUseDOM;

	/**
	 * Returns the current scroll position of the window as { x, y }.
	 */
	function getWindowScrollPosition() {
	  invariant(
	    canUseDOM,
	    'Cannot get current scroll position without a DOM'
	  );

	  return {
	    x: window.pageXOffset || document.documentElement.scrollLeft,
	    y: window.pageYOffset || document.documentElement.scrollTop
	  };
	}

	module.exports = getWindowScrollPosition;


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2014, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule cx
	 */

	/**
	 * This function is used to mark string literals representing CSS class names
	 * so that they can be transformed statically. This allows for modularization
	 * and minification of CSS class names.
	 *
	 * In static_upstream, this function is actually implemented, but it should
	 * eventually be replaced with something more descriptive, and the transform
	 * that is used in the main stack should be ported for use elsewhere.
	 *
	 * @param string|object className to modularize, or an object of key/values.
	 *                      In the object case, the values are conditions that
	 *                      determine if the className keys should be included.
	 * @param [string ...]  Variable list of classNames in the string case.
	 * @return string       Renderable space-separated CSS className.
	 */
	function cx(classNames) {
	  if (typeof classNames == 'object') {
	    return Object.keys(classNames).filter(function(className) {
	      return classNames[className];
	    }).join(' ');
	  } else {
	    return Array.prototype.join.call(arguments, ' ');
	  }
	}

	module.exports = cx;


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2014, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule Object.assign
	 */

	// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.assign

	function assign(target, sources) {
	  if (target == null) {
	    throw new TypeError('Object.assign target cannot be null or undefined');
	  }

	  var to = Object(target);
	  var hasOwnProperty = Object.prototype.hasOwnProperty;

	  for (var nextIndex = 1; nextIndex < arguments.length; nextIndex++) {
	    var nextSource = arguments[nextIndex];
	    if (nextSource == null) {
	      continue;
	    }

	    var from = Object(nextSource);

	    // We don't currently support accessors nor proxies. Therefore this
	    // copy cannot throw. If we ever supported this then we must handle
	    // exceptions and side-effects. We don't support symbols so they won't
	    // be transferred.

	    for (var key in from) {
	      if (hasOwnProperty.call(from, key)) {
	        to[key] = from[key];
	      }
	    }
	  }

	  return to;
	};

	module.exports = assign;


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2014, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule warning
	 */

	"use strict";

	var emptyFunction = __webpack_require__(39);

	/**
	 * Similar to invariant but only logs a warning if the condition is not met.
	 * This can be used to log issues in development environments in critical
	 * paths. Removing the logging code for production environments will keep the
	 * same logic and follow the same code paths.
	 */

	var warning = emptyFunction;

	if (false) {
	  warning = function(condition, format ) {for (var args=[],$__0=2,$__1=arguments.length;$__0<$__1;$__0++) args.push(arguments[$__0]);
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


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2014, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
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
	  if (false) {
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


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2014, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
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


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(40);


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	// Load modules


	// Declare internals

	var internals = {};


	exports.arrayToObject = function (source) {

	    var obj = {};
	    for (var i = 0, il = source.length; i < il; ++i) {
	        if (typeof source[i] !== 'undefined') {

	            obj[i] = source[i];
	        }
	    }

	    return obj;
	};


	exports.merge = function (target, source) {

	    if (!source) {
	        return target;
	    }

	    if (typeof source !== 'object') {
	        if (Array.isArray(target)) {
	            target.push(source);
	        }
	        else {
	            target[source] = true;
	        }

	        return target;
	    }

	    if (typeof target !== 'object') {
	        target = [target].concat(source);
	        return target;
	    }

	    if (Array.isArray(target) &&
	        !Array.isArray(source)) {

	        target = exports.arrayToObject(target);
	    }

	    var keys = Object.keys(source);
	    for (var k = 0, kl = keys.length; k < kl; ++k) {
	        var key = keys[k];
	        var value = source[key];

	        if (!target[key]) {
	            target[key] = value;
	        }
	        else {
	            target[key] = exports.merge(target[key], value);
	        }
	    }

	    return target;
	};


	exports.decode = function (str) {

	    try {
	        return decodeURIComponent(str.replace(/\+/g, ' '));
	    } catch (e) {
	        return str;
	    }
	};


	exports.compact = function (obj, refs) {

	    if (typeof obj !== 'object' ||
	        obj === null) {

	        return obj;
	    }

	    refs = refs || [];
	    var lookup = refs.indexOf(obj);
	    if (lookup !== -1) {
	        return refs[lookup];
	    }

	    refs.push(obj);

	    if (Array.isArray(obj)) {
	        var compacted = [];

	        for (var i = 0, il = obj.length; i < il; ++i) {
	            if (typeof obj[i] !== 'undefined') {
	                compacted.push(obj[i]);
	            }
	        }

	        return compacted;
	    }

	    var keys = Object.keys(obj);
	    for (i = 0, il = keys.length; i < il; ++i) {
	        var key = keys[i];
	        obj[key] = exports.compact(obj[key], refs);
	    }

	    return obj;
	};


	exports.isRegExp = function (obj) {
	    return Object.prototype.toString.call(obj) === '[object RegExp]';
	};


	exports.isBuffer = function (obj) {

	    if (obj === null ||
	        typeof obj === 'undefined') {

	        return false;
	    }

	    return !!(obj.constructor &&
	        obj.constructor.isBuffer &&
	        obj.constructor.isBuffer(obj));
	};


/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2014, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule emptyFunction
	 */

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

	emptyFunction.thatReturns = makeEmptyFunction;
	emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
	emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
	emptyFunction.thatReturnsNull = makeEmptyFunction(null);
	emptyFunction.thatReturnsThis = function() { return this; };
	emptyFunction.thatReturnsArgument = function(arg) { return arg; };

	module.exports = emptyFunction;


/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	// Load modules

	var Stringify = __webpack_require__(41);
	var Parse = __webpack_require__(42);


	// Declare internals

	var internals = {};


	module.exports = {
	    stringify: Stringify,
	    parse: Parse
	};


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	// Load modules

	var Utils = __webpack_require__(38);


	// Declare internals

	var internals = {
	    delimiter: '&',
	    indices: true
	};


	internals.stringify = function (obj, prefix, options) {

	    if (Utils.isBuffer(obj)) {
	        obj = obj.toString();
	    }
	    else if (obj instanceof Date) {
	        obj = obj.toISOString();
	    }
	    else if (obj === null) {
	        obj = '';
	    }

	    if (typeof obj === 'string' ||
	        typeof obj === 'number' ||
	        typeof obj === 'boolean') {

	        return [encodeURIComponent(prefix) + '=' + encodeURIComponent(obj)];
	    }

	    var values = [];

	    if (typeof obj === 'undefined') {
	        return values;
	    }

	    var objKeys = Object.keys(obj);
	    for (var i = 0, il = objKeys.length; i < il; ++i) {
	        var key = objKeys[i];
	        if (!options.indices &&
	            Array.isArray(obj)) {

	            values = values.concat(internals.stringify(obj[key], prefix, options));
	        }
	        else {
	            values = values.concat(internals.stringify(obj[key], prefix + '[' + key + ']', options));
	        }
	    }

	    return values;
	};


	module.exports = function (obj, options) {

	    options = options || {};
	    var delimiter = typeof options.delimiter === 'undefined' ? internals.delimiter : options.delimiter;
	    options.indices = typeof options.indices === 'boolean' ? options.indices : internals.indices;

	    var keys = [];

	    if (typeof obj !== 'object' ||
	        obj === null) {

	        return '';
	    }

	    var objKeys = Object.keys(obj);
	    for (var i = 0, il = objKeys.length; i < il; ++i) {
	        var key = objKeys[i];
	        keys = keys.concat(internals.stringify(obj[key], key, options));
	    }

	    return keys.join(delimiter);
	};


/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	// Load modules

	var Utils = __webpack_require__(38);


	// Declare internals

	var internals = {
	    delimiter: '&',
	    depth: 5,
	    arrayLimit: 20,
	    parameterLimit: 1000
	};


	internals.parseValues = function (str, options) {

	    var obj = {};
	    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

	    for (var i = 0, il = parts.length; i < il; ++i) {
	        var part = parts[i];
	        var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;

	        if (pos === -1) {
	            obj[Utils.decode(part)] = '';
	        }
	        else {
	            var key = Utils.decode(part.slice(0, pos));
	            var val = Utils.decode(part.slice(pos + 1));

	            if (!obj.hasOwnProperty(key)) {
	                obj[key] = val;
	            }
	            else {
	                obj[key] = [].concat(obj[key]).concat(val);
	            }
	        }
	    }

	    return obj;
	};


	internals.parseObject = function (chain, val, options) {

	    if (!chain.length) {
	        return val;
	    }

	    var root = chain.shift();

	    var obj = {};
	    if (root === '[]') {
	        obj = [];
	        obj = obj.concat(internals.parseObject(chain, val, options));
	    }
	    else {
	        var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
	        var index = parseInt(cleanRoot, 10);
	        var indexString = '' + index;
	        if (!isNaN(index) &&
	            root !== cleanRoot &&
	            indexString === cleanRoot &&
	            index >= 0 &&
	            index <= options.arrayLimit) {

	            obj = [];
	            obj[index] = internals.parseObject(chain, val, options);
	        }
	        else {
	            obj[cleanRoot] = internals.parseObject(chain, val, options);
	        }
	    }

	    return obj;
	};


	internals.parseKeys = function (key, val, options) {

	    if (!key) {
	        return;
	    }

	    // The regex chunks

	    var parent = /^([^\[\]]*)/;
	    var child = /(\[[^\[\]]*\])/g;

	    // Get the parent

	    var segment = parent.exec(key);

	    // Don't allow them to overwrite object prototype properties

	    if (Object.prototype.hasOwnProperty(segment[1])) {
	        return;
	    }

	    // Stash the parent if it exists

	    var keys = [];
	    if (segment[1]) {
	        keys.push(segment[1]);
	    }

	    // Loop through children appending to the array until we hit depth

	    var i = 0;
	    while ((segment = child.exec(key)) !== null && i < options.depth) {

	        ++i;
	        if (!Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ''))) {
	            keys.push(segment[1]);
	        }
	    }

	    // If there's a remainder, just add whatever is left

	    if (segment) {
	        keys.push('[' + key.slice(segment.index) + ']');
	    }

	    return internals.parseObject(keys, val, options);
	};


	module.exports = function (str, options) {

	    if (str === '' ||
	        str === null ||
	        typeof str === 'undefined') {

	        return {};
	    }

	    options = options || {};
	    options.delimiter = typeof options.delimiter === 'string' || Utils.isRegExp(options.delimiter) ? options.delimiter : internals.delimiter;
	    options.depth = typeof options.depth === 'number' ? options.depth : internals.depth;
	    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : internals.arrayLimit;
	    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : internals.parameterLimit;

	    var tempObj = typeof str === 'string' ? internals.parseValues(str, options) : str;
	    var obj = {};

	    // Iterate over the keys and setup the new object

	    var keys = Object.keys(tempObj);
	    for (var i = 0, il = keys.length; i < il; ++i) {
	        var key = keys[i];
	        var newObj = internals.parseKeys(key, tempObj[key], options);
	        obj = Utils.merge(obj, newObj);
	    }

	    return Utils.compact(obj);
	};


/***/ }
/******/ ])