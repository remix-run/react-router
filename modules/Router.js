import React, { PropTypes } from 'react'
import History from './History'
import MatchCountProvider from './MatchCountProvider'

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
        {({ location }) => (
          <MatchCountProvider>
            {typeof children === 'function' ? (
              children({ location })
            ) : React.Children.count(children) === 1 ? (
              children
            ) : (
              <div>{children}</div>
            )}
          </MatchCountProvider>
        )}
      </History>
    )
  }
}

export default Router
