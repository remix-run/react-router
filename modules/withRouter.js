import React from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { routerShape } from './PropTypes'

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

export default function withRouter(WrappedComponent) {
  const WithRouter = React.createClass({
    contextTypes: { router: routerShape },
    propTypes: { router: routerShape },
    render() {
      const router = this.props.router || this.context.router
      return <WrappedComponent {...this.props} router={router} />
    }
  })

  WithRouter.displayName = `withRouter(${getDisplayName(WrappedComponent)})`
  WithRouter.WrappedComponent = WrappedComponent

  return hoistStatics(WithRouter, WrappedComponent)
}
