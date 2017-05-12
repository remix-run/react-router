import resolvePathname from 'resolve-pathname'

const resolveLocation = (location, base) => {
  let validBase = !base ? '/' : base
  if (location == null) {
    return validBase
  } else if (typeof location === 'string') {
    return join(location, validBase)
  } else {
    return {
      ...location,
      pathname: join(location.pathname, validBase)
    }
  }
}

const join = (to, from) => {
  if (isAbsolute(to))
    return to
  const pathname = resolvePathname(to, addTrailingSlash(from))
  return noTrailingSlash(to, from) ? stripTrailingSlash(pathname) : pathname
}

const isAbsolute = pathname => !!(pathname && pathname.charAt(0) === '/')

const addTrailingSlash = pathname =>
  hasTrailingSlash(pathname) ? pathname : pathname + '/'

const hasTrailingSlash = pathname => 
  !!pathname && pathname.charAt(pathname.length-1) === '/'

// If neither the to or from paths had a trailing slash, then
// the returned pathname should not have one either. This is an issue
// with falsy pathnames like '' and undefined and dot notation paths (./ and ../)
const noTrailingSlash = (to, from) =>  !hasTrailingSlash(to) && !hasTrailingSlash(from)

const stripTrailingSlash = pathname => 
  pathname.length > 1 && hasTrailingSlash(pathname) ? pathname.slice(0, -1) : pathname

export default resolveLocation
