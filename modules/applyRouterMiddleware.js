import React, { createElement } from 'react'
import RouterContext from './RouterContext'
import warning from './routerWarning'

export default (...middlewares) => {
  if (__DEV__) {
    middlewares.forEach((middleware, index) => {
      warning(
        middleware.renderRouterContext || middleware.renderRouteComponent,
        `The middleware specified at index ${index} does not appear to be ` +
        'a valid React Router middleware.'
      )
    })
  }

  const withContext = middlewares
    .map(middleware => middleware.renderRouterContext)
    .filter(Boolean)
  const withComponent = middlewares
    .map(middleware => middleware.renderRouteComponent)
    .filter(Boolean)

  const makeCreateElement = (baseCreateElement = createElement) => (
    (Component, props) => (
      withComponent.reduceRight(
        (previous, renderRouteComponent) => (
          renderRouteComponent(previous, props)
        ), baseCreateElement(Component, props)
      )
    )
  )

  return (renderProps) => (
    withContext.reduceRight(
      (previous, renderRouterContext) => (
        renderRouterContext(previous, renderProps)
      ), (
        <RouterContext
          {...renderProps}
          createElement={makeCreateElement(renderProps.createElement)}
        />
      )
    )
  )
}

