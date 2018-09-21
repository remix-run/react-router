import React from "react";
import PropTypes from "prop-types";
import { createLocation, createPath } from "history";
import invariant from "invariant";
import warning from "warning";

import Router from "./Router";

const addLeadingSlash = path => {
  return path.charAt(0) === "/" ? path : "/" + path;
};

const addBasename = (basename, location) => {
  if (!basename) return location;

  return {
    ...location,
    pathname: addLeadingSlash(basename) + location.pathname
  };
};

const stripBasename = (basename, location) => {
  if (!basename) return location;

  const base = addLeadingSlash(basename);

  if (location.pathname.indexOf(base) !== 0) return location;

  return {
    ...location,
    pathname: location.pathname.substr(base.length)
  };
};

const createURL = location =>
  typeof location === "string" ? location : createPath(location);

const staticHandler = methodName => () => {
  invariant(false, "You cannot %s with <StaticRouter>", methodName);
};

const noop = () => {};

/**
 * The public top-level API for a "static" <Router>, so-called because it
 * can't actually change the current location. Instead, it just records
 * location changes in a context object. Useful mainly in testing and
 * server-rendering scenarios.
 */
class StaticRouter extends React.Component {
  static defaultProps = {
    basename: "",
    location: "/"
  };

  createHref = path => addLeadingSlash(this.props.basename + createURL(path));

  handlePush = location => {
    const { basename, context } = this.props;
    context.action = "PUSH";
    context.location = addBasename(basename, createLocation(location));
    context.url = createURL(context.location);
  };

  handleReplace = location => {
    const { basename, context } = this.props;
    context.action = "REPLACE";
    context.location = addBasename(basename, createLocation(location));
    context.url = createURL(context.location);
  };

  handleListen = () => noop;

  handleBlock = () => noop;

  render() {
    const { basename, context, location, ...props } = this.props;

    const history = {
      createHref: this.createHref,
      action: "POP",
      location: stripBasename(basename, createLocation(location)),
      push: this.handlePush,
      replace: this.handleReplace,
      go: staticHandler("go"),
      goBack: staticHandler("goBack"),
      goForward: staticHandler("goForward"),
      listen: this.handleListen,
      block: this.handleBlock
    };

    return (
      <Router {...props} history={history} staticContext={this.props.context} />
    );
  }
}

if (__DEV__) {
  StaticRouter.propTypes = {
    basename: PropTypes.string,
    context: PropTypes.object.isRequired,
    location: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
  };

  StaticRouter.prototype.componentDidMount = function() {
    warning(
      !this.props.history,
      "<StaticRouter> ignores the history prop. To use a custom history, " +
        "use `import { Router }` instead of `import { StaticRouter as Router }`."
    );
  };
}

export default StaticRouter;
