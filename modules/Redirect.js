import React, { PropTypes } from 'react'
import {
  history as historyType,
  to as toType
} from './PropTypes'

/**
 * The public API for updating the location programatically
 * with a component.
 */
class Redirect extends React.Component {
  static contextTypes = {
    history: historyType.isRequired
  }

  static propTypes = {
    push: PropTypes.bool,
    to: toType.isRequired
  }

  static defaultProps = {
    push: false
  }

  componentWillMount() {
    this.isServerRender = typeof window !== 'object'

    if (this.isServerRender)
      this.perform()
  }

  componentDidMount() {
    if (!this.isServerRender)
      this.perform()
  }

  perform() {
    const { history } = this.context
    const { push, to } = this.props

    if (push) {
      history.push(to)
    } else {
      history.replace(to)
    }
  }

  render() {
    return null
  }
}

export default Redirect
