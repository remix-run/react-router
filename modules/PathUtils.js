// TODO: Have Michael comb over this, I don't know the history of history (hehehe)
import warning from 'warning'

//export const isAbsolutePath = (path) =>
  //typeof path === 'string' && path.charAt(0) === '/'

//export const addQueryStringValueToPath = (path, key, value) => {
  //const { pathname, search, hash } = parsePath(path)

  //return createPath({
    //pathname,
    //search: search + (search.indexOf('?') === -1 ? '?' : '&') + key + '=' + value,
    //hash
  //})
//}

//export const stripQueryStringValueFromPath = (path, key) => {
  //const { pathname, search, hash } = parsePath(path)

  //return createPath({
    //pathname,
    //search: search.replace(
      //new RegExp(`([?&])${key}=[a-zA-Z0-9]+(&?)`),
      //(match, prefix, suffix) => (
        //prefix === '?' ? prefix : suffix
      //)
    //),
    //hash
  //})
//}

//export const getQueryStringValueFromPath = (path, key) => {
  //const { search } = parsePath(path)
  //const match = search.match(new RegExp(`[?&]${key}=([a-zA-Z0-9]+)`))
  //return match && match[1]
//}

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

export const createPath = (location) => {
  if (location == null || typeof location === 'string')
    return location

  const { basename, pathname, search, hash } = location
  let path = (basename || '') + pathname

  if (search && search !== '?')
    path += search

  if (hash)
    path += hash

  return path
}

