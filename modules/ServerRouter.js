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

const ServerRouter = ({ url, context, ...props }) => (
  <Router
    history={{
      createHref,
      action: 'POP',
      location: createLocation(url),
      isServer: true,
      push: (location) => {
        context.action = 'PUSH'
        context.location = location
      },
      replace: (location) => {
        context.action = 'REPLACE'
        context.location = location
      },
      listen
    }}
    {...props} />
)

ServerRouter.propTypes = {
  url: PropTypes.string.isRequired,
  context: PropTypes.object.isRequired
}

export default ServerRouter
