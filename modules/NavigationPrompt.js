import React, { PropTypes } from 'react'
import {
  history as historyType
} from './PropTypes'

class NavigationPrompt extends React.Component {
  static contextTypes = {
    history: historyType.isRequired
  }

  static propTypes = {
    message: PropTypes.oneOfType([ PropTypes.string, PropTypes.func ]),
    when: PropTypes.bool
  }

  static defaultProps = {
    when: true
  }

  unlistenBefore = null

  componentDidMount() {
    this.maybeBlock()
  }

  componentDidUpdate() {
    this.maybeBlock()
  }

  componentWillUnmount() {
    this.unblock()
  }

  maybeBlock() {
    const { when } = this.props

    if (when) {
      this.block()
    } else {
      this.unblock()
    }
  }

  block() {
    if (this.unlistenBefore)
      return

    const { message } = this.props
    const listener = typeof message === 'string' ?  () => message : message

    this.unlistenBefore = this.context.history.listenBefore(listener)
  }

  unblock() {
    if (this.unlistenBefore) {
      this.unlistenBefore()
      this.unlistenBefore = null
    }
  }

  render() {
    return null
  }
}

export default NavigationPrompt
