import React from 'react'

function isValidChild(object) {
  return object == null || React.isValidElement(object)
}

export function isReactChildren(object) {
  return isValidChild(object) || (Array.isArray(object) && object.every(isValidChild))
}

function createRoute(defaultProps, props) {
  return { ...defaultProps, ...props }
}

export function createRouteFromReactElement(element, parentRoute, externalContext) {
  const type = element.type
  const route = createRoute(type.defaultProps, element.props)

  if (route.children) {
    const childRoutes = createRoutesFromReactChildren(route.children, route, externalContext)

    if (childRoutes.length)
      route.childRoutes = childRoutes

    delete route.children
  }

  return route
}

/**
 * Creates and returns a routes object from the given ReactChildren. JSX
 * provides a convenient way to visualize how routes in the hierarchy are
 * nested.
 *
 *   import { Route, createRoutesFromReactChildren } from 'react-router'
 *
 *   const routes = createRoutesFromReactChildren(
 *     <Route component={App}>
 *       <Route path="home" component={Dashboard}/>
 *       <Route path="news" component={NewsFeed}/>
 *     </Route>
 *   )
 *
 * Note: This method is automatically used when you provide <Route> children
 * to a <Router> component.
 */
export function createRoutesFromReactChildren(children, parentRoute, externalContext) {
  const routes = []

  React.Children.forEach(children, function (element) {
    if (React.isValidElement(element)) {
      // Component classes may have a static create* method.
      if (element.type.createRouteFromReactElement) {
        const route = element.type.createRouteFromReactElement(element, parentRoute, externalContext)

        if (route)
          routes.push(route)
      } else {
        routes.push(createRouteFromReactElement(element, null, externalContext))
      }
    }
  })

  return routes
}

/**
 * Creates and returns an array of routes from the given object which
 * may be a JSX route, a plain object route, or an array of either.
 */
export function createRoutes(routes, externalContext) {
  if (isReactChildren(routes)) {
    routes = createRoutesFromReactChildren(routes, null, externalContext)
  } else if (routes && !Array.isArray(routes)) {
    routes = [ routes ]
  }

  return routes
}
