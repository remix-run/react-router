import invariant from 'invariant'
import React, { PropTypes } from 'react'
import Router from './Router'

const createHref = path => path
const listen = () => {
  invariant(
    false,
    'You cannot listen for location changes using <ServerRouter>'
  )
}

const createLocation = (url) => {
  let pathname = url || '/'
  let search = ''
  let hash = ''

  const hashIndex = pathname.indexOf('#')
  if (hashIndex !== -1) {
    hash = pathname.substr(hashIndex)
    pathname = pathname.substr(0, hashIndex)
  }

  const searchIndex = pathname.indexOf('?')
  if (searchIndex !== -1) {
    search = pathname.substr(searchIndex)
    pathname = pathname.substr(0, searchIndex)
  }

  return {
    pathname,
    search: search === '?' ? '' : search,
    hash: hash === '#' ? '' : hash
  }
}

/**
 * The public top-level API for a server-side <Router>.
 */
class ServerRouter extends React.Component {
  static propTypes = {
    url: PropTypes.string.isRequired,
    context: PropTypes.object.isRequired
  }

  static childContextTypes = {
    history: PropTypes.object.isRequired
  }

  getChildContext() {
    return {
      history: {
        createHref,
        action: 'POP',
        location: createLocation(this.props.url),
        push: this.handlePush,
        replace: this.handleReplace,
        listen
      }
    }
  }

  handlePush = (location) => {
    const { context } = this.props
    context.action = 'PUSH'
    context.location = location
  }

  handleReplace = (location) => {
    const { context } = this.props
    context.action = 'REPLACE'
    context.location = location
  }

  render() {
    const { url, context, ...props } = this.props // eslint-disable-line no-unused-vars
    return <Router {...props}/>
  }
}

export default ServerRouter
