import { PropTypes } from 'react'

import deprecateObjectProperties from './deprecateObjectProperties'
import * as InternalPropTypes from './InternalPropTypes'
import warning from './routerWarning'

const { func, object, shape, string } = PropTypes

export const routerShape = shape({
  push: func.isRequired,
  replace: func.isRequired,
  go: func.isRequired,
  goBack: func.isRequired,
  goForward: func.isRequired,
  setRouteLeaveHook: func.isRequired,
  isActive: func.isRequired
})

export const locationShape = shape({
  pathname: string.isRequired,
  search: string.isRequired,
  state: object,
  action: string.isRequired,
  key: string
})

// Deprecated stuff below:

export let falsy = InternalPropTypes.falsy
export let history = InternalPropTypes.history
export let location = locationShape
export let component = InternalPropTypes.component
export let components = InternalPropTypes.components
export let route = InternalPropTypes.route
export let routes = InternalPropTypes.routes
export let router = routerShape

if (__DEV__) {
  const deprecatePropType = (propType, message) => (...args) => {
    warning(false, message)
    return propType(...args)
  }

  const deprecateInternalPropType = propType => (
    deprecatePropType(propType, 'This prop type is not intended for external use, and was previously exported by mistake. These internal prop types are deprecated for external use, and will be removed in a later version.')
  )

  const deprecateRenamedPropType = (propType, name) => (
    deprecatePropType(propType, `The \`${name}\` prop type is now exported as \`${name}Shape\` to avoid name conflicts. This export is deprecated and will be removed in a later version.`)
  )

  falsy = deprecateInternalPropType(falsy)
  history = deprecateInternalPropType(history)
  component = deprecateInternalPropType(component)
  components = deprecateInternalPropType(components)
  route = deprecateInternalPropType(route)
  routes = deprecateInternalPropType(routes)

  location = deprecateRenamedPropType(location, 'location')
  router = deprecateRenamedPropType(router, 'router')
}

let defaultExport = {
  falsy,
  history,
  location,
  component,
  components,
  route,
  // For some reason, routes was never here.
  router
}

if (__DEV__) {
  defaultExport = deprecateObjectProperties(defaultExport, 'The default export from `react-router/lib/PropTypes` is deprecated. Please use the named exports instead.')
}

export default defaultExport
