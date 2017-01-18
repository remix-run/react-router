import React, { PropTypes } from 'react'
import pathToRegexp from 'path-to-regexp'

const patternCache = { true: {}, false: {} }
const cacheLimit = 10000
let cacheCount = 0

const compilePath = (pattern, exact) => {
  const cache = patternCache[exact]

  if (cache[pattern])
    return cache[pattern]

  const keys = []
  const re = pathToRegexp(pattern, keys, { end: exact, strict: true })
  const compiledPattern = { re, keys }

  if (cacheCount < cacheLimit) {
    cache[pattern] = compiledPattern
    cacheCount++
  }

  return compiledPattern
}

/**
 * Public API for matching a URL pathname to a path pattern.
 */
const matchPath = (pathname, path, exact = false) => {
  if (!path)
    return { url: pathname, isExact: true, params: {} }

  const { re, keys } = compilePath(path, exact)
  const match = re.exec(pathname)

  if (!match)
    return null

  const [ url, ...values ] = match
  const isExact = pathname === url

  if (exact && !isExact)
    return null

  return {
    path, // the path pattern used to match
    url, // the matched portion of the URL
    isExact, // whether or not we matched exactly
    params: keys.reduce((memo, key, index) => {
      memo[key.name] = values[index]
      return memo
    }, {})
  }
}

class RouterProvider extends React.Component {
  static propTypes = {
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
const Route = ({ computedMatch, history, path, exact, ...props }) => (
  Route.render({
    ...props,
    match: computedMatch || matchPath(history.location.pathname, path, exact),
    history
  })
)

Route.propTypes = {
  computedMatch: PropTypes.object, // private, from <Switch>
  history: PropTypes.object.isRequired,
  path: PropTypes.string,
  exact: PropTypes.bool,
  component: PropTypes.func, // TODO: Warn when used with other render props
  render: PropTypes.func, // TODO: Warn when used with other render props
  children: PropTypes.oneOfType([ // TODO: Warn when used with other render props
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
const Switch = ({ history, children }) => {
  const routes = React.Children.toArray(children)

  let route, computedMatch
  for (let i = 0, length = routes.length; computedMatch == null && i < length; ++i) {
    route = routes[i]
    computedMatch = matchPath(history.location.pathname, route.props.path, route.props.exact)
  }

  return computedMatch ? React.cloneElement(route, { computedMatch }) : null
}

Switch.propTypes = {
  history: PropTypes.object.isRequired,
  children: PropTypes.node
}

/**
 * The public API for putting history on context.
 */
const Router = ({ children, history }) => (
  children ? (
    <RouterProvider match={null} history={history}>
      { children }
    </RouterProvider>
  ) : null
)

Router.propTypes = {
  history: PropTypes.object.isRequired,
  children: PropTypes.node
}

const HistoryRoute = withRouter(Route)
const HistorySwitch = withRouter(Switch)

export {
  matchPath,
  withRouter,
  HistoryRoute as Route,
  HistorySwitch as Switch,
  Router
}
