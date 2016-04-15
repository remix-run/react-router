import React, { createElement } from 'react'
import RouterContext from './RouterContext'

export default (...middlewares) => {
  const withContext = middlewares.map(m => m.renderRouterContext).filter(f => f)
  const withComponent = middlewares.map(m => m.renderRouteComponent).filter(f => f)
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

