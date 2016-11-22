import React, { PropTypes } from 'react'
import matchPattern from './matchPattern'

class MatchRoutes extends React.Component {
  static contextTypes = {
    router: PropTypes.object
  }

  constructor(props, context) {
    super(props, context)
    this.state = this.findMatch()
  }

  componentDidMount() {
    this.unlisten = this.context.router.subscribe(() => {
      const state = this.findMatch()
      if (state.match)
        this.context.router.onMatch()
      this.setState(state)
    })
  }

  componentWillUnmount() {
    this.unlisten()
  }

  findMatch() {
    const { routes } = this.props
    const { match:parent } = this.context.router.match.getState()
    const { location } = this.context.router.getState()

    let match = null
    let matchIndex = null
    routes.some((route, index) => {
      const { pattern, exact } = route
      matchIndex = index
      match = matchPattern(pattern, location, !!exact, parent)
      return !!match
    })

    return { match, matchIndex, location }
  }

  render() {
    const { routes, renderMiss, missComponent:MissComponent } = this.props
    const { match, matchIndex, location } = this.state

    if (match) {
      const { component:Component, pattern, render } = routes[matchIndex]
      const props = { ...match, location, pattern }
      return render ? render(props) : <Component {...props}/>
    }

    else {
      const props = { location }
      return renderMiss ? (
        renderMiss(props)
      ) : MissComponent ? (
        <MissComponent {...props}/>
      ) : null
    }
  }
}

if (__DEV__) {
  MatchRoutes.propTypes = {
    routes: PropTypes.arrayOf(
      PropTypes.shape({
        pattern: PropTypes.string.isRequired,
        exact: PropTypes.bool,
        render: PropTypes.func,
        component: PropTypes.func
      })
    ).isRequired,
    renderMiss: PropTypes.func,
    missComponent: PropTypes.func
  }
}

export default MatchRoutes
