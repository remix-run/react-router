import React, { PropTypes } from 'react'
import History from './History'
import MatchCountProvider from './MatchCountProvider'

const Router = ({ children, ...rest }) => (
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

Router.propTypes = {
  history: PropTypes.object,
  children: PropTypes.oneOfType([ PropTypes.node, PropTypes.func ])
}

export default Router
