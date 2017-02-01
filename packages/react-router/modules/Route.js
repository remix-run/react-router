import warning from 'warning'
import React, { PropTypes } from 'react'
import matchPath from './matchPath'

const computeMatch = (router, { computedMatch, path, exact, strict }) =>
  computedMatch || matchPath(router.location.pathname, path, { exact, strict })

/**
 * The public API for matching a single path and rendering.
 */
class Route extends React.Component {

  /**
   * Low-level public API for rendering using the various "render props"
   * provided to a <Route>. This is mainly useful when wrapping <Route>s.
   */
  static render = (props) => {
    // TODO: eslint-plugin-react thinks this is a missing propType. File a bug.
    const { component, render, match } = props // eslint-disable-line react/prop-types
    let children = props.children  // eslint-disable-line react/prop-types

    if (children && !children.length) children = null

    warning(
      !(component && render),
      'You should not use <Route component> and <Route render> in the same route; <Route render> will be ignored'
    )

    warning(
      !(component && children),
      'You should not use <Route component> and <Route children> in the same route; <Route children> will be ignored'
    )

    warning(
      !(render && children),
      'You should not use <Route render> and <Route children> in the same route; <Route children> will be ignored'
    )

    return (
      component ? ( // component prop gets first priority, only called if there's a match
        match ? React.createElement(component, props) : null
      ) : render ? ( // render prop is next, only called if there's a match
        match ? render(props) : null
      ) : children ? ( // children come last, always called
        typeof children === 'function' ? children(props) : React.Children.only(children)
      ) : (
        null
      )
    )
  }

  static contextTypes = {
    router: PropTypes.shape({
      listen: PropTypes.func.isRequired
    }).isRequired
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
    ])
  }

  static childContextTypes = {
    router: PropTypes.object.isRequired
  }

  getChildContext() {
    return {
      router: this.router
    }
  }

  componentWillMount() {
    const parentRouter = this.context.router

    this.router = {
      ...parentRouter,
      match: computeMatch(parentRouter, this.props)
    }

    // Start listening here so we can <Redirect> on the initial render.
    this.unlisten = parentRouter.listen(() => {
      Object.assign(this.router, parentRouter, {
        match: computeMatch(parentRouter, this.props)
      })

      this.forceUpdate()
    })
  }

  componentWillReceiveProps(nextProps) {
    Object.assign(this.router, {
      match: computeMatch(this.router, nextProps)
    })
  }

  componentWillUnmount() {
    this.unlisten()
  }

  render() {
    return Route.render({ ...this.props, ...this.router })
  }
}

export default Route
