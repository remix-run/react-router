import invariant from 'invariant'
import React from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { routerShape } from './PropTypes'

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

export default function withRouter(WrappedComponent, options) {
  const withRef = options && options.withRef

  const WithRouter = React.createClass({
    contextTypes: { router: routerShape },
    propTypes: { router: routerShape },

    getWrappedInstance() {
      invariant(
        withRef,
        'To access the wrapped instance, you need to specify ' +
        '`{ withRef: true }` as the second argument of the withRouter() call.'
      )

      return this.wrappedInstance
    },

    render() {
      const router = this.props.router || this.context.router
      const props = { ...this.props, router }

      if (withRef) {
        props.ref = (c) => { this.wrappedInstance = c }
      }

      return <WrappedComponent {...props} />
    }
  })

  WithRouter.displayName = `withRouter(${getDisplayName(WrappedComponent)})`
  WithRouter.WrappedComponent = WrappedComponent

  return hoistStatics(WithRouter, WrappedComponent)
}
