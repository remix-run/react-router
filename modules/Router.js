import React, { PropTypes } from 'react'
import History from './History'
import MatchCountProvider from './MatchCountProvider'
import Match from './Match'

class Router extends React.Component {
  static propTypes = {
    history: PropTypes.object,
    children: PropTypes.oneOfType([ PropTypes.node, PropTypes.func ]),
    render: PropTypes.func,
    component: PropTypes.func
  }

  render() {
    const { children, ...rest } = this.props

    return (
      <History {...rest}>
        <MatchCountProvider match={{ isTerminal: true }}>
          <Match pattern="/" render={(props) => (
            typeof children === 'function' ? (
              children(props)
            ) : React.Children.count(children) === 1 ? (
              children
            ) : (
              <div>{children}</div>
            )
          )}/>
        </MatchCountProvider>
      </History>
    )
  }
}

export default Router
