import { PropTypes } from 'react'

const { func, object, arrayOf, oneOfType, element, shape, string } = PropTypes

export function falsy(props, propName, componentName) {
  if (props[propName])
    return new Error(`<${componentName}> should not have a "${propName}" prop`)
}

export const history = shape({
  listen: func.isRequired,
  push: func.isRequired,
  replace: func.isRequired,
  go: func.isRequired,
  goBack: func.isRequired,
  goForward: func.isRequired
})

export const location = shape({
  pathname: string.isRequired,
  search: string.isRequired,
  state: object,
  action: string.isRequired,
  key: string
})

export const component = oneOfType([ func, string ])
export const components = oneOfType([ component, object ])
export const route = oneOfType([ object, element ])
export const routes = oneOfType([ route, arrayOf(route) ])

export const router = shape({
  push: func.isRequired,
  replace: func.isRequired,
  go: func.isRequired,
  goBack: func.isRequired,
  goForward: func.isRequired,
  setRouteLeaveHook: func.isRequired,
  isActive: func.isRequired
})

export default {
  history,
  location,
  router
}
