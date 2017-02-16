import React from 'react'
import PropTypes from 'prop-types'
import {
  Route,
  resolveLocation
} from 'react-router'
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
}, { router }) => {
  const { match } = router.route
  const resolvedTo = resolveLocation(to, match && match.url)
  const path = typeof resolvedTo === 'object' ? resolvedTo.pathname : resolvedTo
  return (
    <Route
      path={path}
      exact={exact}
      strict={strict}
      location={location}
      children={({ location, match }) => {
        const isActive = !!(getIsActive ? getIsActive(match, location) : match)

        return (
          <Link
            to={resolvedTo}
            className={isActive ? [ activeClassName, className ].filter(i => i).join(' ') : className}
            style={isActive ? { ...style, ...activeStyle } : style}
            {...rest}
          />
        )
      }}
    />
  )
}

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

NavLink.contextTypes = {
  router: PropTypes.shape({
    route: PropTypes.shape({
      match: PropTypes.object
    })
  }).isRequired
}

export default NavLink
