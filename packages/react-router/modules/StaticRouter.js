import invariant from 'invariant'
import React from 'react'
import PropTypes from 'prop-types'
import { addLeadingSlash, createPath, parsePath } from 'history/PathUtils'
import Router from './Router'

const normalizeLocation = (object) => {
  const { pathname = '/', search = '', hash = '' } = object

  return {
    pathname,
    search: search === '?' ? '' : search,
    hash: hash === '#' ? '' : hash
  }
}

const addBasename = (basename, location) => {
  if (!basename)
    return location

  return {
    ...location,
    pathname: addLeadingSlash(basename) + location.pathname
  }
}

const stripBasename = (basename, location) => {
  if (!basename)
    return location

  const base = addLeadingSlash(basename)

  if (location.pathname.indexOf(base) !== 0)
    return location

  return {
    ...location,
    pathname: location.pathname.substr(base.length)
  }
}

const createLocation = (location) =>
  typeof location === 'string' ? parsePath(location) : normalizeLocation(location)

const createURL = (location) =>
  typeof location === 'string' ? location : createPath(location)

const staticHandler = (methodName) => () => {
  invariant(
    false,
    'You cannot %s with <StaticRouter>',
    methodName
  )
}

const noop = () => {}

/**
 * The public top-level API for a "static" <Router>, so-called because it
 * can't actually change the current location. Instead, it just records
 * location changes in a context object. Useful mainly in testing and
 * server-rendering scenarios.
 */
class StaticRouter extends React.Component {
  static propTypes = {
    basename: PropTypes.string,
    context: PropTypes.object.isRequired,
    location: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ])
  }

  static defaultProps = {
    basename: '',
    location: '/'
  }

  static childContextTypes = {
    router: PropTypes.object.isRequired
  }

  getChildContext() {
    return {
      router: {
        staticContext: this.props.context
      }
    }
  }

  createHref = (path) =>
    addLeadingSlash(this.props.basename + createURL(path))

  handlePush = (location) => {
    const { basename, context } = this.props
    context.action = 'PUSH'
    context.location = addBasename(basename, createLocation(location))
    context.url = createURL(context.location)
  }

  handleReplace = (location) => {
    const { basename, context } = this.props
    context.action = 'REPLACE'
    context.location = addBasename(basename, createLocation(location))
    context.url = createURL(context.location)
  }

  handleListen = () =>
    noop

  handleBlock = () =>
    noop

  render() {
    const { basename, context, location, ...props } = this.props

    const history = {
      createHref: this.createHref,
      action: 'POP',
      location: stripBasename(basename, createLocation(location)),
      push: this.handlePush,
      replace: this.handleReplace,
      go: staticHandler('go'),
      goBack: staticHandler('goBack'),
      goForward: staticHandler('goForward'),
      listen: this.handleListen,
      block: this.handleBlock
    }

    return <Router {...props} history={history}/>
  }
}

export default StaticRouter
