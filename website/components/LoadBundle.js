import React from 'react'
import LoadingDots from './LoadingDots'
import { B } from './bricks'

class LoadBundle extends React.Component {

  state = { mod: null }

  componentDidMount() {
    this.props.load((mod) => {
      this.setState({ mod })
    })
  }

  render() {
    const { children:Child } = this.props
    const { mod } = this.state
    return mod ? <Child mod={mod} /> : <B><LoadingDots/></B>
  }

}

export default LoadBundle
