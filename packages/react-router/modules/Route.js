import React, { PropTypes } from 'react'
import warning from 'warning'
import matchPath from './matchPath'


/**
 * The public API for matching a single path and rendering.
 */
class Route extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  static childContextTypes = {
    router: PropTypes.object.isRequired
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

  state = {
    match: this.computeMatch(this.props)
  }

  getChildContext() {
    return {
      router: {
        ...this.context.router,
        match: this.state.match
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      match: this.computeMatch(nextProps)
    })

    warning(
      !(nextProps.location && !this.props.location),
      'You cannot change from an uncontrolled to controlled Route. You passed in a `location` prop on a re-render when initially there was none.'
    )
    warning(
      !(!nextProps.location && this.props.location),
      'You cannot change from a controlled to an uncontrolled Route. You passed in a `location` prop initially but on a re-render there was none.'
    )
  }

  computeMatch(props) {
    const { location, computedMatch, path, exact, strict } = props
    const { router } = this.context
    const pathname = (location || router.location).pathname
    return computedMatch || matchPath(pathname, { path, exact, strict })
  }

  render() {
    const { children, component, render } = this.props
    const { match } = this.state
    const props = { ...this.context.router, match }

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
