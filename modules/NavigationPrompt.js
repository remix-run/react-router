import React, { PropTypes } from 'react'

class NavigationPrompt extends React.Component {
  static propTypes = {
    when: PropTypes.bool,
    prompt: PropTypes.oneOfType([ PropTypes.string, PropTypes.func ])
  }

  static contextTypes = {
    history: PropTypes.object
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
    const { history } = this.context
    const { prompt } = this.props
    const listener = typeof prompt === 'string' ?  () => prompt : prompt

    if (!this.unlistenBefore)
      this.unlistenBefore = history.listenBefore(listener)
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
