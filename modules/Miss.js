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
    const { children, render, component:Component } = this.props
    const { matchCount } = this.context.router.match.getState()
    const { location } = this.context.router.getState()

    // Miss component is matched when there is no other matches
    const matched = matchCount === 0

    if (children) {
      return (children({ matched, location }))
    }

    return matched ? (
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
    children: PropTypes.func,
    render: PropTypes.func,
    component: PropTypes.func
  }
}

export default Miss
