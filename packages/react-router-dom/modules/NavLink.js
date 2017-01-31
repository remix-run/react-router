import React, { PropTypes } from 'react'
import Route from 'react-router/Route'
import Link from './Link'

/**
 * A <Link> wrapper that knows if it's "active" or not.
 */
const NavLink = ({
  to,
  activeClassName,
  className,
  activeStyle,
  style,
  isActive: getIsActive,
  ...rest
}) => (
  <Route
    path={typeof to === 'object' ? to.pathname : to}
    children={({ location, match }) => {
      const isActive = !!(getIsActive ? getIsActive(match, location) : match)

      return (
        <Link
          to={to}
          className={isActive ? [ activeClassName, className ].join(' ') : className}
          style={isActive ? { ...style, ...activeStyle } : style}
          {...rest}
        />
      )
    }}
  />
)

NavLink.propTypes = {
  to: Link.propTypes.to,
  activeClassName: PropTypes.string,
  className: PropTypes.string,
  activeStyle: PropTypes.object,
  style: PropTypes.object,
  isActive: PropTypes.func
}

export default NavLink
