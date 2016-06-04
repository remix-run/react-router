import React, { PropTypes } from 'react'
import History from './History'
import MatchCountProvider from './MatchCountProvider'
import Match from './Match'
import MultiRender from './MultiRender'

class Router extends React.Component {
  static propTypes = {
    history: PropTypes.object,
    children: PropTypes.node,
    render: PropTypes.func,
    component: PropTypes.func
  }

  render() {
    const { children, component, render, ...rest } = this.props

    return (
      <History {...rest}>
        <MatchCountProvider isTerminal={true}>
          <Match pattern="/" render={(props) => (
            <MultiRender
              props={props}
              children={children}
              render={render}
              component={component}
            />
          )}/>
        </MatchCountProvider>
      </History>
    )
  }
}

export default Router
