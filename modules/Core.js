import React, { PropTypes } from 'react'
import pathToRegexp from 'path-to-regexp'

const patternCache = { true: {}, false: {} }

const compilePattern = (pattern, exact) => {
  const cache = patternCache[exact]

  if (!cache[pattern]) {
    const keys = []
    const re = pathToRegexp(pattern, keys, { end: exact, strict: true })
    cache[pattern] = { re, keys }
  }

  return cache[pattern]
}

const matchPattern = (pattern, exact, pathname) => {
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

const createProps = (action, location, match) => ({
  action,
  location,
  params: match ? match.params : {},
  pathname: match ? match.pathname : '',
  isExact: match ? match.isExact : false,
  matched: match != null
})

const createElement = ({ render, component, children }, props) => (
  render ? ( // render prop gets first priority, only called if there's a match
    props.matched ? render(props) : null
  ) : component ? ( // component prop is next, only called if there's a match
    props.matched ? React.createElement(component, props) : null
  ) : children ? ( // children come last, always called
    typeof children === 'function' ? children(props) : React.Children.only(children)
  ) : (
    null
  )
)

/**
 * The public API for rendering a <Router> that matches a single route.
 */
export const Route = ({ path, exact, ...renderProps }) => (
  <Router
    match={(action, location) => ({
      props: createProps(action, location, matchPattern(path, exact, location.pathname))
    })}
    children={({ props }) => (
      createElement(renderProps, props)
    )}
  />
)

Route.propTypes = {
  path: PropTypes.string,
  exact: PropTypes.bool,
  render: PropTypes.func, // TODO: Warn when used with other render props
  component: PropTypes.func, // TODO: Warn when used with other render props
  children: PropTypes.oneOfType([ // TODO: Warn when used with other render props
    PropTypes.func,
    PropTypes.node
  ])
}

Route.defaultProps = {
  exact: false
}

/**
 * The public API for rendering a <Router> that matches the first
 * of many child <Route>s.
 */
export const Switch = ({ children }) => {
  const routes = React.Children.toArray(children)

  return (
    <Router
      match={(action, location) => {
        let child, match
        for (let i = 0, length = routes.length; match == null && i < length; ++i) {
          child = routes[i]
          match = matchPattern(child.props.path, child.props.exact, location.pathname)
        }

        return {
          props: createProps(action, location, match),
          child
        }
      }}
      children={({ props, child }) => {
        let element
        if (props.matched && (element = createElement(child.props, props)))
          return React.cloneElement(element, { key: child.key }) // preserve child key

        return null
      }}
    />
  )
}

Switch.propTypes = {
  children: PropTypes.node
}

/**
 * The low-level public API for subscribing to location updates
 * and rendering stuff when the location changes.
 */
export class Router extends React.Component {
  static contextTypes = {
    history: PropTypes.shape({
      action: PropTypes.oneOf([ 'PUSH', 'REPLACE', 'POP' ]).isRequired,
      location: PropTypes.shape({
        pathname: PropTypes.string.isRequired
      }).isRequired,
      listen: PropTypes.func.isRequired
    }).isRequired
  }

  static propTypes = {
    match: PropTypes.func,
    children: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.node
    ])
  }

  static defaultProps = {
    match: (action, location) => ({ props: { action, location } })
  }

  static childContextTypes = {
    history: PropTypes.object.isRequired
  }

  getChildContext() {
    const { action, location } = this.state

    this.childContextHistory = {
      ...this.context.history,
      action, location, // overwrite action/location
      listen: this.listen // overwrite listen
    }

    return {
      history: this.childContextHistory
    }
  }

  listen = (listener) => {
    this.listeners.push(listener)

    return () => {
      this.listeners = this.listeners.filter(item => item !== listener)
    }
  }

  getRoute(action, location) {
    const route = this.props.match(action, location)

    return {
      ...route,
      props: { ...route.props, history: this.context.history }
    }
  }

  handleRouteChange = () => {
    const { action, location } = this.context.history
    const route = this.getRoute(action, location)
    const state = this.nextState = { action, location, route }
    const child = this.child

    if (child && typeof child.routeWillChange === 'function') {
      child.routeWillChange.call(child, route.props, () => {
        // Ensure the route didn't change since we invoked routeWillChange.
        if (this.nextState === state)
          this.finishRouteChange(state)
      })
    } else {
      this.finishRouteChange(state)
    }
  }

  finishRouteChange = (state) => {
    this.setState(state)

    Object.assign(this.childContextHistory, {
      action: state.action,
      location: state.location
    })

    this.listeners.forEach(listener => listener())
  }

  updateChild = (child) => {
    this.child = child
  }

  state = {
    action: null,
    location: null,
    route: null
  }

  componentWillMount() {
    this.listeners = []

    const { action, location } = this.context.history
    const route = this.getRoute(action, location)

    this.setState({ action, location, route })
  }

  componentDidMount() {
    this.unlisten = this.context.history.listen(this.handleRouteChange)
  }

  componentWillUnmount() {
    this.unlisten()
  }

  render() {
    const { children } = this.props
    const { action, location, route } = this.state

    const element = typeof children === 'function' ? (
      children(route)
    ) : children ? (
      React.Children.only(children)
    ) : (
      null
    )

    return element && React.cloneElement(element, {
      ref: this.updateChild
    })
  }
}
