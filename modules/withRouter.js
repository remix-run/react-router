import React from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { routerShape } from './PropTypes'
import warning from './routerWarning'

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}
export default function withRouter(options) {
  const wrapWithRouter = function (WrappedComponent) {
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

  if(typeof(options) === 'function') {
    warning(false,'passing a component to the first invocation of withRouter has been depreciated, withRouter'+ 
    'now needs to be invoked twice, once to pass the options through, and a second time with the component eg. withRouter()(MyComponent) or withRouter({withRef:true})(MyComponent)')
    return wrapWithRouter(options)
  }else{
    return wrapWithRouter
  }
}
