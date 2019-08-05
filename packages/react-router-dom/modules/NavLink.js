import React from "react";
import { __RouterContext as RouterContext, matchPath } from "react-router";
import PropTypes from "prop-types";
import invariant from "tiny-invariant";
import Link from "./Link";
import { resolveToLocation, normalizeToLocation } from "./utils/locationUtils";

function joinClassnames(...classnames) {
  return classnames.filter(i => i).join(" ");
}

/**
 * A <Link> wrapper that knows if it's "active" or not.
 */
function NavLink({
  "aria-current": ariaCurrent = "page",
  activeClassName = "active",
  activeStyle,
  className: classNameProp,
  exact,
  isActive: isActiveProp,
  location: locationProp,
  strict,
  style: styleProp,
  to,
  ...rest
}) {
  return (
    <RouterContext.Consumer>
      {context => {
        invariant(context, "You should not use <NavLink> outside a <Router>");

        const currentLocation = locationProp || context.location;
        const toLocation = normalizeToLocation(
          resolveToLocation(to, currentLocation),
          currentLocation
        );
        const { pathname: path } = toLocation;
        // Regex taken from: https://github.com/pillarjs/path-to-regexp/blob/master/index.js#L202
        const escapedPath =
          path && path.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");

        const match = escapedPath
          ? matchPath(currentLocation.pathname, { path: escapedPath, exact, strict })
          : null;
        const isActive = !!(isActiveProp
          ? isActiveProp(match, currentLocation)
          : match);

        const className = isActive
          ? joinClassnames(classNameProp, activeClassName)
          : classNameProp;
        const style = isActive ? { ...styleProp, ...activeStyle } : styleProp;

        return (
          <Link
            aria-current={(isActive && ariaCurrent) || null}
            className={className}
            style={style}
            to={toLocation}
            {...rest}
          />
        );
      }}
    </RouterContext.Consumer>
  );
}

if (__DEV__) {
  const ariaCurrentType = PropTypes.oneOf([
    "page",
    "step",
    "location",
    "date",
    "time",
    "true"
  ]);

  NavLink.propTypes = {
    ...Link.propTypes,
    "aria-current": ariaCurrentType,
    activeClassName: PropTypes.string,
    activeStyle: PropTypes.object,
    className: PropTypes.string,
    exact: PropTypes.bool,
    isActive: PropTypes.func,
    location: PropTypes.object,
    strict: PropTypes.bool,
    style: PropTypes.object
  };
}

export default NavLink;
