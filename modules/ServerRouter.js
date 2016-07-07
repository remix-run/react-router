import React, { PropTypes } from 'react'
import Router from './Router'
import createMemoryHistory from 'history/lib/createMemoryHistory'
import useQueries from 'history/lib/useQueries'

class ServerRouter extends React.Component {
  static propTypes = {
    history: PropTypes.object,
    location: PropTypes.oneOfType([ PropTypes.object, PropTypes.string ]),
    onRedirect: PropTypes.func.isRequired,
    children: PropTypes.oneOfType([ PropTypes.node, PropTypes.func ])
  }

  componentWillMount() {
    const { history, location } = this.props
    const loc = typeof location === 'string' ? { pathname: location } : location
    this.history = history || useQueries(createMemoryHistory)([ loc ])
    this.history.listenBefore((location) => {
      this.props.onRedirect(location)
      return false
    })
  }

  render() {
    const { location, history, ...rest } = this.props // eslint-disable-line
    return <Router {...rest} history={this.history} />
  }
}

export default ServerRouter
