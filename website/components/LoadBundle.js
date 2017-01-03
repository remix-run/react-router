import React from 'react'
import LoadingDots from './LoadingDots'
import { B } from './bricks'

class LoadBundle extends React.Component {
  state = { value: null }

  componentDidMount() {
    this.props.load(value => this.setState({ value }))
  }

  render() {
    const { value } = this.state
    return value ? this.props.children(value) : <B><LoadingDots/></B>
  }
}

export default LoadBundle
