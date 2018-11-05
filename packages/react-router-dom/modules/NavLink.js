import React from "react";
import { Route } from "react-router";
import PropTypes from "prop-types";

import Link from "./Link";
import { resolveToLocation, normalizeToLocation } from "./utils/locationUtils";

function joinClassnames(...classnames) {
  return classnames.filter(i => i).join(" ");
}

function resolvePath(to, location) {
  const { pathname } = normalizeToLocation(
    resolveToLocation(to, location),
    location
  );

  // Regex taken from: https://github.com/pillarjs/path-to-regexp/blob/master/index.js#L202
  return pathname && pathname.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
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
    <Route
      path={location => resolvePath(to, locationProp || location)}
      exact={exact}
      strict={strict}
      location={locationProp}
      children={({ location, match }) => {
        const isActive = !!(isActiveProp
          ? isActiveProp(match, location)
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
            to={to}
            {...rest}
          />
        );
      }}
    />
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
    "aria-current": ariaCurrentType,
    activeClassName: PropTypes.string,
    activeStyle: PropTypes.object,
    className: PropTypes.string,
    exact: Route.propTypes.exact,
    isActive: PropTypes.func,
    location: PropTypes.object,
    strict: Route.propTypes.strict,
    style: PropTypes.object,
    to: Link.propTypes.to
  };
}

export default NavLink;
