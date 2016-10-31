import { parsePath, createPath } from 'history/PathUtils'
export { locationsAreEqual } from 'history/LocationUtils'

export const createRouterLocation = (input, parseQueryString, stringifyQuery) => {
  if (typeof input === 'string') {
    const location = parsePath(input)
    location.query = location.search !== '' ?
      parseQueryString(location.search) : null
    return location
  } else {
    // got a location descriptor
    return {
      pathname: input.pathname || '',
      search: input.search || (
        input.query ? `?${stringifyQuery(input.query)}` : ''
      ),
      hash: input.hash || '',
      state: input.state || null,
      query: input.query || (
        input.search ? parseQueryString(input.search) : null
      ),
      key: input.key
    }
  }
}

export const createRouterPath = (input, stringifyQuery) => {
  return typeof input === 'string' ? input : createPath({
    ...input,
    search: input.search || (
      input.query ? `?${stringifyQuery(input.query)}` : ''
    )
  })
}

export const resolveLocation = (location, base) => {
  if (!isRelative(location)) {
    return location
  }

  if (typeof location === 'string') {
    return resolve(location, base)
  } else {
    location.pathname = resolve(location.pathname, base)
    return location
  }
}

const isRelative = (location) => {
  if (typeof location === 'string') {
    return location.charAt(0) !== '/'
  } else {
    const { pathname, query, search, hash } = location
    // If there is no pathname, the location should still be
    // considered relative if it has a query, search, or hash
    // (but not an empty query)
    if (!pathname) {
      return (query && Object.keys(query).length) || !!search || !!hash
    }
    return pathname.charAt(0) !== '/'
  }
}

// works similarly, but not exactly the same as RFC 1808
// https://tools.ietf.org/html/rfc1808#section-4
// base is the base URL and path is the URL to resolve.
// this differentiates from the RFC because it treats
// the url pattern "foo/bar" the same as "foo/bar/" where the
// relative path will be joined after "bar"
const resolve = (path, base = '') => {
  if (path === undefined) {
    return base
  } else if (base === '') {
    return '/' + path
  }

  // RFC 1808 drops the last base segment (step 6) and joins off
  // of its parent. This does not happen in here because the last
  // segment of the base because we want to join off of the last
  // segment. If the base ends in a forward slash, strip it so that
  // we join off of the segment before that instead.
  if (base[base.length-1] === '/') {
    base = base.slice(0,-1)
  }

  const baseSegments = splitSegments(base)
  const { pathname, extra } = removeExtra(path)
  // don't need to resolve if there is no pathname
  if (pathname === '') {
    return base + extra
  }

  // filter out all ./ segments (step 6.a)
  const relativeSegments = splitSegments(pathname).filter(s => s !== '.')
  return joinSegments([...baseSegments, ...relativeSegments]) + extra
}

// remove any '//' from the path because this doesn't mean anything
// and will interfere in replacement
const splitSegments = (path) => path.replace('//','/').split('/')

// if the original location was a string (not a descriptor), then the search
// or hash can still be attached to the path, so remove it before resolving
const removeExtra = (path) => {
  const hashIndex = path.indexOf('#')
  const searchIndex = path.indexOf('?')
  let splitIndex
  if (searchIndex >= 0 && hashIndex >= 0) {
    splitIndex = Math.min(searchIndex, hashIndex)
  } else if (searchIndex >=0) {
    splitIndex = searchIndex
  } else if (hashIndex >= 0) {
    splitIndex = hashIndex
  }

  return {
    pathname: splitIndex !== undefined ? path.slice(0, splitIndex) : path,
    extra: splitIndex !== undefined ? path.slice(splitIndex) : ''
  }
}

const joinSegments = (segments) => {
  // (step 6.c)
  return segments
    .reduce((acc, segment) => {
      if (segment !== '..') {
        return acc.concat(segment)
      }
      // remove <segment>/.. but not ../.. (or /.., but the only empty
      // string segment should be the root segment). To do this,
      // we want to verify that the last kept item is not a '..' or a ''.
      // If it is a '..', that means that we already failed to match
      // (['', 'foo', '..'] will never occur)
      const last = acc[acc.length-1]
      if (last !== '..' && last !== '') {
        return acc.slice(0, -1)
      } else {
        return acc.concat('..')
      }
    }, [])
    .join('/')
}
