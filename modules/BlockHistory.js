import React, { PropTypes } from 'react'

class BlockHistory extends React.Component {
  static propTypes = {
    when: PropTypes.bool,
    prompt: PropTypes.func
  }

  static contextTypes = {
    history: PropTypes.object
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

    if (!this.unlistenBefore)
      this.unlistenBefore = history.listenBefore(prompt)
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

export default BlockHistory
