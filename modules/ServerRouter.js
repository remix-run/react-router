import React, { PropTypes } from 'react'
import StaticRouter from './StaticRouter'
import { location as locationType } from './PropTypes'

class ServerRouterProvider extends React.Component {

  static propTypes = {
    children: PropTypes.node,
    onMiss: PropTypes.func
  }

  static childContextTypes = {
    serverRouter: PropTypes.object.isRequired
  }

  static defaultProps = {
    onMiss: () => {}
  }

  getChildContext() {
    return {
      serverRouter: {
        onMiss: this.props.onMiss
      }
    }
  }

  render() {
    return this.props.children
  }
}

const ServerRouter = ({ location, onRedirect, onMiss, ...rest }) => (
  <ServerRouterProvider onMiss={onMiss}>
    <StaticRouter
      action="POP"
      location={location}
      onReplace={onRedirect}
      onPush={() => {}}
      {...rest}
    />
  </ServerRouterProvider>
)

ServerRouter.propTypes = {
  onRedirect: PropTypes.func.isRequired,
  onMiss: PropTypes.func.isRequired,
  location: PropTypes.oneOfType([
    locationType,
    PropTypes.string
  ]).isRequired,
  children: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node
  ])
}

export default ServerRouter
