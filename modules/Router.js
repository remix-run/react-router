import React, { PropTypes } from 'react'
import History from './History'
import StaticRouter from './StaticRouter'
import {
  history as historyType,
  location as locationType
} from './PropTypes'

class Router extends React.Component {

  static propTypes = {
    history: historyType,
    location: locationType,
    children: PropTypes.oneOfType([ PropTypes.node, PropTypes.func ]),
    onChange: PropTypes.func
  }

  render() {
    const { children, history, location, onChange } = this.props

    return (
      <History
        history={history}
        location={location}
        onChange={onChange}
      >
        {({ location }) => (
          <StaticRouter
            location={location}
            createHref={history.createHref}
            onPush={history.push}
            onReplace={history.replace}
            blockTransitions={history.listenBefore}
            children={children}
          />
        )}
      </History>
    )
  }
}

export default Router
