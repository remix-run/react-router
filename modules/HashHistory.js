import warning from 'warning'
import React, { PropTypes } from 'react'
import HistoryContext from './HistoryContext'
import DOMStateStorage from './DOMStateStorage'
import { addEventListener, removeEventListener } from './DOMUtils'
import {
  addQueryStringValueToPath,
  getQueryStringValueFromPath,
  stripQueryStringValueFromPath
} from './PathUtils'
import {
  stateStorage as stateStorageType
} from './PropTypes'

const HashChangeEvent = 'hashchange'

const addLeadingSlash = (path) =>
  path.charAt(0) === '/' ? path : '/' + path

const HashPathCoders = {
  hashbang: {
    encodePath: (path) => path.charAt(0) === '!' ? path : '!' + path,
    decodePath: (path) => path.charAt(0) === '!' ? path.substring(1) : path
  },

  noslash: {
    encodePath: (path) => path.charAt(0) === '/' ? path.substring(1) : path,
    decodePath: addLeadingSlash
  },

  slash: {
    encodePath: addLeadingSlash,
    decodePath: addLeadingSlash
  }
}

const getHashPath = () => {
  // We can't use window.location.hash here because it's not
  // consistent across browsers - Firefox will pre-decode it!
  const href = window.location.href
  const hashIndex = href.indexOf('#')
  return hashIndex === -1 ? '' : href.substring(hashIndex + 1)
}

const pushHashPath = (path) =>
  window.location.hash = path

const replaceHashPath = (path) => {
  const hashIndex = window.location.href.indexOf('#')

  window.location.replace(
    window.location.href.slice(0, hashIndex >= 0 ? hashIndex : 0) + '#' + path
  )
}

/**
 * A history that uses the URL hash.
 */
class HashHistory extends React.Component {
  static propTypes = {
    children: PropTypes.func.isRequired,
    hashType: PropTypes.oneOf(Object.keys(HashPathCoders)),
    keyLength: PropTypes.number,
    queryKey: PropTypes.string,
    stateStorage: stateStorageType
  }

  static defaultProps = {
    hashType: 'slash',
    keyLength: 6,
    queryKey: '_k',
    stateStorage: DOMStateStorage
  }

  state = {
    location: null
  }

  decodePath(path) {
    return HashPathCoders[this.props.hashType].decodePath(path)
  }

  encodePath(path) {
    return HashPathCoders[this.props.hashType].encodePath(path)
  }

  createKey() {
    return Math.random().toString(36).substr(2, this.props.keyLength)
  }

  createLocation() {
    let path = this.decodePath(getHashPath())
    const key = getQueryStringValueFromPath(path, this.props.queryKey)

    let state
    if (key) {
      path = stripQueryStringValueFromPath(path, this.props.queryKey)
      state = this.props.stateStorage.readState(key)
    }

    return {
      path,
      state,
      key
    }
  }

  handleHashChange = () => {
    const path = getHashPath()
    const encodedPath = this.encodePath(path)

    if (path !== encodedPath) {
      // Ensure we always have a properly-encoded hash.
      replaceHashPath(encodedPath)
    } else {
      const { hash } = window.location

      if (this.prevHash === hash)
        return // Ignore consecutive identical hashchange events.

      this.prevHash = hash

      this.setState({
        location: this.createLocation()
      })
    }
  }

  handlePush = (path, state) => {
    if (state !== undefined) {
      const key = this.createKey()
      this.props.stateStorage.saveState(key, state)
      path = addQueryStringValueToPath(path, this.props.queryKey, key)
    }

    const encodedPath = this.encodePath(path)

    // TODO: Maybe we could use forceUpdate here and skip the warning?
    warning(
      getHashPath() !== encodedPath,
      'You cannot PUSH the same path using <HashHistory>'
    )

    pushHashPath(encodedPath)
  }

  handleReplace = (path, state) => {
    const { location } = this.state
    const key = (location && location.key) || this.createKey()

    if (state !== undefined) {
      this.props.stateStorage.saveState(key, state)
      path = addQueryStringValueToPath(path, this.props.queryKey, key)
    }

    const encodedPath = this.encodePath(path)

    replaceHashPath(encodedPath)
  }

  handlePop = (n) => {
    window.history.go(n)
  }

  componentWillMount() {
    if (typeof window === 'object') {
      this.setState({
        location: this.createLocation()
      })
    } else {
      warning(
        false,
        '<HashHistory> works only in DOM environments'
      )
    }
  }

  componentDidMount() {
    addEventListener(window, HashChangeEvent, this.handleHashChange)
  }

  componentWillUnmount() {
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

export default HashHistory
