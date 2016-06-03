import React, { PropTypes } from 'react'
import History from './History'
import MatchCountProvider from './MatchCountProvider'
import Match from './Match'
import FuncOrNode from './FuncOrNode'
import { funcOrNode } from './PropTypes'

class Router extends React.Component {
  static propTypes = {
    history: PropTypes.object,
    children: funcOrNode
  }

  render() {
    const { children, ...rest } = this.props

    return (
      <History {...rest}>
        <MatchCountProvider isTerminal={true}>
          <Match pattern="/" children={(props) => (
            <FuncOrNode children={children} props={props}/>
          )}/>
        </MatchCountProvider>
      </History>
    )
  }
}

export default Router
