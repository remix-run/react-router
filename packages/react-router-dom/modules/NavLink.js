import React from "react";
import { __FOR_INTERNAL_USE_ONLY__, matchPath } from "react-router";
import PropTypes from "prop-types";
import Link from "./Link";
import invariant from "tiny-invariant";

const { RouterContext } = __FOR_INTERNAL_USE_ONLY__;

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
  const path = typeof to === "object" ? to.pathname : to;

  // Regex taken from: https://github.com/pillarjs/path-to-regexp/blob/master/index.js#L202
  const escapedPath = path && path.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");

  return (
    <RouterContext.Consumer>
      {context => {
        invariant(context, "You should not use <NavLink> outside a <Router>");

        const pathToMatch = locationProp
          ? locationProp.pathname
          : context.location.pathname;
        const match = escapedPath
          ? matchPath(pathToMatch, { path: escapedPath, exact, strict })
          : null;
        const isActive = !!(isActiveProp
          ? isActiveProp(match, context.location)
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
