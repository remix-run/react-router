import React from 'react'
import PropTypes from 'prop-types'
import { Route } from 'react-router'
import Link from './Link'

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
  ...rest
}) => (
  <Route
    path={typeof to === 'object' ? to.pathname : to}
    exact={exact}
    strict={strict}
    location={location}
    children={({ location, match }) => {
      const isActive = !!(getIsActive ? getIsActive(match, location) : match)

      return (
        <Link
          to={to}
          className={isActive ? [ className, activeClassName ].filter(i => i).join(' ') : className}
          style={isActive ? { ...style, ...activeStyle } : style}
          {...rest}
        />
      )
    }}
  />
)

NavLink.propTypes = {
  to: Link.propTypes.to,
  exact: PropTypes.bool,
  strict: PropTypes.bool,
  location: PropTypes.object,
  activeClassName: PropTypes.string,
  className: PropTypes.string,
  activeStyle: PropTypes.object,
  style: PropTypes.object,
  isActive: PropTypes.func
}

NavLink.defaultProps = {
  activeClassName: 'active'
}

export default NavLink
