import { func, object, arrayOf, oneOfType, element, shape, elementType } from 'prop-types'

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

export const component = elementType
export const components = oneOfType([ component, object ])
export const route = oneOfType([ object, element ])
export const routes = oneOfType([ route, arrayOf(route) ])
