/*eslint react/display-name: 0*/
import React, { PropTypes } from 'react'
import Route from './Route'
import Link from './Link'

const NavLink = ({
  to,
  activeClassName,
  className,
  activeStyle,
  style,
  isActive:getIsActive,
  ...rest
}) => (
  <Route
    path={typeof to === 'object' ? to.pathname : to}
    children={({ match, location }) => {
      const isActive = getIsActive ? getIsActive(match, location) : match
      return (
        <Link
          to={to}
          className={isActive ? (
            [ activeClassName, className ].join(' ')
          ) : (
            className
          )}
          style={isActive ? (
            { ...style, ...activeStyle }
          ) : (
            style
          )}
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
