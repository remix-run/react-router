import warning from 'warning'
import React, { PropTypes } from 'react'
import matchPath from './matchPath'

/**
 * The public API for putting history on context.router.
 */
class Router extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    history: PropTypes.object.isRequired
  }

  static childContextTypes = {
    router: PropTypes.object.isRequired
  }

  getChildContext() {
    return {
      router: this.props.history
    }
  }

  render() {
    const { children } = this.props
    return children ? React.Children.only(children) : null
  }
}

const computeMatch = (router, { computedMatch, path, exact, strict }) =>
  computedMatch || matchPath(router.location.pathname, path, { exact, strict })

/**
 * The public API for matching a single path and rendering.
 */
class Route extends React.Component {
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

  /**
   * Low-level API for rendering the props provided to a <Route> element.
   */
  static render = (props) => {
    const { component, render, children, match } = props

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

/**
 * The public API for rendering the first <Route> that matches.
 */
class Switch extends React.Component {
  static contextTypes = {
    router: PropTypes.shape({
      listen: PropTypes.func.isRequired
    }).isRequired
  }

  static propTypes = {
    children: PropTypes.node
  }

  state = {
    location: null
  }

  componentWillMount() {
    const { router } = this.context

    this.setState({ 
      location: router.location
    })

    // Start listening here so we can <Redirect> on the initial render.
    this.unlisten = this.context.router.listen(() => {
      this.setState({
        location: router.location
      })
    })
  }

  componentWillUnmount() {
    this.unlisten()
  }

  render() {
    const { children } = this.props
    const { location } = this.state
    const routes = React.Children.toArray(children)

    let route, match
    for (let i = 0, length = routes.length; match == null && i < length; ++i) {
      route = routes[i]
      match = matchPath(location.pathname, route.props.path, route.props)
    }

    return match ? React.cloneElement(route, { computedMatch: match }) : null
  }
}

/**
 * The public API for listening for route changes and re-rendering
 * when it does. Also, passes ...context.router as props.
 */
const withRouter = (component) => {
  return class extends React.Component {
    static displayName = `withRouter(${component.displayName || component.name})`

    static contextTypes = {
      router: PropTypes.shape({
        listen: PropTypes.func.isRequired
      }).isRequired
    }

    componentWillMount() {
      // Start listening here so we can <Redirect> on the initial render.
      this.unlisten = this.context.router.listen(() => this.forceUpdate())
    }

    componentWillUnmount() {
      this.unlisten()
    }

    render() {
      return React.createElement(component, {
        ...this.props,
        ...this.context.router
      })
    }
  }
}

export {
  Router,
  Route,
  Switch,
  withRouter
}
