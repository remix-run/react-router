import React from 'react'
import RouterContext from './RouterContext'
import warning from 'warning'

class RoutingContext extends React.Component {
  componentWillMount() {
    warning(false, '`RoutingContext` has been renamed to `RouterContext`. Please use `import { RouterContext } from \'react-router\'.`')
  }

  render() {
    return <RouterContext {...this.props}/>
  }
}

export default RoutingContext
