import React from 'react'
import PropTypes from 'prop-types'
import hoistStatics from 'hoist-non-react-statics'
import Route from './Route'

/**
 * A public higher-order component to access the imperative API
 */
const withRouter = (Component) => {
  class C extends React.Component {
    static displayName = `withRouter(${Component.displayName || Component.name})`

    static WrappedComponent = Component

    static propTypes = {
      wrappedComponentRef: PropTypes.func
    }

    render() {
      const { wrappedComponentRef, ...remainingProps } = this.props
      return (
        <Route render={routeComponentProps => (
          <Component {...remainingProps} {...routeComponentProps} ref={wrappedComponentRef}/>
        )}/>
      )
    }
  }

  return hoistStatics(C, Component)
}

export default withRouter
