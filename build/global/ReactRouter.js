(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("react"));
	else if(typeof define === 'function' && define.amd)
		define(["react"], factory);
	else if(typeof exports === 'object')
		exports["ReactRouter"] = factory(require("react"));
	else
		root["ReactRouter"] = factory(root["React"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_21__) {
return /******/ (function(modules) { // webpackBootstrap
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

	"use strict";

	exports.DefaultRoute = __webpack_require__(1);
	exports.Link = __webpack_require__(2);
	exports.NotFoundRoute = __webpack_require__(3);
	exports.Redirect = __webpack_require__(4);
	exports.Route = __webpack_require__(5);
	exports.RouteHandler = __webpack_require__(6);

	exports.HashLocation = __webpack_require__(7);
	exports.HistoryLocation = __webpack_require__(8);
	exports.RefreshLocation = __webpack_require__(9);
	exports.StaticLocation = __webpack_require__(10);

	exports.ImitateBrowserBehavior = __webpack_require__(11);
	exports.ScrollToTopBehavior = __webpack_require__(12);

	exports.History = __webpack_require__(13);
	exports.Navigation = __webpack_require__(14);
	exports.RouteHandlerMixin = __webpack_require__(15);
	exports.State = __webpack_require__(16);

	exports.createRoute = __webpack_require__(17).createRoute;
	exports.createDefaultRoute = __webpack_require__(17).createDefaultRoute;
	exports.createNotFoundRoute = __webpack_require__(17).createNotFoundRoute;
	exports.createRedirect = __webpack_require__(17).createRedirect;
	exports.createRoutesFromReactChildren = __webpack_require__(18);
	exports.create = __webpack_require__(19);
	exports.run = __webpack_require__(20);

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var React = __webpack_require__(21);
	var Configuration = __webpack_require__(22);
	var PropTypes = __webpack_require__(23);

	/**
	 * A <DefaultRoute> component is a special kind of <Route> that
	 * renders when its parent matches but none of its siblings do.
	 * Only one such route may be used at any given level in the
	 * route hierarchy.
	 */
	var DefaultRoute = React.createClass({

	  displayName: "DefaultRoute",

	  mixins: [Configuration],

	  propTypes: {
	    name: PropTypes.string,
	    path: PropTypes.falsy,
	    children: PropTypes.falsy,
	    handler: PropTypes.func.isRequired
	  }

	});

	module.exports = DefaultRoute;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var React = __webpack_require__(21);
	var classSet = __webpack_require__(35);
	var assign = __webpack_require__(36);
	var Navigation = __webpack_require__(14);
	var State = __webpack_require__(16);
	var PropTypes = __webpack_require__(23);
	var Route = __webpack_require__(17);

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

	  displayName: "Link",

	  mixins: [Navigation, State],

	  propTypes: {
	    activeClassName: PropTypes.string.isRequired,
	    to: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Route)]),
	    params: PropTypes.object,
	    query: PropTypes.object,
	    activeStyle: PropTypes.object,
	    onClick: PropTypes.func
	  },

	  getDefaultProps: function getDefaultProps() {
	    return {
	      activeClassName: "active"
	    };
	  },

	  handleClick: function handleClick(event) {
	    var allowTransition = true;
	    var clickResult;

	    if (this.props.onClick) clickResult = this.props.onClick(event);

	    if (isModifiedEvent(event) || !isLeftClickEvent(event)) {
	      return;
	    }if (clickResult === false || event.defaultPrevented === true) allowTransition = false;

	    event.preventDefault();

	    if (allowTransition) this.transitionTo(this.props.to, this.props.params, this.props.query);
	  },

	  /**
	   * Returns the value of the "href" attribute to use on the DOM element.
	   */
	  getHref: function getHref() {
	    return this.makeHref(this.props.to, this.props.params, this.props.query);
	  },

	  /**
	   * Returns the value of the "class" attribute to use on the DOM element, which contains
	   * the value of the activeClassName property when this <Link> is active.
	   */
	  getClassName: function getClassName() {
	    var classNames = {};

	    if (this.props.className) classNames[this.props.className] = true;

	    if (this.getActiveState()) classNames[this.props.activeClassName] = true;

	    return classSet(classNames);
	  },

	  getActiveState: function getActiveState() {
	    return this.isActive(this.props.to, this.props.params, this.props.query);
	  },

	  render: function render() {
	    var props = assign({}, this.props, {
	      href: this.getHref(),
	      className: this.getClassName(),
	      onClick: this.handleClick
	    });

	    if (props.activeStyle && this.getActiveState()) props.style = props.activeStyle;

	    return React.DOM.a(props, this.props.children);
	  }

	});

	module.exports = Link;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var React = __webpack_require__(21);
	var Configuration = __webpack_require__(22);
	var PropTypes = __webpack_require__(23);

	/**
	 * A <NotFoundRoute> is a special kind of <Route> that
	 * renders when the beginning of its parent's path matches
	 * but none of its siblings do, including any <DefaultRoute>.
	 * Only one such route may be used at any given level in the
	 * route hierarchy.
	 */
	var NotFoundRoute = React.createClass({

	  displayName: "NotFoundRoute",

	  mixins: [Configuration],

	  propTypes: {
	    name: PropTypes.string,
	    path: PropTypes.falsy,
	    children: PropTypes.falsy,
	    handler: PropTypes.func.isRequired
	  }

	});

	module.exports = NotFoundRoute;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var React = __webpack_require__(21);
	var Configuration = __webpack_require__(22);
	var PropTypes = __webpack_require__(23);

	/**
	 * A <Redirect> component is a special kind of <Route> that always
	 * redirects to another route when it matches.
	 */
	var Redirect = React.createClass({

	  displayName: "Redirect",

	  mixins: [Configuration],

	  propTypes: {
	    path: PropTypes.string,
	    from: PropTypes.string, // Alias for path.
	    to: PropTypes.string,
	    handler: PropTypes.falsy
	  }

	});

	module.exports = Redirect;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var React = __webpack_require__(21);
	var Configuration = __webpack_require__(22);
	var PropTypes = __webpack_require__(23);
	var RouteHandler = __webpack_require__(6);
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
	 *
	 * If no handler is provided for the route, it will render a matched child route.
	 */
	var Route = React.createClass({

	  displayName: "Route",

	  mixins: [Configuration],

	  propTypes: {
	    name: PropTypes.string,
	    path: PropTypes.string,
	    handler: PropTypes.func,
	    ignoreScrollBehavior: PropTypes.bool
	  },

	  getDefaultProps: function getDefaultProps() {
	    return {
	      handler: RouteHandler
	    };
	  }

	});

	module.exports = Route;

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var React = __webpack_require__(21);
	var RouteHandlerMixin = __webpack_require__(15);

	/**
	 * A <RouteHandler> component renders the active child route handler
	 * when routes are nested.
	 */
	var RouteHandler = React.createClass({

	  displayName: "RouteHandler",

	  mixins: [RouteHandlerMixin],

	  render: function render() {
	    return this.createChildRouteHandler();
	  }

	});

	module.exports = RouteHandler;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var LocationActions = __webpack_require__(24);
	var History = __webpack_require__(13);

	/**
	 * Returns the current URL path from the `hash` portion of the URL, including
	 * query string.
	 */
	function getHashPath() {
	  return decodeURI(
	  // We can't use window.location.hash here because it's not
	  // consistent across browsers - Firefox will pre-decode it!
	  window.location.href.split("#")[1] || "");
	}

	var _actionType;

	function ensureSlash() {
	  var path = getHashPath();

	  if (path.charAt(0) === "/") {
	    return true;
	  }HashLocation.replace("/" + path);

	  return false;
	}

	var _changeListeners = [];

	function notifyChange(type) {
	  if (type === LocationActions.PUSH) History.length += 1;

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

	  addChangeListener: function addChangeListener(listener) {
	    _changeListeners.push(listener);

	    // Do this BEFORE listening for hashchange.
	    ensureSlash();

	    if (!_isListening) {
	      if (window.addEventListener) {
	        window.addEventListener("hashchange", onHashChange, false);
	      } else {
	        window.attachEvent("onhashchange", onHashChange);
	      }

	      _isListening = true;
	    }
	  },

	  removeChangeListener: function removeChangeListener(listener) {
	    _changeListeners = _changeListeners.filter(function (l) {
	      return l !== listener;
	    });

	    if (_changeListeners.length === 0) {
	      if (window.removeEventListener) {
	        window.removeEventListener("hashchange", onHashChange, false);
	      } else {
	        window.removeEvent("onhashchange", onHashChange);
	      }

	      _isListening = false;
	    }
	  },

	  push: function push(path) {
	    _actionType = LocationActions.PUSH;
	    window.location.hash = path;
	  },

	  replace: function replace(path) {
	    _actionType = LocationActions.REPLACE;
	    window.location.replace(window.location.pathname + window.location.search + "#" + path);
	  },

	  pop: function pop() {
	    _actionType = LocationActions.POP;
	    History.back();
	  },

	  getCurrentPath: getHashPath,

	  toString: function toString() {
	    return "<HashLocation>";
	  }

	};

	module.exports = HashLocation;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var LocationActions = __webpack_require__(24);
	var History = __webpack_require__(13);

	/**
	 * Returns the current URL path from `window.location`, including query string.
	 */
	function getWindowPath() {
	  return decodeURI(window.location.pathname + window.location.search);
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

	function onPopState(event) {
	  if (event.state === undefined) {
	    return;
	  } // Ignore extraneous popstate events in WebKit.

	  notifyChange(LocationActions.POP);
	}

	/**
	 * A Location that uses HTML5 history.
	 */
	var HistoryLocation = {

	  addChangeListener: function addChangeListener(listener) {
	    _changeListeners.push(listener);

	    if (!_isListening) {
	      if (window.addEventListener) {
	        window.addEventListener("popstate", onPopState, false);
	      } else {
	        window.attachEvent("onpopstate", onPopState);
	      }

	      _isListening = true;
	    }
	  },

	  removeChangeListener: function removeChangeListener(listener) {
	    _changeListeners = _changeListeners.filter(function (l) {
	      return l !== listener;
	    });

	    if (_changeListeners.length === 0) {
	      if (window.addEventListener) {
	        window.removeEventListener("popstate", onPopState, false);
	      } else {
	        window.removeEvent("onpopstate", onPopState);
	      }

	      _isListening = false;
	    }
	  },

	  push: function push(path) {
	    window.history.pushState({ path: path }, "", path);
	    History.length += 1;
	    notifyChange(LocationActions.PUSH);
	  },

	  replace: function replace(path) {
	    window.history.replaceState({ path: path }, "", path);
	    notifyChange(LocationActions.REPLACE);
	  },

	  pop: History.back,

	  getCurrentPath: getWindowPath,

	  toString: function toString() {
	    return "<HistoryLocation>";
	  }

	};

	module.exports = HistoryLocation;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var HistoryLocation = __webpack_require__(8);
	var History = __webpack_require__(13);

	/**
	 * A Location that uses full page refreshes. This is used as
	 * the fallback for HistoryLocation in browsers that do not
	 * support the HTML5 history API.
	 */
	var RefreshLocation = {

	  push: function push(path) {
	    window.location = path;
	  },

	  replace: function replace(path) {
	    window.location.replace(path);
	  },

	  pop: History.back,

	  getCurrentPath: HistoryLocation.getCurrentPath,

	  toString: function toString() {
	    return "<RefreshLocation>";
	  }

	};

	module.exports = RefreshLocation;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var invariant = __webpack_require__(37);

	function throwCannotModify() {
	  invariant(false, "You cannot modify a static location");
	}

	/**
	 * A location that only ever contains a single path. Useful in
	 * stateless environments like servers where there is no path history,
	 * only the path that was used in the request.
	 */

	var StaticLocation = (function () {
	  function StaticLocation(path) {
	    _classCallCheck(this, StaticLocation);

	    this.path = path;
	  }

	  _prototypeProperties(StaticLocation, null, {
	    getCurrentPath: {
	      value: function getCurrentPath() {
	        return this.path;
	      },
	      writable: true,
	      configurable: true
	    },
	    toString: {
	      value: function toString() {
	        return "<StaticLocation path=\"" + this.path + "\">";
	      },
	      writable: true,
	      configurable: true
	    }
	  });

	  return StaticLocation;
	})();

	// TODO: Include these in the above class definition
	// once we can use ES7 property initializers.
	StaticLocation.prototype.push = throwCannotModify;
	StaticLocation.prototype.replace = throwCannotModify;
	StaticLocation.prototype.pop = throwCannotModify;

	module.exports = StaticLocation;

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var LocationActions = __webpack_require__(24);

	/**
	 * A scroll behavior that attempts to imitate the default behavior
	 * of modern browsers.
	 */
	var ImitateBrowserBehavior = {

	  updateScrollPosition: function updateScrollPosition(position, actionType) {
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
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	/**
	 * A scroll behavior that always scrolls to the top of the page
	 * after a transition.
	 */
	var ScrollToTopBehavior = {

	  updateScrollPosition: function updateScrollPosition() {
	    window.scrollTo(0, 0);
	  }

	};

	module.exports = ScrollToTopBehavior;

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var invariant = __webpack_require__(37);
	var canUseDOM = __webpack_require__(38).canUseDOM;

	var History = {

	  /**
	   * The current number of entries in the history.
	   *
	   * Note: This property is read-only.
	   */
	  length: 1,

	  /**
	   * Sends the browser back one entry in the history.
	   */
	  back: function back() {
	    invariant(canUseDOM, "Cannot use History.back without a DOM");

	    // Do this first so that History.length will
	    // be accurate in location change listeners.
	    History.length -= 1;

	    window.history.back();
	  }

	};

	module.exports = History;

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var PropTypes = __webpack_require__(23);

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
	    makePath: PropTypes.func.isRequired,
	    makeHref: PropTypes.func.isRequired,
	    transitionTo: PropTypes.func.isRequired,
	    replaceWith: PropTypes.func.isRequired,
	    goBack: PropTypes.func.isRequired
	  },

	  /**
	   * Returns an absolute URL path created from the given route
	   * name, URL parameters, and query values.
	   */
	  makePath: function makePath(to, params, query) {
	    return this.context.makePath(to, params, query);
	  },

	  /**
	   * Returns a string that may safely be used as the href of a
	   * link to the route with the given name.
	   */
	  makeHref: function makeHref(to, params, query) {
	    return this.context.makeHref(to, params, query);
	  },

	  /**
	   * Transitions to the URL specified in the arguments by pushing
	   * a new URL onto the history stack.
	   */
	  transitionTo: function transitionTo(to, params, query) {
	    this.context.transitionTo(to, params, query);
	  },

	  /**
	   * Transitions to the URL specified in the arguments by replacing
	   * the current URL in the history stack.
	   */
	  replaceWith: function replaceWith(to, params, query) {
	    this.context.replaceWith(to, params, query);
	  },

	  /**
	   * Transitions to the previous URL.
	   */
	  goBack: function goBack() {
	    return this.context.goBack();
	  }

	};

	module.exports = Navigation;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var React = __webpack_require__(21);
	var assign = __webpack_require__(36);
	var PropTypes = __webpack_require__(23);

	var REF_NAME = "__routeHandler__";

	var RouteHandlerMixin = {

	  contextTypes: {
	    getRouteAtDepth: PropTypes.func.isRequired,
	    setRouteComponentAtDepth: PropTypes.func.isRequired,
	    routeHandlers: PropTypes.array.isRequired
	  },

	  childContextTypes: {
	    routeHandlers: PropTypes.array.isRequired
	  },

	  getChildContext: function getChildContext() {
	    return {
	      routeHandlers: this.context.routeHandlers.concat([this])
	    };
	  },

	  componentDidMount: function componentDidMount() {
	    this._updateRouteComponent(this.refs[REF_NAME]);
	  },

	  componentDidUpdate: function componentDidUpdate() {
	    this._updateRouteComponent(this.refs[REF_NAME]);
	  },

	  componentWillUnmount: function componentWillUnmount() {
	    this._updateRouteComponent(null);
	  },

	  _updateRouteComponent: function _updateRouteComponent(component) {
	    this.context.setRouteComponentAtDepth(this.getRouteDepth(), component);
	  },

	  getRouteDepth: function getRouteDepth() {
	    return this.context.routeHandlers.length;
	  },

	  createChildRouteHandler: function createChildRouteHandler(props) {
	    var route = this.context.getRouteAtDepth(this.getRouteDepth());
	    return route ? React.createElement(route.handler, assign({}, props || this.props, { ref: REF_NAME })) : null;
	  }

	};

	module.exports = RouteHandlerMixin;

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var PropTypes = __webpack_require__(23);

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
	    getCurrentPath: PropTypes.func.isRequired,
	    getCurrentRoutes: PropTypes.func.isRequired,
	    getCurrentPathname: PropTypes.func.isRequired,
	    getCurrentParams: PropTypes.func.isRequired,
	    getCurrentQuery: PropTypes.func.isRequired,
	    isActive: PropTypes.func.isRequired
	  },

	  /**
	   * Returns the current URL path.
	   */
	  getPath: function getPath() {
	    return this.context.getCurrentPath();
	  },

	  /**
	   * Returns an array of the routes that are currently active.
	   */
	  getRoutes: function getRoutes() {
	    return this.context.getCurrentRoutes();
	  },

	  /**
	   * Returns the current URL path without the query string.
	   */
	  getPathname: function getPathname() {
	    return this.context.getCurrentPathname();
	  },

	  /**
	   * Returns an object of the URL params that are currently active.
	   */
	  getParams: function getParams() {
	    return this.context.getCurrentParams();
	  },

	  /**
	   * Returns an object of the query params that are currently active.
	   */
	  getQuery: function getQuery() {
	    return this.context.getCurrentQuery();
	  },

	  /**
	   * A helper method to determine if a given route, params, and query
	   * are active.
	   */
	  isActive: function isActive(to, params, query) {
	    return this.context.isActive(to, params, query);
	  }

	};

	module.exports = State;

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var assign = __webpack_require__(36);
	var invariant = __webpack_require__(37);
	var warning = __webpack_require__(39);
	var PathUtils = __webpack_require__(25);

	var _currentRoute;

	var Route = (function () {
	  function Route(name, path, ignoreScrollBehavior, isDefault, isNotFound, onEnter, onLeave, handler) {
	    _classCallCheck(this, Route);

	    this.name = name;
	    this.path = path;
	    this.paramNames = PathUtils.extractParamNames(this.path);
	    this.ignoreScrollBehavior = !!ignoreScrollBehavior;
	    this.isDefault = !!isDefault;
	    this.isNotFound = !!isNotFound;
	    this.onEnter = onEnter;
	    this.onLeave = onLeave;
	    this.handler = handler;
	  }

	  _prototypeProperties(Route, {
	    createRoute: {

	      /**
	       * Creates and returns a new route. Options may be a URL pathname string
	       * with placeholders for named params or an object with any of the following
	       * properties:
	       *
	       * - name                     The name of the route. This is used to lookup a
	       *                            route relative to its parent route and should be
	       *                            unique among all child routes of the same parent
	       * - path                     A URL pathname string with optional placeholders
	       *                            that specify the names of params to extract from
	       *                            the URL when the path matches. Defaults to `/${name}`
	       *                            when there is a name given, or the path of the parent
	       *                            route, or /
	       * - ignoreScrollBehavior     True to make this route (and all descendants) ignore
	       *                            the scroll behavior of the router
	       * - isDefault                True to make this route the default route among all
	       *                            its siblings
	       * - isNotFound               True to make this route the "not found" route among
	       *                            all its siblings
	       * - onEnter                  A transition hook that will be called when the
	       *                            router is going to enter this route
	       * - onLeave                  A transition hook that will be called when the
	       *                            router is going to leave this route
	       * - handler                  A React component that will be rendered when
	       *                            this route is active
	       * - parentRoute              The parent route to use for this route. This option
	       *                            is automatically supplied when creating routes inside
	       *                            the callback to another invocation of createRoute. You
	       *                            only ever need to use this when declaring routes
	       *                            independently of one another to manually piece together
	       *                            the route hierarchy
	       *
	       * The callback may be used to structure your route hierarchy. Any call to
	       * createRoute, createDefaultRoute, createNotFoundRoute, or createRedirect
	       * inside the callback automatically uses this route as its parent.
	       */

	      value: function createRoute(options, callback) {
	        options = options || {};

	        if (typeof options === "string") options = { path: options };

	        var parentRoute = _currentRoute;

	        if (parentRoute) {
	          warning(options.parentRoute == null || options.parentRoute === parentRoute, "You should not use parentRoute with createRoute inside another route's child callback; it is ignored");
	        } else {
	          parentRoute = options.parentRoute;
	        }

	        var name = options.name;
	        var path = options.path || name;

	        if (path && !(options.isDefault || options.isNotFound)) {
	          if (PathUtils.isAbsolute(path)) {
	            if (parentRoute) {
	              invariant(parentRoute.paramNames.length === 0, "You cannot nest path \"%s\" inside \"%s\"; the parent requires URL parameters", path, parentRoute.path);
	            }
	          } else if (parentRoute) {
	            // Relative paths extend their parent.
	            path = PathUtils.join(parentRoute.path, path);
	          } else {
	            path = "/" + path;
	          }
	        } else {
	          path = parentRoute ? parentRoute.path : "/";
	        }

	        if (options.isNotFound && !/\*$/.test(path)) path += "*"; // Auto-append * to the path of not found routes.

	        var route = new Route(name, path, options.ignoreScrollBehavior, options.isDefault, options.isNotFound, options.onEnter, options.onLeave, options.handler);

	        if (parentRoute) {
	          if (route.isDefault) {
	            invariant(parentRoute.defaultRoute == null, "%s may not have more than one default route", parentRoute);

	            parentRoute.defaultRoute = route;
	          } else if (route.isNotFound) {
	            invariant(parentRoute.notFoundRoute == null, "%s may not have more than one not found route", parentRoute);

	            parentRoute.notFoundRoute = route;
	          }

	          parentRoute.appendChild(route);
	        }

	        // Any routes created in the callback
	        // use this route as their parent.
	        if (typeof callback === "function") {
	          var currentRoute = _currentRoute;
	          _currentRoute = route;
	          callback.call(route, route);
	          _currentRoute = currentRoute;
	        }

	        return route;
	      },
	      writable: true,
	      configurable: true
	    },
	    createDefaultRoute: {

	      /**
	       * Creates and returns a route that is rendered when its parent matches
	       * the current URL.
	       */

	      value: function createDefaultRoute(options) {
	        return Route.createRoute(assign({}, options, { isDefault: true }));
	      },
	      writable: true,
	      configurable: true
	    },
	    createNotFoundRoute: {

	      /**
	       * Creates and returns a route that is rendered when its parent matches
	       * the current URL but none of its siblings do.
	       */

	      value: function createNotFoundRoute(options) {
	        return Route.createRoute(assign({}, options, { isNotFound: true }));
	      },
	      writable: true,
	      configurable: true
	    },
	    createRedirect: {

	      /**
	       * Creates and returns a route that automatically redirects the transition
	       * to another route. In addition to the normal options to createRoute, this
	       * function accepts the following options:
	       *
	       * - from         An alias for the `path` option. Defaults to *
	       * - to           The path/route/route name to redirect to
	       * - params       The params to use in the redirect URL. Defaults
	       *                to using the current params
	       * - query        The query to use in the redirect URL. Defaults
	       *                to using the current query
	       */

	      value: function createRedirect(options) {
	        return Route.createRoute(assign({}, options, {
	          path: options.path || options.from || "*",
	          onEnter: function onEnter(transition, params, query) {
	            transition.redirect(options.to, options.params || params, options.query || query);
	          }
	        }));
	      },
	      writable: true,
	      configurable: true
	    }
	  }, {
	    appendChild: {

	      /**
	       * Appends the given route to this route's child routes.
	       */

	      value: function appendChild(route) {
	        invariant(route instanceof Route, "route.appendChild must use a valid Route");

	        if (!this.childRoutes) this.childRoutes = [];

	        this.childRoutes.push(route);
	      },
	      writable: true,
	      configurable: true
	    },
	    toString: {
	      value: function toString() {
	        var string = "<Route";

	        if (this.name) string += " name=\"" + this.name + "\"";

	        string += " path=\"" + this.path + "\">";

	        return string;
	      },
	      writable: true,
	      configurable: true
	    }
	  });

	  return Route;
	})();

	module.exports = Route;

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	/* jshint -W084 */

	var React = __webpack_require__(21);
	var assign = __webpack_require__(36);
	var warning = __webpack_require__(39);
	var DefaultRouteType = __webpack_require__(1).type;
	var NotFoundRouteType = __webpack_require__(3).type;
	var RedirectType = __webpack_require__(4).type;
	var Route = __webpack_require__(17);

	function checkPropTypes(componentName, propTypes, props) {
	  componentName = componentName || "UnknownComponent";

	  for (var propName in propTypes) {
	    if (propTypes.hasOwnProperty(propName)) {
	      var error = propTypes[propName](props, propName, componentName);

	      if (error instanceof Error) warning(false, error.message);
	    }
	  }
	}

	function createRouteOptions(props) {
	  var options = assign({}, props);
	  var handler = options.handler;

	  if (handler) {
	    options.onEnter = handler.willTransitionTo;
	    options.onLeave = handler.willTransitionFrom;
	  }

	  return options;
	}

	function createRouteFromReactElement(element) {
	  if (!React.isValidElement(element)) {
	    return;
	  }var type = element.type;
	  var props = element.props;

	  if (type.propTypes) checkPropTypes(type.displayName, type.propTypes, props);

	  if (type === DefaultRouteType) {
	    return Route.createDefaultRoute(createRouteOptions(props));
	  }if (type === NotFoundRouteType) {
	    return Route.createNotFoundRoute(createRouteOptions(props));
	  }if (type === RedirectType) {
	    return Route.createRedirect(createRouteOptions(props));
	  }return Route.createRoute(createRouteOptions(props), function () {
	    if (props.children) createRoutesFromReactChildren(props.children);
	  });
	}

	/**
	 * Creates and returns an array of routes created from the given
	 * ReactChildren, all of which should be one of <Route>, <DefaultRoute>,
	 * <NotFoundRoute>, or <Redirect>, e.g.:
	 *
	 *   var { createRoutesFromReactChildren, Route, Redirect } = require('react-router');
	 *
	 *   var routes = createRoutesFromReactChildren(
	 *     <Route path="/" handler={App}>
	 *       <Route name="user" path="/user/:userId" handler={User}>
	 *         <Route name="task" path="tasks/:taskId" handler={Task}/>
	 *         <Redirect from="todos/:taskId" to="task"/>
	 *       </Route>
	 *     </Route>
	 *   );
	 */
	function createRoutesFromReactChildren(children) {
	  var routes = [];

	  React.Children.forEach(children, function (child) {
	    if (child = createRouteFromReactElement(child)) routes.push(child);
	  });

	  return routes;
	}

	module.exports = createRoutesFromReactChildren;

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	/* jshint -W058 */
	var React = __webpack_require__(21);
	var warning = __webpack_require__(39);
	var invariant = __webpack_require__(37);
	var canUseDOM = __webpack_require__(38).canUseDOM;
	var LocationActions = __webpack_require__(24);
	var ImitateBrowserBehavior = __webpack_require__(11);
	var HashLocation = __webpack_require__(7);
	var HistoryLocation = __webpack_require__(8);
	var RefreshLocation = __webpack_require__(9);
	var StaticLocation = __webpack_require__(10);
	var NavigationContext = __webpack_require__(26);
	var ScrollHistory = __webpack_require__(27);
	var StateContext = __webpack_require__(28);
	var createRoutesFromReactChildren = __webpack_require__(18);
	var isReactChildren = __webpack_require__(29);
	var Transition = __webpack_require__(30);
	var PropTypes = __webpack_require__(23);
	var Redirect = __webpack_require__(31);
	var History = __webpack_require__(13);
	var Cancellation = __webpack_require__(32);
	var Match = __webpack_require__(33);
	var Route = __webpack_require__(17);
	var supportsHistory = __webpack_require__(34);
	var PathUtils = __webpack_require__(25);

	/**
	 * The default location for new routers.
	 */
	var DEFAULT_LOCATION = canUseDOM ? HashLocation : "/";

	/**
	 * The default scroll behavior for new routers.
	 */
	var DEFAULT_SCROLL_BEHAVIOR = canUseDOM ? ImitateBrowserBehavior : null;

	function hasProperties(object, properties) {
	  for (var propertyName in properties) if (properties.hasOwnProperty(propertyName) && object[propertyName] !== properties[propertyName]) {
	    return false;
	  }return true;
	}

	function hasMatch(routes, route, prevParams, nextParams, prevQuery, nextQuery) {
	  return routes.some(function (r) {
	    if (r !== route) return false;

	    var paramNames = route.paramNames;
	    var paramName;

	    // Ensure that all params the route cares about did not change.
	    for (var i = 0, len = paramNames.length; i < len; ++i) {
	      paramName = paramNames[i];

	      if (nextParams[paramName] !== prevParams[paramName]) return false;
	    }

	    // Ensure the query hasn't changed.
	    return hasProperties(prevQuery, nextQuery) && hasProperties(nextQuery, prevQuery);
	  });
	}

	function addRoutesToNamedRoutes(routes, namedRoutes) {
	  var route;
	  for (var i = 0, len = routes.length; i < len; ++i) {
	    route = routes[i];

	    if (route.name) {
	      invariant(namedRoutes[route.name] == null, "You may not have more than one route named \"%s\"", route.name);

	      namedRoutes[route.name] = route;
	    }

	    if (route.childRoutes) addRoutesToNamedRoutes(route.childRoutes, namedRoutes);
	  }
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

	  if (isReactChildren(options)) options = { routes: options };

	  var mountedComponents = [];
	  var location = options.location || DEFAULT_LOCATION;
	  var scrollBehavior = options.scrollBehavior || DEFAULT_SCROLL_BEHAVIOR;
	  var state = {};
	  var nextState = {};
	  var pendingTransition = null;
	  var dispatchHandler = null;

	  if (typeof location === "string") location = new StaticLocation(location);

	  if (location instanceof StaticLocation) {
	    warning(!canUseDOM || ("production") === "test", "You should not use a static location in a DOM environment because " + "the router will not be kept in sync with the current URL");
	  } else {
	    invariant(canUseDOM || location.needsDOM === false, "You cannot use %s without a DOM", location);
	  }

	  // Automatically fall back to full page refreshes in
	  // browsers that don't support the HTML history API.
	  if (location === HistoryLocation && !supportsHistory()) location = RefreshLocation;

	  var Router = React.createClass({

	    displayName: "Router",

	    statics: {

	      isRunning: false,

	      cancelPendingTransition: function cancelPendingTransition() {
	        if (pendingTransition) {
	          pendingTransition.cancel();
	          pendingTransition = null;
	        }
	      },

	      clearAllRoutes: function clearAllRoutes() {
	        this.cancelPendingTransition();
	        this.namedRoutes = {};
	        this.routes = [];
	      },

	      /**
	       * Adds routes to this router from the given children object (see ReactChildren).
	       */
	      addRoutes: function addRoutes(routes) {
	        if (isReactChildren(routes)) routes = createRoutesFromReactChildren(routes);

	        addRoutesToNamedRoutes(routes, this.namedRoutes);

	        this.routes.push.apply(this.routes, routes);
	      },

	      /**
	       * Replaces routes of this router from the given children object (see ReactChildren).
	       */
	      replaceRoutes: function replaceRoutes(routes) {
	        this.clearAllRoutes();
	        this.addRoutes(routes);
	        this.refresh();
	      },

	      /**
	       * Performs a match of the given path against this router and returns an object
	       * with the { routes, params, pathname, query } that match. Returns null if no
	       * match can be made.
	       */
	      match: function match(path) {
	        return Match.findMatch(this.routes, path);
	      },

	      /**
	       * Returns an absolute URL path created from the given route
	       * name, URL parameters, and query.
	       */
	      makePath: function makePath(to, params, query) {
	        var path;
	        if (PathUtils.isAbsolute(to)) {
	          path = to;
	        } else {
	          var route = to instanceof Route ? to : this.namedRoutes[to];

	          invariant(route instanceof Route, "Cannot find a route named \"%s\"", to);

	          path = route.path;
	        }

	        return PathUtils.withQuery(PathUtils.injectParams(path, params), query);
	      },

	      /**
	       * Returns a string that may safely be used as the href of a link
	       * to the route with the given name, URL parameters, and query.
	       */
	      makeHref: function makeHref(to, params, query) {
	        var path = this.makePath(to, params, query);
	        return location === HashLocation ? "#" + path : path;
	      },

	      /**
	       * Transitions to the URL specified in the arguments by pushing
	       * a new URL onto the history stack.
	       */
	      transitionTo: function transitionTo(to, params, query) {
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
	      replaceWith: function replaceWith(to, params, query) {
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
	      goBack: function goBack() {
	        if (History.length > 1 || location === RefreshLocation) {
	          location.pop();
	          return true;
	        }

	        warning(false, "goBack() was ignored because there is no router history");

	        return false;
	      },

	      handleAbort: options.onAbort || function (abortReason) {
	        if (location instanceof StaticLocation) throw new Error("Unhandled aborted transition! Reason: " + abortReason);

	        if (abortReason instanceof Cancellation) {
	          return;
	        } else if (abortReason instanceof Redirect) {
	          location.replace(this.makePath(abortReason.to, abortReason.params, abortReason.query));
	        } else {
	          location.pop();
	        }
	      },

	      handleError: options.onError || function (error) {
	        // Throw so we don't silently swallow async errors.
	        throw error; // This error probably originated in a transition hook.
	      },

	      handleLocationChange: function handleLocationChange(change) {
	        this.dispatch(change.path, change.type);
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
	      dispatch: function dispatch(path, action) {
	        this.cancelPendingTransition();

	        var prevPath = state.path;
	        var isRefreshing = action == null;

	        if (prevPath === path && !isRefreshing) {
	          return;
	        } // Nothing to do!

	        // Record the scroll position as early as possible to
	        // get it before browsers try update it automatically.
	        if (prevPath && action === LocationActions.PUSH) this.recordScrollPosition(prevPath);

	        var match = this.match(path);

	        warning(match != null, "No route matches path \"%s\". Make sure you have <Route path=\"%s\"> somewhere in your routes", path, path);

	        if (match == null) match = {};

	        var prevRoutes = state.routes || [];
	        var prevParams = state.params || {};
	        var prevQuery = state.query || {};

	        var nextRoutes = match.routes || [];
	        var nextParams = match.params || {};
	        var nextQuery = match.query || {};

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

	        var fromComponents = mountedComponents.slice(prevRoutes.length - fromRoutes.length);

	        Transition.from(transition, fromRoutes, fromComponents, function (error) {
	          if (error || transition.abortReason) return dispatchHandler.call(Router, error, transition); // No need to continue.

	          Transition.to(transition, toRoutes, nextParams, nextQuery, function (error) {
	            dispatchHandler.call(Router, error, transition, {
	              path: path,
	              action: action,
	              pathname: match.pathname,
	              routes: nextRoutes,
	              params: nextParams,
	              query: nextQuery
	            });
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
	      run: function run(callback) {
	        invariant(!this.isRunning, "Router is already running");

	        dispatchHandler = function (error, transition, newState) {
	          if (error) Router.handleError(error);

	          if (pendingTransition !== transition) return;

	          pendingTransition = null;

	          if (transition.abortReason) {
	            Router.handleAbort(transition.abortReason);
	          } else {
	            callback.call(this, this, nextState = newState);
	          }
	        };

	        if (!(location instanceof StaticLocation)) {
	          if (location.addChangeListener) location.addChangeListener(Router.handleLocationChange);

	          this.isRunning = true;
	        }

	        // Bootstrap using the current path.
	        this.refresh();
	      },

	      refresh: function refresh() {
	        Router.dispatch(location.getCurrentPath(), null);
	      },

	      stop: function stop() {
	        this.cancelPendingTransition();

	        if (location.removeChangeListener) location.removeChangeListener(Router.handleLocationChange);

	        this.isRunning = false;
	      },

	      getScrollBehavior: function getScrollBehavior() {
	        return scrollBehavior;
	      }

	    },

	    mixins: [NavigationContext, StateContext, ScrollHistory],

	    propTypes: {
	      children: PropTypes.falsy
	    },

	    childContextTypes: {
	      getRouteAtDepth: React.PropTypes.func.isRequired,
	      setRouteComponentAtDepth: React.PropTypes.func.isRequired,
	      routeHandlers: React.PropTypes.array.isRequired
	    },

	    getChildContext: function getChildContext() {
	      return {
	        getRouteAtDepth: this.getRouteAtDepth,
	        setRouteComponentAtDepth: this.setRouteComponentAtDepth,
	        routeHandlers: [this]
	      };
	    },

	    getInitialState: function getInitialState() {
	      return state = nextState;
	    },

	    componentWillReceiveProps: function componentWillReceiveProps() {
	      this.setState(state = nextState);
	    },

	    componentWillUnmount: function componentWillUnmount() {
	      Router.stop();
	    },

	    getLocation: function getLocation() {
	      return location;
	    },

	    getRouteAtDepth: function getRouteAtDepth(depth) {
	      var routes = this.state.routes;
	      return routes && routes[depth];
	    },

	    setRouteComponentAtDepth: function setRouteComponentAtDepth(depth, component) {
	      mountedComponents[depth] = component;
	    },

	    render: function render() {
	      var route = this.getRouteAtDepth(0);
	      return route ? React.createElement(route.handler, this.props) : null;
	    }

	  });

	  Router.clearAllRoutes();

	  if (options.routes) Router.addRoutes(options.routes);

	  return Router;
	}

	module.exports = createRouter;

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var createRouter = __webpack_require__(19);

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
	  if (typeof location === "function") {
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
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_21__;

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var warning = __webpack_require__(39);
	var invariant = __webpack_require__(37);

	function checkPropTypes(componentName, propTypes, props) {
	  for (var propName in propTypes) {
	    if (propTypes.hasOwnProperty(propName)) {
	      var error = propTypes[propName](props, propName, componentName);

	      if (error instanceof Error) warning(false, error.message);
	    }
	  }
	}

	var Configuration = {

	  statics: {

	    validateProps: function validateProps(props) {
	      checkPropTypes(this.displayName, this.propTypes, props);
	    }

	  },

	  render: function render() {
	    invariant(false, "%s elements are for router configuration only and should not be rendered", this.constructor.displayName);
	  }

	};

	module.exports = Configuration;

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var assign = __webpack_require__(36);
	var ReactPropTypes = __webpack_require__(21).PropTypes;

	var PropTypes = assign({

	  /**
	   * Requires that the value of a prop be falsy.
	   */
	  falsy: function falsy(props, propName, componentName) {
	    if (props[propName]) {
	      return new Error("<" + componentName + "> may not have a \"" + propName + "\" prop");
	    }
	  }

	}, ReactPropTypes);

	module.exports = PropTypes;

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	/**
	 * Actions that modify the URL.
	 */
	var LocationActions = {

	  /**
	   * Indicates a new location is being pushed to the history stack.
	   */
	  PUSH: "push",

	  /**
	   * Indicates the current location should be replaced.
	   */
	  REPLACE: "replace",

	  /**
	   * Indicates the most recent entry should be removed from the history stack.
	   */
	  POP: "pop"

	};

	module.exports = LocationActions;

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var invariant = __webpack_require__(37);
	var merge = __webpack_require__(42).merge;
	var qs = __webpack_require__(41);

	var paramCompileMatcher = /:([a-zA-Z_$][a-zA-Z0-9_$]*)|[*.()\[\]\\+|{}^$]/g;
	var paramInjectMatcher = /:([a-zA-Z_$][a-zA-Z0-9_$?]*[?]?)|[*]/g;
	var paramInjectTrailingSlashMatcher = /\/\/\?|\/\?\/|\/\?/g;
	var queryMatcher = /\?(.+)/;

	var _compiledPatterns = {};

	function compilePattern(pattern) {
	  if (!(pattern in _compiledPatterns)) {
	    var paramNames = [];
	    var source = pattern.replace(paramCompileMatcher, function (match, paramName) {
	      if (paramName) {
	        paramNames.push(paramName);
	        return "([^/?#]+)";
	      } else if (match === "*") {
	        paramNames.push("splat");
	        return "(.*?)";
	      } else {
	        return "\\" + match;
	      }
	    });

	    _compiledPatterns[pattern] = {
	      matcher: new RegExp("^" + source + "$", "i"),
	      paramNames: paramNames
	    };
	  }

	  return _compiledPatterns[pattern];
	}

	var PathUtils = {

	  /**
	   * Returns true if the given path is absolute.
	   */
	  isAbsolute: function isAbsolute(path) {
	    return path.charAt(0) === "/";
	  },

	  /**
	   * Joins two URL paths together.
	   */
	  join: function join(a, b) {
	    return a.replace(/\/*$/, "/") + b;
	  },

	  /**
	   * Returns an array of the names of all parameters in the given pattern.
	   */
	  extractParamNames: function extractParamNames(pattern) {
	    return compilePattern(pattern).paramNames;
	  },

	  /**
	   * Extracts the portions of the given URL path that match the given pattern
	   * and returns an object of param name => value pairs. Returns null if the
	   * pattern does not match the given path.
	   */
	  extractParams: function extractParams(pattern, path) {
	    var _compilePattern = compilePattern(pattern);

	    var matcher = _compilePattern.matcher;
	    var paramNames = _compilePattern.paramNames;

	    var match = path.match(matcher);

	    if (!match) {
	      return null;
	    }var params = {};

	    paramNames.forEach(function (paramName, index) {
	      params[paramName] = match[index + 1];
	    });

	    return params;
	  },

	  /**
	   * Returns a version of the given route path with params interpolated. Throws
	   * if there is a dynamic segment of the route path for which there is no param.
	   */
	  injectParams: function injectParams(pattern, params) {
	    params = params || {};

	    var splatIndex = 0;

	    return pattern.replace(paramInjectMatcher, function (match, paramName) {
	      paramName = paramName || "splat";

	      // If param is optional don't check for existence
	      if (paramName.slice(-1) === "?") {
	        paramName = paramName.slice(0, -1);

	        if (params[paramName] == null) return "";
	      } else {
	        invariant(params[paramName] != null, "Missing \"%s\" parameter for path \"%s\"", paramName, pattern);
	      }

	      var segment;
	      if (paramName === "splat" && Array.isArray(params[paramName])) {
	        segment = params[paramName][splatIndex++];

	        invariant(segment != null, "Missing splat # %s for path \"%s\"", splatIndex, pattern);
	      } else {
	        segment = params[paramName];
	      }

	      return segment;
	    }).replace(paramInjectTrailingSlashMatcher, "/");
	  },

	  /**
	   * Returns an object that is the result of parsing any query string contained
	   * in the given path, null if the path contains no query string.
	   */
	  extractQuery: function extractQuery(path) {
	    var match = path.match(queryMatcher);
	    return match && qs.parse(match[1]);
	  },

	  /**
	   * Returns a version of the given path without the query string.
	   */
	  withoutQuery: function withoutQuery(path) {
	    return path.replace(queryMatcher, "");
	  },

	  /**
	   * Returns a version of the given path with the parameters in the given
	   * query merged into the query string.
	   */
	  withQuery: function withQuery(path, query) {
	    var existingQuery = PathUtils.extractQuery(path);

	    if (existingQuery) query = query ? merge(existingQuery, query) : existingQuery;

	    var queryString = qs.stringify(query, { indices: false });

	    if (queryString) {
	      return PathUtils.withoutQuery(path) + "?" + queryString;
	    }return path;
	  }

	};

	module.exports = PathUtils;

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var PropTypes = __webpack_require__(23);

	/**
	 * Provides the router with context for Router.Navigation.
	 */
	var NavigationContext = {

	  childContextTypes: {
	    makePath: PropTypes.func.isRequired,
	    makeHref: PropTypes.func.isRequired,
	    transitionTo: PropTypes.func.isRequired,
	    replaceWith: PropTypes.func.isRequired,
	    goBack: PropTypes.func.isRequired
	  },

	  getChildContext: function getChildContext() {
	    return {
	      makePath: this.constructor.makePath.bind(this.constructor),
	      makeHref: this.constructor.makeHref.bind(this.constructor),
	      transitionTo: this.constructor.transitionTo.bind(this.constructor),
	      replaceWith: this.constructor.replaceWith.bind(this.constructor),
	      goBack: this.constructor.goBack.bind(this.constructor)
	    };
	  }

	};

	module.exports = NavigationContext;

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var invariant = __webpack_require__(37);
	var canUseDOM = __webpack_require__(38).canUseDOM;
	var getWindowScrollPosition = __webpack_require__(40);

	function shouldUpdateScroll(state, prevState) {
	  if (!prevState) {
	    return true;
	  } // Don't update scroll position when only the query has changed.
	  if (state.pathname === prevState.pathname) {
	    return false;
	  }var routes = state.routes;
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
	var ScrollHistory = {

	  statics: {

	    /**
	     * Records curent scroll position as the last known position for the given URL path.
	     */
	    recordScrollPosition: function recordScrollPosition(path) {
	      if (!this.scrollHistory) this.scrollHistory = {};

	      this.scrollHistory[path] = getWindowScrollPosition();
	    },

	    /**
	     * Returns the last known scroll position for the given URL path.
	     */
	    getScrollPosition: function getScrollPosition(path) {
	      if (!this.scrollHistory) this.scrollHistory = {};

	      return this.scrollHistory[path] || null;
	    }

	  },

	  componentWillMount: function componentWillMount() {
	    invariant(this.constructor.getScrollBehavior() == null || canUseDOM, "Cannot use scroll behavior without a DOM");
	  },

	  componentDidMount: function componentDidMount() {
	    this._updateScroll();
	  },

	  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
	    this._updateScroll(prevState);
	  },

	  _updateScroll: function _updateScroll(prevState) {
	    if (!shouldUpdateScroll(this.state, prevState)) {
	      return;
	    }var scrollBehavior = this.constructor.getScrollBehavior();

	    if (scrollBehavior) scrollBehavior.updateScrollPosition(this.constructor.getScrollPosition(this.state.path), this.state.action);
	  }

	};

	module.exports = ScrollHistory;

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var assign = __webpack_require__(36);
	var PropTypes = __webpack_require__(23);
	var PathUtils = __webpack_require__(25);

	function routeIsActive(activeRoutes, routeName) {
	  return activeRoutes.some(function (route) {
	    return route.name === routeName;
	  });
	}

	function paramsAreActive(activeParams, params) {
	  for (var property in params) if (String(activeParams[property]) !== String(params[property])) {
	    return false;
	  }return true;
	}

	function queryIsActive(activeQuery, query) {
	  for (var property in query) if (String(activeQuery[property]) !== String(query[property])) {
	    return false;
	  }return true;
	}

	/**
	 * Provides the router with context for Router.State.
	 */
	var StateContext = {

	  /**
	   * Returns the current URL path + query string.
	   */
	  getCurrentPath: function getCurrentPath() {
	    return this.state.path;
	  },

	  /**
	   * Returns a read-only array of the currently active routes.
	   */
	  getCurrentRoutes: function getCurrentRoutes() {
	    return this.state.routes.slice(0);
	  },

	  /**
	   * Returns the current URL path without the query string.
	   */
	  getCurrentPathname: function getCurrentPathname() {
	    return this.state.pathname;
	  },

	  /**
	   * Returns a read-only object of the currently active URL parameters.
	   */
	  getCurrentParams: function getCurrentParams() {
	    return assign({}, this.state.params);
	  },

	  /**
	   * Returns a read-only object of the currently active query parameters.
	   */
	  getCurrentQuery: function getCurrentQuery() {
	    return assign({}, this.state.query);
	  },

	  /**
	   * Returns true if the given route, params, and query are active.
	   */
	  isActive: function isActive(to, params, query) {
	    if (PathUtils.isAbsolute(to)) {
	      return to === this.state.path;
	    }return routeIsActive(this.state.routes, to) && paramsAreActive(this.state.params, params) && (query == null || queryIsActive(this.state.query, query));
	  },

	  childContextTypes: {
	    getCurrentPath: PropTypes.func.isRequired,
	    getCurrentRoutes: PropTypes.func.isRequired,
	    getCurrentPathname: PropTypes.func.isRequired,
	    getCurrentParams: PropTypes.func.isRequired,
	    getCurrentQuery: PropTypes.func.isRequired,
	    isActive: PropTypes.func.isRequired
	  },

	  getChildContext: function getChildContext() {
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
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var React = __webpack_require__(21);

	function isValidChild(object) {
	  return object == null || React.isValidElement(object);
	}

	function isReactChildren(object) {
	  return isValidChild(object) || Array.isArray(object) && object.every(isValidChild);
	}

	module.exports = isReactChildren;

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	/* jshint -W058 */

	var Cancellation = __webpack_require__(32);
	var Redirect = __webpack_require__(31);

	/**
	 * Encapsulates a transition to a given path.
	 *
	 * The willTransitionTo and willTransitionFrom handlers receive
	 * an instance of this class as their first argument.
	 */
	function Transition(path, retry) {
	  this.path = path;
	  this.abortReason = null;
	  // TODO: Change this to router.retryTransition(transition)
	  this.retry = retry.bind(this);
	}

	Transition.prototype.abort = function (reason) {
	  if (this.abortReason == null) this.abortReason = reason || "ABORT";
	};

	Transition.prototype.redirect = function (to, params, query) {
	  this.abort(new Redirect(to, params, query));
	};

	Transition.prototype.cancel = function () {
	  this.abort(new Cancellation());
	};

	Transition.from = function (transition, routes, components, callback) {
	  routes.reduce(function (callback, route, index) {
	    return function (error) {
	      if (error || transition.abortReason) {
	        callback(error);
	      } else if (route.onLeave) {
	        try {
	          route.onLeave(transition, components[index], callback);

	          // If there is no callback in the argument list, call it automatically.
	          if (route.onLeave.length < 3) callback();
	        } catch (e) {
	          callback(e);
	        }
	      } else {
	        callback();
	      }
	    };
	  }, callback)();
	};

	Transition.to = function (transition, routes, params, query, callback) {
	  routes.reduceRight(function (callback, route) {
	    return function (error) {
	      if (error || transition.abortReason) {
	        callback(error);
	      } else if (route.onEnter) {
	        try {
	          route.onEnter(transition, params, query, callback);

	          // If there is no callback in the argument list, call it automatically.
	          if (route.onEnter.length < 4) callback();
	        } catch (e) {
	          callback(e);
	        }
	      } else {
	        callback();
	      }
	    };
	  }, callback)();
	};

	module.exports = Transition;

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

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
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	/**
	 * Represents a cancellation caused by navigating away
	 * before the previous transition has fully resolved.
	 */
	function Cancellation() {}

	module.exports = Cancellation;

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	/* jshint -W084 */
	var PathUtils = __webpack_require__(25);

	function deepSearch(route, pathname, query) {
	  // Check the subtree first to find the most deeply-nested match.
	  var childRoutes = route.childRoutes;
	  if (childRoutes) {
	    var match, childRoute;
	    for (var i = 0, len = childRoutes.length; i < len; ++i) {
	      childRoute = childRoutes[i];

	      if (childRoute.isDefault || childRoute.isNotFound) continue; // Check these in order later.

	      if (match = deepSearch(childRoute, pathname, query)) {
	        // A route in the subtree matched! Add this route and we're done.
	        match.routes.unshift(route);
	        return match;
	      }
	    }
	  }

	  // No child routes matched; try the default route.
	  var defaultRoute = route.defaultRoute;
	  if (defaultRoute && (params = PathUtils.extractParams(defaultRoute.path, pathname))) {
	    return new Match(pathname, params, query, [route, defaultRoute]);
	  } // Does the "not found" route match?
	  var notFoundRoute = route.notFoundRoute;
	  if (notFoundRoute && (params = PathUtils.extractParams(notFoundRoute.path, pathname))) {
	    return new Match(pathname, params, query, [route, notFoundRoute]);
	  } // Last attempt: check this route.
	  var params = PathUtils.extractParams(route.path, pathname);
	  if (params) {
	    return new Match(pathname, params, query, [route]);
	  }return null;
	}

	var Match = (function () {
	  function Match(pathname, params, query, routes) {
	    _classCallCheck(this, Match);

	    this.pathname = pathname;
	    this.params = params;
	    this.query = query;
	    this.routes = routes;
	  }

	  _prototypeProperties(Match, {
	    findMatch: {

	      /**
	       * Attempts to match depth-first a route in the given route's
	       * subtree against the given path and returns the match if it
	       * succeeds, null if no match can be made.
	       */

	      value: function findMatch(routes, path) {
	        var pathname = PathUtils.withoutQuery(path);
	        var query = PathUtils.extractQuery(path);
	        var match = null;

	        for (var i = 0, len = routes.length; match == null && i < len; ++i) match = deepSearch(routes[i], pathname, query);

	        return match;
	      },
	      writable: true,
	      configurable: true
	    }
	  });

	  return Match;
	})();

	module.exports = Match;

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	function supportsHistory() {
	  /*! taken from modernizr
	   * https://github.com/Modernizr/Modernizr/blob/master/LICENSE
	   * https://github.com/Modernizr/Modernizr/blob/master/feature-detects/history.js
	   * changed to avoid false negatives for Windows Phones: https://github.com/rackt/react-router/issues/586
	   */
	  var ua = navigator.userAgent;
	  if ((ua.indexOf("Android 2.") !== -1 || ua.indexOf("Android 4.0") !== -1) && ua.indexOf("Mobile Safari") !== -1 && ua.indexOf("Chrome") === -1 && ua.indexOf("Windows Phone") === -1) {
	    return false;
	  }
	  return window.history && "pushState" in window.history;
	}

	module.exports = supportsHistory;

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

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
	  if (typeof classNames == "object") {
	    return Object.keys(classNames).filter(function (className) {
	      return classNames[className];
	    }).join(" ");
	  } else {
	    return Array.prototype.join.call(arguments, " ");
	  }
	}

	module.exports = cx;

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

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
	    throw new TypeError("Object.assign target cannot be null or undefined");
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
/* 37 */
/***/ function(module, exports, __webpack_require__) {

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

	var invariant = function invariant(condition, format, a, b, c, d, e, f) {
	  if (false) {
	    if (format === undefined) {
	      throw new Error("invariant requires an error message argument");
	    }
	  }

	  if (!condition) {
	    var error;
	    if (format === undefined) {
	      error = new Error("Minified exception occurred; use the non-minified dev environment " + "for the full error message and additional helpful warnings.");
	    } else {
	      var args = [a, b, c, d, e, f];
	      var argIndex = 0;
	      error = new Error("Invariant Violation: " + format.replace(/%s/g, function () {
	        return args[argIndex++];
	      }));
	    }

	    error.framesToPop = 1; // we don't care about invariant's own frame
	    throw error;
	  }
	};

	module.exports = invariant;
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

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var canUseDOM = !!(typeof window !== "undefined" && window.document && window.document.createElement);

	/**
	 * Simple, lightweight module assisting with the detection and context of
	 * Worker. Helps avoid circular dependencies and allows code to reason about
	 * whether or not they are in a Worker, even if they never include the main
	 * `ReactWorker` dependency.
	 */
	var ExecutionEnvironment = {

	  canUseDOM: canUseDOM,

	  canUseWorkers: typeof Worker !== "undefined",

	  canUseEventListeners: canUseDOM && !!(window.addEventListener || window.attachEvent),

	  canUseViewport: canUseDOM && !!window.screen,

	  isInWorker: !canUseDOM // For now, this is true - might change in the future.

	};

	module.exports = ExecutionEnvironment;
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

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var emptyFunction = __webpack_require__(43);

	/**
	 * Similar to invariant but only logs a warning if the condition is not met.
	 * This can be used to log issues in development environments in critical
	 * paths. Removing the logging code for production environments will keep the
	 * same logic and follow the same code paths.
	 */

	var warning = emptyFunction;

	if (false) {
	  warning = function (condition, format) {
	    for (var args = [], $__0 = 2, $__1 = arguments.length; $__0 < $__1; $__0++) args.push(arguments[$__0]);
	    if (format === undefined) {
	      throw new Error("`warning(condition, format, ...args)` requires a warning " + "message argument");
	    }

	    if (!condition) {
	      var argIndex = 0;
	      console.warn("Warning: " + format.replace(/%s/g, function () {
	        return args[argIndex++];
	      }));
	    }
	  };
	}

	module.exports = warning;
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

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var invariant = __webpack_require__(37);
	var canUseDOM = __webpack_require__(38).canUseDOM;

	/**
	 * Returns the current scroll position of the window as { x, y }.
	 */
	function getWindowScrollPosition() {
	  invariant(canUseDOM, "Cannot get current scroll position without a DOM");

	  return {
	    x: window.pageXOffset || document.documentElement.scrollLeft,
	    y: window.pageYOffset || document.documentElement.scrollTop
	  };
	}

	module.exports = getWindowScrollPosition;

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	module.exports = __webpack_require__(44);

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	// Load modules

	// Declare internals

	var internals = {};

	exports.arrayToObject = function (source) {

	    var obj = {};
	    for (var i = 0, il = source.length; i < il; ++i) {
	        if (typeof source[i] !== "undefined") {

	            obj[i] = source[i];
	        }
	    }

	    return obj;
	};

	exports.merge = function (target, source) {

	    if (!source) {
	        return target;
	    }

	    if (typeof source !== "object") {
	        if (Array.isArray(target)) {
	            target.push(source);
	        } else {
	            target[source] = true;
	        }

	        return target;
	    }

	    if (typeof target !== "object") {
	        target = [target].concat(source);
	        return target;
	    }

	    if (Array.isArray(target) && !Array.isArray(source)) {

	        target = exports.arrayToObject(target);
	    }

	    var keys = Object.keys(source);
	    for (var k = 0, kl = keys.length; k < kl; ++k) {
	        var key = keys[k];
	        var value = source[key];

	        if (!target[key]) {
	            target[key] = value;
	        } else {
	            target[key] = exports.merge(target[key], value);
	        }
	    }

	    return target;
	};

	exports.decode = function (str) {

	    try {
	        return decodeURIComponent(str.replace(/\+/g, " "));
	    } catch (e) {
	        return str;
	    }
	};

	exports.compact = function (obj, refs) {

	    if (typeof obj !== "object" || obj === null) {

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
	            if (typeof obj[i] !== "undefined") {
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
	    return Object.prototype.toString.call(obj) === "[object RegExp]";
	};

	exports.isBuffer = function (obj) {

	    if (obj === null || typeof obj === "undefined") {

	        return false;
	    }

	    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
	};

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

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
	  return function () {
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
	emptyFunction.thatReturnsThis = function () {
	  return this;
	};
	emptyFunction.thatReturnsArgument = function (arg) {
	  return arg;
	};

	module.exports = emptyFunction;

/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	// Load modules

	var Stringify = __webpack_require__(45);
	var Parse = __webpack_require__(46);

	// Declare internals

	var internals = {};

	module.exports = {
	    stringify: Stringify,
	    parse: Parse
	};

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	// Load modules

	var Utils = __webpack_require__(42);

	// Declare internals

	var internals = {
	    delimiter: "&",
	    indices: true
	};

	internals.stringify = function (obj, prefix, options) {

	    if (Utils.isBuffer(obj)) {
	        obj = obj.toString();
	    } else if (obj instanceof Date) {
	        obj = obj.toISOString();
	    } else if (obj === null) {
	        obj = "";
	    }

	    if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") {

	        return [encodeURIComponent(prefix) + "=" + encodeURIComponent(obj)];
	    }

	    var values = [];

	    if (typeof obj === "undefined") {
	        return values;
	    }

	    var objKeys = Object.keys(obj);
	    for (var i = 0, il = objKeys.length; i < il; ++i) {
	        var key = objKeys[i];
	        if (!options.indices && Array.isArray(obj)) {

	            values = values.concat(internals.stringify(obj[key], prefix, options));
	        } else {
	            values = values.concat(internals.stringify(obj[key], prefix + "[" + key + "]", options));
	        }
	    }

	    return values;
	};

	module.exports = function (obj, options) {

	    options = options || {};
	    var delimiter = typeof options.delimiter === "undefined" ? internals.delimiter : options.delimiter;
	    options.indices = typeof options.indices === "boolean" ? options.indices : internals.indices;

	    var keys = [];

	    if (typeof obj !== "object" || obj === null) {

	        return "";
	    }

	    var objKeys = Object.keys(obj);
	    for (var i = 0, il = objKeys.length; i < il; ++i) {
	        var key = objKeys[i];
	        keys = keys.concat(internals.stringify(obj[key], key, options));
	    }

	    return keys.join(delimiter);
	};

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	// Load modules

	var Utils = __webpack_require__(42);

	// Declare internals

	var internals = {
	    delimiter: "&",
	    depth: 5,
	    arrayLimit: 20,
	    parameterLimit: 1000
	};

	internals.parseValues = function (str, options) {

	    var obj = {};
	    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

	    for (var i = 0, il = parts.length; i < il; ++i) {
	        var part = parts[i];
	        var pos = part.indexOf("]=") === -1 ? part.indexOf("=") : part.indexOf("]=") + 1;

	        if (pos === -1) {
	            obj[Utils.decode(part)] = "";
	        } else {
	            var key = Utils.decode(part.slice(0, pos));
	            var val = Utils.decode(part.slice(pos + 1));

	            if (!obj.hasOwnProperty(key)) {
	                obj[key] = val;
	            } else {
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
	    if (root === "[]") {
	        obj = [];
	        obj = obj.concat(internals.parseObject(chain, val, options));
	    } else {
	        var cleanRoot = root[0] === "[" && root[root.length - 1] === "]" ? root.slice(1, root.length - 1) : root;
	        var index = parseInt(cleanRoot, 10);
	        var indexString = "" + index;
	        if (!isNaN(index) && root !== cleanRoot && indexString === cleanRoot && index >= 0 && index <= options.arrayLimit) {

	            obj = [];
	            obj[index] = internals.parseObject(chain, val, options);
	        } else {
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
	        if (!Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ""))) {
	            keys.push(segment[1]);
	        }
	    }

	    // If there's a remainder, just add whatever is left

	    if (segment) {
	        keys.push("[" + key.slice(segment.index) + "]");
	    }

	    return internals.parseObject(keys, val, options);
	};

	module.exports = function (str, options) {

	    if (str === "" || str === null || typeof str === "undefined") {

	        return {};
	    }

	    options = options || {};
	    options.delimiter = typeof options.delimiter === "string" || Utils.isRegExp(options.delimiter) ? options.delimiter : internals.delimiter;
	    options.depth = typeof options.depth === "number" ? options.depth : internals.depth;
	    options.arrayLimit = typeof options.arrayLimit === "number" ? options.arrayLimit : internals.arrayLimit;
	    options.parameterLimit = typeof options.parameterLimit === "number" ? options.parameterLimit : internals.parameterLimit;

	    var tempObj = typeof str === "string" ? internals.parseValues(str, options) : str;
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
});
