import React, { PropTypes } from 'react'
import pathToRegexp from 'path-to-regexp'

const patternCache = { true: {}, false: {} }

let cacheCount = 0
const CACHE_LIMIT = 10000

const compilePattern = (pattern, exact) => {
  const cache = patternCache[exact]

  if (cache[pattern]) {
    return cache[pattern]
  } else {
    const keys = []
    const re = pathToRegexp(pattern, keys, { end: exact, strict: true })
    const compiledPattern = { re, keys }
    if (cacheCount < CACHE_LIMIT) {
      cache[pattern] = compiledPattern
      cacheCount++
    }
    return compiledPattern
  }
}

const matchPattern = (pattern, pathname, exact = false) => {
  if (!pattern)
    return { pathname, isExact: true, params: {} }

  const { re, keys } = compilePattern(pattern, exact)
  const match = re.exec(pathname)

  if (!match)
    return null

  const [ path, ...values ] = match
  const isExact = pathname === path

  if (exact && !isExact)
    return null

  return {
    isExact,
    pathname: path,
    params: keys.reduce((memo, key, index) => {
      memo[key.name] = values[index]
      return memo
    }, {})
  }
}

const createProps = (history, match) => ({
  history,
  action: history.action,
  location: history.location,
  params: match ? match.params : {},
  pathname: match ? match.pathname : '',
  isExact: match ? match.isExact : false,
  matched: match != null
})

/**
 * A utility method for creating route elements.
 */
const createRouteElement = ({ component, render, children }, props) => (
  component ? ( // component prop gets first priority, only called if there's a match
    props.matched ? React.createElement(component, props) : null
  ) : render ? ( // render prop is next, only called if there's a match
    props.matched ? render(props) : null
  ) : children ? ( // children come last, always called
    typeof children === 'function' ? children(props) : React.Children.only(children)
  ) : (
    null
  )
)

/**
 * A higher-order component that starts listening for location
 * changes (calls `history.listen`) and re-renders the component
 * each time it does. Also, passes `context.history` as a prop.
 */
const withHistory = (component) => {
  return class extends React.Component {
    static displayName = `withHistory(${component.displayName || component.name})`

    static contextTypes = {
      history: PropTypes.shape({
        listen: PropTypes.func.isRequired
      }).isRequired
    }

    componentWillMount() {
      // Do this here so we can catch actions in componentDidMount (e.g. <Redirect>).
      this.unlisten = this.context.history.listen(() => this.forceUpdate())
    }

    componentWillUnmount() {
      this.unlisten()
    }

    render() {
      return React.createElement(component, {
        ...this.props,
        history: this.context.history
      })
    }
  }
}

/**
 * The public API for matching a single path and rendering.
 */
const Route = ({ history, path, exact, ...renderProps }) => {
  const match = matchPattern(path, history.location.pathname, exact)
  return createRouteElement(renderProps, createProps(history, match))
}

Route.propTypes = {
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
 * The public API for rendering the first <Route> that matches.
 */
const Switch = ({ history, children }) => {
  const routes = React.Children.toArray(children)

  let route, match
  for (let i = 0, length = routes.length; match == null && i < length; ++i) {
    route = routes[i]
    match = matchPattern(route.props.path, history.location.pathname, route.props.exact)
  }

  return match ? createRouteElement(route.props, createProps(history, match)) : null
}

Switch.propTypes = {
  history: PropTypes.object.isRequired,
  children: PropTypes.node
}

/**
 * The public API for putting history on context.
 */
class Router extends React.Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    children: PropTypes.node
  }

  static childContextTypes = {
    history: PropTypes.object.isRequired
  }

  getChildContext() {
    return { history: this.props.history }
  }

  render() {
    const { children } = this.props
    return children ? React.Children.only(children) : null
  }
}

const HistoryRoute = withHistory(Route)
const HistorySwitch = withHistory(Switch)

export {
  createRouteElement,
  withHistory,
  HistoryRoute as Route,
  HistorySwitch as Switch,
  Router
}
