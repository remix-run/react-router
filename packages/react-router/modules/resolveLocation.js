import resolvePathname from 'resolve-pathname'

const resolveLocation = (location, base) => {
  base = !base ? '/' : base
  if (location === undefined) {
    return base
  } else if (typeof location === 'string') {
    return join(location, base)
  } else {
    location.pathname = join(location.pathname, base)
    return location
  }
}

const join = (to, from) => {
  if (isAbsolute(to)) {
    return to
  }
  const toSlash = hasTrailingSlash(to)
  const fromSlash = hasTrailingSlash(from)
  const pathname = resolvePathname(to, withTrailingSlash(from))
  return sameSlash(pathname, !toSlash && !fromSlash)
}

const isAbsolute = pathname => !!(pathname && pathname.charAt(0) === '/')

const withTrailingSlash = pathname =>
  hasTrailingSlash(pathname) ? pathname : pathname + '/'

const hasTrailingSlash = pathname => 
  !!pathname && pathname.charAt(pathname.length-1) === '/'

const sameSlash = (pathname, noSlash) => noSlash ? stripTrailingSlash(pathname) : pathname

const stripTrailingSlash = pathname => 
  pathname.length > 1 && hasTrailingSlash(pathname) ? pathname.slice(0, -1) : pathname

export default resolveLocation
