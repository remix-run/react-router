import React, { PropTypes } from 'react'

const { oneOfType, string, object, bool, func } = PropTypes

const pathIsActive = (to, pathname, activeOnlyWhenExact) =>
  activeOnlyWhenExact ? pathname === to : pathname.startsWith(to)

const isLeftClickEvent = (event) =>
  event.button === 0

const isModifiedEvent = (event) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

class Link extends React.Component {

  static propTypes = {
    to: oneOfType([ string, object ]).isRequired,
    activeStyle: object,
    activeClassName: string,
    location: object,
    activeOnlyWhenExact: bool,

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
    activeStyle: {}
  }

  static contextTypes = {
    history: PropTypes.object,
    location: PropTypes.object
  }

  handleClick = (event) => {
    const { history } = this.context
    const { to, onClick, target } = this.props

    if (onClick)
      onClick(event)

    if (
      !event.defaultPrevented && // onClick prevented default
      !target && // let browser handle "target=_blank" etc.
      !isModifiedEvent(event) &&
      isLeftClickEvent(event)
    ) {
      event.preventDefault()
      history.push(to)
    }
  }

  render() {
    const {
      to,
      style,
      activeStyle,
      className,
      activeClassName,
      location,
      activeOnlyWhenExact,
      ...rest
    } = this.props

    const loc = location || this.context.location
    // TODO: add query checking or punt and add function support for
    //       activeClassName and activeStyle?
    const isActive = pathIsActive(to, loc.pathname, activeOnlyWhenExact)

    return (
      <a
        {...rest}
        href={typeof to === 'object' ? to.pathname : to}
        onClick={this.handleClick}
        style={isActive ? { ...style, ...activeStyle } : style }
        className={isActive ?
          [ activeClassName, className ].join(' ').trim() : className
        }
      />
    )
  }
}

export default Link
