import invariant from 'invariant'
import React, { Component, PropTypes } from 'react'
import { Router, Route } from 'react-router'

import { LOCATION_CHANGE } from './reducer'

class ConnectedRouter extends Component {
  static propTypes = {
    store: PropTypes.object,
    history: PropTypes.object,
    children: PropTypes.node
  }

  static contextTypes = {
    store: PropTypes.object
  }

  state = {
    history: null,
    location: {
      key: null
    }
  }
  
  unlisten = null

  componentWillMount() {
    const { children } = this.props

    invariant(
      children == null || React.Children.count(children) === 1,
      'A <ConnectedRouter> may have only one child element'
    )
  }

  componentDidMount() {
    this.handleProps(this.props)
    this.handleLocation(this.props.history.location)
  }
  
  componentDidUpdate() {
    this.handleProps(this.props)
  }
  
  componentWillUnmount() {
    if (this.unlisten) {
      this.unlisten()
    }
  }

  handleProps(props) {
    const { history } = props
    if (history !== this.state.history) {
      if (this.unlisten) {
        this.unlisten()
      }
      this.setState({ history, location: history.location })
      this.unlisten = history.listen(this.handleLocation.bind(this))
    }
  }
  
  handleLocation(nextLocation) {
    const store = this.props.store || this.context.store
    if (nextLocation.key !== this.state.location.key) {
      this.setState({
        location: nextLocation
      }, () => store.dispatch({
        type: LOCATION_CHANGE,
        payload: nextLocation
      }));
    }
  }

  render() {
    return <Router {...this.props} />;
  }
}

export default ConnectedRouter
