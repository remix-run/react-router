import React, { PropTypes } from 'react'

// needs accessibility stuff from React Router Link
class Link extends React.Component {
  static propTypes = {
    to: PropTypes.string,
    style: PropTypes.object,
    activeStyle: PropTypes.object,
    location: PropTypes.object,
    activeOnlyWhenExact: PropTypes.bool
  }

  static defaultProps = {
    activeOnlyWhenExact: false,
    style: {},
    activeStyle: {}
  }

  static contextTypes = {
    history: PropTypes.object,
    location: PropTypes.object
  }

  handleClick = (event) => {
    event.preventDefault()

    const { history } = this.context
    const { to } = this.props

    history.push(to)
  }

  render() {
    const {
      to,
      style,
      activeStyle,
      location,
      activeOnlyWhenExact,
      ...rest
    } = this.props

    const { pathname } = location || this.context.location
    const isActive = activeOnlyWhenExact ?
      pathname === to : pathname.startsWith(to)

    return (
      <a
        {...rest}
        href={to}
        style={isActive ? { ...style, ...activeStyle } : style}
        onClick={this.handleClick}
      />
    )
  }
}

export default Link
