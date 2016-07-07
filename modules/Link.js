import React, { PropTypes } from 'react'
import {
  location as locationType,
  router as routerType
} from './PropTypes'

const { oneOfType, string, object, bool, func } = PropTypes

class Link extends React.Component {
  static propTypes = {
    to: oneOfType([ string, object ]).isRequired,
    activeStyle: object,
    activeClassName: string,
    location: object,
    activeOnlyWhenExact: bool,
    isActive: func,

    // props we have to deal with but aren't necessarily
    // part of the Link API
    style: object,
    className: string,
    target: string,
    onClick: func
  }

  static defaultProps = {
    activeOnlyWhenExact: false,
    className: '',
    activeClassName: '',
    style: {},
    activeStyle: {},
    isActive: (location, props) => {
      const to = createLocationDescriptor(props.to)
      return pathIsActive(
        to.pathname,
        location.pathname,
        props.activeOnlyWhenExact
      ) && queryIsActive(
        to.query,
        location.query
      )
    }
  }

  static contextTypes = {
    router: routerType, // TODO: This should be required, lazy testers be damned
    location: locationType // TODO: This should also be required
  }

  handleClick = (event) => {
    if (this.props.onClick)
      this.props.onClick(event)

    if (
      !event.defaultPrevented && // onClick prevented default
      !this.props.target && // let browser handle "target=_blank" etc.
      !isModifiedEvent(event) &&
      isLeftClickEvent(event)
    ) {
      event.preventDefault()
      this.context.router.transitionTo(this.props.to)
    }
  }

  render() {
    const { router } = this.context
    const {
      to,
      style,
      activeStyle,
      className,
      activeClassName,
      location,
      isActive: getIsActive,
      activeOnlyWhenExact, // eslint-disable-line
      ...rest
    } = this.props

    const currentLocation = location || this.context.location
    const isActive = getIsActive(currentLocation, this.props)

    return (
      <a
        {...rest}
        href={router ? router.createHref(to) : to}
        onClick={this.handleClick}
        style={isActive ? { ...style, ...activeStyle } : style }
        className={isActive ?
          [ activeClassName, className ].join(' ').trim() : className
        }
      />
    )
  }
}

const createLocationDescriptor = (to) =>
  typeof to === 'object' ? to : { pathname: to }

const pathIsActive = (to, pathname, activeOnlyWhenExact) =>
  activeOnlyWhenExact ? pathname === to : pathname.startsWith(to)

const queryIsActive = (query, activeQuery) => {
  if (activeQuery == null)
    return query == null

  if (query == null)
    return true

  return deepEqual(query, activeQuery)
}

const isLeftClickEvent = (event) =>
  event.button === 0

const isModifiedEvent = (event) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

const deepEqual = (a, b) => {
  if (a == b)
    return true

  if (a == null || b == null)
    return false

  if (Array.isArray(a)) {
    return (
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((item, index) => deepEqual(item, b[index]))
    )
  }

  if (typeof a === 'object') {
    for (let p in a) {
      if (!Object.prototype.hasOwnProperty.call(a, p)) {
        continue
      }

      if (a[p] === undefined) {
        if (b[p] !== undefined) {
          return false
        }
      } else if (!Object.prototype.hasOwnProperty.call(b, p)) {
        return false
      } else if (!deepEqual(a[p], b[p])) {
        return false
      }
    }

    return true
  }

  return String(a) === String(b)
}

export default Link
