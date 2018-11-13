import React from "react";
import PropTypes from "prop-types";
import { createLocation, createPath } from "history";
import invariant from "tiny-invariant";
import warning from "tiny-warning";

import Router from "./Router";
import Lifecycle from "./Lifecycle";

function addLeadingSlash(path) {
  return path.charAt(0) === "/" ? path : "/" + path;
}

function addBasename(basename, location) {
  if (!basename) return location;

  return {
    ...location,
    pathname: addLeadingSlash(basename) + location.pathname
  };
}

function stripBasename(basename, location) {
  if (!basename) return location;

  const base = addLeadingSlash(basename);

  if (location.pathname.indexOf(base) !== 0) return location;

  return {
    ...location,
    pathname: location.pathname.substr(base.length)
  };
}

function createURL(location) {
  return typeof location === "string" ? location : createPath(location);
}

function staticHandler(methodName) {
  return () => {
    invariant(false, "You cannot %s with <StaticRouter>", methodName);
  };
}

function noop() {}

/**
 * The public top-level API for a "static" <Router>, so-called because it
 * can't actually change the current location. Instead, it just records
 * location changes in a context object. Useful mainly in testing and
 * server-rendering scenarios.
 */
function StaticRouter(props) {
  const { basename = "", context = {}, location = "/", ...rest } = props;
  const navigateTo = (location, action) => {
    const { basename = "", context } = props;
    context.action = action;
    context.location = addBasename(basename, createLocation(location));
    context.url = createURL(context.location);
  };

  const handlePush = location => navigateTo(location, "PUSH");
  const handleReplace = location => navigateTo(location, "REPLACE");
  const handleListen = () => noop;
  const handleBlock = () => noop;

  const history = {
    createHref: path => addLeadingSlash(basename + createURL(path)),
    action: "POP",
    location: stripBasename(basename, createLocation(location)),
    push: handlePush,
    replace: handleReplace,
    go: staticHandler("go"),
    goBack: staticHandler("goBack"),
    goForward: staticHandler("goForward"),
    listen: handleListen,
    block: handleBlock
  };

  return (
    <Lifecycle
      onMount={() => {
        warning(
          !props.history,
          "<StaticRouter> ignores the history prop. To use a custom history, " +
            "use `import { Router }` instead of `import { StaticRouter as Router }`."
        );
      }}
    >
      {() => {
        return <Router {...rest} history={history} staticContext={context} />;
      }}
    </Lifecycle>
  );
}

if (__DEV__) {
  StaticRouter.propTypes = {
    basename: PropTypes.string,
    context: PropTypes.object,
    location: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
  };
}

export default StaticRouter;
