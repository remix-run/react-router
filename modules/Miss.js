import React, { PropTypes } from 'react'
import MultiRender from './MultiRender'

class Miss extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    render: PropTypes.func,
    component: PropTypes.func
  }

  static contextTypes = {
    matchCounter: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
  }

  render() {
    const { children, render, component } = this.props
    const { location, matchCounter } = this.context
    return matchCounter.matchFound ? null : (
      <MultiRender
        props={{ location }}
        children={children}
        component={component}
        render={render}
      />
    )
  }
}

export default Miss
