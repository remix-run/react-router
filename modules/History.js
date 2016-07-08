import React, { PropTypes } from 'react'
import createBrowserHistory from 'history/lib/createBrowserHistory'
import useQueries from 'history/lib/useQueries'
import {
  history as historyType,
  location as locationType
} from './PropTypes'

const warning = () => {}

const isBrowserEnvironment = typeof window === 'object'

const controlledLocationType = (props, propName, componentName) => {
  if (props[propName]) {
    const error = locationType(props, propName, componentName)

    if (error)
      return error

    if (typeof props.onChange !== 'function' && isBrowserEnvironment) {
      return new Error(
        'You provided a `location` prop to a <History> component without an `onChange` handler. ' +
        'This will make the back/forward buttons and the address bar unusable. If you intend to ' +
        'let the user navigate using the browser\'s built-in controls, use `defaultLocation` with ' +
        'a `history` prop. Otherwise, set `onChange`.'
      )
    }
  }
}

class History extends React.Component {
  static propTypes = {
    history: historyType,
    location: controlledLocationType,
    onChange: PropTypes.func,
    children: PropTypes.oneOfType([ PropTypes.node, PropTypes.func ]),
    render: PropTypes.func,
    component: PropTypes.func
  }

  static defaultProps = {
    history: useQueries(createBrowserHistory)()
  }

  static childContextTypes = {
    location: locationType
  }

  getChildContext() {
    const { location } = this.isControlled() ? this.props : this.state

    return {
      location
    }
  }

  state = {
    location: null
  }

  unlisten = null

  unlistenBefore = null

  // need to teardown and setup in cWRP too
  componentWillMount() {
    if (this.isControlled()) {
      this.listenBefore()
    } else {
      this.listen()
    }
  }

  componentWillReceiveProps(nextProps) {
    warning(
      nextProps.history === this.props.history,
      'Don’t change the history please. Thanks.'
    )

    if (nextProps.location && this.props.location == null) {
      this.switchToControlled()
    } else if (!nextProps.location && this.props.location) {
      this.switchToUncontrolled()
    }

    if (nextProps.location !== this.props.location) {
      this.transitioning = true

      const { location } = nextProps
      const { history } = this.props

      if (location.action === 'PUSH') {
        history.push(location)
      } else {
        history.replace(location)
      }
    }
  }

  isControlled() {
    return !!this.props.location
  }

  listen() {
    const { history } = this.props

    this.setState({
      location: history.getCurrentLocation()
    })

    this.unlisten = history.listen(location => {
      this.setState({ location })
    })
  }

  listenBefore() {
    const { history, onChange } = this.props

    this.unlistenBefore = history.listenBefore((location) => {
      if (!this.transitioning) {
        if (onChange)
          onChange(location)

        return false
      } else {
        this.transitioning = false
        return true
      }
    })
  }

  switchToControlled() {
    this.unlisten()
    this.unlisten = null
    this.listen()
  }

  switchToUncontrolled() {
    this.unlistenBefore()
    this.unlistenBefore = null
    this.listen()
  }

  render() {
    const { children } = this.props
    const { location } = this.isControlled() ? this.props : this.state

    return (
      typeof children === 'function' ? children({ location }) : children
    )
  }
}

export default History
