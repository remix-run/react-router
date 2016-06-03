import React, { PropTypes } from 'react'
import createBrowserHistory from 'history/lib/createBrowserHistory'
import FuncOrNode from './FuncOrNode'
import funcOrNode from './PropTypes'

const warning = () => {}

const makeProvider = (contextName, type, displayName) => (
  class ContextProvider extends React.Component {
    static displayName = displayName

    static propTypes = {
      children: PropTypes.node
    }

    static childContextTypes = {
      [contextName]: type
    }

    getChildContext() {
      return {
        [contextName]: this.props[contextName]
      }
    }

    render() {
      return React.Children.only(this.props.children)
    }
  }
)

const HistoryProvider = makeProvider('history', PropTypes.object, 'HistoryProvider')
const LocationProvider = makeProvider('location', PropTypes.object, 'LocationProvider')
const isBrowserEnvironment = typeof window === 'object'

const locationType = (props, propName, componentName) => {
  const error = object(props, propName, componentName)

  if (error)
    return error

  if (props[propName] && typeof props.onChange !== 'function' && isBrowserEnvironment) {
    // TODO: Add link to history docs for onChange usage.
    return new Error(
      'You provided a `location` prop to a <History> component without an `onChange` handler. ' +
      'This will make the back/forward buttons and the address bar unusable. If you intend to let the ' +
      'user navigate using the browser\'s built-in controls, use `defaultLocation` with a `history` prop. ' +
      'Otherwise, set `onChange`.'
    )
  }
}

class History extends React.Component {
  static propTypes = {
    location: locationType,
    onChange: PropTypes.func,
    history: PropTypes.object,
    children: funcOrNode
  }

  static defaultProps = {
    history: createBrowserHistory()
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
      // FIXME: I don't think this is right
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
    const { children, history } = this.props
    const { location } = this.isControlled() ? this.props : this.state
    return (
      <HistoryProvider history={history}>
        <LocationProvider location={location}>
          <FuncOrNode props={{ location }} children={children}/>
        </LocationProvider>
      </HistoryProvider>
    )
  }
}

export default History
