import invariant from 'invariant'
import React, { PropTypes } from 'react'
import Router from './Router'

const createHref = path => path
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

const createURL = (location) =>
  typeof location === 'string' ? location : location.pathname + location.search

const listen = () => {
  invariant(
    false,
    'You cannot listen for location changes using <StaticRouter>'
  )
}

/**
 * The public top-level API for a "static" <Router>. It's static because
 * it doesn't actually change the location anywhere. Instead, it just records
 * location changes in a context object.
 */
class StaticRouter extends React.Component {
  static propTypes = {
    context: PropTypes.object.isRequired,
    url: PropTypes.string
  }

  static defaultProps = {
    url: '/'
  }

  handlePush = (location) => {
    const { context } = this.props
    context.action = 'PUSH'
    context.location = location
    context.url = createURL(location)
  }

  handleReplace = (location) => {
    const { context } = this.props
    context.action = 'REPLACE'
    context.location = location
    context.url = createURL(location)
  }

  render() {
    const { context, url, ...props } = this.props // eslint-disable-line no-unused-vars

    const history = {
      isStatic: true,
      createHref,
      action: 'POP',
      location: createLocation(this.props.url),
      push: this.handlePush,
      replace: this.handleReplace,
      listen
    }

    return <Router {...props} history={history}/>
  }
}

export default StaticRouter
