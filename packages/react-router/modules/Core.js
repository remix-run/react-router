import invariant from 'invariant'
import React, { PropTypes } from 'react'
import matchPath from './matchPath'

/**
 * The public API for putting history on context.router.
 */
const Router = ({ children, history }) => (
  children ? <RouterProvider children={children} router={history}/> : null
)

Router.propTypes = {
  children: PropTypes.node,
  history: PropTypes.object.isRequired
}

class RouterProvider extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    router: PropTypes.object
  }

  static childContextTypes = {
    router: PropTypes.object.isRequired
  }

  getChildContext() {
    return {
      router: this.props.router
    }
  }

  render() {
    const { children } = this.props
    return children ? React.Children.only(children) : null
  }
}

/**
 * The public API for listening for route changes and re-rendering
 * when it does. Also, passes context.router as a prop.
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
      // Use cWM so we can <Redirect> on the initial render.
      this.unlisten = this.context.router.listen(() => this.forceUpdate())
    }

    componentWillUnmount() {
      this.unlisten()
    }

    render() {
      return React.createElement(component, {
        ...this.props,
        router: this.context.router
      })
    }
  }
}

const computeMatch = ({ computedMatch, router, path, exact, strict }) =>
  computedMatch || matchPath(router.location.pathname, path, { exact, strict })

/**
 * The public API for matching a single path and rendering.
 */
class Route extends React.Component {
  static propTypes = {
    path: PropTypes.string,
    exact: PropTypes.bool,
    strict: PropTypes.bool,
    component: (props, propName, componentName, ...rest) => {
      if (props.component && props.render)
        return new Error('You should not use <Route component> and <Route render> in the same route; <Route render> will be ignored')

      if (props.component && props.children)
        return new Error('You should not use <Route component> and <Route children> in the same route; <Route children> will be ignored')

      if (props.render && props.children)
        return new Error('You should not use <Route render> and <Route children> in the same route; <Route children> will be ignored')

      return PropTypes.func(props, propName, componentName, ...rest)
    },
    render: PropTypes.func,
    children: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.node
    ]),
    computedMatch: PropTypes.object, // private, from <Switch>
    router: PropTypes.shape({ // private, from withRouter
      location: PropTypes.shape({
        pathname: PropTypes.string.isRequired
      }).isRequired
    }).isRequired
  }

  /**
   * Low-level API for rendering the props provided to a <Route> element.
   */
  static render = ({ component, render, children, ...props }) => {
    const { router } = props

    invariant(
      router,
      'Route.render is missing the "router" prop. Did you forget to pass it along?'
    )

    const child = (
      component ? ( // component prop gets first priority, only called if there's a match
        router.match ? React.createElement(component, props) : null
      ) : render ? ( // render prop is next, only called if there's a match
        router.match ? render(props) : null
      ) : children ? ( // children come last, always called
        typeof children === 'function' ? children(props) : React.Children.only(children)
      ) : (
        null
      )
    )

    return child && <RouterProvider {...props} children={child}/>
  }

  componentWillMount() {
    this.router = {
      ...this.props.router,
      match: computeMatch(this.props)
    }
  }

  componentWillReceiveProps(nextProps) {
    Object.assign(this.router, {
      ...nextProps.router,
      match: computeMatch(nextProps)
    })
  }

  render() {
    return Route.render({ ...this.props, router: this.router })
  }
}

/**
 * The public API for rendering the first <Route> that matches.
 */
const Switch = ({ children, router }) => {
  const routes = React.Children.toArray(children)

  let route, match
  for (let i = 0, length = routes.length; match == null && i < length; ++i) {
    route = routes[i]
    match = matchPath(router.location.pathname, route.props.path, route.props)
  }

  return match ? React.cloneElement(route, { computedMatch: match }) : null
}

Switch.propTypes = {
  children: PropTypes.node,
  router: PropTypes.shape({ // private, from withRouter
    location: PropTypes.shape({
      pathname: PropTypes.string.isRequired
    }).isRequired
  }).isRequired
}

const xRoute = withRouter(Route)
const xSwitch = withRouter(Switch)

export {
  Router,
  withRouter,
  xRoute as Route,
  xSwitch as Switch
}
