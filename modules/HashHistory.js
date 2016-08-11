import warning from 'warning'
import React, { PropTypes } from 'react'
import DOMHistoryContext from './DOMHistoryContext'
import {
  addEventListener,
  removeEventListener,
  supportsGoWithoutReloadUsingHash
} from './DOMUtils'
import {
  locationsAreEqual
} from './LocationUtils'

const HashChangeEvent = 'hashchange'

const addLeadingSlash = (path) =>
  path.charAt(0) === '/' ? path : '/' + path

const HashPathCoders = {
  hashbang: {
    encodePath: (path) => path.charAt(0) === '!' ? path : '!' + addLeadingSlash(path),
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
    hashType: PropTypes.oneOf(Object.keys(HashPathCoders))
  }

  static defaultProps = {
    hashType: 'slash'
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

  createLocation() {
    const path = this.decodePath(getHashPath())

    return {
      path
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
        return // Ignore this change; we already setState.

      this.ignorePath = null

      this.setState({
        action: 'POP', // Best guess.
        location: nextLocation
      })
    }
  }

  handlePush = (path, state) => {
    warning(
      state === undefined,
      '<HashHistory> cannot store state; it will be dropped'
    )

    const encodedPath = this.encodePath(path)
    const hashChanged = getHashPath() !== encodedPath

    if (hashChanged) {
      // We cannot tell if a hashchange was caused by a PUSH, so we'd
      // rather setState here and ignore the hashchange. The caveat here
      // is that other <HashHistory>s in the page will consider it a POP.
      this.ignorePath = path
      pushHashPath(encodedPath)
    }

    this.setState({
      action: 'PUSH',
      location: { path }
    })
  }

  handleReplace = (path, state) => {
    warning(
      state === undefined,
      '<HashHistory> cannot store state; it will be dropped'
    )

    const encodedPath = this.encodePath(path)
    const hashChanged = getHashPath() !== encodedPath

    if (hashChanged) {
      // We cannot tell if a hashchange was caused by a REPLACE, so we'd
      // rather setState here and ignore the hashchange. The caveat here
      // is that other <HashHistory>s in the page will consider it a POP.
      this.ignorePath = path
      replaceHashPath(encodedPath)
    }

    this.setState({
      action: 'REPLACE',
      location: { path }
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
      <DOMHistoryContext
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
