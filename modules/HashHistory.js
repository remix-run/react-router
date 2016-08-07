import warning from 'warning'
import React, { PropTypes } from 'react'
import HistoryContext from './HistoryContext'
import DOMStateStorage from './DOMStateStorage'
import {
  addEventListener,
  removeEventListener,
  supportsGoWithoutReloadUsingHash
} from './DOMUtils'
import {
  locationsAreEqual
} from './LocationUtils'
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
    action: null,
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
      const { location } = this.state
      const nextLocation = this.createLocation()

      if (locationsAreEqual(location, nextLocation))
        return // A hashchange doesn't always == location change.

      if (this.ignorePath === nextLocation.path)
        return // Ignore this path; we already setState.

      this.ignorePath = null

      this.setState({
        action: 'POP',
        location: nextLocation
      })
    }
  }

  handlePush = (path, state) => {
    let key, pathWithKey
    if (state !== undefined) {
      key = this.createKey()
      this.props.stateStorage.saveState(key, state)
      pathWithKey = addQueryStringValueToPath(path, this.props.queryKey, key)
    } else {
      pathWithKey = path
    }

    const encodedPath = this.encodePath(pathWithKey)
    const hashChanged = getHashPath() !== encodedPath

    if (hashChanged) {
      this.ignorePath = path
      pushHashPath(encodedPath)
    }

    this.setState({
      action: 'PUSH',
      location: { path, state, key }
    })
  }

  handleReplace = (path, state) => {
    let key, pathWithKey
    if (state !== undefined) {
      key = this.createKey()
      this.props.stateStorage.saveState(key, state)
      pathWithKey = addQueryStringValueToPath(path, this.props.queryKey, key)
    } else {
      pathWithKey = path
    }

    const encodedPath = this.encodePath(pathWithKey)
    const hashChanged = getHashPath() !== encodedPath

    if (hashChanged) {
      this.ignorePath = path
      replaceHashPath(encodedPath)
    }

    this.setState({
      action: 'REPLACE',
      location: { path, state, key }
    })
  }

  handleGo = (n) => {
    warning(
      this.goIsSupportedWithoutReload,
      '<HashHistory> go(n) causes a full page reload in this browser'
    )

    window.history.go(n)
  }

  componentWillMount() {
    if (typeof window === 'object') {
      this.goIsSupportedWithoutReload = supportsGoWithoutReloadUsingHash()

      // Ensure the hash is encoded properly.
      const path = getHashPath()
      const encodedPath = this.encodePath(path)

      if (path !== encodedPath)
        replaceHashPath(encodedPath)

      this.setState({
        action: 'POP',
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
    const { action, location } = this.state

    return (
      <HistoryContext
        children={children}
        action={action}
        location={location}
        push={this.handlePush}
        replace={this.handleReplace}
        go={this.handleGo}
      />
    )
  }
}

export default HashHistory
