import React, { PropTypes } from 'react'
import {
  history as historyType,
  to as toType
} from './PropTypes'

class Redirect extends React.Component {
  static contextTypes = {
    history: historyType.isRequired
  }

  static propTypes = {
    to: toType.isRequired
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
    this.context.history.replace(this.props.to)
  }

  render() {
    return null
  }
}

export default Redirect
