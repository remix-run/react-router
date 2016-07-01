import React from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { routerShape } from './PropTypes'

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

export default function withRouter(WrappedComponent) {
  const WithRouter = React.createClass({
    contextTypes: { router: routerShape },
    getWrappedInstance() {
      return this.refs.wrappedInstance
    },
    render() {
      return <WrappedComponent {...this.props} router={this.context.router} ref="wrappedInstance"/>
    }
  })

  WithRouter.displayName = `withRouter(${getDisplayName(WrappedComponent)})`
  WithRouter.WrappedComponent = WrappedComponent

  return hoistStatics(WithRouter, WrappedComponent)
}
