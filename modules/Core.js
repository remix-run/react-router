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

const createProps = (history, match) => ({
  history,
  action: history.action,
  location: history.location,
  params: match ? match.params : {},
  pathname: match ? match.pathname : '',
  isExact: match ? match.isExact : false,
  matched: match != null
})

const createElement = ({ component, render, children }, props) => (
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
 * The public API for rendering a <Router> that matches a single route.
 */
export const Route = ({ path, exact, ...renderProps }) => (
  <Router
    children={history => {
      const match = matchPattern(path, exact, history.location.pathname)
      return createElement(renderProps, createProps(history, match))
    }}
  />
)

Route.propTypes = {
  path: PropTypes.string,
  exact: PropTypes.bool,
  component: PropTypes.func, // TODO: Warn when used with other render props
  render: PropTypes.func, // TODO: Warn when used with other render props
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
      children={history => {
        const { pathname } = history.location

        let route, match
        for (let i = 0, length = routes.length; match == null && i < length; ++i) {
          route = routes[i]
          match = matchPattern(route.props.path, route.props.exact, pathname)
        }

        if (match) {
          const element = createElement(route.props, createProps(history, match))
          return React.cloneElement(element, { key: route.key }) // preserve route.key
        }

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
export const Router = ({ children }, context) => (
  typeof children === 'function' ? (
    children(context.history)
  ) : children ? (
    React.Children.only(children)
  ) : (
    null
  )
)

Router.contextTypes = {
  history: PropTypes.object.isRequired
}

Router.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node
  ])
}
