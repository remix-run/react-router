import React from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { ContextSubscriber } from './ContextUtils'
import { routerShape } from './PropTypes'

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

export default function withRouter(WrappedComponent) {
  const WithRouter = React.createClass({
    mixins: [ ContextSubscriber('router') ],

    contextTypes: { router: routerShape },

    render() {
      const { router } = this.context
      const { params, location, routes } = router
      return (
        <WrappedComponent
          {...this.props}
          router={router}
          params={params}
          location={location}
          routes={routes}
        />
      )
    }
  })

  WithRouter.displayName = `withRouter(${getDisplayName(WrappedComponent)})`
  WithRouter.WrappedComponent = WrappedComponent

  return hoistStatics(WithRouter, WrappedComponent)
}
