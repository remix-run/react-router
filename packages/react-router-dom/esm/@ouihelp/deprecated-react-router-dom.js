import _inheritsLoose from "@babel/runtime/helpers/esm/inheritsLoose";
import React from "react";
import { Router, __RouterContext, Route } from "react-router";
export * from "react-router";
import {
  createBrowserHistory,
  createHashHistory,
  createLocation
} from "history";
import PropTypes from "prop-types";
import warning from "tiny-warning";
import _extends from "@babel/runtime/helpers/esm/extends";
import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/esm/objectWithoutPropertiesLoose";
import invariant from "tiny-invariant";

/**
 * The public API for a <Router> that uses HTML5 history.
 */

var BrowserRouter =
  /*#__PURE__*/
  (function(_React$Component) {
    _inheritsLoose(BrowserRouter, _React$Component);

    function BrowserRouter() {
      var _this;

      for (
        var _len = arguments.length, args = new Array(_len), _key = 0;
        _key < _len;
        _key++
      ) {
        args[_key] = arguments[_key];
      }

      _this =
        _React$Component.call.apply(_React$Component, [this].concat(args)) ||
        this;
      _this.history = createBrowserHistory(_this.props);
      return _this;
    }

    var _proto = BrowserRouter.prototype;

    _proto.render = function render() {
      return React.createElement(Router, {
        history: this.history,
        children: this.props.children
      });
    };

    return BrowserRouter;
  })(React.Component);

if (process.env.NODE_ENV !== "production") {
  BrowserRouter.propTypes = {
    basename: PropTypes.string,
    children: PropTypes.node,
    forceRefresh: PropTypes.bool,
    getUserConfirmation: PropTypes.func,
    keyLength: PropTypes.number
  };

  BrowserRouter.prototype.componentDidMount = function() {
    process.env.NODE_ENV !== "production"
      ? warning(
          !this.props.history,
          "<BrowserRouter> ignores the history prop. To use a custom history, " +
            "use `import { Router }` instead of `import { BrowserRouter as Router }`."
        )
      : void 0;
  };
}

/**
 * The public API for a <Router> that uses window.location.hash.
 */

var HashRouter =
  /*#__PURE__*/
  (function(_React$Component) {
    _inheritsLoose(HashRouter, _React$Component);

    function HashRouter() {
      var _this;

      for (
        var _len = arguments.length, args = new Array(_len), _key = 0;
        _key < _len;
        _key++
      ) {
        args[_key] = arguments[_key];
      }

      _this =
        _React$Component.call.apply(_React$Component, [this].concat(args)) ||
        this;
      _this.history = createHashHistory(_this.props);
      return _this;
    }

    var _proto = HashRouter.prototype;

    _proto.render = function render() {
      return React.createElement(Router, {
        history: this.history,
        children: this.props.children
      });
    };

    return HashRouter;
  })(React.Component);

if (process.env.NODE_ENV !== "production") {
  HashRouter.propTypes = {
    basename: PropTypes.string,
    children: PropTypes.node,
    getUserConfirmation: PropTypes.func,
    hashType: PropTypes.oneOf(["hashbang", "noslash", "slash"])
  };

  HashRouter.prototype.componentDidMount = function() {
    process.env.NODE_ENV !== "production"
      ? warning(
          !this.props.history,
          "<HashRouter> ignores the history prop. To use a custom history, " +
            "use `import { Router }` instead of `import { HashRouter as Router }`."
        )
      : void 0;
  };
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
/**
 * The public API for rendering a history-aware <a>.
 */

var Link =
  /*#__PURE__*/
  (function(_React$Component) {
    _inheritsLoose(Link, _React$Component);

    function Link() {
      return _React$Component.apply(this, arguments) || this;
    }

    var _proto = Link.prototype;

    _proto.handleClick = function handleClick(event, history) {
      if (this.props.onClick) this.props.onClick(event);

      if (
        !event.defaultPrevented && // onClick prevented default
        event.button === 0 && // ignore everything but left clicks
        (!this.props.target || this.props.target === "_self") && // let browser handle "target=_blank" etc.
        !isModifiedEvent(event) // ignore clicks with modifier keys
      ) {
        event.preventDefault();
        var method = this.props.replace ? history.replace : history.push;
        method(this.props.to);
      }
    };

    _proto.render = function render() {
      var _this = this;

      var _this$props = this.props,
        innerRef = _this$props.innerRef,
        replace = _this$props.replace,
        to = _this$props.to,
        rest = _objectWithoutPropertiesLoose(_this$props, [
          "innerRef",
          "replace",
          "to"
        ]); // eslint-disable-line no-unused-vars

      return React.createElement(__RouterContext.Consumer, null, function(
        context
      ) {
        !context
          ? process.env.NODE_ENV !== "production"
            ? invariant(false, "You should not use <Link> outside a <Router>")
            : invariant(false)
          : void 0;
        var location =
          typeof to === "string"
            ? createLocation(to, null, null, context.location)
            : to;
        var href = location ? context.history.createHref(location) : "";
        return React.createElement(
          "a",
          _extends({}, rest, {
            onClick: function onClick(event) {
              return _this.handleClick(event, context.history);
            },
            href: href,
            ref: innerRef
          })
        );
      });
    };

    return Link;
  })(React.Component);

if (process.env.NODE_ENV !== "production") {
  var toType = PropTypes.oneOfType([PropTypes.string, PropTypes.object]);
  var innerRefType = PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.shape({
      current: PropTypes.any
    })
  ]);
  Link.propTypes = {
    innerRef: innerRefType,
    onClick: PropTypes.func,
    replace: PropTypes.bool,
    target: PropTypes.string,
    to: toType.isRequired
  };
}

function joinClassnames() {
  for (
    var _len = arguments.length, classnames = new Array(_len), _key = 0;
    _key < _len;
    _key++
  ) {
    classnames[_key] = arguments[_key];
  }

  return classnames
    .filter(function(i) {
      return i;
    })
    .join(" ");
}
/**
 * A <Link> wrapper that knows if it's "active" or not.
 */

function NavLink(_ref) {
  var _ref$ariaCurrent = _ref["aria-current"],
    ariaCurrent = _ref$ariaCurrent === void 0 ? "page" : _ref$ariaCurrent,
    _ref$activeClassName = _ref.activeClassName,
    activeClassName =
      _ref$activeClassName === void 0 ? "active" : _ref$activeClassName,
    activeStyle = _ref.activeStyle,
    classNameProp = _ref.className,
    exact = _ref.exact,
    isActiveProp = _ref.isActive,
    location = _ref.location,
    strict = _ref.strict,
    styleProp = _ref.style,
    to = _ref.to,
    rest = _objectWithoutPropertiesLoose(_ref, [
      "aria-current",
      "activeClassName",
      "activeStyle",
      "className",
      "exact",
      "isActive",
      "location",
      "strict",
      "style",
      "to"
    ]);

  var path = typeof to === "object" ? to.pathname : to; // Regex taken from: https://github.com/pillarjs/path-to-regexp/blob/master/index.js#L202

  var escapedPath = path && path.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
  return React.createElement(Route, {
    path: escapedPath,
    exact: exact,
    strict: strict,
    location: location,
    children: function children(_ref2) {
      var location = _ref2.location,
        match = _ref2.match;
      var isActive = !!(isActiveProp ? isActiveProp(match, location) : match);
      var className = isActive
        ? joinClassnames(classNameProp, activeClassName)
        : classNameProp;
      var style = isActive ? _extends({}, styleProp, activeStyle) : styleProp;
      return React.createElement(
        Link,
        _extends(
          {
            "aria-current": (isActive && ariaCurrent) || null,
            className: className,
            style: style,
            to: to
          },
          rest
        )
      );
    }
  });
}

if (process.env.NODE_ENV !== "production") {
  var ariaCurrentType = PropTypes.oneOf([
    "page",
    "step",
    "location",
    "date",
    "time",
    "true"
  ]);
  NavLink.propTypes = _extends({}, Link.propTypes, {
    "aria-current": ariaCurrentType,
    activeClassName: PropTypes.string,
    activeStyle: PropTypes.object,
    className: PropTypes.string,
    exact: Route.propTypes.exact,
    isActive: PropTypes.func,
    location: PropTypes.object,
    strict: Route.propTypes.strict,
    style: PropTypes.object
  });
}

export { BrowserRouter, HashRouter, Link, NavLink };
