import { parsePath } from 'react-history/PathUtils'

export const createLocation = ({ input, parseQuery, action = 'POP', key = null }) => {
  const object = typeof input === 'string' ? parsePath(input) : input

  const pathname = object.pathname || '/'
  const search = object.search || ''
  const query = object.query || search !== '' ? parseQuery(search) : {}
  const hash = object.hash || ''

  return {
    pathname,
    search,
    query,
    hash,
    action,
    key
  }
}

