import qs from 'qs'

export function stringifyQuery(query) {
  return qs.stringify(query, { arrayFormat: 'brackets' })
}

export function parseQueryString(queryString) {
  return qs.parse(queryString)
}
