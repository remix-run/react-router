import React, { PropTypes } from 'react'

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
    const { render, component:Component } = this.props
    const { location, matchCounter } = this.context
    return matchCounter.matchFound() ? null : (
      render ? (
        render({ location })
      ) : (
        <Component location={location}/>
      )
    )
  }
}

export default Miss
