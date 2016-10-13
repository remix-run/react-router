import React, { Component } from 'react'
import { historyContext } from 'react-history/PropTypes'
import { routerContext } from './PropTypes'
import { LocationSubscriber } from './Broadcasts'

const withRouter = (WrappedComponent) => {
  class WithRouter extends Component {
    static contextTypes = {
      history: historyContext,
      router: routerContext
    }

    render() {
      return (
        <LocationSubscriber>
          {(locationContext) => {
            const history = { ...this.context.history }
            delete history.location
            return (
              <WrappedComponent
                {...this.props}
                location={locationContext}
                history={history}
                router={this.context.router}
              />
            )
          }}
        </LocationSubscriber>
      )
    }
  }
  return WithRouter
}

export default withRouter
