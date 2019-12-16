/*
 * Copyright (c) 2019 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { createElement } from 'react'
import RouterContext from './RouterContext'
import warning from './routerWarning'

export default (...middlewares) => {
  if (__DEV__) {
    middlewares.forEach((middleware, index) => {
      warning(
        middleware.renderRouterContext || middleware.renderRouteComponent,
        `The middleware specified at index ${index} does not appear to be ` +
        'a valid One App Router middleware.'
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

