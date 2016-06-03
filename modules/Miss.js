import React, { PropTypes } from 'react'
import { funcOrNode } from './PropTypes'

class Miss extends React.Component {
  static propTypes = {
    children: funcOrNode
  }

  static contextTypes = {
    matchCounter: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
  }

  render() {
    const { children:Child } = this.props
    const { location, matchCounter } = this.context
    return matchCounter.matchFound ? null : <Child location={location}/>
  }
}

export default Miss
