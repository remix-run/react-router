import React from "react";
import PropTypes from "prop-types";

import Route from "./Route";
import Link from "./Link";

function joinClassnames(...classnames) {
  return classnames.filter(i => i).join(" ");
}

/**
 * A <Link> wrapper that knows if it's "active" or not.
 */
function NavLink({
  "aria-current": ariaCurrent,
  activeClassName,
  activeStyle,
  className: classNameProp,
  exact,
  isActive: isActiveProp,
  location,
  strict,
  style: styleProp,
  to,
  ...rest
}) {
  return (
    <Route
      path={typeof to === "object" ? to.pathname : to}
      exact={exact}
      strict={strict}
      location={location}
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

NavLink.defaultProps = {
  "aria-current": "page",
  activeClassName: "active"
};

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
