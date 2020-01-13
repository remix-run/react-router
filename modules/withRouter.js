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

import invariant from 'invariant'
import React from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { Context as RouterContext } from './RouterContext'
import { routerShape } from './PropTypes'

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

export default function withRouter(WrappedComponent, options) {
  const withRef = options && options.withRef

  class WithRouter extends React.Component {
    static displayName = 'WithRouter'
    static contextType = RouterContext
    static propTypes = { router: routerShape }

    getWrappedInstance = () => {
      invariant(
        withRef,
        'To access the wrapped instance, you need to specify ' +
        '`{ withRef: true }` as the second argument of the withRouter() call.'
      )

      return this.wrappedInstance
    }

    render() {
      const router = this.props.router || this.context.router
      if (!router) {
        return <WrappedComponent {...this.props} />
      }

      const { params, location, routes } = router
      const props = { ...this.props, router, params, location, routes }

      if (withRef) {
        props.ref = (c) => { this.wrappedInstance = c }
      }

      return <WrappedComponent {...props} />
    }
  }

  WithRouter.displayName = `withRouter(${getDisplayName(WrappedComponent)})`
  WithRouter.WrappedComponent = WrappedComponent

  return hoistStatics(WithRouter, WrappedComponent)
}
