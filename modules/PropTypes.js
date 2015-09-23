export default function createPropTypes(React) {

  const { func, object, arrayOf, oneOfType, element, shape, string } = React.PropTypes

  function falsy(props, propName, componentName) {
    if (props[propName])
      return new Error(`<${componentName}> should not have a "${propName}" prop`)
  }

  const history = shape({
    listen: func.isRequired,
    pushState: func.isRequired,
    replaceState: func.isRequired,
    go: func.isRequired
  })

  const location = shape({
    pathname: string.isRequired,
    search: string.isRequired,
    state: object,
    action: string.isRequired,
    key: string
  })

  const component = oneOfType([ func, string ])
  const components = oneOfType([ component, object ])
  const route = oneOfType([ object, element ])
  const routes = oneOfType([ route, arrayOf(route) ])

  return {
    falsy,
    history,
    location,
    component,
    components,
    route,
    routes
  }

}
