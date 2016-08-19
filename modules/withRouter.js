import React from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { routerShape } from './PropTypes'
import warning from './routerWarning'


function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

export default function withRouter(WrappedComponent, options) {
  const { withRef } = options || {}

  const WithRouter = React.createClass({
    contextTypes: { router: routerShape },
    propTypes: { router: routerShape },

    getWrappedInstance() {
      warning(withRef, 'To access the wrappedInstance you must provide { withRef: true } as the second argument of the withRouter call')
      return this.wrappedComponent
    },

    render() {
      const { router, ...props } = this.props

      if (withRef) props.ref = component =>this.wrappedComponent = component

      return <WrappedComponent {...props} router={router || this.context.router} />
    }
  })

  WithRouter.displayName = `withRouter(${getDisplayName(WrappedComponent)})`
  WithRouter.WrappedComponent = WrappedComponent

  return hoistStatics(WithRouter, WrappedComponent)
}
