import React from "react";
import PropTypes from "prop-types";

import Route from "./Route";
import Link from "./Link";

/**
 * A <Link> wrapper that knows if it's "active" or not.
 */
const NavLink = ({
  to,
  exact,
  strict,
  location,
  activeClassName,
  className,
  activeStyle,
  style,
  isActive: getIsActive,
  "aria-current": ariaCurrent,
  ...rest
}) => {
  const path = typeof to === "object" ? to.pathname : to;

  // Regex taken from: https://github.com/pillarjs/path-to-regexp/blob/master/index.js#L202
  const escapedPath = path && path.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");

  return (
    <Route
      path={escapedPath}
      exact={exact}
      strict={strict}
      location={location}
      children={({ location, match }) => {
        const isActive = !!(getIsActive ? getIsActive(match, location) : match);

        return (
          <Link
            to={to}
            className={
              isActive
                ? [className, activeClassName].filter(i => i).join(" ")
                : className
            }
            style={isActive ? { ...style, ...activeStyle } : style}
            aria-current={(isActive && ariaCurrent) || null}
            {...rest}
          />
        );
      }}
    />
  );
};

NavLink.defaultProps = {
  activeClassName: "active",
  "aria-current": "page"
};

if (__DEV__) {
  NavLink.propTypes = {
    to: Link.propTypes.to,
    exact: PropTypes.bool,
    strict: PropTypes.bool,
    location: PropTypes.object,
    activeClassName: PropTypes.string,
    className: PropTypes.string,
    activeStyle: PropTypes.object,
    style: PropTypes.object,
    isActive: PropTypes.func,
    "aria-current": PropTypes.oneOf([
      "page",
      "step",
      "location",
      "date",
      "time",
      "true"
    ])
  };
}

export default NavLink;
