import { parsePath, createPath } from 'react-history/PathUtils'

const createRouterLocation = (input, parseQuery, stringifyQuery) => {
  if (typeof input === 'string') {
    const location = parsePath(input)
    location.query = location.search !== '' ?
      parseQuery(location.search) : null
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
        input.search ? parseQuery(input.search) : null
      )
    }
  }
}

const createRouterPath = (input, stringifyQuery) => {
  return typeof input === 'string' ? input : createPath({
    ...input,
    search: input.search || (
      input.query ? `?${stringifyQuery(input.query)}` : ''
    )
  })
}

export { createRouterLocation, createRouterPath }
