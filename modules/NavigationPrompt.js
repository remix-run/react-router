import React, { PropTypes } from 'react'
import {
  router as routerType
} from './PropTypes'

class NavigationPrompt extends React.Component {
  static contextTypes = {
    router: routerType.isRequired
  }

  static propTypes = {
    message: PropTypes.oneOfType([ PropTypes.string, PropTypes.func ]),
    when: PropTypes.bool
  }

  static defaultProps = {
    when: true
  }

  unblockTransitions = null

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

  getPromptMessage = (location) => {
    const { message } = this.props
    return typeof message === 'function' ? message(location) : message
  }

  block() {
    if (!this.unblockTransitions)
      this.unblockTransitions = this.context.router.blockTransitions(this.getPromptMessage)
  }

  unblock() {
    if (this.unblockTransitions) {
      this.unblockTransitions()
      this.unblockTransitions = null
    }
  }

  render() {
    return null
  }
}

export default NavigationPrompt
