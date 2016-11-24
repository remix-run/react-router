import React, { PropTypes } from 'react'

class Link extends React.Component {
  static defaultProps = {
    replace: false,
    activeOnlyWhenExact: false,
    className: '',
    activeClassName: '',
    style: {},
    activeStyle: {},
    isActive: (location, to, props) => {
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
    router: PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      isActive: this.getIsActive()
    }
  }

  componentDidMount() {
    this.unlisten = this.context.router.subscribe(() => {
      this.setState({
        isActive: this.getIsActive()
      })
    })
  }

  componentWillUnmount() {
    this.unlisten()
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

      const { router } = this.context
      const { to, replace } = this.props

      if (replace) {
        router.replaceWith(to)
      } else {
        router.transitionTo(to)
      }
    }
  }

  getIsActive() {
    const { to, isActive } = this.props

    return isActive(
      this.context.router.getState().location,
      createLocationDescriptor(to),
      this.props
    )
  }

  render() {
    const { isActive } = this.state
    const {
      to,
      style, activeStyle,
      className, activeClassName,
      activeOnlyWhenExact, // eslint-disable-line
      replace, // eslint-disable-line
      isActive:_, // eslint-disable-line
      ...rest
    } = this.props

    return (
      <a
        {...rest}
        href={this.context.router.createHref(to)}
        onClick={this.handleClick}
        style={isActive ? { ...style, ...activeStyle } : style }
        className={isActive ?
          [ className, activeClassName ].join(' ').trim() : className
        }
      />
    )
  }
}

if (__DEV__) {
  Link.propTypes = {
    to: PropTypes.oneOfType([ PropTypes.string, PropTypes.object ]).isRequired,
    replace: PropTypes.bool,
    activeStyle: PropTypes.object,
    activeClassName: PropTypes.string,
    activeOnlyWhenExact: PropTypes.bool,
    isActive: PropTypes.func,
    children: PropTypes.node,

    // props we have to deal with but aren't necessarily
    // part of the Link API
    style: PropTypes.object,
    className: PropTypes.string,
    target: PropTypes.string,
    onClick: PropTypes.func
  }
}

const createLocationDescriptor = (to) =>
  typeof to === 'object' ? to : { pathname: to }

const pathIsActive = (to, pathname, activeOnlyWhenExact) =>
  activeOnlyWhenExact ? pathname === to : pathname.indexOf(to) === 0

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

// use looseEqual from history/LocationUtils
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
