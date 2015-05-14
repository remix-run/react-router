(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("react"));
	else if(typeof define === 'function' && define.amd)
		define(["react"], factory);
	else if(typeof exports === 'object')
		exports["ReactRouter"] = factory(require("react"));
	else
		root["ReactRouter"] = factory(root["React"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
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

	'use strict';

	exports.createRouter = __webpack_require__(23);
	exports.createRoutesFromReactChildren = __webpack_require__(10);
	exports.Navigation = __webpack_require__(14);
	exports.State = __webpack_require__(17);
	exports.Transition = __webpack_require__(19);

	exports.ImitateBrowserBehavior = __webpack_require__(21);
	exports.ScrollToTopBehavior = __webpack_require__(22);

	exports.Link = __webpack_require__(13);
	exports.Route = __webpack_require__(16);

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule invariant
	 */

	'use strict';

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
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/* jshint -W084 */
	'use strict';

	var invariant = __webpack_require__(2);
	var assign = __webpack_require__(4);
	var qs = __webpack_require__(27);

	var queryMatcher = /\?(.*)$/;

	function escapeRegExp(string) {
	  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function escapeSource(string) {
	  return escapeRegExp(string).replace(/\/+/g, '/+');
	}

	function _compilePattern(pattern) {
	  var escapedSource = '';
	  var paramNames = [];
	  var tokens = [];

	  var match,
	      lastIndex = 0,
	      matcher = /:([a-zA-Z_$][a-zA-Z0-9_$]*)|\*|\(|\)/g;
	  while (match = matcher.exec(pattern)) {
	    if (match.index !== lastIndex) {
	      tokens.push(pattern.slice(lastIndex, match.index));
	      escapedSource += escapeSource(pattern.slice(lastIndex, match.index));
	    }

	    if (match[1]) {
	      escapedSource += '([^/?#]+)';
	      paramNames.push(match[1]);
	    } else if (match[0] === '*') {
	      escapedSource += '(.*?)';
	      paramNames.push('splat');
	    } else if (match[0] === '(') {
	      escapedSource += '(?:';
	    } else if (match[0] === ')') {
	      escapedSource += ')?';
	    }

	    tokens.push(match[0]);

	    lastIndex = matcher.lastIndex;
	  }

	  if (lastIndex !== pattern.length) {
	    tokens.push(pattern.slice(lastIndex, pattern.length));
	    escapedSource += escapeSource(pattern.slice(lastIndex, pattern.length));
	  }

	  return {
	    pattern: pattern,
	    escapedSource: escapedSource,
	    paramNames: paramNames,
	    tokens: tokens
	  };
	}

	// Cache patterns we've seen before.
	var _compiledPatterns = {};

	function compilePattern(pattern) {
	  if (!(pattern in _compiledPatterns)) _compiledPatterns[pattern] = _compilePattern(pattern);

	  return _compiledPatterns[pattern];
	}

	function stripLeadingSlashes(path) {
	  return path ? path.replace(/^\/+/, '') : '';
	}

	function stripTrailingSlashes(path) {
	  return path.replace(/\/+$/, '');
	}

	function isAbsolutePath(path) {
	  return typeof path === 'string' && path.charAt(0) === '/';
	}

	function getPathname(path) {
	  return path.replace(queryMatcher, '');
	}

	function getQueryString(path) {
	  var match = path.match(queryMatcher);
	  return match ? match[1] : '';
	}

	function getQuery(path, options) {
	  return qs.parse(getQueryString(path), options);
	}

	function withQuery(path, query) {
	  if (typeof query !== 'string') query = qs.stringify(query, { arrayFormat: 'brackets' });

	  if (query) {
	    return getPathname(path) + '?' + query;
	  }return getPathname(path);
	}

	function getParamNames(path) {
	  return compilePattern(path).paramNames;
	}

	/**
	 * Returns a version of the given route path with params
	 * interpolated. Throws if there is a dynamic segment of
	 * the route path for which there is no param.
	 */
	function injectParams(pattern, params) {
	  params = params || {};

	  var _compilePattern2 = compilePattern(pattern);

	  var tokens = _compilePattern2.tokens;

	  var parenCount = 0,
	      pathname = '',
	      splatIndex = 0;

	  var token, paramName, paramValue;
	  for (var i = 0, len = tokens.length; i < len; ++i) {
	    token = tokens[i];

	    if (token === '*') {
	      paramValue = Array.isArray(params.splat) ? params.splat[splatIndex++] : params.splat;

	      invariant(paramValue != null || parenCount > 0, 'Missing splat #%s for path "%s"', splatIndex, pattern);

	      if (paramValue != null) pathname += paramValue;
	    } else if (token === '(') {
	      parenCount += 1;
	    } else if (token === ')') {
	      parenCount -= 1;
	    } else if (token.charAt(0) === ':') {
	      paramName = token.substring(1);
	      paramValue = params[paramName];

	      invariant(paramValue != null || parenCount > 0, 'Missing "%s" parameter for path "%s"', paramName, pattern);

	      if (paramValue != null) pathname += paramValue;
	    } else {
	      pathname += token;
	    }
	  }

	  return pathname.replace(/\/+/g, '/');
	}

	module.exports = {
	  compilePattern: compilePattern,
	  stripLeadingSlashes: stripLeadingSlashes,
	  stripTrailingSlashes: stripTrailingSlashes,
	  isAbsolutePath: isAbsolutePath,
	  getPathname: getPathname,
	  getQueryString: getQueryString,
	  getQuery: getQuery,
	  withQuery: withQuery,
	  getParamNames: getParamNames,
	  injectParams: injectParams
	};

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	function ToObject(val) {
		if (val == null) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	module.exports = Object.assign || function (target, source) {
		var from;
		var keys;
		var to = ToObject(target);

		for (var s = 1; s < arguments.length; s++) {
			from = arguments[s];
			keys = Object.keys(Object(from));

			for (var i = 0; i < keys.length; i++) {
				to[keys[i]] = from[keys[i]];
			}
		}

		return to;
	};


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var NavigationTypes = __webpack_require__(8);
	var PathUtils = __webpack_require__(3);

	/**
	 * A Location answers two important questions:
	 *
	 * 1. Where am I?
	 * 2. How did I get here?
	 */

	var Location = (function () {
	  function Location(path, navigationType) {
	    _classCallCheck(this, Location);

	    this.path = path;
	    this.navigationType = navigationType || NavigationTypes.POP;
	  }

	  _createClass(Location, [{
	    key: 'getPathname',
	    value: function getPathname() {
	      return PathUtils.getPathname(this.path);
	    }
	  }, {
	    key: 'getQueryString',
	    value: function getQueryString() {
	      return PathUtils.getQueryString(this.path);
	    }
	  }, {
	    key: 'getQuery',
	    value: function getQuery(options) {
	      return PathUtils.getQuery(this.path, options);
	    }
	  }]);

	  return Location;
	})();

	module.exports = Location;

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var invariant = __webpack_require__(2);
	var Location = __webpack_require__(5);

	var _listenSingleton = null;

	/**
	 * A history interface that normalizes the differences across
	 * various environments and implementations. Requires concrete
	 * subclasses to implement the following methods:
	 *
	 * - getPath()
	 * - push(path)
	 * - replace(path)
	 * - go(n)
	 */

	var AbstractHistory = (function () {
	  function AbstractHistory(length, current, navigationType) {
	    _classCallCheck(this, AbstractHistory);

	    invariant(typeof length === 'number' && length > 0, 'History needs a length greater than 0');

	    if (current == null) current = length - 1;

	    invariant(current < length, 'History current value is out of bounds');

	    this.length = length;
	    this.current = current;
	    this.navigationType = navigationType;
	  }

	  _createClass(AbstractHistory, [{
	    key: 'listen',

	    /**
	     * This is the high-level sugar API for adding a listener and
	     * triggering it immediately in one shot, useful when you're
	     * doing data-fetching before you render.
	     *
	     *   History.listen(function (location) {
	     *     Router.match(location, function (error, props) {
	     *       fetchData(props.branch, function (data) {
	     *         wrapComponentsWithData(props.components, data);
	     *         React.render(<Router {...props}/>, document.body);
	     *       });
	     *     });
	     *   });
	     */
	    value: function listen(listener) {
	      _listenSingleton = this;
	      this.addChangeListener(listener);
	      listener.call(this, this.getLocation());
	    }
	  }, {
	    key: '_notifyChange',
	    value: function _notifyChange() {
	      if (!this.changeListeners) {
	        return;
	      }var location = this.getLocation();

	      for (var i = 0, len = this.changeListeners.length; i < len; ++i) this.changeListeners[i].call(this, location);
	    }
	  }, {
	    key: 'addChangeListener',
	    value: function addChangeListener(listener) {
	      if (!this.changeListeners) this.changeListeners = [];

	      this.changeListeners.push(listener);
	    }
	  }, {
	    key: 'removeChangeListener',
	    value: function removeChangeListener(listener) {
	      if (!this.changeListeners) {
	        return;
	      }this.changeListeners = this.changeListeners.filter(function (li) {
	        return li !== listener;
	      });
	    }
	  }, {
	    key: 'getLocation',
	    value: function getLocation() {
	      return new Location(this.getPath(), this.navigationType);
	    }
	  }, {
	    key: 'back',
	    value: function back() {
	      this.go(-1);
	    }
	  }, {
	    key: 'forward',
	    value: function forward() {
	      this.go(1);
	    }
	  }, {
	    key: 'canGo',
	    value: function canGo(n) {
	      if (n === 0) {
	        return true;
	      }var next = this.current + n;
	      return next >= 0 && next < this.length;
	    }
	  }, {
	    key: 'canGoBack',
	    value: function canGoBack() {
	      return this.canGo(-1);
	    }
	  }, {
	    key: 'canGoForward',
	    value: function canGoForward() {
	      return this.canGo(1);
	    }
	  }, {
	    key: 'makeHref',
	    value: function makeHref(path) {
	      return path;
	    }
	  }, {
	    key: 'toJSON',
	    value: function toJSON() {
	      return {
	        length: this.length,
	        current: this.current,
	        navigationType: this.navigationType
	      };
	    }
	  }], [{
	    key: 'getSingleton',
	    value: function getSingleton() {
	      return _listenSingleton;
	    }
	  }]);

	  return AbstractHistory;
	})();

	module.exports = AbstractHistory;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	function mapAsync(array, work, callback) {
	  var length = array.length;
	  var values = [];

	  if (length === 0) {
	    return callback(null, values);
	  }var isDone = false;
	  var doneCount = 0;

	  function done(index, error, value) {
	    if (isDone) {
	      return;
	    }if (error) {
	      isDone = true;
	      callback(error);
	    } else {
	      values[index] = value;

	      isDone = ++doneCount === length;

	      if (isDone) callback(null, values);
	    }
	  }

	  array.forEach(function (item, index) {
	    work(item, index, function (error, value) {
	      done(index, error, value);
	    });
	  });
	}

	function loopAsync(turns, work, callback) {
	  var currentTurn = 0;
	  var isDone = false;

	  function done() {
	    isDone = true;
	    callback.apply(this, arguments);
	  }

	  function next() {
	    if (isDone) {
	      return;
	    }if (currentTurn < turns) {
	      currentTurn += 1;
	      work(currentTurn - 1, next, done);
	    } else {
	      done.apply(this, arguments);
	    }
	  }

	  next();
	}

	module.exports = {
	  mapAsync: mapAsync,
	  loopAsync: loopAsync
	};

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var keyMirror = __webpack_require__(26);

	var NavigationTypes = keyMirror({

	  /**
	   * Indicates that navigation was caused by a call to history.push.
	   */
	  PUSH: null,

	  /**
	   * Indicates that navigation was caused by a call to history.replace.
	   */
	  REPLACE: null,

	  /**
	   * Indicates that navigation was caused by some other action such
	   * as using a browser's back/forward buttons and/or manually manipulating
	   * the URL in a browser's location bar. This is the default.
	   *
	   * See https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate
	   * for more information.
	   */
	  POP: null

	});

	module.exports = NavigationTypes;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _require$PropTypes = __webpack_require__(1).PropTypes;

	var func = _require$PropTypes.func;
	var object = _require$PropTypes.object;
	var arrayOf = _require$PropTypes.arrayOf;
	var instanceOf = _require$PropTypes.instanceOf;
	var oneOfType = _require$PropTypes.oneOfType;

	var AbstractHistory = __webpack_require__(6);
	var Location = __webpack_require__(5);

	function falsy(props, propName, componentName) {
	  if (props[propName]) {
	    return new Error('<' + componentName + '> should not have a "' + propName + '" prop');
	  }
	}

	var component = func;
	var components = oneOfType([component, object]);
	var history = instanceOf(AbstractHistory);
	var location = instanceOf(Location);
	var route = object;

	module.exports = {
	  falsy: falsy,
	  component: component,
	  components: components,
	  history: history,
	  location: location,
	  route: route
	};

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var React = __webpack_require__(1);
	var warning = __webpack_require__(12);
	var invariant = __webpack_require__(2);
	var assign = __webpack_require__(4);

	function getComponentName(component) {
	  return component.displayName || component.name;
	}

	function checkPropTypes(componentName, propTypes, props) {
	  componentName = componentName || 'UnknownComponent';

	  for (var propName in propTypes) {
	    if (propTypes.hasOwnProperty(propName)) {
	      var error = propTypes[propName](props, propName, componentName);

	      if (error instanceof Error) warning(false, error.message);
	    }
	  }
	}

	function createRouteFromReactElement(element) {
	  var type = element.type;
	  var route = assign({}, type.defaultProps, element.props);

	  if (type.propTypes) checkPropTypes(getComponentName(type), type.propTypes, route);

	  if (route.handler) {
	    warning(false, '<%s handler> is deprecated, use <%s component> instead', getComponentName(type), getComponentName(type));

	    route.component = route.handler;
	    delete route.handler;
	  }

	  // Unless otherwise specified, a route's path defaults to its name.
	  if (route.name && route.path == null) route.path = route.name;

	  if (route.children) {
	    route.childRoutes = createRoutesFromReactChildren(route.children);
	    delete route.children;
	  }

	  return route;
	}

	/**
	 * Creates and returns a routes object from the given ReactChildren. JSX
	 * provides a convenient way to visualize how routes in the hierarchy are
	 * nested.
	 *
	 *   var { Route, DefaultRoute, CatchAllRoute } = require('react-router');
	 *   
	 *   var routes = createRoutesFromReactChildren(
	 *     <Route handler={App}>
	 *       <Route name="home" handler={Dashboard}/>
	 *       <Route name="news" handler={NewsFeed}/>
	 *     </Route>
	 *   );
	 *
	 * This method is automatically used when you provide a ReactChildren
	 * object to createRouter.
	 *
	 *   var Router = createRouter(
	 *     <Route .../>
	 *   );
	 *
	 *   React.render(<Router/>, ...);
	 */
	function createRoutesFromReactChildren(children) {
	  var routes = [];

	  React.Children.forEach(children, function (element) {
	    if (!React.isValidElement(element)) return;

	    routes.push(createRouteFromReactElement(element));
	  });

	  return routes;
	}

	module.exports = createRoutesFromReactChildren;

/***/ },
/* 11 */
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
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2014-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule warning
	 */

	'use strict';

	/**
	 * Similar to invariant but only logs a warning if the condition is not met.
	 * This can be used to log issues in development environments in critical
	 * paths. Removing the logging code for production environments will keep the
	 * same logic and follow the same code paths.
	 */

	var __DEV__ = ("production") !== 'production';

	var warning = function() {};

	if (__DEV__) {
	  warning = function(condition, format, args) {
	    var len = arguments.length;
	    args = new Array(len > 2 ? len - 2 : 0);
	    for (var key = 2; key < len; key++) {
	      args[key - 2] = arguments[key];
	    }
	    if (format === undefined) {
	      throw new Error(
	        '`warning(condition, format, ...args)` requires a warning ' +
	        'message argument'
	      );
	    }

	    if (format.length < 10 || (/^[s\W]*$/).test(format)) {
	      throw new Error(
	        'The warning format should be able to uniquely identify this ' +
	        'warning. Please, use a more descriptive format than: ' + format
	      );
	    }

	    if (!condition) {
	      var argIndex = 0;
	      var message = 'Warning: ' +
	        format.replace(/%s/g, function() {
	          args[argIndex++];
	        });
	      if (typeof console !== 'undefined') {
	        console.error(message);
	      }
	      try {
	        // --- Welcome to debugging React ---
	        // This error was thrown as a convenience so that you can use this stack
	        // to find the callsite that caused this warning to fire.
	        throw new Error(message);
	      } catch(x) {}
	    }
	  };
	}

	module.exports = warning;


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

	var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var React = __webpack_require__(1);
	var _React$PropTypes = React.PropTypes;
	var object = _React$PropTypes.object;
	var string = _React$PropTypes.string;
	var func = _React$PropTypes.func;
	var oneOfType = _React$PropTypes.oneOfType;

	var assign = __webpack_require__(4);

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

	var Link = (function (_React$Component) {
	  function Link(props) {
	    _classCallCheck(this, Link);

	    _get(Object.getPrototypeOf(Link.prototype), 'constructor', this).call(this, props);
	    this.handleClick = this.handleClick.bind(this);
	  }

	  _inherits(Link, _React$Component);

	  _createClass(Link, [{
	    key: 'handleClick',
	    value: function handleClick(event) {
	      var allowTransition = true;
	      var clickResult;

	      if (this.props.onClick) clickResult = this.props.onClick(event);

	      if (isModifiedEvent(event) || !isLeftClickEvent(event)) {
	        return;
	      }if (clickResult === false || event.defaultPrevented === true) allowTransition = false;

	      event.preventDefault();

	      if (allowTransition) this.context.router.transitionTo(this.props.to, this.props.params, this.props.query);
	    }
	  }, {
	    key: 'getHref',
	    value: function getHref() {
	      return this.context.router.makeHref(this.props.to, this.props.params, this.props.query);
	    }
	  }, {
	    key: 'isActive',
	    value: function isActive() {
	      return this.context.router.isActive(this.props.to, this.props.params, this.props.query);
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var props = assign({}, this.props, {
	        href: this.getHref(),
	        onClick: this.handleClick
	      });

	      if (this.isActive()) {
	        if (props.activeClassName) props.className += ' ' + props.activeClassName;

	        if (props.activeStyle) assign(props.style, props.activeStyle);
	      }

	      return React.DOM.a(props, this.props.children);
	    }
	  }], [{
	    key: 'contextTypes',
	    value: {
	      router: object.isRequired
	    },
	    enumerable: true
	  }, {
	    key: 'propTypes',
	    value: {
	      activeStyle: object,
	      activeClassName: string,
	      to: oneOfType([string, object]).isRequired,
	      params: object,
	      query: object,
	      onClick: func
	    },
	    enumerable: true
	  }, {
	    key: 'defaultProps',
	    value: {
	      className: '',
	      activeClassName: 'active'
	    },
	    enumerable: true
	  }]);

	  return Link;
	})(React.Component);

	module.exports = Link;

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var object = __webpack_require__(1).PropTypes.object;

	/**
	 * A mixin for components that modify the URL.
	 *
	 * Example:
	 *
	 *   var { Navigation } = require('react-router');
	 *   var MyLink = React.createClass({
	 *     mixins: [ Navigation ],
	 *     handleClick(event) {
	 *       event.preventDefault();
	 *       this.transitionTo('aRoute', { the: 'params' }, { the: 'query' });
	 *     },
	 *     render() {
	 *       return (
	 *         <a onClick={this.handleClick}>Click me!</a>
	 *       );
	 *     }
	 *   });
	 */
	var Navigation = {

	  contextTypes: {
	    router: object.isRequired
	  }

	};

	var RouterNavigationMethods = ['makePath', 'makeHref', 'transitionTo', 'replaceWith', 'go', 'goBack', 'goForward', 'canGo', 'canGoBack', 'canGoForward'];

	RouterNavigationMethods.forEach(function (method) {
	  Navigation[method] = function () {
	    var router = this.context.router;
	    return router[method].apply(router, arguments);
	  };
	});

	module.exports = Navigation;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var invariant = __webpack_require__(2);

	var _require = __webpack_require__(3);

	var isAbsolutePath = _require.isAbsolutePath;
	var withQuery = _require.withQuery;
	var injectParams = _require.injectParams;
	var stripLeadingSlashes = _require.stripLeadingSlashes;
	var stripTrailingSlashes = _require.stripTrailingSlashes;

	function searchRoutesSync(routes, test) {
	  var route, branch;
	  for (var i = 0, len = routes.length; i < len; ++i) {
	    route = routes[i];

	    if (test(route)) {
	      return [route];
	    }if (route.childRoutes && (branch = searchRoutesSync(route.childRoutes, test))) {
	      branch.unshift(route);
	      return branch;
	    }
	  }

	  return null;
	}

	function getBranchToRoute(routes, route) {
	  return searchRoutesSync(routes, function (r) {
	    return r === route;
	  });
	}

	function getBranchToRouteWithName(routes, name) {
	  return searchRoutesSync(routes, function (route) {
	    return route.name === name;
	  });
	}

	function makePatternFromBranch(branch) {
	  return branch.reduce(function (pattern, route) {
	    return stripTrailingSlashes(pattern) + '/' + stripLeadingSlashes(route.path);
	  }, '');
	}

	var NavigationMixin = {

	  /**
	   * Returns an absolute URL path created from the given route
	   * name, URL parameters, and query.
	   */
	  makePath: function makePath(to, params, query) {
	    var pattern;
	    if (isAbsolutePath(to)) {
	      pattern = to;
	    } else {
	      var routes = this.getRoutes();
	      var branch = typeof to === 'string' ? getBranchToRouteWithName(routes, to) : getBranchToRoute(routes, to);

	      invariant(branch, 'Cannot find route "%s"', to);

	      pattern = makePatternFromBranch(branch);
	    }

	    return withQuery(injectParams(pattern, params), query);
	  },

	  /**
	   * Returns a string that may safely be used as the href of a link
	   * to the route with the given name, URL parameters, and query.
	   */
	  makeHref: function makeHref(to, params, query) {
	    var path = this.makePath(to, params, query);
	    var history = this.getHistory();

	    if (history) {
	      return history.makeHref(path);
	    }return path;
	  },

	  /**
	   * Transitions to the URL specified in the arguments by pushing
	   * a new URL onto the history stack.
	   */
	  transitionTo: function transitionTo(to, params, query) {
	    var history = this.getHistory();

	    invariant(history, 'transitionTo() needs history');

	    var path = this.makePath(to, params, query);

	    if (this.nextLocation) {
	      this.cancelTransition();

	      // Replace so pending location does not stay in history.
	      history.replace(path);
	    } else {
	      history.push(path);
	    }
	  },

	  /**
	   * Transitions to the URL specified in the arguments by replacing
	   * the current URL in the history stack.
	   */
	  replaceWith: function replaceWith(to, params, query) {
	    var history = this.getHistory();

	    invariant(history, 'replaceWith() needs history');

	    if (this.nextLocation) this.cancelTransition();

	    history.replace(this.makePath(to, params, query));
	  },

	  go: function go(n) {
	    var history = this.getHistory();

	    invariant(history, 'go() needs history');

	    if (this.nextLocation) this.cancelTransition();

	    history.go(n);
	  },

	  goBack: function goBack() {
	    this.go(-1);
	  },

	  goForward: function goForward() {
	    this.go(1);
	  },

	  canGo: function canGo(n) {
	    var history = this.getHistory();

	    invariant(history, 'canGo() needs history');

	    return history.canGo(n);
	  },

	  canGoBack: function canGoBack() {
	    return this.canGo(-1);
	  },

	  canGoForward: function canGoForward() {
	    return this.canGo(1);
	  }

	};

	module.exports = NavigationMixin;

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var React = __webpack_require__(1);
	var invariant = __webpack_require__(2);
	var _React$PropTypes = React.PropTypes;
	var string = _React$PropTypes.string;
	var bool = _React$PropTypes.bool;
	var func = _React$PropTypes.func;

	var _require = __webpack_require__(9);

	var component = _require.component;
	var components = _require.components;

	/**
	 * A <Route> is used to declare which components are rendered to the page when
	 * the URL matches a given pattern.
	 *
	 * Routes are arranged in a nested tree structure. When a new URL is requested,
	 * the tree is searched depth-first to find a route whose path matches the URL.
	 * When one is found, all routes in the tree that lead to it are considered
	 * "active" and their components are rendered into the DOM, nested in the same
	 * order as they are in the tree.
	 */

	var Route = (function (_React$Component) {
	  function Route() {
	    _classCallCheck(this, Route);

	    if (_React$Component != null) {
	      _React$Component.apply(this, arguments);
	    }
	  }

	  _inherits(Route, _React$Component);

	  _createClass(Route, [{
	    key: 'render',
	    value: function render() {
	      invariant(false, '<%s> elements are for router configuration only and should not be rendered', this.constructor.name);
	    }
	  }], [{
	    key: 'propTypes',
	    value: {
	      name: string,
	      path: string,
	      ignoreScrollBehavior: bool,
	      component: component,
	      components: components,
	      getComponents: func
	    },
	    enumerable: true
	  }]);

	  return Route;
	})(React.Component);

	module.exports = Route;

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var object = __webpack_require__(1).PropTypes.object;

	/**
	 * A mixin for components that need to know the path, routes, URL
	 * params and query that are currently active.
	 *
	 * Example:
	 *
	 *   var { State } = require('react-router');
	 *   var AboutLink = React.createClass({
	 *     mixins: [ State ],
	 *     render() {
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
	    router: object.isRequired
	  }

	};

	var RouterStateMethods = ['getLocation', 'getPath', 'getPathname', 'getQuery', 'getParams', 'getRoutes', 'getComponents', 'isActive'];

	RouterStateMethods.forEach(function (method) {
	  State[method] = function () {
	    var router = this.context.router;
	    return router[method].apply(router, arguments);
	  };
	});

	module.exports = State;

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _require = __webpack_require__(3);

	var isAbsolutePath = _require.isAbsolutePath;

	function routeIsActive(activeRoutes, route) {
	  if (typeof route === 'object') {
	    return activeRoutes.indexOf(route) !== -1;
	  }return activeRoutes.some(function (r) {
	    return r.name === route;
	  });
	}

	function paramsAreActive(activeParams, params) {
	  for (var property in params) if (String(activeParams[property]) !== String(params[property])) {
	    return false;
	  }return true;
	}

	function queryIsActive(activeQuery, query) {
	  if (activeQuery == null) {
	    return false;
	  }for (var property in query) if (String(activeQuery[property]) !== String(query[property])) {
	    return false;
	  }return true;
	}

	var StateMixin = {

	  getLocation: function getLocation() {
	    return this.state.location;
	  },

	  getPath: function getPath() {
	    return this.getLocation().path;
	  },

	  getPathname: function getPathname() {
	    return this.getLocation().getPathname();
	  },

	  getQueryString: function getQueryString() {
	    return this.getLocation().getQueryString();
	  },

	  getQuery: function getQuery() {
	    return this.getLocation().getQuery();
	  },

	  getBranch: function getBranch() {
	    return this.state.branch;
	  },

	  getParams: function getParams() {
	    return this.state.params;
	  },

	  getComponents: function getComponents() {
	    return this.state.components;
	  },

	  isActive: function isActive(to, params, query) {
	    if (!this.getLocation()) {
	      return false;
	    }if (isAbsolutePath(to)) {
	      return to === this.getPath();
	    }return routeIsActive(this.getBranch(), to) && paramsAreActive(this.getParams(), params) && (query == null || queryIsActive(this.getQuery(), query));
	  }

	};

	module.exports = StateMixin;

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var object = __webpack_require__(1).PropTypes.object;

	/**
	 * A mixin for components that need to observe transitions.
	 *
	 * Example:
	 *
	 *   var { Transition } = require('react-router');
	 *   
	 *   var MyComponent = React.createClass({
	 *     mixins: [ Transition ],
	 *     transitionHook(router) {
	 *       if (this.refs.textInput.getValue() !== '' && prompt('Are you sure?'))
	 *         router.cancelTransition();
	 *     },
	 *     componentDidMount() {
	 *       this.addTransitionHook(this.transitionHook);
	 *     },
	 *     componentWillUnmount() {
	 *       this.removeTransitionHook(this.transitionHook);
	 *     },
	 *     render() {
	 *       return (
	 *         <div>
	 *           <input ref="textInput" type="text"/>
	 *         </div>
	 *       );
	 *     }
	 *   });
	 */
	var Transition = {

	  contextTypes: {
	    router: object.isRequired
	  }

	};

	var RouterTransitionMethods = ['cancelTransition', 'retryLastCancelledTransition', 'addTransitionHook', 'removeTransitionHook'];

	RouterTransitionMethods.forEach(function (method) {
	  Transition[method] = function () {
	    var router = this.context.router;
	    return router[method].apply(router, arguments);
	  };
	});

	module.exports = Transition;

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var warning = __webpack_require__(12);

	var _require = __webpack_require__(3);

	var getParamNames = _require.getParamNames;

	function forEachComponent(components, callback) {
	  if (typeof components === 'object') {
	    for (var key in components) if (components.hasOwnProperty(key)) callback(components[key]);
	  } else if (components) {
	    callback(components);
	  }
	}

	/**
	 * Returns true if the params a route cares about changed in
	 * the transition from prevState to nextState, false otherwise.
	 */
	function routeParamsChanged(route, prevState, nextState) {
	  if (!route.path) {
	    return false;
	  }var paramNames = getParamNames(route.path);

	  return paramNames.some(function (paramName) {
	    return prevState.params[paramName] !== nextState.params[paramName];
	  });
	}

	function getRouteAndComponentTransitionHooks(router, prevState, nextState) {
	  var fromRoutes = prevState.branch;
	  var toRoutes = nextState.branch;
	  var hooks = [];

	  if (fromRoutes) {
	    var leavingRoutes;

	    (function () {
	      var isLeavingRoute = function (route) {
	        return toRoutes.indexOf(route) === -1 || routeParamsChanged(route, prevState, nextState);
	      };

	      var isEnteringRoute = function (route) {
	        return fromRoutes.indexOf(route) === -1 || leavingRoutes.indexOf(route) !== -1;
	      };

	      leavingRoutes = [];

	      fromRoutes.forEach(function (route, index) {
	        if (isLeavingRoute(route)) {
	          leavingRoutes.push(route);

	          forEachComponent(prevState.components[index], function (component) {
	            if (component.routerWillLeave) hooks.push(component.routerWillLeave.bind(component, router, nextState, route));
	          });

	          if (route.onLeave) hooks.push(route.onLeave.bind(route, router, nextState));
	        }
	      });

	      // Call "leave" hooks starting at the leaf route.
	      hooks.reverse();

	      toRoutes.forEach(function (route, index) {
	        if (isEnteringRoute(route)) {
	          if (route.onEnter) hooks.push(route.onEnter.bind(route, router, nextState));

	          forEachComponent(nextState.components[index], function (component) {
	            if (component.routerWillEnter) hooks.push(component.routerWillEnter.bind(component, router, nextState, route));
	          });
	        }
	      });
	    })();
	  } else {
	    toRoutes.forEach(function (route, index) {
	      if (route.onEnter) hooks.push(route.onEnter.bind(route, router, nextState));

	      forEachComponent(nextState.components[index], function (component) {
	        if (component.routerWillEnter) hooks.push(component.routerWillEnter.bind(component, router, nextState, route));
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
	  _runTransitionHooks: function _runTransitionHooks(nextState) {
	    var hooks = [];

	    if (this._transitionHooks) {
	      this._transitionHooks.forEach(function (hook) {
	        hooks.push(hook.bind(this, this, nextState));
	      }, this);
	    }

	    hooks.push.apply(hooks, getRouteAndComponentTransitionHooks(this, this.state, nextState));

	    var nextLocation = this.nextLocation;

	    try {
	      for (var i = 0, len = hooks.length; i < len; ++i) {
	        hooks[i]();

	        if (this.nextLocation !== nextLocation) break; // No need to proceed further.
	      }
	    } catch (error) {
	      this.handleError(error);
	      return false;
	    }

	    // Allow the transition if nextLocation hasn't changed.
	    return this.nextLocation === nextLocation;
	  },

	  cancelTransition: function cancelTransition() {
	    warning(this.nextLocation, 'cancelTransition: No transition is in progress');

	    this.cancelledLocation = this.nextLocation;
	    this.nextLocation = null;
	  },

	  retryLastCancelledTransition: function retryLastCancelledTransition() {
	    warning(this.cancelledLocation, 'retryTransition: There is no cancelled transition to retry');

	    if (this.cancelledLocation) {
	      var location = this.cancelledLocation;
	      this.cancelledLocation = null;
	      this._updateLocation(location);
	    }
	  },

	  addTransitionHook: function addTransitionHook(hook) {
	    if (!this._transitionHooks) {
	      this._transitionHooks = [hook];
	    } else {
	      this._transitionHooks.push(hook);
	    }
	  },

	  removeTransitionHook: function removeTransitionHook(hook) {
	    if (this._transitionHooks) {
	      this._transitionHooks = this._transitionHooks.filter(function (h) {
	        return h !== hook;
	      });
	    }
	  }

	};

	module.exports = TransitionMixin;

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var NavigationTypes = __webpack_require__(8);

	/**
	 * A scroll behavior that attempts to imitate the default behavior
	 * of modern browsers.
	 */
	var ImitateBrowserBehavior = {

	  updateScrollPosition: function updateScrollPosition(position, navigationType) {
	    switch (navigationType) {
	      case NavigationTypes.PUSH:
	      case NavigationTypes.REPLACE:
	        window.scrollTo(0, 0);
	        break;
	      case NavigationTypes.POP:
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
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A scroll behavior that always scrolls to the top of the page
	 * after a transition.
	 */
	"use strict";

	var ScrollToTopBehavior = {

	  updateScrollPosition: function updateScrollPosition() {
	    window.scrollTo(0, 0);
	  }

	};

	module.exports = ScrollToTopBehavior;

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

	var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var React = __webpack_require__(1);
	var assign = __webpack_require__(4);
	var invariant = __webpack_require__(2);
	var _React$PropTypes = React.PropTypes;
	var func = _React$PropTypes.func;
	var object = _React$PropTypes.object;
	var string = _React$PropTypes.string;
	var oneOfType = _React$PropTypes.oneOfType;
	var arrayOf = _React$PropTypes.arrayOf;

	var _require = __webpack_require__(9);

	var components = _require.components;
	var history = _require.history;
	var location = _require.location;
	var route = _require.route;

	var isReactChildren = __webpack_require__(25);
	var createRoutesFromReactChildren = __webpack_require__(10);

	var _require2 = __webpack_require__(7);

	var mapAsync = _require2.mapAsync;

	var NavigationMixin = __webpack_require__(15);
	var TransitionMixin = __webpack_require__(20);
	var StateMixin = __webpack_require__(18);
	var findMatch = __webpack_require__(24);
	var Location = __webpack_require__(5);
	var AbstractHistory = __webpack_require__(6);

	function createElement(component, props) {
	  return typeof component === 'function' ? React.createElement(component, props) : null;
	}

	function getComponents(route, callback) {
	  if (route.component || route.components) {
	    callback(null, route.component || route.components);
	  } else if (route.getComponents) {
	    route.getComponents(callback);
	  } else {
	    callback();
	  }
	}

	function getComponentsForBranch(branch, callback) {
	  mapAsync(branch, function (route, index, callback) {
	    getComponents(route, function (error, components) {
	      if (error) {
	        callback(error);
	      } else {
	        invariant(!Array.isArray(components), 'Components must not be an array');

	        callback(null, components);
	      }
	    });
	  }, callback);
	}

	function checkProps(props) {
	  var history = props.history;
	  var location = props.location;
	  var branch = props.branch;
	  var params = props.params;
	  var components = props.components;

	  if (history) {
	    invariant(!(location || branch || params || components), 'A <Router> must not have location, branch, params, or components props when it has a history prop');
	  } else {
	    invariant(location && branch && params && components, 'A <Router> must have location, branch, params, and components props when it does not have a history prop');
	  }
	}

	/**
	 * Creates and returns a new Router component that uses the given routes to
	 * determine what to render to the page.
	 *
	 * In a client-side environment you simply pass a History object to the Router
	 * as a prop. A History acts like a store for Location objects and emits new
	 * ones as the location changes over time (i.e. a user navigates around your
	 * site). History objects are included for all the most common scenarios in
	 * which the router may be used.
	 *
	 *   var { createRouter } = require('react-router');
	 *   var Router = createRouter(routes);
	 *
	 *   var BrowserHistory = require('react-router/BrowserHistory');
	 *   React.render(<Router history={BrowserHistory}/>, document.body);
	 *
	 * In a server-side environment you should use the router component's static
	 * `match` method to determine the props you need to pass to the router.
	 *
	 *   app.get('*', function (req, res) {
	 *     Router.match(req.url, function (error, props) {
	 *       res.send(
	 *         React.renderToString(React.createElement(Router, props))
	 *       );
	 *     });
	 *   });
	 */
	function createRouter(routes) {
	  invariant(routes != null, 'A router needs some routes');

	  if (isReactChildren(routes)) {
	    // Allow users to specify routes as JSX.
	    routes = createRoutesFromReactChildren(routes);
	  } else if (!Array.isArray(routes)) {
	    routes = [routes];
	  }

	  var Router = (function (_React$Component) {
	    function Router(props) {
	      _classCallCheck(this, Router);

	      _get(Object.getPrototypeOf(Router.prototype), 'constructor', this).call(this, props);
	      this._updateLocation = this._updateLocation.bind(this);
	      this.nextLocation = null;
	      this.state = {
	        location: props.location,
	        branch: props.branch,
	        params: props.params,
	        components: props.components
	      };
	    }

	    _inherits(Router, _React$Component);

	    _createClass(Router, [{
	      key: '_updateLocation',
	      value: function _updateLocation(location) {
	        var _this = this;

	        this.nextLocation = location;

	        Router.match(location, function (error, state) {
	          if (error) {
	            _this.handleError(error);
	            return;
	          }

	          if (_this.nextLocation !== location) return; // Another transition interrupted this one.

	          if (state && _this._runTransitionHooks(state)) _this.setState(state);

	          _this.nextLocation = null;
	        });
	      }
	    }, {
	      key: 'handleError',
	      value: function handleError(error) {
	        if (this.props.onError) {
	          this.props.onError.call(this, error);
	        } else {
	          // Throw errors so we don't silently swallow them.
	          throw error; // This error probably originated in getChildRoutes or getComponents.
	        }
	      }
	    }, {
	      key: 'getHistory',
	      value: function getHistory() {
	        return this.getHistoryProp() || AbstractHistory.getSingleton();
	      }
	    }, {
	      key: 'getHistoryProp',
	      value: function getHistoryProp() {
	        var history = this.props.history;

	        if (history == null) {
	          return null;
	        }return history.fallback || history;
	      }
	    }, {
	      key: 'getRoutes',
	      value: function getRoutes() {
	        return routes;
	      }
	    }, {
	      key: 'componentWillMount',
	      value: function componentWillMount() {
	        checkProps(this.props);

	        var history = this.getHistoryProp();

	        if (history) {
	          history.addChangeListener(this._updateLocation);
	          this._updateLocation(history.getLocation());
	        }
	      }
	    }, {
	      key: 'componentWillReceiveProps',
	      value: function componentWillReceiveProps(nextProps) {
	        checkProps(nextProps);

	        if (!nextProps.history) this.setState(nextProps);
	      }
	    }, {
	      key: 'componentDidUpdate',
	      value: function componentDidUpdate() {
	        if (this.props.onUpdate) this.props.onUpdate.call(this);
	      }
	    }, {
	      key: 'componentWillUnmount',
	      value: function componentWillUnmount() {
	        var history = this.getHistoryProp();

	        if (history) history.removeChangeListener(this._updateLocation);
	      }
	    }, {
	      key: 'getChildContext',
	      value: function getChildContext() {
	        return {
	          router: this
	        };
	      }
	    }, {
	      key: 'render',
	      value: function render() {
	        var children = null;
	        var _state = this.state;
	        var location = _state.location;
	        var branch = _state.branch;
	        var params = _state.params;
	        var components = _state.components;

	        if (components) {
	          children = components.reduceRight(function (children, components, index) {
	            if (components == null) return children; // Don't create new children; use the grandchildren.

	            var route = branch[index];
	            var props = { location: location, params: params, route: route };

	            if (React.isValidElement(children)) {
	              props.children = children;
	            } else if (children) {
	              // In render, use children like:
	              // var { header, sidebar } = this.props;
	              assign(props, children);
	            }

	            if (typeof components === 'object') {
	              var elements = {};

	              for (var key in components) if (components.hasOwnProperty(key)) elements[key] = createElement(components[key], assign({}, props));

	              return elements;
	            }

	            return createElement(components, props);
	          }, children);
	        }

	        invariant(React.isValidElement(children), 'Your top-most route must render a single component');

	        return children;
	      }
	    }], [{
	      key: 'match',

	      /**
	       * Matches the given location on this router's routes, fetches their
	       * components, and calls callback(error, state) when finished. This
	       * is the main router interface.
	       */
	      value: function match(location, callback) {
	        if (!(location instanceof Location)) {
	          if (typeof location === 'string') {
	            location = new Location(location);
	          } else if (location && location.path) {
	            location = new Location(location.path, location.navigationType);
	          }
	        }

	        invariant(location instanceof Location, 'Router.match needs a Location');

	        findMatch(routes, location.path, function (error, state) {
	          if (error || state == null) {
	            callback(error, state);
	          } else {
	            state.location = location;

	            getComponentsForBranch(state.branch, function (error, components) {
	              if (error) {
	                callback(error);
	              } else {
	                state.components = components;
	                callback(null, state);
	              }
	            });
	          }
	        });
	      }
	    }, {
	      key: 'propTypes',
	      value: {
	        onError: func,
	        onUpdate: func,

	        // We either need a history...
	        history: history,

	        // OR ALL of these...
	        location: oneOfType([string, location]),
	        branch: arrayOf(route),
	        params: object,
	        components: arrayOf(components)
	      },
	      enumerable: true
	    }, {
	      key: 'childContextTypes',
	      value: {
	        router: object.isRequired
	      },
	      enumerable: true
	    }]);

	    return Router;
	  })(React.Component);

	  assign(Router.prototype, NavigationMixin, StateMixin, TransitionMixin);

	  return Router;
	}

	module.exports = createRouter;

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _require = __webpack_require__(3);

	var getPathname = _require.getPathname;
	var compilePattern = _require.compilePattern;
	var stripLeadingSlashes = _require.stripLeadingSlashes;

	var _require2 = __webpack_require__(7);

	var loopAsync = _require2.loopAsync;

	function getChildRoutes(route, callback) {
	  if (route.childRoutes) {
	    callback(null, route.childRoutes);
	  } else if (route.getChildRoutes) {
	    route.getChildRoutes(callback);
	  } else {
	    callback();
	  }
	}

	function assignParams(params, paramNames, paramValues) {
	  return paramNames.reduceRight(function (params, paramName, index) {
	    var paramValue = paramValues[index];

	    if (Array.isArray(params[paramName])) {
	      params[paramName].unshift(paramValue);
	    } else if (paramName in params) {
	      params[paramName] = [paramValue, params[paramName]];
	    } else {
	      params[paramName] = paramValue;
	    }

	    return params;
	  }, params);
	}

	function createParams(paramNames, paramValues) {
	  return assignParams({}, paramNames, paramValues);
	}

	function matchPattern(pattern, pathname) {
	  var _compilePattern = compilePattern(stripLeadingSlashes(pattern));

	  var escapedSource = _compilePattern.escapedSource;
	  var paramNames = _compilePattern.paramNames;
	  var tokens = _compilePattern.tokens;

	  escapedSource += '/*'; // Ignore trailing slashes

	  var captureRemaining = tokens[tokens.length - 1] !== '*';

	  if (captureRemaining) escapedSource += '(.*?)';

	  var match = pathname.match(new RegExp('^' + escapedSource + '$', 'i'));

	  var remainingPathname, paramValues;
	  if (match != null) {
	    paramValues = Array.prototype.slice.call(match, 1);

	    if (captureRemaining) {
	      remainingPathname = paramValues.pop();
	    } else {
	      remainingPathname = pathname.replace(match[0], '');
	    }
	  }

	  return {
	    remainingPathname: remainingPathname,
	    paramNames: paramNames,
	    paramValues: paramValues
	  };
	}

	function matchRouteDeep(route, pathname, callback) {
	  var _matchPattern = matchPattern(route.path, pathname);

	  var remainingPathname = _matchPattern.remainingPathname;
	  var paramNames = _matchPattern.paramNames;
	  var paramValues = _matchPattern.paramValues;

	  if (remainingPathname === '') {
	    // This route matched the whole path!
	    callback(null, {
	      params: createParams(paramNames, paramValues),
	      branch: [route]
	    });
	  } else if (remainingPathname != null) {
	    // This route matched at least some of the path.
	    getChildRoutes(route, function (error, childRoutes) {
	      if (error) {
	        callback(error);
	      } else if (childRoutes) {
	        // Check the child routes to see if any of them match.
	        matchRoutes(childRoutes, remainingPathname, function (error, match) {
	          if (error) {
	            callback(error);
	          } else if (match) {
	            // A child route matched! Augment the match and pass it up the stack.
	            assignParams(match.params, paramNames, paramValues);
	            match.branch.unshift(route);
	            callback(null, match);
	          } else {
	            callback();
	          }
	        });
	      } else {
	        callback();
	      }
	    });
	  } else {
	    callback();
	  }
	}

	function matchRoutes(routes, pathname, callback) {
	  loopAsync(routes.length, function (index, next, done) {
	    matchRouteDeep(routes[index], pathname, function (error, match) {
	      if (error || match) {
	        done(error, match);
	      } else {
	        next();
	      }
	    });
	  }, callback);
	}

	/**
	 * Searches the given tree of routes for a branch that matches
	 * the given path and calls callback(error, match) with the
	 * result. The match object has the following properties:
	 *
	 * routes   An array of route objects that matched, in nested order
	 * params   An object of URL params (contained in the pathname)
	 *
	 * If no match can be made the callback argument is undefined.
	 */
	function findMatch(routes, path, callback) {
	  if (!Array.isArray(routes)) routes = [routes]; // Allow a single route

	  var pathname = stripLeadingSlashes(getPathname(path));

	  matchRoutes(routes, pathname, callback);
	}

	module.exports = findMatch;

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var React = __webpack_require__(1);

	function isValidChild(object) {
	  return object == null || React.isValidElement(object);
	}

	function isReactChildren(object) {
	  return isValidChild(object) || Array.isArray(object) && object.every(isValidChild);
	}

	module.exports = isReactChildren;

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

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
	 */

	"use strict";

	/**
	 * Constructs an enumeration with keys equal to their value.
	 *
	 * For example:
	 *
	 *   var COLORS = keyMirror({blue: null, red: null});
	 *   var myColor = COLORS.blue;
	 *   var isColorValid = !!COLORS[myColor];
	 *
	 * The last line could not be performed if the values of the generated enum were
	 * not equal to their keys.
	 *
	 *   Input:  {key1: val1, key2: val2}
	 *   Output: {key1: key1, key2: key2}
	 *
	 * @param {object} obj
	 * @return {object}
	 */
	var keyMirror = function(obj) {
	  var ret = {};
	  var key;
	  if (!(obj instanceof Object && !Array.isArray(obj))) {
	    throw new Error('keyMirror(...): Argument must be an object.');
	  }
	  for (key in obj) {
	    if (!obj.hasOwnProperty(key)) {
	      continue;
	    }
	    ret[key] = key;
	  }
	  return ret;
	};

	module.exports = keyMirror;


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(28);


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	// Load modules

	var Stringify = __webpack_require__(30);
	var Parse = __webpack_require__(29);


	// Declare internals

	var internals = {};


	module.exports = {
	    stringify: Stringify,
	    parse: Parse
	};


/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	// Load modules

	var Utils = __webpack_require__(11);


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

	            if (Object.prototype.hasOwnProperty(key)) {
	                continue;
	            }

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


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	// Load modules

	var Utils = __webpack_require__(11);


	// Declare internals

	var internals = {
	    delimiter: '&',
	    arrayPrefixGenerators: {
	        brackets: function (prefix, key) {
	            return prefix + '[]';
	        },
	        indices: function (prefix, key) {
	            return prefix + '[' + key + ']';
	        },
	        repeat: function (prefix, key) {
	            return prefix;
	        }
	    }
	};


	internals.stringify = function (obj, prefix, generateArrayPrefix) {

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
	        if (Array.isArray(obj)) {
	            values = values.concat(internals.stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix));
	        }
	        else {
	            values = values.concat(internals.stringify(obj[key], prefix + '[' + key + ']', generateArrayPrefix));
	        }
	    }

	    return values;
	};


	module.exports = function (obj, options) {

	    options = options || {};
	    var delimiter = typeof options.delimiter === 'undefined' ? internals.delimiter : options.delimiter;

	    var keys = [];

	    if (typeof obj !== 'object' ||
	        obj === null) {

	        return '';
	    }

	    var arrayFormat;
	    if (options.arrayFormat in internals.arrayPrefixGenerators) {
	        arrayFormat = options.arrayFormat;
	    }
	    else if ('indices' in options) {
	        arrayFormat = options.indices ? 'indices' : 'repeat';
	    }
	    else {
	        arrayFormat = 'indices';
	    }

	    var generateArrayPrefix = internals.arrayPrefixGenerators[arrayFormat];

	    var objKeys = Object.keys(obj);
	    for (var i = 0, il = objKeys.length; i < il; ++i) {
	        var key = objKeys[i];
	        keys = keys.concat(internals.stringify(obj[key], key, generateArrayPrefix));
	    }

	    return keys.join(delimiter);
	};


/***/ }
/******/ ])
});
