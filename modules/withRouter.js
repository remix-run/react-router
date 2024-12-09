import React from 'react'
import hoistStatics from 'hoist-non-react-statics'
import { routerContext } from './RouterContext'

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

export default function withRouter(WrappedComponent) {
  function WithRouter(props) {
    const routerFromContext = React.useContext(routerContext)

    const router = props.router || routerFromContext
    if (!router) {
      return <WrappedComponent {...props} />
    }

    const { params, location, routes } = router
    const propsWithRouter = { ...props, router, params, location, routes }

    return <WrappedComponent {...propsWithRouter} />
  }

  WithRouter.displayName = `withRouter(${getDisplayName(WrappedComponent)})`
  WithRouter.WrappedComponent = WrappedComponent

  return hoistStatics(WithRouter, WrappedComponent)
}
