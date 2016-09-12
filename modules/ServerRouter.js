import React, { PropTypes } from 'react'
import StaticRouter from './StaticRouter'
import { location as locationType } from './PropTypes'

class ServerRouter extends React.Component {

  static propTypes = {
    result: PropTypes.object,
    location: locationType,
    children: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.node
    ])
  }

  static childContextTypes = {
    serverResult: PropTypes.object.isRequired
  }

  getChildContext() {
    return {
      serverResult: this.props.result
    }
  }

  render() {
    const { result, ...rest } = this.props
    const redirect = (location, state) => {
      if (!result.redirect) {
        result.redirect = { location, state }
      }
    }
    return (
      <StaticRouter
        action="POP"
        location={location}
        onReplace={redirect}
        onPush={redirect}
        {...rest}
      />
    )
  }
}

export default ServerRouter
