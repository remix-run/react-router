import warning from 'warning'

export const createLocation = ({ input, parseQuery, action = 'POP', key = null }) => {
  const object = typeof input === 'string' ? parsePath(input) : input

  const pathname = object.pathname || '/'
  const search = object.search || ''
  const query = object.query || parseQuery(search)
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

const extractPath = (string) => {
  const match = string.match(/^(https?:)?\/\/[^\/]*/)
  return match == null ? string : string.substring(match[0].length)
}

export const parsePath = (path) => {
  let pathname = extractPath(path)
  let search = ''
  let hash = ''

  warning(
    path === pathname,
    'A path must be pathname + search + hash only, not a full URL like "%s"',
    path
  )

  const hashIndex = pathname.indexOf('#')
  if (hashIndex !== -1) {
    hash = pathname.substring(hashIndex)
    pathname = pathname.substring(0, hashIndex)
  }

  const searchIndex = pathname.indexOf('?')
  if (searchIndex !== -1) {
    search = pathname.substring(searchIndex)
    pathname = pathname.substring(0, searchIndex)
  }

  if (pathname === '')
    pathname = '/'

  return {
    pathname,
    search,
    hash
  }
}

export const createPath = (location, stringifyQuery) => {
  if (location == null || typeof location === 'string')
    return location

  const { basename, pathname, query, search, hash } = location
  let path = (basename || '') + pathname

  if (query)
    path += '?'+stringifyQuery(query)
  else if (search && search !== '?')
    path += search

  if (hash)
    path += hash

  return path
}

