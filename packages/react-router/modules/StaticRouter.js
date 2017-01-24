import invariant from 'invariant'
import React, { PropTypes } from 'react'
import { createPath, parsePath } from 'history/PathUtils'
import Router from './Router'

const createHref = path => path

const normalizeLocation = (object) => {
  const { pathname = '/', search = '', hash = '' } = object

  return {
    pathname,
    search: search === '?' ? '' : search,
    hash: hash === '#' ? '' : hash
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

/**
 * The public top-level API for a "static" <Router>, so-called because it
 * can't actually change the current location. Instead, it just records
 * location changes in a context object. Useful mainly in testing and
 * server-rendering scenarios.
 */
class StaticRouter extends React.Component {
  static propTypes = {
    context: PropTypes.object.isRequired,
    location: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ])
  }

  static defaultProps = {
    location: '/'
  }

  handlePush = (location) => {
    const { context } = this.props
    context.action = 'PUSH'
    context.location = createLocation(location)
    context.url = createURL(location)
  }

  handleReplace = (location) => {
    const { context } = this.props
    context.action = 'REPLACE'
    context.location = createLocation(location)
    context.url = createURL(location)
  }

  render() {
    const { context, location, ...props } = this.props // eslint-disable-line no-unused-vars

    const history = {
      isStatic: true,
      createHref,
      action: 'POP',
      location: createLocation(location),
      push: this.handlePush,
      replace: this.handleReplace,
      go: staticHandler('go'),
      goBack: staticHandler('goBack'),
      goForward: staticHandler('goForward'),
      listen: staticHandler('listen')
    }

    return <Router {...props} history={history}/>
  }
}

export default StaticRouter
