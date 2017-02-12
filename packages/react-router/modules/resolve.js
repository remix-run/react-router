import resolvePathname from 'resolve-pathname'

const hasTrailingSlash = pathname => {
  if (pathname == null) {
    return false
  }
  return pathname.charAt(pathname.length-1) === '/'
}

const withTrailingSlash = pathname => {
  if (pathname == null) {
    return '/'
  }
  return hasTrailingSlash(pathname) ? pathname : pathname + '/'
}

const stripTrailingSlash = pathname => {
  if (pathname == null) {
    return '/'
  }
  return pathname.length > 1 && hasTrailingSlash(pathname) ?
    pathname.slice(0, -1) : pathname
}

const isAbsolute = pathname => !!(pathname && pathname.charAt(0) === '/')

const sameSlashStrategy = (pathname, toSlash, fromSlash) => 
  !toSlash && !fromSlash ? stripTrailingSlash(pathname) : pathname

export const resolveLocation = (location, base) => {
  if (location === undefined) {
    return base
  } else if (typeof location === 'string') {
    return resolve(location, base)
  } else {
    location.pathname = resolve(location.pathname, base)
    return location
  }
}

const resolve = (to, from = '') => {
  const toSlash = hasTrailingSlash(to)
  const fromSlash = hasTrailingSlash(from)
  const pathname = resolvePathname(to, withTrailingSlash(from))
  return sameSlashStrategy(pathname, toSlash, fromSlash)
}

export const simpleResolve = (pathname, base) => {
  if (base == null || base === '') {
    base = '/'
  }

  if (pathname === undefined || isAbsolute(pathname)) {
    return pathname
  } else if (pathname === '') {
    return base
  } else {
    return `${withTrailingSlash(base)}${pathname}`
  }
}
