import React from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { routerShape } from './PropTypes'
import warning from './routerWarning'


function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

export default function withRouter(WrappedComponent, options) {
  const WithRouter = React.createClass({
    contextTypes: { router: routerShape },
    propTypes: { router: routerShape },
    getWrappedInstance() {
      warning(options && options.withRef, 'To access the wrappedInstance you must provide {withRef : true} as the first argument of the withRouter call')
      return this.refs.wrappedInstance
    },
    render() {
      const router = this.props.router || this.context.router
      if(options && options.withRef) {
        return <WrappedComponent {...this.props} ref="wrappedInstance" router={router} />
      }else{
        return <WrappedComponent {...this.props} router={router} />
      }
    }
  })

  WithRouter.displayName = `withRouter(${getDisplayName(WrappedComponent)})`
  WithRouter.WrappedComponent = WrappedComponent

  return hoistStatics(WithRouter, WrappedComponent)
}
