import React, { PropTypes } from 'react'

class Miss extends React.Component {
  static contextTypes = {
    router: PropTypes.object
  }

  componentDidMount() {
    this.unlisten = this.context.router.subscribe(() => {
      this.forceUpdate()
    })
  }

  componentWillUnmount() {
    this.unlisten()
  }

  render() {
    const { render, component:Component } = this.props
    const { matchCount } = this.context.router.match.getState()
    const { location } = this.context.router.getState()
    return matchCount === 0 ? (
      render ? (
        render({ location })
      ) : (
        <Component location={location}/>
      )
    ) : null
  }
}

if (__DEV__) {
  Miss.propTypes = {
    children: PropTypes.node,
    render: PropTypes.func,
    component: PropTypes.func
  }
}

export default Miss
