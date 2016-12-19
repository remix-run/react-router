import React, { PropTypes } from 'react'
import {
  history as historyType,
  to as toType
} from './PropTypes'

const isLeftClickEvent = (event) =>
  event.button === 0

const isModifiedEvent = (event) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)

/**
 * The public API for a history-aware <a>.
 */
class Link extends React.Component {
  static contextTypes = {
    history: historyType.isRequired
  }

  static propTypes = {
    onClick: PropTypes.func,
    target: PropTypes.string,
    replace: PropTypes.bool,
    to: toType.isRequired
  }

  static defaultProps = {
    replace: false
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

      const { history } = this.context
      const { replace, to } = this.props

      if (replace) {
        history.replace(to)
      } else {
        history.push(to)
      }
    }
  }

  render() {
    const { replace, to, ...props } = this.props // eslint-disable-line no-unused-vars
    const href = typeof to === 'string' ? to : history.createHref(to)

    return (
      <a
        {...props}
        onClick={this.handleClick}
        href={href}
      />
    )
  }
}

export default Link
