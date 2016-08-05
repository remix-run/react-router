import warning from 'warning'
import React, { PropTypes } from 'react'
import HistoryContext from './HistoryContext'
import DOMStateStorage from './DOMStateStorage'
import { addEventListener, removeEventListener, supportsHistory, supportsPopStateOnHashChange } from './DOMUtils'
import {
  stateStorage as stateStorageType
} from './PropTypes'

const PopStateEvent = 'popstate'
const HashChangeEvent = 'hashchange'

const getHistoryState = () => {
  try {
    return window.history.state || {}
  } catch (e) {
    // IE 11 sometimes throws when accessing window.history.state
    // See https://github.com/ReactTraining/history/pull/289
    return {}
  }
}

/**
 * A history that uses the HTML5 history API with automatic fallback
 * to full page refreshes in older browsers.
 */
class BrowserHistory extends React.Component {
  static propTypes = {
    children: PropTypes.func.isRequired,
    keyLength: PropTypes.number,
    stateStorage: stateStorageType
  }

  static defaultProps = {
    keyLength: 6,
    stateStorage: DOMStateStorage
  }

  state = {
    location: null
  }

  createKey() {
    return Math.random().toString(36).substr(2, this.props.keyLength)
  }

  createLocation(historyState) {
    const key = historyState && historyState.key
    const { pathname, search, hash } = window.location

    return {
      path: pathname + search + hash,
      state: key ? this.props.stateStorage.readState(key) : undefined,
      key
    }
  }

  handlePopState = (event) => {
    if (event.state !== undefined) // Ignore extraneous popstate events in WebKit.
      this.setState({
        location: this.createLocation(event.state)
      })
  }

  handleHashChange = () => {
    this.setState({
      location: this.createLocation(getHistoryState())
    })
  }

  handlePush = (path, state) => {
    if (!this.supportsHistory) {
      warning(
        state === undefined,
        'You cannot push state in browsers that do not support HTML5 history'
      )

      window.location.href = path
      return
    }

    const key = this.createKey()

    if (state !== undefined)
      this.props.stateStorage.saveState(key, state)

    window.history.pushState({ key }, null, path)

    this.setState({
      location: { path, state, key }
    })
  }

  handleReplace = (path, state) => {
    if (!this.supportsHistory) {
      warning(
        state === undefined,
        'You cannot replace state in browsers that do not support HTML5 history'
      )

      window.location.replace(path)
      return
    }

    const { location } = this.state
    const key = (location && location.key) || this.createKey()

    if (state !== undefined)
      this.props.stateStorage.saveState(key, state)

    window.history.replaceState({ key }, null, path)

    this.setState({
      location: { path, state, key }
    })
  }

  handlePop = (n) => {
    window.history.go(n)
  }

  componentWillMount() {
    if (typeof window === 'object') {
      this.supportsHistory = supportsHistory()
      this.needsHashChangeListener = !supportsPopStateOnHashChange()

      this.setState({
        location: this.createLocation(getHistoryState())
      })
    } else {
      warning(
        false,
        '<BrowserHistory> works only in DOM environments'
      )
    }
  }

  componentDidMount() {
    addEventListener(window, PopStateEvent, this.handlePopState)

    if (this.needsHashChangeListener)
      addEventListener(window, HashChangeEvent)
  }

  componentWillUnmount() {
    removeEventListener(window, PopStateEvent, this.handlePopState)

    if (this.needsHashChangeListener)
      removeEventListener(window, HashChangeEvent, this.handleHashChange)
  }

  render() {
    const { children } = this.props
    const { location } = this.state

    return (
      <HistoryContext
        children={children}
        location={location}
        push={this.handlePush}
        replace={this.handleReplace}
        pop={this.handlePop}
      />
    )
  }
}

export default BrowserHistory
