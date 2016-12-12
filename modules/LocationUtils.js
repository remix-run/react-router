import { parsePath, createPath } from 'history/PathUtils'
export { locationsAreEqual } from 'history/LocationUtils'

const hasOwnProperty = (o, property) => Object.prototype.hasOwnProperty.call(o, property)

export const createRouterLocation = (input, parseQueryString, stringifyQuery) => {
  if (typeof input === 'string') {
    const location = parsePath(input)
    location.query = location.search !== '' ?
      parseQueryString(location.search) : null
    return location
  } else {
    // got a location descriptor
    let result = {
      pathname: input.pathname || '',
      search: input.search || (
        input.query ? `?${stringifyQuery(input.query)}` : ''
      ),
      hash: input.hash || '',
      state: input.state || null,
      query: input.query || (
        input.search ? parseQueryString(input.search) : null
      )
    }
    if (hasOwnProperty(input, 'key')){
      result.key = input.key
    }
    return result
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
