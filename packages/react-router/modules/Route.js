import warning from 'warning'
import React, { PropTypes } from 'react'
import matchPath from './matchPath'

/**
 * The public API for matching a single path and rendering.
 */
class Route extends React.Component {
  static contextTypes = {
    history: PropTypes.object.isRequired
  }

  static propTypes = {
    computedMatch: PropTypes.object, // private, from <Switch>
    path: PropTypes.string,
    exact: PropTypes.bool,
    strict: PropTypes.bool,
    component: PropTypes.func,
    render: PropTypes.func,
    children: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.node
    ]),
    location: PropTypes.object
  }

  static childContextTypes = {
    route: PropTypes.object.isRequired
  }

  getChildContext() {
    return {
      route: {
        location: this.props.location || this.context.history.location,
        match: this.state.match
      }
    }
  }

  state = {
    match: this.computeMatch(this.props)
  }

  computeMatch({ computedMatch, location, path, strict, exact }) {
    if (computedMatch)
      return computedMatch // <Switch> already computed the match for us

    const pathname = (location || this.context.history.location).pathname

    return matchPath(pathname, { path, strict, exact })
  }

  componentWillReceiveProps(nextProps) {
    warning(
      !(nextProps.location && !this.props.location),
      '<Route> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    )

    warning(
      !(!nextProps.location && this.props.location),
      '<Route> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    )

    this.setState({
      match: this.computeMatch(nextProps)
    })
  }

  render() {
    const { match } = this.state
    const { children, component, render } = this.props
    const { history } = this.context
    const { location } = history
    const props = { match, location, history }

    return (
      component ? ( // component prop gets first priority, only called if there's a match
        match ? React.createElement(component, props) : null
      ) : render ? ( // render prop is next, only called if there's a match
        match ? render(props) : null
      ) : children ? ( // children come last, always called
        typeof children === 'function' ? (
          children(props)
        ) : !Array.isArray(children) || children.length ? ( // Preact defaults to empty children array
          React.Children.only(children)
        ) : (
          null
        )
      ) : (
        null
      )
    )
  }
}

export default Route
