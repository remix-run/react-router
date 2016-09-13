import React, { PropTypes } from 'react'
import StaticRouter from './StaticRouter'

class ServerRouter extends React.Component {

  static propTypes = {
    context: PropTypes.object.isRequired,
    location: PropTypes.string.isRequired,
    children: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.node
    ])
  }

  static childContextTypes = {
    serverRouter: PropTypes.object.isRequired
  }

  getChildContext() {
    return {
      serverRouter: this.props.context
    }
  }

  render() {
    const { context, ...rest } = this.props
    const redirect = (location) => {
      context.setRedirect(location)
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
