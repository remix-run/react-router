import React, { PropTypes } from 'react'
import matchPath from './matchPath'

class RouterProvider extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    history: PropTypes.object,
    match: PropTypes.object
  }

  static childContextTypes = {
    router: PropTypes.shape({
      history: PropTypes.object.isRequired,
      getMatch: PropTypes.func.isRequired
    }).isRequired
  }

  getChildContext() {
    return {
      router: {
        history: this.props.history,
        getMatch: () => this.props.match
      }
    }
  }

  render() {
    const { children } = this.props
    return children ? React.Children.only(children) : null
  }
}

/**
 * A higher-order component that starts listening for location
 * changes (calls `history.listen`) and re-renders the component
 * each time it does. Also, passes `context.router` as a prop.
 */
const withRouter = (component) => {
  return class extends React.Component {
    static displayName = `withRouter(${component.displayName || component.name})`

    static contextTypes = {
      router: PropTypes.shape({
        history: PropTypes.shape({
          listen: PropTypes.func.isRequired
        }).isRequired,
        getMatch: PropTypes.func.isRequired
      }).isRequired
    }

    componentWillMount() {
      // Do this here so we can catch actions in componentDidMount (e.g. <Redirect>).
      this.unlisten = this.context.router.history.listen(() => this.forceUpdate())
    }

    componentWillUnmount() {
      this.unlisten()
    }

    render() {
      const { history, getMatch } = this.context.router

      return React.createElement(component, {
        ...this.props,
        history,
        match: getMatch()
      })
    }
  }
}

/**
 * The public API for matching a single path and rendering.
 */
const Route = ({ computedMatch, history, path, exact, strict, ...props }) => (
  Route.render({
    ...props,
    match: computedMatch || matchPath(history.location.pathname, path, { exact, strict }),
    history
  })
)

Route.propTypes = {
  computedMatch: PropTypes.object, // private, from <Switch>
  history: PropTypes.object.isRequired,
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
  ])
}

/**
 * Low-level API for rendering the props provided to a <Route> element.
 */
Route.render = ({ component, render, children, ...props }) => {
  const element = (
    component ? ( // component prop gets first priority, only called if there's a match
      props.match ? React.createElement(component, props) : null
    ) : render ? ( // render prop is next, only called if there's a match
      props.match ? render(props) : null
    ) : children ? ( // children come last, always called
      typeof children === 'function' ? children(props) : React.Children.only(children)
    ) : (
      null
    )
  )

  return element && <RouterProvider {...props} children={element}/>
}

/**
 * The public API for rendering the first <Route> that matches.
 */
const Switch = ({ children, history }) => {
  const routes = React.Children.toArray(children)

  let route, computedMatch
  for (let i = 0, length = routes.length; computedMatch == null && i < length; ++i) {
    route = routes[i]
    computedMatch = matchPath(history.location.pathname, route.props.path, route.props)
  }

  return computedMatch ? React.cloneElement(route, { computedMatch }) : null
}

Switch.propTypes = {
  children: PropTypes.node,
  history: PropTypes.shape({
    location: PropTypes.shape({
      pathname: PropTypes.string.isRequired
    }).isRequired
  }).isRequired
}

/**
 * The public API for putting history on context.
 */
const Router = ({ children, history }) => (
  children ? <RouterProvider children={children} history={history} match={null}/> : null
)

Router.propTypes = {
  children: PropTypes.node,
  history: PropTypes.object.isRequired
}

const ConnectedRoute = withRouter(Route)
const ConnectedSwitch = withRouter(Switch)

export {
  withRouter,
  ConnectedRoute as Route,
  ConnectedSwitch as Switch,
  Router
}
