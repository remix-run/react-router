import React, { PropTypes } from 'react'
import Router from './Router'
import createMemoryHistory from 'history/lib/createMemoryHistory'
import useQueries from 'history/lib/useQueries'

const { object, string, func, node, oneOfType } = PropTypes

class ServerRouter extends React.Component {

  static propTypes = {
    history: object,
    location: oneOfType([ object, string ]),
    onRedirect: func.isRequired,
    children: oneOfType([ node, func ])
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
